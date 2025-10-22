const app = require("./app");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/messageModel");
const Conversation = require("./models/conversationModel");
const messageController = require("./controllers/messageContoller");

const parseList = (value) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const socketOrigins = parseList(
  process.env.MESSAGE_SERVICE_SOCKET_ORIGINS ||
    process.env.MESSAGE_SERVICE_CORS_ORIGINS ||
    process.env.CORS_ORIGINS
);
const socketMethods = parseList(process.env.MESSAGE_SERVICE_SOCKET_METHODS).map(
  (method) => method.toUpperCase()
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: socketOrigins.length ? socketOrigins : true,
    methods: socketMethods.length ? socketMethods : ["GET", "POST"],
  },
});

// Helper function to check if user is viewing a specific conversation
const isUserViewingConversation = (userId, conversationId) => {
  return currentlyViewingConversation.get(userId) === conversationId;
};

// Pass Socket.IO instance and helper functions to message controller
messageController.setSocketIO(io, isUserViewingConversation);

// Store active users and their typing status
const activeUsers = new Map(); // socketId -> userId
const typingUsers = new Map();
const activeConversations = new Map(); // conversationId -> Set of userIds
const currentlyViewingConversation = new Map(); // userId -> conversationId (currently open chat)

io.on("connection", (socket) => {
  console.log("🔌 A user connected: " + socket.id);

  // Register user
  socket.on("registerUser", (userId) => {
    activeUsers.set(socket.id, userId);
    socket.userId = userId;
    console.log(`User registered: ${userId}`);
  });

  // Join all user's conversations for global updates
  socket.on("joinAllConversations", async (userId) => {
    try {
      console.log(`👥 User ${userId} joining all their conversations...`);

      // Find all conversations for this user
      const conversations = await Conversation.find({
        $or: [{ senderId: userId }, { receiverId: userId }],
      });

      // Join each conversation room
      conversations.forEach((conv) => {
        socket.join(conv._id.toString());
        console.log(`  ✅ Joined room: ${conv._id}`);
      });

      console.log(
        `✨ User ${userId} joined ${conversations.length} conversation rooms`
      );
    } catch (error) {
      console.error("Error joining all conversations:", error);
    }
  });

  socket.on("joinRoom", (conversationId) => {
    console.log(`User ${socket.userId} joining room: ${conversationId}`);
    socket.join(conversationId);
    socket.currentRoom = conversationId;

    // Track which conversation this user is currently viewing
    if (socket.userId) {
      currentlyViewingConversation.set(socket.userId, conversationId);
      console.log(
        `👁️  User ${socket.userId} is now viewing conversation: ${conversationId}`
      );
    }

    // Track active users in conversation
    if (!activeConversations.has(conversationId)) {
      activeConversations.set(conversationId, new Set());
    }
    if (socket.userId) {
      activeConversations.get(conversationId).add(socket.userId);
      console.log(
        `Active users in ${conversationId}:`,
        Array.from(activeConversations.get(conversationId))
      );
    }

    // Mark messages as delivered when user joins room
    if (socket.userId) {
      markMessagesAsDelivered(conversationId, socket.userId);
    }

    // Broadcast active users update
    io.to(conversationId).emit("activeUsersUpdate", {
      conversationId,
      activeUsers: Array.from(activeConversations.get(conversationId) || []),
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
        status: "sent",
      });

      console.log("New message:", message);
      await message.save();
      console.log("Message saved:", message);

      // Check if receiver is currently viewing this conversation
      const isReceiverViewing =
        currentlyViewingConversation.get(receiverId) === conversationId;
      console.log(
        `👁️  Receiver viewing status: ${
          isReceiverViewing ? "VIEWING" : "NOT VIEWING"
        } this conversation`
      );

      // Update conversation - only increment unread count if receiver is not viewing
      const conversation = await Conversation.findById(conversationId);
      if (!conversation.unreadCount) {
        conversation.unreadCount = { senderId: 0, receiverId: 0 };
      }

      if (!isReceiverViewing) {
        // Increment unread count only if receiver is not actively viewing the conversation
        if (conversation.senderId.toString() === receiverId) {
          conversation.unreadCount.senderId =
            (conversation.unreadCount.senderId || 0) + 1;
          console.log(
            `📊 Incremented unread count for senderId: ${conversation.unreadCount.senderId}`
          );
        } else {
          conversation.unreadCount.receiverId =
            (conversation.unreadCount.receiverId || 0) + 1;
          console.log(
            `📊 Incremented unread count for receiverId: ${conversation.unreadCount.receiverId}`
          );
        }
      } else {
        console.log(
          `👁️  Receiver is viewing conversation, not incrementing unread count`
        );
      }

      conversation.lastMessage = text;
      conversation.lastMessageId = message._id;
      conversation.updatedAt = Date.now();
      await conversation.save();

      // Send message to all users in the room
      io.to(conversationId).emit("receiveMessage", message);

      // Send conversation update to all participants
      console.log(`📤 Emitting conversationUpdated for text message:`, {
        _id: conversation._id,
        lastMessage: conversation.lastMessage,
        unreadCount: conversation.unreadCount,
        updatedAt: conversation.updatedAt,
      });
      io.to(conversationId).emit("conversationUpdated", conversation);
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
          status: { $ne: "read" },
        },
        {
          status: "read",
          readAt: new Date(),
        }
      );

      console.log(
        `Marked ${result.modifiedCount} messages as read for user ${userId}`
      );

      // Reset unread count in conversation
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        const updateData = {};
        if (conversation.senderId === userId) {
          updateData["unreadCount.senderId"] = 0;
        } else {
          updateData["unreadCount.receiverId"] = 0;
        }
        await Conversation.findByIdAndUpdate(conversationId, updateData);
      }

      // Get updated messages and broadcast read status immediately
      const updatedMessages = await Message.find({ conversationId }).sort({
        timestamp: 1,
      });

      // Emit real-time read receipt to sender
      io.to(conversationId).emit("messagesReadUpdate", {
        conversationId,
        readBy: userId,
        messages: updatedMessages,
        timestamp: new Date(),
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

    // Clean up currently viewing conversation tracking
    if (socket.userId) {
      currentlyViewingConversation.delete(socket.userId);
      console.log(
        `👁️  User ${socket.userId} no longer viewing any conversation`
      );
    }

    // Remove user from active conversations
    if (socket.userId && socket.currentRoom) {
      const conversationUsers = activeConversations.get(socket.currentRoom);
      if (conversationUsers) {
        conversationUsers.delete(socket.userId);
        console.log(
          `User ${socket.userId} left conversation ${socket.currentRoom}`
        );

        // Broadcast updated active users
        io.to(socket.currentRoom).emit("activeUsersUpdate", {
          conversationId: socket.currentRoom,
          activeUsers: Array.from(conversationUsers),
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
          isTyping: false,
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
        status: "sent",
      },
      { status: "delivered" }
    );

    // Broadcast delivery status
    const updatedMessages = await Message.find({ conversationId }).sort({
      timestamp: 1,
    });
    io.to(conversationId).emit("messagesDeliveredUpdate", {
      conversationId,
      deliveredTo: userId,
      messages: updatedMessages,
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
