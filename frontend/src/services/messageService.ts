import { io, Socket } from 'socket.io-client';
import { auth } from '../firebase/firebase';
import { getIdToken } from 'firebase/auth';

class MessageService {
  private socket: Socket | null = null;
  private readonly baseURL = 'http://localhost:8000'; // API Gateway URL
  private readonly socketURL = 'http://localhost:8005'; // Direct to msg-service for Socket.IO

  // Helper method to get authorization headers
  private async getAuthHeaders() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const idToken = await getIdToken(user);
    return {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    };
  }

  connect(userId: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(this.socketURL);

    this.socket.on('connect', () => {
      console.log('Connected to message service');
      this.socket?.emit('registerUser', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from message service');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // API calls to backend
  async getConversations(userId: string) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/api/conversations/user/${userId}`, {
        headers
      });
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      const data = await response.json();
      
      // Transform backend data to frontend format
      return data.map((conv: any) => ({
        id: conv._id,
        name: conv.otherUser?.name || conv.otherUser?.email || 'Unknown User',
        lastMessage: conv.lastMessage || 'No messages yet',
        timestamp: new Date(conv.updatedAt).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        unreadCount: userId === conv.senderId 
          ? conv.unreadCount?.senderId || 0
          : conv.unreadCount?.receiverId || 0,
        isOnline: false, // You can enhance this with real-time presence
        avatar: conv.otherUser?.profile_image_url || '/placeholder.svg',
        senderId: conv.senderId,
        receiverId: conv.receiverId,
        updatedAt: conv.updatedAt,
        otherUser: conv.otherUser
      }));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  async getMessages(conversationId: string) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/api/message/conversation/${conversationId}`, {
        headers
      });
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async createConversation(senderId: string, receiverId: string) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/api/conversations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ senderId, receiverId }),
      });
      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Socket.IO event handlers
  joinRoom(conversationId: string) {
    this.socket?.emit('joinRoom', conversationId);
  }

  sendMessage(messageData: {
    senderId: string;
    receiverId: string;
    text: string;
    conversationId: string;
  }) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('sendMessage', messageData);
      
      // Listen for message error
      this.socket.once('messageError', (error) => {
        reject(new Error(error.error));
      });

      // Assume success if no error within timeout
      setTimeout(() => resolve(true), 1000);
    });
  }

  markMessagesAsRead(conversationId: string, userId: string) {
    this.socket?.emit('markMessagesAsRead', { conversationId, userId });
  }

  startTyping(conversationId: string, userId: string) {
    this.socket?.emit('startTyping', { conversationId, userId });
  }

  stopTyping(conversationId: string, userId: string) {
    this.socket?.emit('stopTyping', { conversationId, userId });
  }

  // Event listeners
  onReceiveMessage(callback: (message: any) => void) {
    this.socket?.on('receiveMessage', callback);
  }

  onConversationUpdate(callback: (conversation: any) => void) {
    this.socket?.on('conversationUpdated', callback);
  }

  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    this.socket?.on('userTyping', callback);
  }

  onMessagesRead(callback: (data: { conversationId: string; readBy: string }) => void) {
    this.socket?.on('messagesReadUpdate', callback);
  }

  onActiveUsersUpdate(callback: (data: { conversationId: string; activeUsers: string[] }) => void) {
    this.socket?.on('activeUsersUpdate', callback);
  }

  cleanup() {
    if (this.socket) {
      this.socket.off('receiveMessage');
      this.socket.off('conversationUpdated');
      this.socket.off('userTyping');
      this.socket.off('messagesReadUpdate');
      this.socket.off('activeUsersUpdate');
    }
  }
}

export const messageService = new MessageService();
