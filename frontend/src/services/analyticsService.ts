/**
 * Admin Analytics Service
 * Fetches system-wide analytics data for admin dashboard
 */

import { auth } from "@/firebase/firebase";
import { getIdToken } from "firebase/auth";

const API_GATEWAY_URL =
  import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8000";
const ADMIN_SERVICE_URL = API_GATEWAY_URL;

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  period?: "day" | "week" | "month" | "year";
}

export interface DailyUserCount {
  date: string;
  count: number;
  type?: "users" | "experts";
}

export interface DailyGigCount {
  date: string;
  count: number;
}

export interface DailyBookingCount {
  date: string;
  count: number;
  revenue?: number;
}

export interface SystemStats {
  totalUsers: number;
  totalExperts: number;
  totalGigs: number;
  totalBookings: number;
  totalRevenue?: number;
}

/**
 * Get authentication headers with Firebase token
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }

  const token = await getIdToken(user);
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Get date range for predefined periods
 */
function getDateRange(period: string): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString().split("T")[0];
  let startDate: string;

  switch (period) {
    case "week":
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString().split("T")[0];
      break;
    case "month":
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      startDate = monthAgo.toISOString().split("T")[0];
      break;
    case "year":
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      startDate = yearAgo.toISOString().split("T")[0];
      break;
    default:
      startDate = endDate;
  }

  return { startDate, endDate };
}

/**
 * Fetch system-wide statistics
 */
async function fetchSystemStats(): Promise<SystemStats> {
  try {
    const headers = await getAuthHeaders();

    // Fetch stats from admin service
    const response = await fetch(`${ADMIN_SERVICE_URL}/admin/stats`, {
      headers,
    });

    if (!response.ok) {
      console.error("Failed to fetch system stats:", response.status);
      return {
        totalUsers: 0,
        totalExperts: 0,
        totalGigs: 0,
        totalBookings: 0,
      };
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching system stats:", error);
    return {
      totalUsers: 0,
      totalExperts: 0,
      totalGigs: 0,
      totalBookings: 0,
    };
  }
}

/**
 * Fetch user growth analytics
 */
async function fetchUserAnalytics(
  filters: AnalyticsFilters
): Promise<DailyUserCount[]> {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();

    if (filters.startDate) params.append("start_date", filters.startDate);
    if (filters.endDate) params.append("end_date", filters.endDate);
    if (filters.period) params.append("period", filters.period);

    const response = await fetch(
      `${ADMIN_SERVICE_URL}/admin/analytics/users?${params.toString()}`,
      { headers }
    );

    if (!response.ok) {
      console.error("Failed to fetch user analytics:", response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    return [];
  }
}

/**
 * Fetch expert growth analytics
 */
async function fetchExpertAnalytics(
  filters: AnalyticsFilters
): Promise<DailyUserCount[]> {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();

    if (filters.startDate) params.append("start_date", filters.startDate);
    if (filters.endDate) params.append("end_date", filters.endDate);
    if (filters.period) params.append("period", filters.period);

    const response = await fetch(
      `${ADMIN_SERVICE_URL}/admin/analytics/experts?${params.toString()}`,
      { headers }
    );

    if (!response.ok) {
      console.error("Failed to fetch expert analytics:", response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching expert analytics:", error);
    return [];
  }
}

/**
 * Fetch gig creation analytics
 */
async function fetchGigAnalytics(
  filters: AnalyticsFilters
): Promise<DailyGigCount[]> {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();

    if (filters.startDate) params.append("start_date", filters.startDate);
    if (filters.endDate) params.append("end_date", filters.endDate);
    if (filters.period) params.append("period", filters.period);

    const response = await fetch(
      `${ADMIN_SERVICE_URL}/admin/analytics/gigs?${params.toString()}`,
      { headers }
    );

    if (!response.ok) {
      console.error("Failed to fetch gig analytics:", response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching gig analytics:", error);
    return [];
  }
}

/**
 * Fetch booking analytics
 */
async function fetchBookingAnalytics(
  filters: AnalyticsFilters
): Promise<DailyBookingCount[]> {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();

    if (filters.startDate) params.append("start_date", filters.startDate);
    if (filters.endDate) params.append("end_date", filters.endDate);
    if (filters.period) params.append("period", filters.period);

    const response = await fetch(
      `${ADMIN_SERVICE_URL}/admin/analytics/bookings?${params.toString()}`,
      { headers }
    );

    if (!response.ok) {
      console.error("Failed to fetch booking analytics:", response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching booking analytics:", error);
    return [];
  }
}

/**
 * Export all analytics functions
 */
export const analyticsService = {
  fetchSystemStats,
  fetchUserAnalytics,
  fetchExpertAnalytics,
  fetchGigAnalytics,
  fetchBookingAnalytics,
  getDateRange,
};
