
const express = require("express");
const router = express.Router();
const { sendMessage, getMessages, markAsRead } = require("../controllers/messageContoller");

router.post("/", sendMessage);
router.get("/:id", getMessages);
router.patch("/:id/read", markAsRead);


module.exports = router;
