const Conversation = require("../models/conversationModel");

exports.getUserConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.params.userId });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
