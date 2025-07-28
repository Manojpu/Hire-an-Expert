import { useEffect, useState } from "react";
import { initSocket, getSocket } from "@/lib/socket";

const MessagingPage = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [text, setText] = useState("");

  const senderId = "user1";
  const receiverId = "user2";
  const conversationId = "64c9fcd843d5db0019c12345"; // use any ObjectId from DB

  useEffect(() => {
    initSocket(senderId);
    const socket = getSocket();

    socket.on("receiveMessage", (message) => {
      setMessages((prev) => [...prev, message.text]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    const socket = getSocket();
    if (text.trim()) {
      const message = {
        senderId,
        receiverId,
        conversationId,
        text,
      };
      socket.emit("sendMessage", message);
      setMessages((prev) => [...prev, `You: ${text}`]);
      setText("");
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/3 border-r p-4">Chat List (coming soon)</div>
      <div className="w-2/3 p-4 flex flex-col">
        <div className="flex-1 overflow-y-auto border p-2 mb-4">
          {messages.map((msg, i) => (
            <p key={i} className="mb-1">
              {msg}
            </p>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="border p-2 rounded flex-1"
            placeholder="Type a message"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessagingPage;
