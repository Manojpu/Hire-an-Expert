
const express = require("express");
const router = express.Router();
const { sendMessage, getMessages, markAsRead, getMessagesBetweenUsers } = require("../controllers/messageContoller");

router.post("/", sendMessage);
router.get("/:id", getMessages);
router.get("/between/:userId1/:userId2", getMessagesBetweenUsers);
router.patch("/:id/read", markAsRead);


module.exports = router;
