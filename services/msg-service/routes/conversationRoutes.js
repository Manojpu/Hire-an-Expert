const express = require("express");
const router = express.Router();
const { 
  getUserConversations, 
  createConversation, 
  getConversation 
} = require("../controllers/conversationController");

// Get conversations by Firebase UID
router.get("/:userId", getUserConversations);
router.post("/", createConversation);
router.get("/details/:id", getConversation);

module.exports = router;
