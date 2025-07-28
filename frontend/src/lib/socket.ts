// utils/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket;

export const initSocket = (senderId: string) => {
  socket = io("http://localhost:5000", {
    auth: { senderId },
    transports: ["websocket"],
  });
};

export const getSocket = (): Socket => socket;
