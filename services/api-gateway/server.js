const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { Server } = require("socket.io");
const http = require("http");
const io_client = require("socket.io-client");

// Import custom middleware
const { authenticateJWT, optionalAuth } = require("./middleware/auth");
const { requestLogger, errorLogger } = require("./middleware/logging");

require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Custom middleware
app.use(requestLogger); // Log all requests

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      auth: process.env.AUTH_SERVICE_URL,
      user: process.env.USER_SERVICE_URL,
      gig: process.env.GIG_SERVICE_URL,
      booking: process.env.BOOKING_SERVICE_URL,
      review: process.env.REVIEW_SERVICE_URL,
      payment: process.env.PAYMENT_SERVICE_URL,
      message: process.env.MESSAGE_SERVICE_URL,
    },
  });
});

// Service URLs
const services = {
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:8001",
  gig: process.env.GIG_SERVICE_URL || "http://localhost:8002",
  booking: process.env.BOOKING_SERVICE_URL || "http://localhost:8003",
  payment: process.env.PAYMENT_SERVICE_URL || "http://localhost:8004",
  message: process.env.MESSAGE_SERVICE_URL || "http://localhost:8005",
};

// Middleware to add service info to request
app.use("/api", (req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(`[${req.requestTime}] ${req.method} ${req.originalUrl}`);
  next();
});

// Auth Service Proxy
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: services.auth,
    changeOrigin: true,
    pathRewrite: {
      "^/api/auth": "", // Remove /api/auth prefix when forwarding
    },
    onError: (err, req, res) => {
      console.error("Auth Service Error:", err.message);
      res.status(503).json({
        error: "Auth Service Unavailable",
        message:
          "The authentication service is currently unavailable. Please try again later.",
        timestamp: new Date().toISOString(),
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Proxying to Auth Service: ${req.method} ${req.url}`);
    },
  })
);

//User Service Proxy
app.use(
  "/api/user",
  authenticateJWT,
  createProxyMiddleware({
    target: services.user,
    changeOrigin: true,
    pathRewrite: {
      "^/api/user": "/user", // Forward to /user on the user service
    },
    onError: (err, req, res) => {
      console.error("User Service Error:", err.message);
      res.status(503).json({
        error: "User Service Unavailable",
        message:
          "The user service is currently unavailable. Please try again later.",
        timestamp: new Date().toISOString(),
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Proxying to User Service: ${req.method} ${req.url}`);
    },
  })
);

// Gig Service Proxy (Protected - requires authentication)
app.use(
  "/api/gigs",
  authenticateJWT,
  createProxyMiddleware({
    target: services.gig,
    changeOrigin: true,
    pathRewrite: {
      "^/api/gigs": "/gigs", // Forward to /gigs on the gig service
    },
    onError: (err, req, res) => {
      console.error("Gig Service Error:", err.message);
      res.status(503).json({
        error: "Gig Service Unavailable",
        message:
          "The gig service is currently unavailable. Please try again later.",
        timestamp: new Date().toISOString(),
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Proxying to Gig Service: ${req.method} ${req.url}`);
    },
  })
);

// Booking Service Proxy (Protected - requires authentication)
app.use(
  "/api/bookings",
  authenticateJWT,
  createProxyMiddleware({
    target: services.booking,
    changeOrigin: true,
    pathRewrite: {
      "^/api/bookings": "/bookings", // Forward to /bookings on the booking service
    },
    onError: (err, req, res) => {
      console.error("Booking Service Error:", err.message);
      res.status(503).json({
        error: "Booking Service Unavailable",
        message:
          "The booking service is currently unavailable. Please try again later.",
        timestamp: new Date().toISOString(),
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Proxying to Booking Service: ${req.method} ${req.url}`);
    },
  })
);
//Review Service Proxy
app.use(
  "/api/reviews",
  authenticateJWT,
  createProxyMiddleware({
    target: services.review,
    changeOrigin: true,
    pathRewrite: {
      "^/api/reviews": "/reviews", // Forward to /reviews on the review service
    },
    onError: (err, req, res) => {
      console.error("Review Service Error:", err.message);
      res.status(503).json({
        error: "Review Service Unavailable",
        message:
          "The review service is currently unavailable. Please try again later.",
        timestamp: new Date().toISOString(),
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Proxying to Review Service: ${req.method} ${req.url}`);
    },
  })
);

// Payment Service Proxy (Protected - requires authentication)
app.use(
  "/api/payments",
  authenticateJWT,
  createProxyMiddleware({
    target: services.payment,
    changeOrigin: true,
    pathRewrite: {
      "^/api/payments": "/payments", // Forward to /payments on the payment service
    },
    onError: (err, req, res) => {
      console.error("Payment Service Error:", err.message);
      res.status(503).json({
        error: "Payment Service Unavailable",
        message:
          "The payment service is currently unavailable. Please try again later.",
        timestamp: new Date().toISOString(),
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Proxying to Payment Service: ${req.method} ${req.url}`);
    },
  })
);

// Message Service Proxy (Protected - requires authentication)
app.use(
  "/api/message",
  authenticateJWT,
  createProxyMiddleware({
    target: services.message,
    changeOrigin: true,
    pathRewrite: {
      "^/api/message": "/api/message", // Keep the same path structure
    },
    onError: (err, req, res) => {
      console.error("Message Service Error:", err.message);
      res.status(503).json({
        error: "Message Service Unavailable",
        message:
          "The messaging service is currently unavailable. Please try again later.",
        timestamp: new Date().toISOString(),
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Proxying to Message Service: ${req.method} ${req.url}`);
    },
  })
);

// Conversations Service Proxy (Protected - requires authentication)
app.use(
  "/api/conversations",
  authenticateJWT,
  createProxyMiddleware({
    target: services.message,
    changeOrigin: true,
    pathRewrite: {
      "^/api/conversations": "/api/conversations", // Keep the same path structure
    },
    onError: (err, req, res) => {
      console.error("Message Service (Conversations) Error:", err.message);
      res.status(503).json({
        error: "Conversation Service Unavailable",
        message:
          "The conversation service is currently unavailable. Please try again later.",
        timestamp: new Date().toISOString(),
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(
        `Proxying to Message Service (Conversations): ${req.method} ${req.url}`
      );
    },
  })
);

// Socket.IO Gateway for Real-time Communication
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Connect to Message Service Socket.IO
let messageServiceSocket = null;

function connectToMessageService() {
  try {
    messageServiceSocket = io_client(services.message, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    messageServiceSocket.on("connect", () => {
      console.log("✅ Connected to Message Service Socket.IO");
    });

    messageServiceSocket.on("disconnect", () => {
      console.log("❌ Disconnected from Message Service Socket.IO");
    });

    messageServiceSocket.on("connect_error", (error) => {
      console.error(
        "❌ Message Service Socket.IO Connection Error:",
        error.message
      );
    });

    // Forward all events from message service to clients
    messageServiceSocket.onAny((event, ...args) => {
      console.log(`📡 Forwarding event from Message Service: ${event}`);
      io.emit(event, ...args);
    });
  } catch (error) {
    console.error(
      "❌ Failed to connect to Message Service Socket.IO:",
      error.message
    );
    setTimeout(connectToMessageService, 5000); // Retry after 5 seconds
  }
}

// Initialize connection to message service
connectToMessageService();

// Handle client connections
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Forward all client events to message service
  socket.onAny((event, ...args) => {
    console.log(`📨 Forwarding event to Message Service: ${event}`);
    if (messageServiceSocket && messageServiceSocket.connected) {
      messageServiceSocket.emit(event, ...args);
    } else {
      console.warn("⚠️ Message Service Socket.IO not connected, event dropped");
      socket.emit("error", { message: "Message service unavailable" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Global error handler
app.use(errorLogger); // Log errors
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: "An unexpected error occurred",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`
🚀 API Gateway Server running on port ${PORT}
📊 Environment: ${process.env.NODE_ENV || "development"}
🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}

📡 Service Routes:
🔐 Auth Service: /api/auth → ${services.auth}
💼 Gig Service: /api/gigs → ${services.gig}
📅 Booking Service: /api/bookings → ${services.booking}
💳 Payment Service: /api/payments → ${services.payment}
💬 Message Service: /api/message, /api/conversations → ${services.message}

🔍 Health Check: http://localhost:${PORT}/health
📘 Socket.IO: ws://localhost:${PORT}
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("API Gateway server closed");
    if (messageServiceSocket) {
      messageServiceSocket.disconnect();
    }
    process.exit(0);
  });
});

module.exports = { app, server, io };
