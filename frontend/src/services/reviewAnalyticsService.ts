import axios from "axios";

const API_GATEWAY_URL = (
  import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8000"
).replace(/\/$/, "");
const REVIEW_API_BASE = `${API_GATEWAY_URL}/api/reviews`;

export interface GigRatingAnalytics {
  gig_id: string;
  average_rating: number;
  total_reviews: number;
}

const fetchGigRatingAnalytics = async (
  gigId: string
): Promise<GigRatingAnalytics> => {
  try {
    const response = await axios.get(
      `${REVIEW_API_BASE}/gig/${gigId}/average-rating`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching rating analytics for gig ${gigId}:`, error);
    throw new Error("Failed to fetch rating analytics");
  }
};

export const reviewAnalyticsService = {
  fetchGigRatingAnalytics,
};
