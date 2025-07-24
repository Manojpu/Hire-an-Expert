const express = require("express");
const router = express.Router();
const { getUserConversations } = require("../controllers/conversationController");

router.get("/:userId", getUserConversations);

module.exports = router;
