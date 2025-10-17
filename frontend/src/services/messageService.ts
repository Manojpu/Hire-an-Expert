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
      console.log('🔌 Socket already connected, rejoining rooms...');
      this.socket?.emit('registerUser', userId);
      this.socket?.emit('joinAllConversations', userId);
      return;
    }

    console.log('🔌 Creating new Socket.IO connection...');
    this.socket = io(this.socketURL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to message service');
      this.socket?.emit('registerUser', userId);
      // Join all conversations for real-time updates across all chats
      this.socket?.emit('joinAllConversations', userId);
      console.log('📬 Joined all conversations for real-time updates');
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected to message service after ${attemptNumber} attempts`);
      this.socket?.emit('registerUser', userId);
      this.socket?.emit('joinAllConversations', userId);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from message service:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('⚠️ Connection error:', error);
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
      formData.append('file', file);

      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const idToken = await getIdToken(user);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(Math.round(percentComplete));
          }
        });

        xhr.addEventListener('load', () => {
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

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        xhr.open('POST', `${this.baseURL}/api/upload/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${idToken}`);
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Send message with file attachment
  async sendMessageWithFile(messageData: {
    senderId: string;
    receiverId: string;
    text?: string;
    conversationId: string;
    type: 'image' | 'document' | 'voice';
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
        method: 'POST',
        headers,
        body: JSON.stringify(messageData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Send message error:', response.status, errorText);
        throw new Error(`Failed to send message: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending message with file:', error);
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

  // Event listeners - Note: Multiple calls will add multiple listeners
  // This is intentional to allow different components to listen independently
  onReceiveMessage(callback: (message: any) => void) {
    this.socket?.on('receiveMessage', callback);
    return () => this.socket?.off('receiveMessage', callback);
  }

  onConversationUpdate(callback: (conversation: any) => void) {
    this.socket?.on('conversationUpdated', callback);
    return () => this.socket?.off('conversationUpdated', callback);
  }

  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    this.socket?.on('userTyping', callback);
    return () => this.socket?.off('userTyping', callback);
  }

  onMessagesRead(callback: (data: { conversationId: string; readBy: string }) => void) {
    this.socket?.on('messagesReadUpdate', callback);
    return () => this.socket?.off('messagesReadUpdate', callback);
  }

  onActiveUsersUpdate(callback: (data: { conversationId: string; activeUsers: string[] }) => void) {
    this.socket?.on('activeUsersUpdate', callback);
  }

  cleanup() {
    // Note: We don't remove ALL listeners here because multiple components may be using them
    // Each component should manage its own specific listeners
    console.log('⚠️  cleanup() called - listeners should be managed per component');
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
