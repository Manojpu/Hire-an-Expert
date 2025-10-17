export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  senderId: string;
  receiverId: string;
  conversationId: string;
  // File attachment fields
  type?: 'text' | 'image' | 'document' | 'voice';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  duration?: number;
  thumbnailUrl?: string;
}

export interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  avatar: string;
  lastSeen?: string;
  senderId: string;
  receiverId: string;
  updatedAt: string;
}
