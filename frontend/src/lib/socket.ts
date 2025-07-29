// utils/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket;

export const initSocket = (senderId: string) => {
  socket = io("http://localhost:5000", {
    auth: { senderId },
    transports: ["websocket"],
  });
  
  // Register user on connection
  socket.on("connect", () => {
    socket.emit("registerUser", senderId);
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
