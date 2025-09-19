import { UUID } from "crypto";

// Unified Expert/Gig Data Structure
export interface ExpertGig {
  // Basic Information (from ApplyExpert step 0)
  id: string;
  userId: string;
  name: string;
  title: string; // Professional Headline
  bio: string;
  profileImage: string; // Profile Photo
  bannerImage: string; // Cover Image
  languages: string[]; // Languages (comma separated -> array)

  // Expertise & Services (from ApplyExpert step 1)
  category: string; // Selected from dropdown
  subcategories: string[]; // Additional skills/services
  serviceDescription: string; // Service Description
  pricing: {
    hourlyRate: number; // Hourly Rate (Rs.)
    currency: string;
  };
  availability: {
    preferences: string; // Availability Preferences
    responseTime: string; // Auto-calculated or set
  };

  // Qualifications (from ApplyExpert step 2)
  education: string; // Education background
  experience: string; // Work Experience
  certifications: FileList | null; // Uploaded certificates

  // Verification (from ApplyExpert step 3)
  verification: {
    governmentId: File | null;
    professionalLicense: File | null;
    references: string; // Reference Contacts
    backgroundCheckConsent: boolean;
  };

  // System-generated fields
  slug: string; // Auto-generated from name
  rating: number;
  totalReviews: number;
  totalConsultations: number;
  verified: boolean;
  status: "draft" | "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

// Category mappings
export const EXPERT_CATEGORIES = {
  "Automobile Advice": "automobile-advice",
  "Electronic Device Advice": "electronic-device-advice",
  "Home Appliance Guidance": "home-appliance-guidance",
  "Education & Career Guidance": "education-career-guidance",
} as const;

// Form data structure for ApplyExpert
export interface ExpertApplicationForm {
  // Step 1: Expertise & Services
  category_id: UUID; // Selected category
  serviceDesc: string; // Service Description
  rate: number; // Hourly Rate (Rs.)
  availabilityNotes: string; // General availability notes
  availabilityRules?: {
    day_of_week: number;
    start_time_utc: string;
    end_time_utc: string;
  }[]; // Weekly recurring availability

  // Step 2: Qualifications
  expertise_areas: string[];
  experience_years: string;
  experience: string;
  qualificationDocs?: FileList | null; // multiple documents allowed

  // Step 3: Verification
  govId: File | null; // Government ID
  license: File | null; // Professional License
  references: string; // Reference Contacts
  bgConsent: boolean; // Background Check Consent

  // Step 4: Review
  tos: boolean; // Terms of Service
}
