/**
 * Review Service API for connecting with review-service
 * Handles ratings, reviews, and feedback data
 */

// Review Service URL
const REVIEW_SERVICE_URL = import.meta.env.VITE_REVIEW_SERVICE_URL || "http://localhost:8004";

// TypeScript interfaces based on backend models
export interface Review {
  id: string;
  gig_id: string;
  booking_id: string;
  buyer_id: string;
  seller_id: string;
  rating: number; // 1-5
  comment?: string;
  is_active: boolean;
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ExpertReviewSummary {
  expert_id: string;
  total_reviews: number;
  average_rating: number;
  recent_reviews: Review[];
  monthly_stats: {
    month: string;
    reviews_count: number;
    average_rating: number;
  }[];
}

// Helper to get Firebase ID token
async function getIdToken(): Promise<string> {
  try {
    const { auth } = await import('@/firebase/firebase');
    const { getIdToken: firebaseGetIdToken } = await import('firebase/auth');
    
    if (auth.currentUser) {
      return await firebaseGetIdToken(auth.currentUser);
    }
    
    console.warn("No authenticated user found, using dev token");
    return "dev-mock-token";
  } catch (error) {
    console.error("Failed to get ID token:", error);
    return "dev-mock-token";
  }
}

export const reviewServiceAPI = {
  /**
   * Get reviews for a specific gig
   */
  async getGigReviews(gigId: string, page: number = 1, size: number = 10): Promise<{ reviews: Review[], total: number }> {
    try {
      console.log("🔄 Fetching reviews for gig:", gigId);
      
      const token = await getIdToken();
      const response = await fetch(`${REVIEW_SERVICE_URL}/reviews/gig/${gigId}?page=${page}&size=${size}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error("❌ Failed to fetch gig reviews:", response.status);
        return { reviews: [], total: 0 };
      }

      const data = await response.json();
      console.log("✅ Successfully fetched gig reviews:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching gig reviews:", error);
      return { reviews: [], total: 0 };
    }
  },

  /**
   * Get review statistics for a specific gig
   */
  async getGigReviewStats(gigId: string): Promise<ReviewStats> {
    try {
      console.log("🔄 Fetching review stats for gig:", gigId);
      
      const token = await getIdToken();
      const response = await fetch(`${REVIEW_SERVICE_URL}/reviews/gig/${gigId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error("❌ Failed to fetch gig review stats:", response.status);
        return {
          total_reviews: 0,
          average_rating: 0,
          rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      const stats = await response.json();
      console.log("✅ Successfully fetched gig review stats:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Error fetching gig review stats:", error);
      return {
        total_reviews: 0,
        average_rating: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
  },

  /**
   * Get reviews for expert (seller) - all reviews across all their gigs
   */
  async getExpertReviews(expertId: string): Promise<ExpertReviewSummary> {
    try {
      console.log("🔄 Fetching reviews for expert:", expertId);
      
      const token = await getIdToken();
      const response = await fetch(`${REVIEW_SERVICE_URL}/reviews/expert/${expertId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error("❌ Failed to fetch expert reviews:", response.status);
        return {
          expert_id: expertId,
          total_reviews: 0,
          average_rating: 0,
          recent_reviews: [],
          monthly_stats: []
        };
      }

      const summary = await response.json();
      console.log("✅ Successfully fetched expert reviews:", summary);
      return summary;
    } catch (error) {
      console.error("❌ Error fetching expert reviews:", error);
      return {
        expert_id: expertId,
        total_reviews: 0,
        average_rating: 0,
        recent_reviews: [],
        monthly_stats: []
      };
    }
  },

  /**
   * Get current expert's reviews (for their own profile)
   */
  async getMyReviews(): Promise<ExpertReviewSummary> {
    try {
      console.log("🔄 Fetching my reviews...");
      
      const token = await getIdToken();
      const response = await fetch(`${REVIEW_SERVICE_URL}/reviews/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error("❌ Failed to fetch my reviews:", response.status);
        return {
          expert_id: "current",
          total_reviews: 0,
          average_rating: 0,
          recent_reviews: [],
          monthly_stats: []
        };
      }

      const summary = await response.json();
      console.log("✅ Successfully fetched my reviews:", summary);
      return summary;
    } catch (error) {
      console.error("❌ Error fetching my reviews:", error);
      return {
        expert_id: "current",
        total_reviews: 0,
        average_rating: 0,
        recent_reviews: [],
        monthly_stats: []
      };
    }
  }
};
