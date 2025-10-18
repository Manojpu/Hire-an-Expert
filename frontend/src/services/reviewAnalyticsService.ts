import axios from 'axios';

const REVIEW_SERVICE_URL = "http://localhost:8005";

export interface GigRatingAnalytics {
  gig_id: string;
  average_rating: number;
  total_reviews: number;
}

const fetchGigRatingAnalytics = async (gigId: string): Promise<GigRatingAnalytics> => {
  try {
    const response = await axios.get(`${REVIEW_SERVICE_URL}/api/reviews/gig/${gigId}/average-rating`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching rating analytics for gig ${gigId}:`, error);
    throw new Error("Failed to fetch rating analytics");
  }
};

export const reviewAnalyticsService = {
  fetchGigRatingAnalytics,
};
