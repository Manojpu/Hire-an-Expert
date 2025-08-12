// utils/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket;

export const initSocket = (senderId: string) => {
  // Connect to API Gateway WebSocket endpoint
  socket = io("http://localhost:8000", {
    auth: { senderId },
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 20000,
  });
  
  // Enhanced connection handling
  socket.on("connect", () => {
    console.log("🔌 Connected to API Gateway Socket.IO");
    socket.emit("registerUser", senderId);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Disconnected from API Gateway Socket.IO:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("❌ API Gateway Socket.IO Connection Error:", error.message);
  });

  socket.on("reconnect", (attemptNumber) => {
    console.log(`🔄 Reconnected to API Gateway Socket.IO (attempt ${attemptNumber})`);
  });

  socket.on("error", (error) => {
    console.error("❌ Socket.IO Error:", error);
  });
};

export const getSocket = (): Socket => socket;

// Typing helpers
export const startTyping = (conversationId: string, userId: string) => {
  if (socket) {
    socket.emit("startTyping", { conversationId, userId });
  }
};

export const stopTyping = (conversationId: string, userId: string) => {
  if (socket) {
    socket.emit("stopTyping", { conversationId, userId });
  }
};

// Message status helpers
export const markMessagesAsRead = (conversationId: string, userId: string) => {
  if (socket) {
    socket.emit("markMessagesAsRead", { conversationId, userId });
  }
};
