// Frontend utility to sync with Gig Service
import { ExpertApplicationForm } from "@/types/expert";
import { GigFilters, GigListResponse } from "@/types/publicGigs.ts";
import { getAuth } from "firebase/auth";

// Mock data for development
const MOCK_GIGS: ExpertGig[] = [
  {
    id: "gig-1",
    expert_id: "expert-123",

    category_id: 1,
    service_description:
      "I provide comprehensive technology consulting services including system architecture, digital transformation strategies, and IT project management.",
    hourly_rate: 5000,
    currency: "LKR",

    experience: "15+ years in technology consulting and project management",
    certifications: [
      { url: "https://certs.com/aws-solutions-architect.pdf" },
      { url: "https://certs.com/pmp-certified.pdf" },
    ],
    references: "Available upon request",
    background_check_consent: true,
    status: "active",
    is_verified: true,
    rating: 4.8,
    total_reviews: 127,
    total_consultations: 342,
    response_time: "2 hours",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
    approved_at: "2024-01-02T00:00:00Z",
  },
  {
    id: "gig-2",
    expert_id: "expert-123",

    category_id: 2,
    service_description:
      "I offer strategic business consulting services including market analysis, business planning, and operational optimization.",
    hourly_rate: 6000,
    currency: "LKR",

    experience: "12+ years in business strategy and management consulting",
    certifications: [
      { url: "https://certs.com/six-sigma-black-belt.pdf" },
      { url: "https://certs.com/certified-management-consultant.pdf" },
    ],
    references: "Available upon request",
    background_check_consent: true,
    status: "active",
    is_verified: true,
    rating: 4.9,
    total_reviews: 89,
    total_consultations: 156,
    response_time: "1.5 hours",
    created_at: "2024-01-10T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
    approved_at: "2024-01-11T00:00:00Z",
  },
  {
    id: "gig-3",
    expert_id: "expert-123",

    category_id: 3,
    service_description:
      "I provide comprehensive digital marketing services including SEO, social media marketing, and online advertising strategies.",
    hourly_rate: 4500,
    currency: "LKR",

    experience: "8+ years in digital marketing and brand management",
    certifications: [
      { url: "https://certs.com/google-ads-certified.pdf" },
      { url: "https://certs.com/facebook-blueprint-certified.pdf" },
    ],
    references: "Available upon request",
    background_check_consent: true,
    status: "pending",
    is_verified: false,
    rating: 4.6,
    total_reviews: 45,
    total_consultations: 78,
    response_time: "3 hours",
    created_at: "2024-01-12T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  },
];

// Development flag - set to true to use mock data
const USE_MOCK_DATA = false; // Changed to use real backend database

export interface GigServiceAPI {
  create: (gigData: ExpertGigCreateData) => Promise<ExpertGig>;
  getByExpert: (expertId: string) => Promise<ExpertGig>;
  getMyGigs: () => Promise<ExpertGig[]>;
  getGigById: (gigId: string) => Promise<ExpertGig>;
  getMyGigById: (gigId: string) => Promise<ExpertGig>;
  getPublic: (filters: GigFilters) => Promise<GigListResponse>;
  updateMy: (updates: Partial<ExpertGigCreateData>) => Promise<ExpertGig>;
  updateGig: (
    gigId: string,
    updates: Partial<ExpertGigCreateData>
  ) => Promise<ExpertGig>;
  getGigStats: (gigId?: string) => Promise<{
    total_gigs: number;
    active_gigs: number;
    views: number;
    bookings: number;
  }>;
}

interface Certificate {
  url?: string | null;
  thumbnail?: File;
  file?: File; // Allow File objects for uploads
}

export interface ExpertGigCreateData {
  // Basic Information (optional in current API but used by UI/mocks)
  name?: string;
  title?: string;
  bio?: string;
  profile_image_url?: string;
  banner_image_url?: string;
  languages?: string[];
  availability_preferences?: string;
  education?: string;
  government_id_url?: string | null;
  professional_license_url?: string | null;

  // Expertise & Services (Step 1)
  category_id: number | string;
  service_description?: string;
  hourly_rate?: number;
  currency?: string;
  experience_years?: number;
  expertise_areas?: string[];

  // availability_preferences?: string; --- IGNORE ---

  // Qualifications (Step 2)

  experience?: string;
  certifications?: Certificate[];

  // Verification (Step 3)
  references?: string;
  background_check_consent?: boolean;
}

export interface ExpertGig extends ExpertGigCreateData {
  id: string;
  expert_id: string;
  status: "draft" | "pending" | "approved" | "rejected" | "active" | "inactive";
  is_verified: boolean;
  rating: number;
  total_reviews: number;
  total_consultations: number;
  response_time: string;
  created_at: string;
  updated_at?: string;
  approved_at?: string;
}

interface GigCategory {
  id: string;
  name: string;
  slug: string;
}

// export interface GigListResponse {
//   gigs: ExpertGig[];
//   total: number;
//   page: number;
//   size: number;
//   pages: number;
// }

// Convert ApplyExpert form to Gig Service format
export function convertFormToGigData(
  form: Partial<ExpertApplicationForm>,
  certificationUrls: string[] = []
): ExpertGigCreateData {
  return {
    category_id: form.category_id,
    service_description: form.serviceDesc || "",
    hourly_rate: Number(form.rate) || 0,
    currency: "LKR",
    experience: form.experience || "",
    certifications: certificationUrls.map((url) => ({ url })),
    references: form.references || "",
    background_check_consent: form.bgConsent || false,
  };
}

// API Configuration - Connect directly to gig service (bypassing API Gateway for now)
const GIG_SERVICE_URL = import.meta.env.VITE_GIG_SERVICE_URL || "http://localhost:8002";

// Debug logging for environment variable
console.log("GIG_SERVICE_URL from env:", import.meta.env.VITE_GIG_SERVICE_URL);
console.log("Final GIG_SERVICE_URL used:", GIG_SERVICE_URL);

export const gigServiceAPI: GigServiceAPI = {
  async create(gigData: ExpertGigCreateData): Promise<ExpertGig> {
    const url = `${GIG_SERVICE_URL}/gigs/`;

    // Debug logging
    console.log("Sending POST request to:", url);
    console.log("Gig data being sent:", gigData);

    // Use FormData for multipart/form-data request to handle files
    const formData = new FormData();

    // Add all non-file fields to the form data
    Object.keys(gigData).forEach((key) => {
      if (key !== "certifications") {
        // If it's an array, convert it to a string
        if (Array.isArray(gigData[key])) {
          formData.append(key, gigData[key].join(","));
        } else {
          formData.append(key, String(gigData[key]));
        }
      }
    });

    // Add any certificate files if they exist
    if (gigData.certifications && Array.isArray(gigData.certifications)) {
      gigData.certifications.forEach((cert, index) => {
        if (cert instanceof File) {
          formData.append(`certificate_files`, cert);
        }
      });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        // Don't set Content-Type for multipart/form-data
        Authorization: `Bearer ${await getIdToken()}`,
      },
      body: formData,
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response body:", errorText);
      throw new Error(`Failed to create gig: ${response.status} ${errorText}`);
    }

    return response.json();
  },

  // getGigStats implemented later in this object (keep only one definition)

  async getByExpert(expertId: string): Promise<ExpertGig> {
    const response = await fetch(`${GIG_SERVICE_URL}/gigs/expert/${expertId}`);

    if (!response.ok) {
      throw new Error("Expert gig not found");
    }

    return response.json();
  },

  async getMyGigs(): Promise<ExpertGig[]> {
    if (USE_MOCK_DATA) {
      console.log("� Using mock data for development");
      // Simulate API delay for development
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockGigs: ExpertGig[] = [
        {
          id: "gig-1",
          expert_id: "expert-123",
          name: "Dr. Rajesh Perera",
          title: "Automobile Expert & Mechanic Consultant",
          bio: "Experienced automotive engineer with 15+ years in the industry. Specialized in engine diagnostics, hybrid vehicles, and maintenance planning.",
          profile_image_url: "/placeholder-avatar.jpg",
          banner_image_url: "/placeholder-banner.jpg",
          languages: ["English", "Sinhala", "Tamil"],
          category_id: "automobile-advice",
          service_description:
            "Professional automobile consultation covering engine diagnostics, maintenance scheduling, buying advice, and troubleshooting. I help clients make informed decisions about their vehicles.",
          hourly_rate: 3500,
          currency: "LKR",
          availability_preferences:
            "Monday to Friday: 9:00 AM - 6:00 PM, Saturday: 9:00 AM - 2:00 PM",
          education:
            "BSc in Mechanical Engineering from University of Moratuwa, Advanced Automotive Technology Certificate",
          experience:
            "15 years as Senior Automotive Engineer at Toyota Lanka, 5 years as Independent Consultant",
          certifications: [
            { url: "https://certs.com/ase-certified-master-technician.pdf" },
            { url: "https://certs.com/hybrid-vehicle-specialist.pdf" },
            { url: "https://certs.com/advanced-engine-diagnostics.pdf" },
          ],
          government_id_url: "/docs/nic-rajesh.pdf",
          professional_license_url: "/docs/engineering-license.pdf",
          references: "Dr. Kumara Silva (Former Supervisor) - 077-1234567",
          background_check_consent: true,
          status: "active",
          is_verified: true,
          rating: 4.8,
          total_reviews: 127,
          total_consultations: 324,
          response_time: "< 2 hours",
          created_at: "2024-01-15T08:00:00Z",
          updated_at: "2024-01-20T14:30:00Z",
          approved_at: "2024-01-16T10:00:00Z",
        },
        {
          id: "gig-2",
          expert_id: "expert-123",
          name: "Dr. Rajesh Perera",
          title: "Electronics & Home Appliance Specialist",
          bio: "Electronics engineer specializing in home appliances, smart devices, and troubleshooting. Helping customers optimize their home technology.",
          profile_image_url: "/placeholder-avatar.jpg",
          banner_image_url: "/placeholder-banner.jpg",
          languages: ["English", "Sinhala"],
          category_id: "electronic-device-advice",
          service_description:
            "Expert guidance on home electronics, appliance selection, smart home setup, and technical troubleshooting. From refrigerators to smart TVs, I help you make the right choices.",
          hourly_rate: 2800,
          currency: "LKR",
          availability_preferences: "Tuesday to Saturday: 10:00 AM - 5:00 PM",
          education: "BSc in Electronic Engineering, MSc in Consumer Electronics",
          experience:
            "12 years in consumer electronics industry, 3 years as technical consultant",
          certifications: [
            { url: "https://certs.com/smart-home-technology-specialist.pdf" },
            { url: "https://certs.com/consumer-electronics-expert.pdf" },
          ],
          government_id_url: "/docs/nic-rajesh.pdf",
          professional_license_url: "/docs/electronics-license.pdf",
          references: "Eng. Nimal Fernando - 077-9876543",
          background_check_consent: true,
          status: "pending",
          is_verified: true,
          rating: 4.6,
          total_reviews: 89,
          total_consultations: 156,
          response_time: "< 3 hours",
          created_at: "2024-02-01T09:00:00Z",
          updated_at: "2024-02-05T16:45:00Z",
          approved_at: null,
        },
        {
          id: "gig-3",
          expert_id: "expert-123",
          name: "Dr. Rajesh Perera",
          title: "Career Guidance & Education Counselor",
          bio: "Educational consultant and career counselor helping students and professionals navigate their academic and career paths.",
          profile_image_url: "/placeholder-avatar.jpg",
          banner_image_url: "/placeholder-banner.jpg",
          languages: ["English", "Sinhala"],
          category_id: "education-career-guidance",
          service_description:
            "Personalized career counseling, university selection guidance, skill development planning, and professional growth strategies.",
          hourly_rate: 4200,
          currency: "LKR",
          availability_preferences:
            "Weekdays: 6:00 PM - 9:00 PM, Weekends: 10:00 AM - 4:00 PM",
          education: "PhD in Educational Psychology, MBA in Human Resources",
          experience:
            "10 years as University Career Counselor, 5 years private consulting",
          certifications: [
            { url: "https://certs.com/career-development-facilitator.pdf" },
            { url: "https://certs.com/professional-life-coach.pdf" },
          ],
          government_id_url: "/docs/nic-rajesh.pdf",
          professional_license_url: "/docs/counselor-license.pdf",
          references: "Prof. Sandya Wijeratne - 077-5551234",
          background_check_consent: true,
          status: "inactive",
          is_verified: false,
          rating: 4.9,
          total_reviews: 203,
          total_consultations: 445,
          response_time: "< 1 hour",
          created_at: "2024-01-20T11:00:00Z",
          updated_at: "2024-02-10T13:20:00Z",
          approved_at: "2024-01-22T15:30:00Z",
        },
      ];

      console.log("✅ Returning mock gigs for development:", mockGigs);
      return mockGigs;
    }

    // API call implementation (commented out since we're not using API Gateway)
    try {
      console.log("🔄 Fetching all gigs from backend API...");
      console.log("🌐 Backend URL:", GIG_SERVICE_URL);
      
      // Get all gigs belonging to the current authenticated user
      const token = await getIdToken();
      console.log("🔐 Using auth token:", token?.substring(0, 20) + "...");
      
      const myGigsResponse = await fetch(`${GIG_SERVICE_URL}/gigs/my/gigs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log("📡 Response status:", myGigsResponse.status);
      console.log("📡 Response headers:", Object.fromEntries(myGigsResponse.headers.entries()));
      
      if (myGigsResponse.ok) {
        const myGigs = await myGigsResponse.json();
        console.log("✅ Successfully fetched user's gigs from backend:", myGigs);
        return myGigs; // Backend now returns array of gigs
      } else if (myGigsResponse.status === 404) {
        // User has no gigs yet
        console.log("ℹ️ User has no gigs yet");
        return [];
      } else {
        const errorText = await myGigsResponse.text();
        console.error("❌ Backend error response:", errorText);
        throw new Error(`Backend error ${myGigsResponse.status}: ${errorText}`);
      }
    } catch (error) {
      console.error("❌ Failed to fetch gigs from backend:", error);
      // Don't fall back to mock data - let the error propagate so we can see what's wrong
      throw error;
    }
  },

  async getGigById(gigId: string): Promise<ExpertGig> {
    console.log("🔍 Fetching gig by ID from backend API:", gigId);
    
    try {
      // Call the real API endpoint
      const token = await getIdToken();
      const response = await fetch(`${GIG_SERVICE_URL}/gigs/${gigId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Gig not found`);
        }
        throw new Error(`Failed to fetch gig: ${response.status}`);
      }

      const gig = await response.json();
      console.log("✅ Successfully fetched gig by ID:", gig);
      return gig;
    } catch (error) {
      console.error("❌ Error fetching gig by ID:", error);
      throw error;
    }
  },

  async getMyGigById(gigId: string): Promise<ExpertGig> {
    console.log("🔍 Fetching my gig by ID:", gigId);
    
    try {
      // Get all my gigs and find the one with matching ID
      const myGigs = await this.getMyGigs();
      const gig = myGigs.find(g => g.id === gigId);
      
      if (!gig) {
        throw new Error(`Gig not found in your gigs`);
      }
      
      console.log("✅ Successfully found my gig by ID:", gig);
      return gig;
    } catch (error) {
      console.error("❌ Error fetching my gig by ID:", error);
      throw error;
    }
  },

  async getPublic(filters: GigFilters): Promise<GigListResponse> {
    const params = new URLSearchParams();

    // Map frontend filters to backend parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${GIG_SERVICE_URL}/gigs/public?${params}`);

    if (!response.ok) {
      throw new Error("Failed to fetch gigs");
    }

    return response.json();
  },

  async updateMy(updates: Partial<ExpertGigCreateData>): Promise<ExpertGig> {
    const response = await fetch(`${GIG_SERVICE_URL}/gigs/my/gig`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getIdToken()}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error("Failed to update gig");
    }

    return response.json();
  },

  async updateGig(
    gigId: string,
    updates: Partial<ExpertGigCreateData>
  ): Promise<ExpertGig> {
    try {
      console.log("🔄 Updating gig via backend API:", gigId, updates);
      
      const token = await getIdToken();
      const response = await fetch(`${GIG_SERVICE_URL}/gigs/my/gig`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Failed to update gig:", response.status, errorText);
        throw new Error(`Failed to update gig: ${response.status} ${errorText}`);
      }
      
      const updatedGig = await response.json();
      console.log("✅ Successfully updated gig:", updatedGig);
      return updatedGig;
    } catch (error) {
      console.error("❌ Error updating gig:", error);
      throw error;
    }
  },

  async getGigStats(gigId?: string): Promise<{
    total_gigs: number;
    active_gigs: number;
    views: number;
    bookings: number;
  }> {
    try {
      const token = await getIdToken();
      
      // The /gigs/my/stats endpoint doesn't exist - calculate from /gigs/my/gigs
      const response = await fetch(`${GIG_SERVICE_URL}/gigs/my/gigs`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.warn("Failed to get gigs, returning zeros");
        return {
          total_gigs: 0,
          active_gigs: 0,
          views: 0,
          bookings: 0
        };
      }
      
      const gigs = await response.json();
      interface GigStats { is_active?: boolean; status?: string; views?: number; bookings_count?: number; }
      const activeGigs = gigs.filter((g: GigStats) => g.is_active || g.status === 'active');
      
      // Calculate totals from gig data
      const totalViews = gigs.reduce((sum: number, g: GigStats) => sum + (g.views || 0), 0);
      const totalBookings = gigs.reduce((sum: number, g: GigStats) => sum + (g.bookings_count || 0), 0);
      
      return {
        total_gigs: gigs.length,
        active_gigs: activeGigs.length,
        views: totalViews,
        bookings: totalBookings
      };
    } catch (error) {
      console.error("Error getting gig stats:", error);
      return {
        total_gigs: 0,
        active_gigs: 0,
        views: 0,
        bookings: 23
      };
    }
  },
};

// Helper to get Firebase ID token
async function getIdToken(): Promise<string> {
  try {
    // Try to get Firebase ID token from auth context
    const { auth } = await import('@/firebase/firebase');
    const { getIdToken: firebaseGetIdToken } = await import('firebase/auth');
    
    if (auth.currentUser) {
      return await firebaseGetIdToken(auth.currentUser);
    }
    
    // For development, return a mock token
    console.warn("No authenticated user found, using dev token");
    return "dev-mock-token";
  } catch (error) {
    console.error("Failed to get ID token:", error);
    return "dev-mock-token";
  }
}

// Simple API methods that use the mock data
export const getMyGigs = async (): Promise<ExpertGig[]> => {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_GIGS;
  }

  return gigServiceAPI.getMyGigs();
};

export const getGigById = async (gigId: string): Promise<ExpertGig> => {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // First try to find in MOCK_GIGS array
    const gig = MOCK_GIGS.find((g) => g.id === gigId);
    if (gig) {
      console.log("Found gig in MOCK_GIGS array:", gig);
      return gig;
    }

    // If not found in array, try the mockGigs object in gigServiceAPI.getGigById
    try {
      return await gigServiceAPI.getGigById(gigId);
    } catch (error) {
      console.error("Failed to get gig from mockGigs:", error);
      throw new Error("Gig not found");
    }
  }

  // Use the API if not in development mode
  const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8000";
  const FULL_GIG_SERVICE_URL = `${API_GATEWAY_URL}/api/gigs`;
  console.log("Making API call to:", `${FULL_GIG_SERVICE_URL}/${gigId}`);

  const response = await fetch(`${FULL_GIG_SERVICE_URL}/${gigId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch gig: ${response.status}`);
  }

  return await response.json();
};

export const updateGig = async (
  gigId: string,
  formData: ExpertApplicationForm
): Promise<ExpertGig> => {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    const gigIndex = MOCK_GIGS.findIndex((g) => g.id === gigId);
    if (gigIndex === -1) {
      throw new Error("Gig not found");
    }

    // Convert form data to gig format
    const gigData = convertFormToGigData(formData);

    // Update the mock gig with converted data
    const updatedGig = {
      ...MOCK_GIGS[gigIndex],
      ...gigData,
      updated_at: new Date().toISOString(),
    };

    MOCK_GIGS[gigIndex] = updatedGig;
    return updatedGig;
  }

  const gigData = convertFormToGigData(formData);
  return gigServiceAPI.updateGig(gigId, gigData);
};
