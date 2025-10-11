export interface DailyUserCount {
  date: string;
  count: number;
}

export interface UserAnalyticsResponse {
  data: DailyUserCount[];
  total_count: number;
  user_type: string;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  userType?: 'all' | 'expert' | 'client';
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export type AnalyticsType = 'users' | 'experts' | 'gigs' | 'bookings';