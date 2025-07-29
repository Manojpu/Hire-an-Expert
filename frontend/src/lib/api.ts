import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Message API functions
export const messageAPI = {
  // Send a message via REST API (fallback)
  sendMessage: async (messageData: {
    senderId: string;
    receiverId: string;
    conversationId: string;
    text: string;
  }) => {
    const response = await api.post('/message', messageData);
    return response.data;
  },

  // Get messages for a conversation
  getMessages: async (conversationId: string) => {
    const response = await api.get(`/message/${conversationId}`);
    return response.data;
  },

  // Mark message as read
  markAsRead: async (messageId: string) => {
    const response = await api.patch(`/message/${messageId}/read`);
    return response.data;
  },
};

// Conversation API functions
export const conversationAPI = {
  // Get user conversations
  getUserConversations: async (userId: string) => {
    const response = await api.get(`/conversations/${userId}`);
    return response.data;
  },
};

export default api;
