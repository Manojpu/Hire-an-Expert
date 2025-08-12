import axios from 'axios';

// API Gateway URL - Single point of entry for all services
const API_GATEWAY_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Global request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging (using a custom property)
    (config as any).requestStartTime = new Date();
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Global response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const startTime = (response.config as any).requestStartTime;
    const duration = startTime ? new Date().getTime() - startTime.getTime() : 0;
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
    
    return response;
  },
  (error) => {
    const startTime = (error.config as any)?.requestStartTime;
    const duration = startTime ? new Date().getTime() - startTime.getTime() : 0;
    
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms)`, error.response?.data || error.message);
    
    // Handle common error scenarios
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      console.warn('🔒 Unauthorized access - consider redirecting to login');
      localStorage.removeItem('authToken');
    } else if (error.response?.status === 503) {
      // Service unavailable
      console.warn('🚫 Service temporarily unavailable');
    }
    
    return Promise.reject(error);
  }
);

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

  // Create or get conversation between two users
  createConversation: async (senderId: string, receiverId: string) => {
    const response = await api.post('/conversations', { senderId, receiverId });
    return response.data;
  },

  // Get conversation by ID
  getConversation: async (conversationId: string) => {
    const response = await api.get(`/conversations/details/${conversationId}`);
    return response.data;
  },
};

// Auth API functions
export const authAPI = {
  // User registration
  signup: async (userData: { email: string; password: string }) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  // User login
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Validate token
  validateToken: async (token: string) => {
    const response = await api.post('/auth/ping', {}, {
      headers: { Authorization: token }
    });
    return response.data;
  },
};

// Gig API functions
export const gigAPI = {
  // Get all gigs
  getAllGigs: async () => {
    const response = await api.get('/gigs');
    return response.data;
  },

  // Get gig by ID
  getGig: async (gigId: string) => {
    const response = await api.get(`/gigs/${gigId}`);
    return response.data;
  },

  // Create new gig
  createGig: async (gigData: any) => {
    const response = await api.post('/gigs', gigData);
    return response.data;
  },

  // Update gig
  updateGig: async (gigId: string, gigData: any) => {
    const response = await api.put(`/gigs/${gigId}`, gigData);
    return response.data;
  },

  // Delete gig
  deleteGig: async (gigId: string) => {
    const response = await api.delete(`/gigs/${gigId}`);
    return response.data;
  },

  // Search gigs
  searchGigs: async (query: string) => {
    const response = await api.get(`/gigs/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

// Booking API functions
export const bookingAPI = {
  // Get user bookings
  getUserBookings: async (userId: string) => {
    const response = await api.get(`/bookings/user/${userId}`);
    return response.data;
  },

  // Get booking by ID
  getBooking: async (bookingId: string) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },

  // Create new booking
  createBooking: async (bookingData: any) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  // Update booking status
  updateBookingStatus: async (bookingId: string, status: string) => {
    const response = await api.patch(`/bookings/${bookingId}/status`, { status });
    return response.data;
  },

  // Cancel booking
  cancelBooking: async (bookingId: string) => {
    const response = await api.delete(`/bookings/${bookingId}`);
    return response.data;
  },
};

// Payment API functions
export const paymentAPI = {
  // Create payment intent
  createPaymentIntent: async (paymentData: { amount: number; currency: string; bookingId: string }) => {
    const response = await api.post('/payments/create-intent', paymentData);
    return response.data;
  },

  // Confirm payment
  confirmPayment: async (paymentIntentId: string) => {
    const response = await api.post(`/payments/confirm/${paymentIntentId}`);
    return response.data;
  },

  // Get payment history
  getPaymentHistory: async (userId: string) => {
    const response = await api.get(`/payments/history/${userId}`);
    return response.data;
  },

  // Refund payment
  refundPayment: async (paymentId: string, amount?: number) => {
    const response = await api.post(`/payments/refund/${paymentId}`, { amount });
    return response.data;
  },
};

export default api;
