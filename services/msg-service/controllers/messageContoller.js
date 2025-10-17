const Message = require("../models/messageModel");
const Conversation = require("../models/conversationModel");
const axios = require("axios");

// Socket.IO instance and helper functions will be set from server.js
let io = null;
let isUserViewingConversation = null;

exports.setSocketIO = (socketIO, viewingChecker) => {
  io = socketIO;
  isUserViewingConversation = viewingChecker;
};

// Function to get user details from user-service
async function getUserByFirebaseUID(firebaseUID) {
  try {
    const response = await axios.get(
      `http://127.0.0.1:8006/users/firebase/${firebaseUID}`
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`⚠️  User ${firebaseUID} not found in database. Messages will work but user details unavailable.`);
      return null;
    }
    console.error(`Error fetching user ${firebaseUID}:`, error.message);
    return null;
  }
}

exports.sendMessage = async (req, res) => {
  const { 
    senderId, 
    receiverId, 
    text, 
    conversationId,
    type = 'text',
    fileUrl,
    fileName,
    fileSize,
    mimeType,
    duration,
    thumbnailUrl
  } = req.body;

  try {
    let convo;
    let actualConversationId;

    if (conversationId) {
      // Try to find existing conversation
      convo = await Conversation.findById(conversationId);
      if (convo) {
        actualConversationId = convo._id;
      } else {
        // Create new conversation with the provided ID
        convo = new Conversation({ 
          _id: conversationId,
          senderId, 
          receiverId 
        });
        await convo.save();
        actualConversationId = convo._id;
      }
    } else {
      // No conversationId provided, create a new one
      convo = new Conversation({ senderId, receiverId });
      await convo.save();
      actualConversationId = convo._id;
    }

    // Create message with attachment support
    const messageData = {
      senderId,
      receiverId,
      conversationId: actualConversationId,
      type,
    };

    // Add text if provided
    if (text) {
      messageData.text = text;
    }

    // Add file data if it's not a text message
    if (type !== 'text' && fileUrl) {
      messageData.fileUrl = fileUrl;
      messageData.fileName = fileName;
      messageData.fileSize = fileSize;
      messageData.mimeType = mimeType;
      
      if (type === 'voice' && duration) {
        messageData.duration = duration;
      }
      
      if (type === 'image' && thumbnailUrl) {
        messageData.thumbnailUrl = thumbnailUrl;
      }
    }

    const message = new Message(messageData);
    await message.save();

    // Update conversation last message and unread count
    let lastMessageText = text || '';
    if (type === 'image') lastMessageText = '📷 Image';
    else if (type === 'document') lastMessageText = `📄 ${fileName || 'Document'}`;
    else if (type === 'voice') lastMessageText = '🎤 Voice message';

    convo.lastMessage = lastMessageText;
    convo.updatedAt = Date.now();
    
    // Increment unread count for receiver ONLY if they're not currently viewing this conversation
    if (!convo.unreadCount) {
      convo.unreadCount = { senderId: 0, receiverId: 0 };
    }
    
    const isReceiverViewing = isUserViewingConversation 
      ? isUserViewingConversation(receiverId, actualConversationId.toString())
      : false;
    
    if (!isReceiverViewing) {
      if (convo.senderId.toString() === receiverId) {
        convo.unreadCount.senderId = (convo.unreadCount.senderId || 0) + 1;
        console.log(`📊 Incremented unread count for senderId: ${convo.unreadCount.senderId}`);
      } else {
        convo.unreadCount.receiverId = (convo.unreadCount.receiverId || 0) + 1;
        console.log(`📊 Incremented unread count for receiverId: ${convo.unreadCount.receiverId}`);
      }
    } else {
      console.log(`👁️  Receiver is viewing conversation, not incrementing unread count`);
    }
    
    await convo.save();

    // Emit Socket.IO events for real-time updates
    if (io) {
      console.log(`📤 Emitting message to room: ${actualConversationId}`);
      console.log(`📊 Conversation data:`, {
        _id: convo._id,
        lastMessage: convo.lastMessage,
        unreadCount: convo.unreadCount,
        updatedAt: convo.updatedAt
      });
      
      // Send message to all users in the conversation room
      io.to(actualConversationId.toString()).emit("receiveMessage", message);
      
      // Send conversation update with unread counts (convert to plain object)
      const conversationUpdate = convo.toObject ? convo.toObject() : convo;
      io.to(actualConversationId.toString()).emit("conversationUpdated", conversationUpdate);
      console.log(`✅ Emitted conversationUpdated event`);
    } else {
      console.warn('⚠️  Socket.IO not initialized. Real-time updates disabled.');
    }

    res.status(201).json(message);
  } catch (err) {
    console.error("❌ Error sending message:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    // Load ALL messages for this conversation, sorted by timestamp (oldest first)
    const messages = await Message.find({ conversationId: req.params.id })
      .sort({ timestamp: 1 }); // 1 = ascending order (oldest first)
    
    // Enhance messages with sender details
    const enhancedMessages = await Promise.all(
      messages.map(async (message) => {
        const sender = await getUserByFirebaseUID(message.senderId);
        
        return {
          ...message.toObject(),
          sender: sender ? {
            firebase_uid: sender.firebase_uid,
            name: sender.name,
            email: sender.email,
            profile_image_url: sender.profile_image_url
          } : null
        };
      })
    );
    
    console.log(`Loaded ${enhancedMessages.length} messages for conversation ${req.params.id}`);
    res.json(enhancedMessages);
  } catch (err) {
    console.error("Error loading messages:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { status: "read" });
    res.json({ message: "Message marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMessagesBetweenUsers = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    
    // Find messages between these two users (both directions)
    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    }).sort({ timestamp: 1 }); // Oldest first
    
    // Enhance messages with sender details
    const enhancedMessages = await Promise.all(
      messages.map(async (message) => {
        const sender = await getUserByFirebaseUID(message.senderId);
        
        return {
          ...message.toObject(),
          sender: sender ? {
            firebase_uid: sender.firebase_uid,
            name: sender.name,
            email: sender.email,
            profile_image_url: sender.profile_image_url
          } : null
        };
      })
    );
    
    console.log(`Loaded ${enhancedMessages.length} messages between ${userId1} and ${userId2}`);
    res.json(enhancedMessages);
  } catch (err) {
    console.error("Error loading messages between users:", err);
    res.status(500).json({ error: err.message });
  }
};
