const Message = require("../models/messageModel");
const Conversation = require("../models/conversationModel");

exports.sendMessage = async (req, res) => {
  const { senderId, receiverId, text, conversationId } = req.body;

  try {
    let convo = await Conversation.findById(conversationId);
    if (!convo) {
      convo = new Conversation({ senderId, receiverId });
      await convo.save();
    }

    const message = new Message({
      senderId,
      receiverId,
      text,
      conversationId: convo._id,
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
    
    console.log(`Loaded ${messages.length} messages for conversation ${req.params.id}`);
    res.json(messages);
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
