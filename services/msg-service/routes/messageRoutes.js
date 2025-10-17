
const express = require("express");
const router = express.Router();
const { sendMessage, getMessages, markAsRead, getMessagesBetweenUsers } = require("../controllers/messageContoller");

router.post("/", sendMessage);
router.get("/conversation/:id", getMessages);  // Frontend uses this path
router.get("/:id", getMessages);  // Keep for backward compatibility
router.get("/between/:userId1/:userId2", getMessagesBetweenUsers);
router.patch("/:id/read", markAsRead);


module.exports = router;
