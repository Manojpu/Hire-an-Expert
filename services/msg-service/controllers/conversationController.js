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

exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.params.userId; // This is Firebase UID
    
    // Get conversations where user is either sender or receiver
    const conversations = await Conversation.find({ 
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }).sort({ updatedAt: -1 });

    // Enhance conversations with user details
    const enhancedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUserId = conversation.senderId === userId 
          ? conversation.receiverId 
          : conversation.senderId;
        
        const otherUser = await getUserByFirebaseUID(otherUserId);
        
        return {
          ...conversation.toObject(),
          otherUser: otherUser ? {
            firebase_uid: otherUser.firebase_uid,
            name: otherUser.name,
            email: otherUser.email,
            profile_image_url: otherUser.profile_image_url
          } : null
        };
      })
    );

    res.json(enhancedConversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    
    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    });
    
    if (conversation) {
      return res.json(conversation);
    }
    
    // Create new conversation
    conversation = new Conversation({
      senderId,
      receiverId,
      lastMessage: "",
      updatedAt: Date.now()
    });
    
    await conversation.save();
    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
