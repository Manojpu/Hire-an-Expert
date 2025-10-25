/**
 * Admin Analytics Service
 * Fetches system-wide analytics data for admin dashboard
 */

import { auth } from '@/firebase/firebase';
import { getIdToken } from 'firebase/auth';

const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000';
const ADMIN_SERVICE_URL = import.meta.env.VITE_ADMIN_SERVICE_URL || 'http://localhost:8009';

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}

export interface DailyUserCount {
  date: string;
  count: number;
  type?: 'users' | 'experts';
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
    throw new Error('User not authenticated');
  }
  
  const token = await getIdToken(user);
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Get date range for predefined periods
 */
function getDateRange(period: string): { startDate: string; endDate: string } {
  const now = new Date();
  // Set to end of today to include today's data
  now.setHours(23, 59, 59, 999);
  const endDate = now.toISOString().split('T')[0];
  let startDate: string;
  let startDateObj: Date;

  switch (period) {
    case 'week':
    case '7days':
      startDateObj = new Date(now);
      // Go back 7 days from today
      startDateObj.setDate(startDateObj.getDate() - 7);
      startDateObj.setHours(0, 0, 0, 0); // Start of that day
      startDate = startDateObj.toISOString().split('T')[0];
      break;
    case 'month':
    case '30days':
      startDateObj = new Date(now);
      startDateObj.setMonth(startDateObj.getMonth() - 1);
      startDateObj.setHours(0, 0, 0, 0);
      startDate = startDateObj.toISOString().split('T')[0];
      break;
    case '3months':
      startDateObj = new Date(now);
      startDateObj.setMonth(startDateObj.getMonth() - 3);
      startDateObj.setHours(0, 0, 0, 0);
      startDate = startDateObj.toISOString().split('T')[0];
      break;
    case '6months':
      startDateObj = new Date(now);
      startDateObj.setMonth(startDateObj.getMonth() - 6);
      startDateObj.setHours(0, 0, 0, 0);
      startDate = startDateObj.toISOString().split('T')[0];
      break;
    case 'year':
      startDateObj = new Date(now);
      startDateObj.setFullYear(startDateObj.getFullYear() - 1);
      startDateObj.setHours(0, 0, 0, 0);
      startDate = startDateObj.toISOString().split('T')[0];
      break;
    case 'custom':
      // For custom, return current date (will be overridden by custom date selection)
      startDate = endDate;
      break;
    default:
      // Default to last 7 days if unknown period
      startDateObj = new Date(now);
      startDateObj.setDate(startDateObj.getDate() - 7);
      startDateObj.setHours(0, 0, 0, 0);
      startDate = startDateObj.toISOString().split('T')[0];
      console.warn(`Unknown period '${period}', defaulting to last 7 days`);
  }

  console.log(`📅 Date range for '${period}':`, { startDate, endDate, daysIncluded: getDaysDifference(startDate, endDate) });
  return { startDate, endDate };
}

/**
 * Calculate days difference between two dates
 */
function getDaysDifference(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Fetch system-wide statistics (deprecated - use getSystemStats instead)
 */
async function fetchSystemStats(): Promise<SystemStats> {
  return getSystemStats();
}

/**
 * Fetch user growth analytics (deprecated - use getUserAnalytics instead)
 */
async function fetchUserAnalytics(filters: AnalyticsFilters): Promise<DailyUserCount[]> {
  const result = await getUserAnalytics(filters);
  return result.data;
}

/**
 * Fetch expert growth analytics (deprecated - use getExpertAnalytics instead)
 */
async function fetchExpertAnalytics(filters: AnalyticsFilters): Promise<DailyUserCount[]> {
  const result = await getExpertAnalytics(filters);
  return result.data;
}

/**
 * Fetch gig creation analytics (deprecated - use getGigAnalytics instead)
 */
async function fetchGigAnalytics(filters: AnalyticsFilters): Promise<DailyGigCount[]> {
  const result = await getGigAnalytics(filters);
  return result.data;
}

/**
 * Fetch booking analytics (deprecated - use getBookingAnalytics instead)
 */
async function fetchBookingAnalytics(filters: AnalyticsFilters): Promise<DailyBookingCount[]> {
  const result = await getBookingAnalytics(filters);
  return result.data;
}

/**
 * Get user analytics with proper response format
 */
async function getUserAnalytics(filters: AnalyticsFilters & { userType?: string }): Promise<{ data: DailyUserCount[] }> {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.period) params.append('period', filters.period);
    if (filters.userType) params.append('user_type', filters.userType);

    const url = `${API_GATEWAY_URL}/api/user-v2/admin/analytics/users?${params.toString()}`;
    console.log('📡 Fetching user analytics:', url);

    // Call user-service-v2 through API gateway
    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.error('❌ Failed to fetch user analytics:', response.status, response.statusText);
      return { data: [] };
    }

    const result = await response.json();
    console.log('✅ User analytics received:', { 
      total_count: result.total_count, 
      dataPoints: result.data?.length || 0,
      dateRange: result.data?.[0]?.date + ' to ' + result.data?.[result.data?.length - 1]?.date
    });
    return result; // Backend returns { total_count: number, data: DailyUserCount[] }
  } catch (error) {
    console.error('❌ Error fetching user analytics:', error);
    return { data: [] };
  }
}

/**
 * Get expert analytics with proper response format
 */
async function getExpertAnalytics(filters: AnalyticsFilters): Promise<{ data: DailyUserCount[] }> {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.period) params.append('period', filters.period);
    params.append('user_type', 'expert'); // Filter for experts only

    const url = `${API_GATEWAY_URL}/api/user-v2/admin/analytics/users?${params.toString()}`;
    console.log('📡 Fetching expert analytics:', url);

    // Call user-service-v2 through API gateway
    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.error('❌ Failed to fetch expert analytics:', response.status, response.statusText);
      return { data: [] };
    }

    const result = await response.json();
    console.log('✅ Expert analytics received:', { 
      total_count: result.total_count, 
      dataPoints: result.data?.length || 0,
      dateRange: result.data?.[0]?.date + ' to ' + result.data?.[result.data?.length - 1]?.date
    });
    return result; // Backend returns { total_count: number, data: DailyUserCount[] }
  } catch (error) {
    console.error('❌ Error fetching expert analytics:', error);
    return { data: [] };
  }
}

/**
 * Get gig analytics with proper response format
 */
async function getGigAnalytics(filters: AnalyticsFilters): Promise<{ data: DailyGigCount[] }> {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.period) params.append('period', filters.period);

    const url = `${API_GATEWAY_URL}/api/gigs/admin/analytics/gigs?${params.toString()}`;
    console.log('📡 Fetching gig analytics:', url);

    // Call gig-service through API gateway
    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.error('❌ Failed to fetch gig analytics:', response.status, response.statusText);
      return { data: [] };
    }

    const result = await response.json();
    console.log('✅ Gig analytics received:', { 
      total_count: result.total_count, 
      dataPoints: result.data?.length || 0,
      dateRange: result.data?.[0]?.date + ' to ' + result.data?.[result.data?.length - 1]?.date
    });
    return result; // Backend returns { total_count: number, data: DailyGigCount[] }
  } catch (error) {
    console.error('❌ Error fetching gig analytics:', error);
    return { data: [] };
  }
}

/**
 * Get booking analytics with proper response format
 */
async function getBookingAnalytics(filters: AnalyticsFilters): Promise<{ data: DailyBookingCount[] }> {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.period) params.append('period', filters.period);

    // TODO: Implement booking analytics endpoint in booking service
    // For now, return empty data
    console.warn('Booking analytics endpoint not yet implemented in backend');
    return { data: [] };
  } catch (error) {
    console.error('Error fetching booking analytics:', error);
    return { data: [] };
  }
}

/**
 * Get system stats from multiple services
 */
async function getSystemStats(): Promise<SystemStats> {
  try {
    const headers = await getAuthHeaders();
    
    console.log('🔄 Fetching system stats...');
    
    // Fetch total users from user service
    const userResponse = await fetch(
      `${API_GATEWAY_URL}/api/user-v2/admin/analytics/users`,
      { headers }
    );
    
    // Fetch total gigs from gig service
    const gigResponse = await fetch(
      `${API_GATEWAY_URL}/api/gigs/admin/analytics/total-stats`,
      { headers }
    );
    
    let totalUsers = 0;
    let totalExperts = 0;
    let totalGigs = 0;
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('📊 User data received:', userData);
      // Backend returns total_count (snake_case)
      totalUsers = userData.total_count || userData.total || 0;
    } else {
      console.error('❌ User response failed:', userResponse.status, userResponse.statusText);
    }
    
    if (gigResponse.ok) {
      const gigData = await gigResponse.json();
      console.log('📊 Gig data received:', gigData);
      // Backend returns totalGigs (camelCase)
      totalGigs = gigData.totalGigs || 0;
    } else {
      console.error('❌ Gig response failed:', gigResponse.status, gigResponse.statusText);
    }
    
    // Fetch expert count separately
    const expertResponse = await fetch(
      `${API_GATEWAY_URL}/api/user-v2/admin/analytics/users?user_type=expert`,
      { headers }
    );
    
    if (expertResponse.ok) {
      const expertData = await expertResponse.json();
      console.log('📊 Expert data received:', expertData);
      // Backend returns total_count (snake_case)
      totalExperts = expertData.total_count || expertData.total || 0;
    } else {
      console.error('❌ Expert response failed:', expertResponse.status, expertResponse.statusText);
    }
    
    console.log('✅ System stats compiled:', { totalUsers, totalExperts, totalGigs });
    
    return {
      totalUsers,
      totalExperts,
      totalGigs,
      totalBookings: 0, // TODO: Implement when booking analytics is ready
      totalRevenue: 0,  // TODO: Implement when revenue analytics is ready
    };
  } catch (error) {
    console.error('❌ Error fetching system stats:', error);
    return {
      totalUsers: 0,
      totalExperts: 0,
      totalGigs: 0,
      totalBookings: 0,
      totalRevenue: 0,
    };
  }
}

/**
 * Export all analytics functions
 */
export const analyticsService = {
  // New wrapper functions for AdminDashboard compatibility
  getUserAnalytics,
  getExpertAnalytics,
  getGigAnalytics,
  getBookingAnalytics,
  getSystemStats,
  getTotalStats: getSystemStats, // Alias for backward compatibility
  
  // Original functions (keeping for backward compatibility)
  fetchSystemStats,
  fetchUserAnalytics,
  fetchExpertAnalytics,
  fetchGigAnalytics,
  fetchBookingAnalytics,
  getDateRange,
};
