// Analytics service for admin dashboard
import { auth } from '@/firebase/firebase';
import { getIdToken } from 'firebase/auth';

export interface DailyUserCount {
  date: string;
  count: number;
}

export interface DailyGigCount {
  date: string;
  count: number;
}

export interface UserAnalyticsResponse {
  data: DailyUserCount[];
  total_count: number;
  user_type: string;
}

export interface GigAnalyticsResponse {
  data: DailyGigCount[];
  total_count: number;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  userType?: 'all' | 'expert' | 'client';
}

class AnalyticsService {
  private readonly baseURL = 'http://localhost:8000'; // API Gateway URL

  private async getAuthToken(): Promise<string | null> {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        return await getIdToken(currentUser);
      }
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async getUserAnalytics(filters: AnalyticsFilters = {}): Promise<UserAnalyticsResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) {
        params.append('start_date', filters.startDate);
      }
      
      if (filters.endDate) {
        params.append('end_date', filters.endDate);
      }
      
      if (filters.userType && filters.userType !== 'all') {
        params.append('user_type', filters.userType);
      }

      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(
        `${this.baseURL}/api/user-v2/admin/analytics/users?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      console.log('📡 User Analytics Request:', `${this.baseURL}/api/user-v2/admin/analytics/users?${params.toString()}`);
      console.log('📡 Response Status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 User Analytics Data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      throw error;
    }
  }

  async getExpertAnalytics(filters: AnalyticsFilters = {}): Promise<UserAnalyticsResponse> {
    return this.getUserAnalytics({ ...filters, userType: 'expert' });
  }

  async getTotalStats(): Promise<{ totalUsers: number; totalExperts: number; totalGigs: number }> {
    try {
      // Fetch user stats first (these should always work)
      const [allUsers, experts] = await Promise.all([
        this.getUserAnalytics({ userType: 'all' }),
        this.getUserAnalytics({ userType: 'expert' })
      ]);

      // Try to fetch gig stats, but don't fail if it's unavailable
      let totalGigs = 0;
      try {
        const gigs = await this.getGigTotalStats();
        totalGigs = gigs.totalGigs;
      } catch (gigError) {
        console.warn('Gig service unavailable, using default value:', gigError);
        totalGigs = 0; // Default value when gig service is down
      }

      console.log('📊 Total Stats:', {
        totalUsers: allUsers.total_count,
        totalExperts: experts.total_count,
        totalGigs
      });

      return {
        totalUsers: allUsers.total_count,
        totalExperts: experts.total_count,
        totalGigs
      };
    } catch (error) {
      console.error('Error fetching total stats:', error);
      throw error;
    }
  }

  async getGigTotalStats(): Promise<{ totalGigs: number }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(
        `${this.baseURL}/api/gigs/admin/analytics/total-stats`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching gig total stats:', error);
      throw error;
    }
  }

  async getGigAnalytics(filters: AnalyticsFilters = {}): Promise<GigAnalyticsResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) {
        params.append('start_date', filters.startDate);
      }
      
      if (filters.endDate) {
        params.append('end_date', filters.endDate);
      }

      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(
        `${this.baseURL}/api/gigs/admin/analytics/gigs?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching gig analytics:', error);
      throw error;
    }
  }

  async getDailyRegistrations(filters: AnalyticsFilters = {}): Promise<UserAnalyticsResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) {
        params.append('start_date', filters.startDate);
      }
      
      if (filters.endDate) {
        params.append('end_date', filters.endDate);
      }
      
      if (filters.userType && filters.userType !== 'all') {
        params.append('user_type', filters.userType);
      }

      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(
        `${this.baseURL}/api/user-v2/admin/analytics/daily-registrations?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching daily registrations:', error);
      throw error;
    }
  }

  // Helper function to get date ranges
  getDateRange(preset: string): { startDate: string; endDate: string } {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
    let startDate: string;

    switch (preset) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        startDate = yearAgo.toISOString().split('T')[0];
        break;
      case '3months':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        startDate = threeMonthsAgo.toISOString().split('T')[0];
        break;
      case '6months':
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        startDate = sixMonthsAgo.toISOString().split('T')[0];
        break;
      default:
        // Default to last month
        const defaultMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        startDate = defaultMonthAgo.toISOString().split('T')[0];
    }

    console.log(`📅 Date Range for ${preset}:`, { startDate, endDate });
    return { startDate, endDate };
  }
}

export const analyticsService = new AnalyticsService();