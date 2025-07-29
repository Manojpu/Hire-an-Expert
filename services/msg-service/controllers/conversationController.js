const Conversation = require("../models/conversationModel");

exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.params.userId;
    const conversations = await Conversation.find({ 
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }).sort({ updatedAt: -1 });
    res.json(conversations);
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
