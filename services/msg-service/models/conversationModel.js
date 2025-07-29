const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  lastMessage: { type: String },
  lastMessageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  unreadCount: { 
    senderId: { type: Number, default: 0 },
    receiverId: { type: Number, default: 0 }
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Conversation", conversationSchema);
