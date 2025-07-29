"use client";

import { useEffect, useState } from "react";
import { initSocket, getSocket } from "@/lib/socket";
import { messageAPI } from "@/lib/api";

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  conversationId: string;
}

const MessagingPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const senderId = "expert456";
  const receiverId = "user123";
  const conversationId = "688226404bee6d3c01bd775e"; // use any ObjectId from DB

  useEffect(() => {
    // Initialize socket connection
    initSocket(senderId);
    const socket = getSocket();

    // Handle connection events
    socket.on("connect", () => {
      console.log("Connected to server");
      setConnected(true);
      // Join the conversation room
      socket.emit("joinRoom", conversationId);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setConnected(false);
    });

    // Listen for incoming messages
    socket.on("receiveMessage", (message: Message) => {
      console.log("Received message:", message);
      setMessages((prev) => [...prev, message]);
    });

    // Load existing messages
    loadMessages();

    return () => {
      socket.disconnect();
    };
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const existingMessages = await messageAPI.getMessages(conversationId);
      console.log("Loaded messages:", existingMessages);
      setMessages(existingMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    const socket = getSocket();
    if (text.trim() && connected) {
      const messageData = {
        senderId,
        receiverId,
        conversationId,
        text,
      };
      
      console.log("Sending message:", messageData);
      socket.emit("sendMessage", messageData);
      setText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{ 
        width: '33.333333%', 
        borderRight: '1px solid #e5e7eb', 
        backgroundColor: 'white', 
        padding: '1rem' 
      }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
          Conversations
        </h2>
        <p style={{ color: '#6b7280' }}>Chat List (coming soon)</p>
      </div>
      
      <div style={{ 
        width: '66.666667%', 
        backgroundColor: 'white', 
        padding: '1rem', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        {/* Header */}
        <div style={{ 
          borderBottom: '1px solid #e5e7eb', 
          paddingBottom: '0.5rem', 
          marginBottom: '1rem' 
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Expert Chat</h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Status: {connected ? "Connected" : "Disconnected"}
          </p>
        </div>

        {/* Messages */}
        <div style={{ 
          flex: '1', 
          overflowY: 'auto', 
          border: '1px solid #e5e7eb', 
          borderRadius: '0.5rem', 
          padding: '1rem', 
          marginBottom: '1rem', 
          backgroundColor: '#f9fafb' 
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#6b7280' }}>Loading messages...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280' }}>No messages yet. Start a conversation!</div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                style={{
                  marginBottom: '0.75rem',
                  display: 'flex',
                  justifyContent: msg.senderId === senderId ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '24rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: msg.senderId === senderId ? '#3b82f6' : 'white',
                    color: msg.senderId === senderId ? 'white' : '#1f2937',
                    border: msg.senderId === senderId ? 'none' : '1px solid #e5e7eb'
                  }}
                >
                  <p style={{ fontSize: '0.875rem' }}>{msg.text}</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.75 }}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            style={{
              border: '1px solid #d1d5db',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              flex: '1',
              outline: 'none',
              fontSize: '1rem'
            }}
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!connected}
          />
          <button
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              color: 'white',
              fontWeight: '500',
              backgroundColor: (connected && text.trim()) ? '#3b82f6' : '#9ca3af',
              cursor: (connected && text.trim()) ? 'pointer' : 'not-allowed',
              border: 'none',
              fontSize: '1rem'
            }}
            onClick={sendMessage}
            disabled={!connected || !text.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessagingPage;
