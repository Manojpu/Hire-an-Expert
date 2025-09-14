const Message = require("../models/messageModel");
const Conversation = require("../models/conversationModel");
const axios = require("axios");

// Function to get user details from user-service
async function getUserByFirebaseUID(firebaseUID) {
  try {
    const response = await axios.get(
      `http://127.0.0.1:8006/users/firebase/${firebaseUID}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${firebaseUID}:`, error.message);
    return null;
  }
}

exports.sendMessage = async (req, res) => {
  const { senderId, receiverId, text, conversationId } = req.body;

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

    const message = new Message({
      senderId,
      receiverId,
      text,
      conversationId: actualConversationId,
    });

    await message.save();

    convo.lastMessage = text;
    convo.updatedAt = Date.now();
    await convo.save();

    res.status(201).json(message);
  } catch (err) {
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
