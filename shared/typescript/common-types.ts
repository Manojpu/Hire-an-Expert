// Mirroring Python models for type safety in frontend
export type UserRole = "client" | "expert" | "admin";

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  is_active: boolean;
  is_verified: boolean;
  role: UserRole;
  profile_picture_url?: string;
  created_at: string; // ISO string
  updated_at?: string; // ISO string
}

export interface ExpertProfile {
  id: number;
  user_id: number;
  headline?: string;
  bio?: string;
  categories: string[];
  skills: string[];
  hourly_rate?: number;
  experience_years: number;
  education?: string;
  certifications: string[];
  languages: string[];
  location?: string;
  is_available: boolean;
  rating: number;
  total_reviews: number;
  completed_sessions: number;
  created_at: string;
  updated_at?: string;
  user: User;
}

export interface ExpertService {
  id: number;
  expert_profile_id: number;
  name: string;
  description?: string;
  price_per_hour: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ClientProfile {
  id: number;
  user_id: number;
  preferences: Record<string, any>;
  total_bookings: number;
  total_spent: number;
  created_at: string;
  updated_at?: string;
  user: User;
}

export interface ServiceOffer {
  name: string;
  description?: string;
  price_per_hour: number;
  duration_minutes: number;
  is_active: boolean;
}

export interface TimeSlot {
  start_time: string; // ISO string
  end_time: string; // ISO string
  is_booked: boolean;
  booking_id?: string;
}

export interface Category {
  name: string;
  description?: string;
  icon?: string;
}

export interface Skill {
  name: string;
  category: string;
  description?: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_picture_url?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Expert search and filtering
export interface ExpertSearchParams {
  categories?: string[];
  skills?: string[];
  min_rating?: number;
  max_hourly_rate?: number;
  location?: string;
  is_available?: boolean;
  limit?: number;
  offset?: number;
}

export interface ExpertSearchResponse {
  experts: ExpertProfile[];
  total: number;
  limit: number;
  offset: number;
}

// Profile update types
export interface UserUpdateRequest {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_picture_url?: string;
}

export interface ExpertProfileUpdateRequest {
  headline?: string;
  bio?: string;
  categories?: string[];
  skills?: string[];
  hourly_rate?: number;
  experience_years?: number;
  education?: string;
  certifications?: string[];
  languages?: string[];
  location?: string;
  is_available?: boolean;
}

export interface ExpertServiceCreateRequest {
  name: string;
  description?: string;
  price_per_hour: number;
  duration_minutes?: number;
  is_active?: boolean;
}

export interface ExpertServiceUpdateRequest {
  name?: string;
  description?: string;
  price_per_hour?: number;
  duration_minutes?: number;
  is_active?: boolean;
}

export interface ClientProfileUpdateRequest {
  preferences?: Record<string, any>;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Error types
export interface ApiError {
  detail: string;
  status_code: number;
  timestamp: string;
}

// Booking and messaging types (for future integration)
export interface Booking {
  id: string;
  client_id: number;
  expert_id: number;
  service_id: number;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: number;
  content: string;
  message_type: 'text' | 'image' | 'file';
  created_at: string;
  read_at?: string;
}

export interface Conversation {
  id: string;
  client_id: number;
  expert_id: number;
  booking_id?: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  last_message?: Message;
}

export interface Review {
  id: string;
  booking_id: string;
  client_id: number;
  expert_id: number;
  rating: number;
  comment?: string;
  created_at: string;
}

// Payment types (for future integration)
export interface PaymentTransaction {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  created_at: string;
  completed_at?: string;
}
