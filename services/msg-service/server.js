const app = require("./app");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/messageModel");
const Conversation = require("./models/conversationModel");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:8000", "null"], // Include API Gateway
    methods: ["GET", "POST"],
  },
});

// Store active users and their typing status
const activeUsers = new Map(); // socketId -> userId
const typingUsers = new Map();
const activeConversations = new Map(); // conversationId -> Set of userIds

io.on("connection", (socket) => {
  console.log("🔌 A user connected: " + socket.id);

  // Register user
  socket.on("registerUser", (userId) => {
    activeUsers.set(socket.id, userId);
    socket.userId = userId;
    console.log(`User registered: ${userId}`);
  });

  socket.on("joinRoom", (conversationId) => {
    console.log(`User ${socket.userId} joining room: ${conversationId}`);
    socket.join(conversationId);
    socket.currentRoom = conversationId;
    
    // Track active users in conversation
    if (!activeConversations.has(conversationId)) {
      activeConversations.set(conversationId, new Set());
    }
    if (socket.userId) {
      activeConversations.get(conversationId).add(socket.userId);
      console.log(`Active users in ${conversationId}:`, Array.from(activeConversations.get(conversationId)));
    }
    
    // Mark messages as delivered when user joins room
    if (socket.userId) {
      markMessagesAsDelivered(conversationId, socket.userId);
    }
    
    // Broadcast active users update
    io.to(conversationId).emit("activeUsersUpdate", {
      conversationId,
      activeUsers: Array.from(activeConversations.get(conversationId) || [])
    });
  });

  socket.on("sendMessage", async (data) => {
    const { senderId, receiverId, text, conversationId } = data;

    try {
      const message = new Message({
        senderId,
        receiverId,
        text,
        conversationId,
        status: 'sent'
      });
      
      console.log("New message:", message);
      await message.save();
      console.log("Message saved:", message);

      // Check if both users are active in the conversation
      const activeUsersInConversation = activeConversations.get(conversationId) || new Set();
      const bothUsersActive = activeUsersInConversation.has(senderId) && activeUsersInConversation.has(receiverId);
      
      // Update conversation - only increment unread count if receiver is not active in chat
      const updateData = {
        lastMessage: text,
        lastMessageId: message._id,
        updatedAt: Date.now(),
      };

      if (!bothUsersActive) {
        // Increment unread count only if receiver is not actively viewing the conversation
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          if (conversation.senderId === receiverId) {
            updateData['unreadCount.senderId'] = (conversation.unreadCount?.senderId || 0) + 1;
          } else {
            updateData['unreadCount.receiverId'] = (conversation.unreadCount?.receiverId || 0) + 1;
          }
        }
      }

      await Conversation.findByIdAndUpdate(conversationId, updateData);

      // Send message to all users in the room
      io.to(conversationId).emit("receiveMessage", message);
      
      // Send conversation update to all participants
      const updatedConversation = await Conversation.findById(conversationId);
      io.to(conversationId).emit("conversationUpdated", updatedConversation);

    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("messageError", { error: "Failed to send message" });
    }
  });

  // Typing indicators
  socket.on("startTyping", (data) => {
    const { conversationId, userId } = data;
    const typingKey = `${conversationId}-${userId}`;
    
    // Clear existing timeout
    if (typingUsers.has(typingKey)) {
      clearTimeout(typingUsers.get(typingKey));
    }
    
    // Broadcast typing to other users in room
    socket.to(conversationId).emit("userTyping", { userId, isTyping: true });
    
    // Set timeout to stop typing after 3 seconds
    const timeout = setTimeout(() => {
      socket.to(conversationId).emit("userTyping", { userId, isTyping: false });
      typingUsers.delete(typingKey);
    }, 3000);
    
    typingUsers.set(typingKey, timeout);
  });

  socket.on("stopTyping", (data) => {
    const { conversationId, userId } = data;
    const typingKey = `${conversationId}-${userId}`;
    
    // Clear timeout and stop typing
    if (typingUsers.has(typingKey)) {
      clearTimeout(typingUsers.get(typingKey));
      typingUsers.delete(typingKey);
    }
    
    socket.to(conversationId).emit("userTyping", { userId, isTyping: false });
  });

  // Mark messages as read - with real-time updates
  socket.on("markMessagesAsRead", async (data) => {
    const { conversationId, userId } = data;
    
    try {
      // Update all unread messages to read
      const result = await Message.updateMany(
        { 
          conversationId, 
          receiverId: userId, 
          status: { $ne: 'read' } 
        },
        { 
          status: 'read', 
          readAt: new Date() 
        }
      );

      console.log(`Marked ${result.modifiedCount} messages as read for user ${userId}`);

      // Reset unread count in conversation
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        const updateData = {};
        if (conversation.senderId === userId) {
          updateData['unreadCount.senderId'] = 0;
        } else {
          updateData['unreadCount.receiverId'] = 0;
        }
        await Conversation.findByIdAndUpdate(conversationId, updateData);
      }

      // Get updated messages and broadcast read status immediately
      const updatedMessages = await Message.find({ conversationId }).sort({ timestamp: 1 });
      
      // Emit real-time read receipt to sender
      io.to(conversationId).emit("messagesReadUpdate", { 
        conversationId, 
        readBy: userId,
        messages: updatedMessages,
        timestamp: new Date()
      });

      // Send conversation update
      const updatedConversation = await Conversation.findById(conversationId);
      io.to(conversationId).emit("conversationUpdated", updatedConversation);

    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 A user disconnected");
    
    // Remove user from active conversations
    if (socket.userId && socket.currentRoom) {
      const conversationUsers = activeConversations.get(socket.currentRoom);
      if (conversationUsers) {
        conversationUsers.delete(socket.userId);
        console.log(`User ${socket.userId} left conversation ${socket.currentRoom}`);
        
        // Broadcast updated active users
        io.to(socket.currentRoom).emit("activeUsersUpdate", {
          conversationId: socket.currentRoom,
          activeUsers: Array.from(conversationUsers)
        });
        
        // Clean up empty conversation tracking
        if (conversationUsers.size === 0) {
          activeConversations.delete(socket.currentRoom);
        }
      }
      
      // Clean up typing indicators
      const typingKey = `${socket.currentRoom}-${socket.userId}`;
      if (typingUsers.has(typingKey)) {
        clearTimeout(typingUsers.get(typingKey));
        typingUsers.delete(typingKey);
        socket.to(socket.currentRoom).emit("userTyping", { 
          userId: socket.userId, 
          isTyping: false 
        });
      }
    }
    
    activeUsers.delete(socket.id);
  });
});

// Helper function to mark messages as delivered
async function markMessagesAsDelivered(conversationId, userId) {
  try {
    await Message.updateMany(
      { 
        conversationId, 
        receiverId: userId, 
        status: 'sent' 
      },
      { status: 'delivered' }
    );
    
    // Broadcast delivery status
    const updatedMessages = await Message.find({ conversationId }).sort({ timestamp: 1 });
    io.to(conversationId).emit("messagesDeliveredUpdate", { 
      conversationId, 
      deliveredTo: userId,
      messages: updatedMessages 
    });
  } catch (error) {
    console.error("Error marking messages as delivered:", error);
  }
}

const PORT = process.env.PORT || 8005; // Updated port for microservice architecture
server.listen(PORT, () => {
  console.log(`🚀 Message Service running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
  console.log(`🌐 CORS enabled for API Gateway and frontend`);
});
