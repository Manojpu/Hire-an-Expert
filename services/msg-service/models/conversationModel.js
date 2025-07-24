const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  expertId: { type: String, required: true },
  lastMessage: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Conversation", conversationSchema);
