const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// CORS configuration with environment variable support
const corsOrigins = process.env.CORS_ORIGINS ? 
  process.env.CORS_ORIGINS.split(',') : 
  ["http://localhost:3000"];

app.use(cors({ 
  origin: corsOrigins,
  credentials: true 
}));
app.use(express.json());

// Health check endpoint for Docker health checks
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'message-service',
    database: 'connected'
  });
});

app.use("/api/message", require("./routes/messageRoutes"));
app.use("/api/conversations", require("./routes/conversationRoutes"));

module.exports = app;
