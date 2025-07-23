// Mirroring Python models for type safety in frontend
export type UserRole = "client" | "expert" | "admin";

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  role: UserRole;
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

export interface ExpertProfile {
  id: string; // MongoDB ObjectId as string
  user_id: number;
  headline: string;
  bio: string;
  categories: string[];
  skills: string[];
  hourly_rate: number;
  services_offered: ServiceOffer[];
  availability: TimeSlot[];
  is_verified: boolean;
  created_at: string;
  updated_at: string;
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

// ... other types like Booking, PaymentTransaction, Message, Review
