"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { initSocket, getSocket } from "@/lib/socket";
import { messageAPI, conversationAPI } from "@/lib/api";
import { getCurrentUser, logout, getUserInfo } from "@/lib/auth";

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  conversationId: string;
}

interface Conversation {
  _id: string;
  senderId: string;
  receiverId: string;
  lastMessage: string;
  updatedAt: string;
}

const MessagingPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeConversation, setActiveConversation] = useState<string>('');
  const [receiverId, setReceiverId] = useState('');
  const router = useRouter();

  // Dynamic user IDs based on authentication
  const [senderId, setSenderId] = useState("");
  
  // Ref for auto-scrolling to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check authentication
    const user = getCurrentUser();
    const userInfo = getUserInfo();
    
    if (!user || !userInfo) {
      router.push('/login');
      return;
    }

    setCurrentUser(userInfo);
    setSenderId(userInfo.userId || "");

    // Initialize socket connection
    initSocket(userInfo.userId || "");
    const socket = getSocket();

    // Handle connection events
    socket.on("connect", () => {
      console.log("Connected to server");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setConnected(false);
    });

    // Load user conversations
    loadConversations(userInfo.userId || "");

    return () => {
      socket.disconnect();
    };
  }, [router]);

  // Separate useEffect for handling incoming messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleReceiveMessage = (message: Message) => {
      console.log("Received message:", message);
      // Only add message if it belongs to the currently active conversation
      if (activeConversation && message.conversationId === activeConversation) {
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const messageExists = prev.some(msg => msg._id === message._id);
          if (messageExists) return prev;
          return [...prev, message];
        });
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [activeConversation]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async (userId: string) => {
    try {
      setConversationsLoading(true);
      const userConversations = await conversationAPI.getUserConversations(userId);
      console.log("Loaded conversations:", userConversations);
      setConversations(userConversations);
    } catch (error) {
      console.error("Error loading conversations:", error);
      setConversations([]);
    } finally {
      setConversationsLoading(false);
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    try {
      setLoading(true);
      
      // Clear existing messages first
      setMessages([]);
      
      setActiveConversation(conversation._id);
      
      // Determine receiver ID based on current user
      const otherUserId = conversation.senderId === senderId ? conversation.receiverId : conversation.senderId;
      setReceiverId(otherUserId);

      // Join the conversation room
      const socket = getSocket();
      if (socket) {
        socket.emit("joinRoom", conversation._id);
      }

      // Load messages for this conversation
      const existingMessages = await messageAPI.getMessages(conversation._id);
      console.log("Loaded messages for conversation:", existingMessages);
      
      // Sort messages by timestamp to ensure proper order
      const sortedMessages = existingMessages.sort((a: Message, b: Message) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      setMessages(sortedMessages);
    } catch (error) {
      console.error("Error loading conversation messages:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async (targetUserId: string) => {
    try {
      const newConversation = await conversationAPI.createConversation(senderId, targetUserId);
      console.log("Created new conversation:", newConversation);
      
      // Refresh conversations list
      await loadConversations(senderId);
      
      // Select the new conversation
      await selectConversation(newConversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const sendMessage = () => {
    const socket = getSocket();
    if (text.trim() && connected && senderId && receiverId && activeConversation) {
      const messageData = {
        senderId,
        receiverId,
        conversationId: activeConversation,
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

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Show loading if not authenticated
  if (!currentUser) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        Checking authentication...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{ 
        width: '33.333333%', 
        borderRight: '1px solid #e5e7eb', 
        backgroundColor: 'white', 
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* User Info */}
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Conversations
          </h2>
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '6px',
            fontSize: '0.875rem'
          }}>
            <p><strong>👤 {currentUser.username}</strong></p>
            <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {currentUser.userType} • {currentUser.userId}
            </p>
            <button
              onClick={handleLogout}
              style={{
                marginTop: '0.5rem',
                padding: '0.4rem 0.8rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* New Conversation Button */}
        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={() => {
              const targetId = currentUser.userType === 'user' ? 'expert456' : 'user123';
              createNewConversation(targetId);
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            + New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div style={{ flex: '1', overflowY: 'auto' }}>
          {conversationsLoading ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>
              <p>No conversations yet.</p>
              <p style={{ fontSize: '0.8rem' }}>Click "New Chat" to start!</p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const otherUserId = conversation.senderId === senderId ? conversation.receiverId : conversation.senderId;
              const isActive = activeConversation === conversation._id;
              
              return (
                <div
                  key={conversation._id}
                  onClick={() => selectConversation(conversation)}
                  style={{
                    padding: '0.75rem',
                    margin: '0.5rem 0',
                    backgroundColor: isActive ? '#3b82f6' : '#f9fafb',
                    color: isActive ? 'white' : '#1f2937',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: isActive ? 'none' : '1px solid #e5e7eb',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.target as HTMLElement).style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.target as HTMLElement).style.backgroundColor = '#f9fafb';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        {otherUserId}
                      </p>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        opacity: 0.8,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '150px'
                      }}>
                        {conversation.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                        {new Date(conversation.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <div style={{ 
        width: '66.666667%', 
        backgroundColor: 'white', 
        padding: '1rem', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        {!activeConversation ? (
          // No conversation selected
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#6b7280'
          }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>💬</h3>
            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Welcome to Hire an Expert Messaging!</p>
            <p style={{ fontSize: '0.875rem', textAlign: 'center' }}>
              Select a conversation from the left to start chatting,<br />
              or click "New Chat" to begin a new conversation.
            </p>
          </div>
        ) : (
          // Active conversation
          <>
            {/* Header */}
            <div style={{ 
              borderBottom: '1px solid #e5e7eb', 
              paddingBottom: '0.5rem', 
              marginBottom: '1rem' 
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                💬 Chat Conversation
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}
              </p>
              <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                Chatting with {receiverId}
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
                <div style={{ textAlign: 'center', color: '#6b7280' }}>
                  No messages yet. Start a conversation!<br />
                  <small>💡 Open another browser tab and login as a different user to test real-time messaging</small>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
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
                          {formatTime(msg.timestamp)} • {msg.senderId}
                        </p>
                      </div>
                    </div>
                  ))}
                  {/* Auto-scroll anchor */}
                  <div ref={messagesEndRef} />
                </>
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
          </>
        )}
      </div>
    </div>
  );
};

export default MessagingPage;
