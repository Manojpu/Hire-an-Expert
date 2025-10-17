/**
 * Expert Gig Analytics Service
 * Fetches analytics data from booking and gig services for expert dashboard
 */

import { auth } from '@/firebase/firebase';
import { getIdToken } from 'firebase/auth';

const BOOKING_SERVICE_URL = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:8003';
const GIG_SERVICE_URL = import.meta.env.VITE_GIG_SERVICE_URL || 'http://localhost:8002';

export interface RevenueMetrics {
  today: number;
  week: number;
  month: number;
  year: number;
  growth: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface BookingMetrics {
  total: number;
  thisMonth: number;
  completed: number;
  cancelled: number;
  pending: number;
  confirmed: number;
  completionRate: number;
}

export interface PerformanceMetrics {
  rating: number;
  totalReviews: number;
  responseTime: string;
  repeatCustomers: number;
  avgSessionDuration: string;
}

export interface ChartDataPoint {
  date: string;
  revenue: number;
}

export interface GigAnalyticsData {
  revenue: RevenueMetrics;
  bookings: BookingMetrics;
  performance: PerformanceMetrics;
  chartData: ChartDataPoint[];
  hourlyRate?: number;
  currency?: string;
}

/**
 * Get authentication headers with Firebase token
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const token = await getIdToken(user);
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Fetch comprehensive analytics for a specific gig
 * Combines data from booking service (revenue, bookings) and gig service (performance)
 */
export async function fetchGigAnalytics(gigId: string, period: string = 'month'): Promise<GigAnalyticsData> {
  try {
    const headers = await getAuthHeaders();

    // Fetch booking analytics (revenue and booking stats)
    const bookingResponse = await fetch(
      `${BOOKING_SERVICE_URL}/bookings/analytics/gig/${gigId}?period=${period}`,
      { headers }
    );

    if (!bookingResponse.ok) {
      console.error(`Booking analytics failed: ${bookingResponse.status}`);
      // Return empty analytics instead of throwing
      return {
        revenue: {
          today: 0,
          week: 0,
          month: 0,
          year: 0,
          growth: { daily: 0, weekly: 0, monthly: 0 }
        },
        bookings: {
          total: 0,
          thisMonth: 0,
          completed: 0,
          cancelled: 0,
          pending: 0,
          confirmed: 0,
          completionRate: 0
        },
        performance: {
          rating: 0,
          totalReviews: 0,
          responseTime: '< 24 hours',
          repeatCustomers: 0,
          avgSessionDuration: '45 min',
        },
        chartData: []
      };
    }

    const bookingData = await bookingResponse.json();

    // Fetch performance analytics (ratings, reviews, response time)
    let performanceData: PerformanceMetrics;
    try {
      const performanceResponse = await fetch(
        `${GIG_SERVICE_URL}/gigs/${gigId}/performance`,
        { headers }
      );

      if (performanceResponse.ok) {
        performanceData = await performanceResponse.json();
      } else {
        // Use defaults if performance service is unavailable
        console.warn('Performance service unavailable, using defaults');
        performanceData = {
          rating: 0,
          totalReviews: 0,
          responseTime: '< 24 hours',
          repeatCustomers: 0,
          avgSessionDuration: '45 min',
        };
      }
    } catch (perfError) {
      console.error('Error fetching performance data:', perfError);
      performanceData = {
        rating: 0,
        totalReviews: 0,
        responseTime: '< 24 hours',
        repeatCustomers: 0,
        avgSessionDuration: '45 min',
      };
    }

    // Combine all analytics data
    return {
      revenue: bookingData.revenue || {
        today: 0,
        week: 0,
        month: 0,
        year: 0,
        growth: { daily: 0, weekly: 0, monthly: 0 }
      },
      bookings: bookingData.bookings || {
        total: 0,
        thisMonth: 0,
        completed: 0,
        cancelled: 0,
        pending: 0,
        confirmed: 0,
        completionRate: 0
      },
      performance: performanceData,
      chartData: bookingData.chartData || [],
      hourlyRate: bookingData.hourlyRate,
      currency: bookingData.currency || 'LKR'
    };

  } catch (error) {
    console.error('Error fetching gig analytics:', error);
    // Return empty analytics instead of throwing
    return {
      revenue: {
        today: 0,
        week: 0,
        month: 0,
        year: 0,
        growth: { daily: 0, weekly: 0, monthly: 0 }
      },
      bookings: {
        total: 0,
        thisMonth: 0,
        completed: 0,
        cancelled: 0,
        pending: 0,
        confirmed: 0,
        completionRate: 0
      },
      performance: {
        rating: 0,
        totalReviews: 0,
        responseTime: '< 24 hours',
        repeatCustomers: 0,
        avgSessionDuration: '45 min',
      },
      chartData: []
    };
  }
}

export const gigAnalyticsService = {
  fetchGigAnalytics,
};
