const app = require("./app");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/messageModel");
const Conversation = require("./models/conversationModel");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000","null"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🔌 A user connected: " + socket.id);

  socket.on("joinRoom", (conversationId) => {
    console.log(`User joining room: ${conversationId}`);
    socket.join(conversationId);
    console.log(`User joined room: ${conversationId}`);
  });

  socket.on("sendMessage", async (data) => {
    const { senderId, receiverId, text, conversationId } = data;

    const message = new Message({
      senderId,
      receiverId,
      text,
      conversationId,
    });
    console.log("New message:", message);
    await message.save();
    console.log("Message saved:", message);

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: text,
      updatedAt: Date.now(),
    });

    io.to(conversationId).emit("receiveMessage", message);
  });

  socket.on("typing", (conversationId) => {
    socket.to(conversationId).emit("typing");
  });

  socket.on("disconnect", () => {
    console.log("🔌 A user disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
