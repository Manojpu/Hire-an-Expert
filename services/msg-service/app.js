const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.use("/api/message", require("./routes/messageRoutes"));
app.use("/api/conversations", require("./routes/conversationRoutes"));

module.exports = app;
