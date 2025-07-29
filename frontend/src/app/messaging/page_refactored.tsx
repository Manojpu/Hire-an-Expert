"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { initSocket, getSocket, startTyping, stopTyping, markMessagesAsRead } from "@/lib/socket";
import { messageAPI, conversationAPI } from "@/lib/api";
import { getCurrentUser, logout, getUserInfo } from "@/lib/auth";
import ConversationList from "@/components/messaging/ChatList";
import ChatWindow from "@/components/messaging/ChatWindow";

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  conversationId: string;
  status: 'sent' | 'delivered' | 'read';
  readAt?: string;
}

interface Conversation {
  _id: string;
  senderId: string;
  receiverId: string;
  lastMessage: string;
  lastMessageId: string;
  unreadCount: {
    senderId: number;
    receiverId: number;
  };
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
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const router = useRouter();

  // Dynamic user IDs based on authentication
  const [senderId, setSenderId] = useState("");
  
  // Refs for auto-scrolling and typing timeout
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check authentication
    const user = getCurrentUser();
    const userInfo = getUserInfo();
    
    if (!user || !userInfo || !userInfo.userId) {
      router.push('/login');
      return;
    }

    console.log("Setting up user:", userInfo);
    setCurrentUser(userInfo);
    setSenderId(userInfo.userId);

    // Initialize socket connection
    initSocket(userInfo.userId);
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

    return () => {
      socket.disconnect();
    };
  }, [router]);

  // Separate useEffect to load conversations after senderId is set
  useEffect(() => {
    if (senderId) {
      console.log("Loading conversations for senderId:", senderId);
      loadConversations(senderId);
    }
  }, [senderId]);

  // Separate useEffect for handling incoming messages and events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleReceiveMessage = (message: Message) => {
      console.log("Received message:", message);
      if (activeConversation && message.conversationId === activeConversation) {
        setMessages((prev) => {
          const messageExists = prev.some(msg => msg._id === message._id);
          if (messageExists) return prev;
          return [...prev, message];
        });
      }
    };

    const handleUserTyping = (data: { userId: string; isTyping: boolean }) => {
      console.log("User typing:", data);
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    };

    const handleMessagesReadUpdate = (data: { conversationId: string; readBy: string; messages: Message[] }) => {
      console.log("Messages read update:", data);
      if (activeConversation === data.conversationId) {
        setMessages(data.messages);
      }
    };

    const handleMessagesDeliveredUpdate = (data: { conversationId: string; deliveredTo: string; messages: Message[] }) => {
      console.log("Messages delivered update:", data);
      if (activeConversation === data.conversationId) {
        setMessages(data.messages);
      }
    };

    const handleConversationUpdated = (conversation: Conversation) => {
      console.log("Conversation updated:", conversation);
      setConversations(prev => 
        prev.map(conv => 
          conv._id === conversation._id ? conversation : conv
        )
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("userTyping", handleUserTyping);
    socket.on("messagesReadUpdate", handleMessagesReadUpdate);
    socket.on("messagesDeliveredUpdate", handleMessagesDeliveredUpdate);
    socket.on("conversationUpdated", handleConversationUpdated);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("userTyping", handleUserTyping);
      socket.off("messagesReadUpdate", handleMessagesReadUpdate);
      socket.off("messagesDeliveredUpdate", handleMessagesDeliveredUpdate);
      socket.off("conversationUpdated", handleConversationUpdated);
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
    if (!userId) {
      console.log("No userId provided to loadConversations");
      return;
    }
    
    try {
      setConversationsLoading(true);
      console.log("Loading conversations for userId:", userId);
      
      const userConversations = await conversationAPI.getUserConversations(userId);
      console.log("Loaded conversations:", userConversations);
      
      setConversations(userConversations || []);
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
      setTypingUsers(new Set());
      
      setActiveConversation(conversation._id);
      
      // Determine receiver ID based on current user
      const otherUserId = conversation.senderId === senderId ? conversation.receiverId : conversation.senderId;
      setReceiverId(otherUserId);

      // Join the conversation room
      const socket = getSocket();
      if (socket) {
        socket.emit("joinRoom", conversation._id);
      }

      // Load ALL messages for this conversation (no pagination limit)
      const existingMessages = await messageAPI.getMessages(conversation._id);
      console.log("Loaded ALL messages for conversation:", existingMessages.length, "messages");
      
      // Sort messages by timestamp to ensure proper order
      const sortedMessages = existingMessages.sort((a: Message, b: Message) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      setMessages(sortedMessages);

      // Mark messages as read after a short delay (to ensure UI is updated)
      setTimeout(() => {
        if (socket && senderId) {
          markMessagesAsRead(conversation._id, senderId);
        }
      }, 500);

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
        text: text.trim(),
      };
      
      console.log("Sending message:", messageData);
      socket.emit("sendMessage", messageData);
      setText("");
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        stopTyping(activeConversation, senderId);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setText(value);

    // Handle typing indicators
    if (value.trim() && activeConversation && senderId) {
      if (!isTyping) {
        setIsTyping(true);
        startTyping(activeConversation, senderId);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          stopTyping(activeConversation, senderId);
        }
      }, 2000);
    } else if (isTyping) {
      // Stop typing if input is empty
      setIsTyping(false);
      stopTyping(activeConversation, senderId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
      <ConversationList
        conversations={conversations}
        conversationsLoading={conversationsLoading}
        activeConversation={activeConversation}
        senderId={senderId}
        currentUser={currentUser}
        onSelectConversation={selectConversation}
        onCreateNewConversation={createNewConversation}
        onLogout={handleLogout}
      />
      
      <div style={{ 
        width: '66.666667%', 
        backgroundColor: 'white', 
        padding: '1rem', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        <ChatWindow
          ref={messagesEndRef}
          activeConversation={activeConversation}
          loading={loading}
          messages={messages}
          typingUsers={typingUsers}
          connected={connected}
          receiverId={receiverId}
          senderId={senderId}
          text={text}
          onTextChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onSendMessage={sendMessage}
        />
      </div>
    </div>
  );
};

export default MessagingPage;
