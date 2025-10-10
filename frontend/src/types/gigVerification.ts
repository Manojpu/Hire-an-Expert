// Types for Gig Verification System
export interface GigForVerification {
  id: string;
  expert_id: string;
  category_id: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    created_at: string;
  };
  service_description: string;
  hourly_rate: number;
  currency: string;
  availability_preferences: string;
  response_time: string;
  experience_years: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  thumbnail_url?: string;
}

export interface Certificate {
  id: string;
  gig_id: string;
  url: string;
  thumbnail_url?: string;
  uploaded_at: string;
  verified?: boolean; // Client-side tracking for UI
}

export interface VerificationDocument {
  id: string;
  user_id: string;
  document_type: 'ID_CARD' | 'PASSPORT' | 'DRIVING_LICENSE' | 'PROFESSIONAL_CERTIFICATE' | 'EDUCATION_CERTIFICATE' | 'OTHER';
  document_url: string;
  uploaded_at: string;
  verified?: boolean; // Client-side tracking for UI
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  created_at?: string;
}

export interface ExpertUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'expert' | 'admin';
  profile_image_url?: string;
}

export interface GigVerificationDetails {
  gig: GigForVerification;
  expert: ExpertUser;
  category: Category;
  certificates: Certificate[];
  verificationDocuments?: VerificationDocument[]; // For users applying to become experts
}

export interface GigVerificationTableRow {
  gig_id: string;
  expert_name: string;
  category_name: string;
  hourly_rate: number;
  currency: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface VerificationAction {
  gig_id: string;
  action: 'APPROVE' | 'REJECT';
  verified_documents: string[]; // Array of document IDs that were verified
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}