// Frontend utility to sync with Gig Service
import { ExpertApplicationForm } from '@/types/expert';

export interface GigServiceAPI {
  create: (gigData: ExpertGigCreateData) => Promise<ExpertGig>;
  getByExpert: (expertId: string) => Promise<ExpertGig>;
  getPublic: (filters: GigFilters) => Promise<GigListResponse>;
  updateMy: (updates: Partial<ExpertGigCreateData>) => Promise<ExpertGig>;
}

export interface ExpertGigCreateData {
  // Basic Information (Step 0)
  name: string;
  title: string;
  bio?: string;
  profile_image_url?: string;
  banner_image_url?: string;
  languages: string[];
  
  // Expertise & Services (Step 1)
  category: 'automobile-advice' | 'electronic-device-advice' | 'home-appliance-guidance' | 'education-career-guidance';
  service_description?: string;
  hourly_rate: number;
  currency?: string;
  availability_preferences?: string;
  
  // Qualifications (Step 2)
  education?: string;
  experience?: string;
  certifications?: string[];
  
  // Verification (Step 3)
  government_id_url?: string;
  professional_license_url?: string;
  references?: string;
  background_check_consent: boolean;
}

export interface ExpertGig extends ExpertGigCreateData {
  id: string;
  expert_id: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
  is_verified: boolean;
  rating: number;
  total_reviews: number;
  total_consultations: number;
  response_time: string;
  created_at: string;
  updated_at?: string;
  approved_at?: string;
}

export interface GigFilters {
  category?: string;
  min_rate?: number;
  max_rate?: number;
  min_rating?: number;
  search_query?: string;
  page?: number;
  size?: number;
}

export interface GigListResponse {
  gigs: ExpertGig[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Convert ApplyExpert form to Gig Service format
export function convertFormToGigData(
  form: Partial<ExpertApplicationForm>,
  profileImageUrl?: string,
  bannerImageUrl?: string
): ExpertGigCreateData {
  return {
    // Basic Information
    name: form.name || '',
    title: form.title || '',
    bio: form.bio || '',
    profile_image_url: profileImageUrl,
    banner_image_url: bannerImageUrl,
    languages: form.languages ? form.languages.split(',').map(lang => lang.trim()) : ['English'],
    
    // Expertise & Services
    category: getCategorySlug(form.categories || ''),
    service_description: form.serviceDesc || '',
    hourly_rate: form.rate || 0,
    currency: 'LKR',
    availability_preferences: form.availabilityNotes || '',
    
    // Qualifications
    education: form.education || '',
    experience: form.experience || '',
    certifications: [], // File uploads would be handled separately
    
    // Verification
    references: form.references || '',
    background_check_consent: form.bgConsent || false
  };
}

function getCategorySlug(category: string): ExpertGigCreateData['category'] {
  const mapping: Record<string, ExpertGigCreateData['category']> = {
    'Automobile Advice': 'automobile-advice',
    'Electronic Device Advice': 'electronic-device-advice',
    'Home Appliance Guidance': 'home-appliance-guidance',
    'Education & Career Guidance': 'education-career-guidance'
  };
  return mapping[category] || 'automobile-advice';
}

// API client for Gig Service
export const gigServiceAPI: GigServiceAPI = {
  async create(gigData: ExpertGigCreateData): Promise<ExpertGig> {
    const response = await fetch('/api/gig-service/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getIdToken()}`
      },
      body: JSON.stringify(gigData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create gig');
    }
    
    return response.json();
  },

  async getByExpert(expertId: string): Promise<ExpertGig> {
    const response = await fetch(`/api/gig-service/expert/${expertId}`);
    
    if (!response.ok) {
      throw new Error('Expert gig not found');
    }
    
    return response.json();
  },

  async getPublic(filters: GigFilters): Promise<GigListResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await fetch(`/api/gig-service/public?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch gigs');
    }
    
    return response.json();
  },

  async updateMy(updates: Partial<ExpertGigCreateData>): Promise<ExpertGig> {
    const response = await fetch('/api/gig-service/my/gig', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getIdToken()}`
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update gig');
    }
    
    return response.json();
  }
};

// Helper to get Firebase ID token
async function getIdToken(): Promise<string> {
  // This would integrate with your Firebase auth context
  // For now, return a placeholder
  return 'firebase-id-token';
}
