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
const USE_MOCK_DATA = true;

export interface GigServiceAPI {
  create: (gigData: ExpertGigCreateData) => Promise<ExpertGig>;
  getByExpert: (expertId: string) => Promise<ExpertGig>;
  getMyGigs: () => Promise<ExpertGig[]>;
  getGigById: (gigId: string) => Promise<ExpertGig>;
  getPublic: (filters: GigFilters) => Promise<GigListResponse>;
  updateMy: (updates: Partial<ExpertGigCreateData>) => Promise<ExpertGig>;
  updateGig: (
    gigId: string,
    updates: Partial<ExpertGigCreateData>
  ) => Promise<ExpertGig>;
}

interface Certificate {
  url?: string | null;
  thumbnail?: File;
  file?: File; // Allow File objects for uploads
}

export interface ExpertGigCreateData {
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

// API client for Gig Service
const GIG_SERVICE_URL =
  import.meta.env.VITE_GIG_SERVICE_URL || "http://localhost:8002";

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

  async getByExpert(expertId: string): Promise<ExpertGig> {
    const response = await fetch(`${GIG_SERVICE_URL}/gigs/expert/${expertId}`);

    if (!response.ok) {
      throw new Error("Expert gig not found");
    }

    return response.json();
  },

  async getMyGigs(): Promise<ExpertGig[]> {
    // FOR DEVELOPMENT: Return mock data instead of API call
    console.log("Using mock data for getMyGigs during development");

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockGigs: ExpertGig[] = [
      {
        id: "gig-1",
        expert_id: "expert-123",
        category_id: "automobile-advice",
        service_description:
          "Professional automobile consultation covering engine diagnostics, maintenance scheduling, buying advice, and troubleshooting. I help clients make informed decisions about their vehicles.",
        hourly_rate: 3500,
        currency: "LKR",

        experience:
          "15 years as Senior Automotive Engineer at Toyota Lanka, 5 years as Independent Consultant",
        certifications: [
          { url: "https://certs.com/ase-certified-master-technician.pdf" },
          { url: "https://certs.com/hybrid-vehicle-specialist.pdf" },
          { url: "https://certs.com/advanced-engine-diagnostics.pdf" },
        ],
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

        category_id: "electronic-device-advice",
        service_description:
          "Expert guidance on home electronics, appliance selection, smart home setup, and technical troubleshooting. From refrigerators to smart TVs, I help you make the right choices.",
        hourly_rate: 2800,
        currency: "LKR",

        experience:
          "12 years in consumer electronics industry, 3 years as technical consultant",
        certifications: [
          { url: "https://certs.com/smart-home-technology-specialist.pdf" },
          { url: "https://certs.com/consumer-electronics-expert.pdf" },
        ],
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

        category_id: "education-career-guidance",
        service_description:
          "Personalized career counseling, university selection guidance, skill development planning, and professional growth strategies.",
        hourly_rate: 4200,
        currency: "LKR",

        experience:
          "10 years as University Career Counselor, 5 years private consulting",
        certifications: [
          { url: "https://certs.com/career-development-facilitator.pdf" },
          { url: "https://certs.com/professional-life-coach.pdf" },
        ],
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

    return mockGigs;

    // ORIGINAL API CALL (commented out for development)
    /*
    const response = await fetch(`${GIG_SERVICE_URL}/gigs/my/gigs`, {
      headers: {
        'Authorization': `Bearer ${await getIdToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch my gigs');
    }
    
    return response.json();
    */
  },

  async getGigById(gigId: string): Promise<ExpertGig> {
    // FOR DEVELOPMENT: Return mock data instead of API call
    console.log(
      "Using mock data for getGigById during development, gigId:",
      gigId
    );

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const mockGigs: Record<string, ExpertGig> = {
      "gig-1": {
        id: "gig-1",
        expert_id: "expert-123",

        category_id: "automobile-advice",
        service_description:
          "Professional automobile consultation covering engine diagnostics, maintenance scheduling, buying advice, and troubleshooting. I help clients make informed decisions about their vehicles.",
        hourly_rate: 3500,
        currency: "LKR",

        experience:
          "15 years as Senior Automotive Engineer at Toyota Lanka, 5 years as Independent Consultant",
        certifications: [
          { url: "https://certs.com/ase-certified-master-technician.pdf" },
          { url: "https://certs.com/hybrid-vehicle-specialist.pdf" },
          { url: "https://certs.com/advanced-engine-diagnostics.pdf" },
        ],

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
      "gig-2": {
        id: "gig-2",
        expert_id: "expert-123",

        category_id: "electronic-device-advice",
        service_description:
          "Expert guidance on home electronics, appliance selection, smart home setup, and technical troubleshooting. From refrigerators to smart TVs, I help you make the right choices.",
        hourly_rate: 2800,
        currency: "LKR",

        experience:
          "12 years in consumer electronics industry, 3 years as technical consultant",
        certifications: [
          { url: "https://certs.com/smart-home-technology-specialist.pdf" },
          { url: "https://certs.com/consumer-electronics-expert.pdf" },
        ],

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
      "gig-3": {
        id: "gig-3",
        expert_id: "expert-123",
        category_id: "education-career-guidance",
        service_description:
          "Personalized career counseling, university selection guidance, skill development planning, and professional growth strategies.",
        hourly_rate: 4200,
        currency: "LKR",

        experience:
          "10 years as University Career Counselor, 5 years private consulting",
        certifications: [
          {
            url: "https://certs.com/certified-career-development-facilitator.pdf",
          },
          { url: "https://certs.com/professional-life-coach.pdf" },
        ],

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
    };

    const gig = mockGigs[gigId];
    if (!gig) {
      throw new Error("Gig not found");
    }

    return gig;

    // ORIGINAL API CALL (commented out for development)
    /*
    const response = await fetch(`${GIG_SERVICE_URL}/gigs/${gigId}`, {
      headers: {
        'Authorization': `Bearer ${await getIdToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Gig not found');
    }
    
    return response.json();
    */
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
    // FOR DEVELOPMENT: Return mock updated data instead of API call
    console.log(
      "Using mock data for updateGig during development, gigId:",
      gigId,
      "updates:",
      updates
    );

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get the existing gig and merge with updates
    const existingGig = await this.getGigById(gigId);
    const updatedGig: ExpertGig = {
      ...existingGig,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    console.log("Mock gig updated successfully:", updatedGig);
    return updatedGig;

    // ORIGINAL API CALL (commented out for development)
    /*
    const response = await fetch(`${GIG_SERVICE_URL}/gigs/${gigId}`, {
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
    */
  },
};

// Helper to get Firebase ID token
async function getIdToken(): Promise<string> {
  try {
    // Get token from Firebase auth context
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }

    // If no user is authenticated, try to get the token from localStorage
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      return storedToken;
    }

    console.warn("No authenticated user or stored token found");
    return ""; // Return empty string instead of mock token
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
  const GIG_SERVICE_URL =
    import.meta.env.VITE_GIG_SERVICE_URL || "http://localhost:8002";
  console.log("Making API call to:", `${GIG_SERVICE_URL}/gigs/${gigId}`);

  const response = await fetch(`${GIG_SERVICE_URL}/gigs/${gigId}`);
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
