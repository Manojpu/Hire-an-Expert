const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  text: { type: String },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  readAt: { type: Date },
  
  // File attachment fields
  type: { 
    type: String, 
    enum: ['text', 'image', 'document', 'voice'], 
    default: 'text' 
  },
  fileUrl: { type: String },
  fileName: { type: String },
  fileSize: { type: Number }, // in bytes
  mimeType: { type: String },
  duration: { type: Number }, // for voice messages in seconds
  thumbnailUrl: { type: String }, // for images/videos
});

module.exports = mongoose.model("Message", messageSchema);
