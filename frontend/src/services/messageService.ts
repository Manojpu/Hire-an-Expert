import { io, Socket } from "socket.io-client";
import { auth } from "../firebase/firebase";
import { getIdToken } from "firebase/auth";
import type { Chat } from "@/components/chat/types";

const API_GATEWAY_URL =
  import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8000";
const MSG_SERVICE_URL =
  import.meta.env.VITE_MSG_SERVICE_URL || "http://localhost:8005"; // Direct for Socket.IO

class MessageService {
  private socket: Socket | null = null;
  private readonly baseURL = API_GATEWAY_URL; // API Gateway URL
  private readonly socketURL = MSG_SERVICE_URL; // Direct to msg-service for Socket.IO

  // Helper method to get authorization headers
  private async getAuthHeaders() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const idToken = await getIdToken(user);
    return {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    };
  }

  connect(userId: string) {
    if (this.socket?.connected) {
      console.log("🔌 Socket already connected, rejoining rooms...");
      this.socket?.emit("registerUser", userId);
      this.socket?.emit("joinAllConversations", userId);
      return;
    }

    console.log("🔌 Creating new Socket.IO connection...");
    this.socket = io(this.socketURL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("✅ Connected to message service");
      this.socket?.emit("registerUser", userId);
      // Join all conversations for real-time updates across all chats
      this.socket?.emit("joinAllConversations", userId);
      console.log("📬 Joined all conversations for real-time updates");
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log(
        `🔄 Reconnected to message service after ${attemptNumber} attempts`
      );
      this.socket?.emit("registerUser", userId);
      this.socket?.emit("joinAllConversations", userId);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from message service:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("⚠️ Connection error:", error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // API calls to backend
  private mapConversationToChat(
    conversation: any,
    currentUserId: string
  ): Chat {
    const resolvedId = conversation._id || conversation.id;
    const updatedAt = conversation.updatedAt || new Date().toISOString();
    const lastMessage = conversation.lastMessage || "No messages yet";
    const unread = conversation.unreadCount || {};
    const unreadCount =
      String(currentUserId) === String(conversation.senderId)
        ? unread.senderId || 0
        : unread.receiverId || 0;

    const nameFromOtherUser =
      conversation.otherUser?.name || conversation.otherUser?.email;

    return {
      id: resolvedId,
      name: conversation.name || nameFromOtherUser || "New Conversation",
      lastMessage,
      timestamp: new Date(updatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      unreadCount,
      isOnline: false,
      avatar:
        conversation.otherUser?.profile_image_url ||
        conversation.avatar ||
        "/placeholder.svg",
      senderId: conversation.senderId,
      receiverId: conversation.receiverId,
      updatedAt,
    };
  }

  async getConversations(userId: string): Promise<Chat[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${this.baseURL}/api/conversations/user/${userId}`,
        {
          headers,
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      const data = await response.json();

      // Transform backend data to frontend format
      return data.map((conv: any) => this.mapConversationToChat(conv, userId));
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return [];
    }
  }

  async getMessages(conversationId: string) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${this.baseURL}/api/message/conversation/${conversationId}`,
        {
          headers,
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  }

  async createConversation(senderId: string, receiverId: string) {
    const headers = await this.getAuthHeaders();

    const attemptCreate = async (url: string) => {
      const response = await fetch(`${url}/api/conversations`, {
        method: "POST",
        headers,
        body: JSON.stringify({ senderId, receiverId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Create conversation error:", response.status, errorText);
        throw new Error(`Failed to create conversation: ${response.status}`);
      }

      return response.json();
    };

    try {
      // Prefer the gateway URL to avoid browser CORS restrictions when direct service isn't exposed
      return await attemptCreate(this.baseURL);
    } catch (gatewayError) {
      console.warn(
        "Primary conversation creation via API gateway failed, attempting direct message service...",
        gatewayError
      );

      try {
        return await attemptCreate(MSG_SERVICE_URL);
      } catch (directError) {
        console.error(
          "Error creating conversation via both endpoints:",
          directError
        );
        throw directError;
      }
    }
  }

  /**
   * Creates or gets an existing conversation and returns the conversation data
   * This is useful when initiating a chat from external sources like GigView
   */
  async getOrCreateConversation(
    senderId: string,
    receiverId: string
  ): Promise<Chat> {
    try {
      console.log(
        `🔍 Getting or creating conversation between ${senderId} and ${receiverId}`
      );

      // First, try to get existing conversations
      const conversations = await this.getConversations(senderId);
      console.log(`📋 Found ${conversations.length} existing conversations`);

      // Check if a conversation already exists with this receiver
      const existingConversation = conversations.find(
        (conv: Chat) =>
          (conv.senderId === senderId && conv.receiverId === receiverId) ||
          (conv.senderId === receiverId && conv.receiverId === senderId)
      );

      if (existingConversation) {
        console.log(
          `✅ Found existing conversation: ${existingConversation.id}`
        );
        return existingConversation;
      }

      // If no existing conversation, create a new one
      console.log(
        `📝 Creating new conversation between ${senderId} and ${receiverId}...`
      );
      const newConversation = await this.createConversation(
        senderId,
        receiverId
      );
      console.log(`✅ New conversation created:`, newConversation);

      // Transform the response to match the expected format
      return this.mapConversationToChat(newConversation, senderId);
    } catch (error) {
      console.error("❌ Error getting or creating conversation:", error);
      throw error;
    }
  }

  // File upload with progress tracking
  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    thumbnailUrl?: string;
    duration?: number;
  }> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const idToken = await getIdToken(user);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable && onProgress) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(Math.round(percentComplete));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve({
              fileUrl: response.fileUrl,
              fileName: response.fileName,
              fileSize: response.fileSize,
              mimeType: response.mimeType,
              thumbnailUrl: response.thumbnailUrl,
              duration: response.duration,
            });
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload cancelled"));
        });

        xhr.open("POST", `${this.baseURL}/api/upload/upload`);
        xhr.setRequestHeader("Authorization", `Bearer ${idToken}`);
        xhr.send(formData);
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }

  // Send message with file attachment
  async sendMessageWithFile(messageData: {
    senderId: string;
    receiverId: string;
    text?: string;
    conversationId: string;
    type: "image" | "document" | "voice";
    fileUrl: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    thumbnailUrl?: string;
  }) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/api/message/`, {
        method: "POST",
        headers,
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Send message error:", response.status, errorText);
        throw new Error(
          `Failed to send message: ${response.status} - ${errorText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending message with file:", error);
      throw error;
    }
  }

  // Socket.IO event handlers
  joinRoom(conversationId: string) {
    this.socket?.emit("joinRoom", conversationId);
  }

  async sendMessage(messageData: {
    senderId: string;
    receiverId: string;
    text: string;
    conversationId: string;
  }) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/api/message/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...messageData,
          type: "text",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Send text message error:", response.status, errorText);
        throw new Error(`Failed to send message: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending text message:", error);
      throw error;
    }
  }

  markMessagesAsRead(conversationId: string, userId: string) {
    this.socket?.emit("markMessagesAsRead", { conversationId, userId });
  }

  startTyping(conversationId: string, userId: string) {
    this.socket?.emit("startTyping", { conversationId, userId });
  }

  stopTyping(conversationId: string, userId: string) {
    this.socket?.emit("stopTyping", { conversationId, userId });
  }

  // Event listeners - Note: Multiple calls will add multiple listeners
  // This is intentional to allow different components to listen independently
  onReceiveMessage(callback: (message: any) => void) {
    this.socket?.on("receiveMessage", callback);
    return () => this.socket?.off("receiveMessage", callback);
  }

  onConversationUpdate(callback: (conversation: any) => void) {
    this.socket?.on("conversationUpdated", callback);
    return () => this.socket?.off("conversationUpdated", callback);
  }

  onUserTyping(
    callback: (data: { userId: string; isTyping: boolean }) => void
  ) {
    this.socket?.on("userTyping", callback);
    return () => this.socket?.off("userTyping", callback);
  }

  onMessagesRead(
    callback: (data: { conversationId: string; readBy: string }) => void
  ) {
    this.socket?.on("messagesReadUpdate", callback);
    return () => this.socket?.off("messagesReadUpdate", callback);
  }

  onActiveUsersUpdate(
    callback: (data: { conversationId: string; activeUsers: string[] }) => void
  ) {
    this.socket?.on("activeUsersUpdate", callback);
  }

  cleanup() {
    // Note: We don't remove ALL listeners here because multiple components may be using them
    // Each component should manage its own specific listeners
    console.log(
      "⚠️  cleanup() called - listeners should be managed per component"
    );
  }

  removeListener(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }
}

export const messageService = new MessageService();
