export interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'expert' | 'admin';
  profileImage?: string;
  verified: boolean;
  joinDate: string;
  location?: string;
}

export interface Expert {
  id: string;
  userId: string;
  name: string;
  title: string;
  categories: string[];
  subcategories: string[];
  profileImage?: string;
  bannerImage?: string;
  bio: string;
  pricing: {
    hourlyRate: number;
    currency: string;
  };
  rating: number;
  totalReviews: number;
  totalConsultations: number;
  responseTime: string;
  languages: string[];
  availability: Record<string, string[]>;
  qualifications: Qualification[];
  certifications: Certification[];
  missedBookings: number;
  verified: boolean;
  status: 'available' | 'busy' | 'offline';
}

export interface Qualification {
  id: string;
  title: string;
  institution: string;
  year: string;
  verified: boolean;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
  verified: boolean;
  imageUrl?: string;
}

export interface Booking {
  id: string;
  clientId: string;
  expertId: string;
  service: string;
  dateTime: string;
  duration: number;
  type: 'online' | 'physical';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  amount: number;
  description: string;
  specialRequirements?: string;
  meetingLink?: string;
  location?: string;
  notes?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  clientId: string;
  expertId: string;
  rating: number;
  comment: string;
  date: string;
  clientName: string;
  helpful: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  subcategories: Subcategory[];
  backgroundImage?: string;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'booking' | 'payment' | 'file';
  status: 'sent' | 'delivered' | 'read';
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  lastActivity: string;
  unreadCount: number;
}