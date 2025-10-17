import React, { useState, useEffect } from 'react';
import { ExpertGig } from '@/services/gigService';
import EarningsChart from '@/components/dashboard/EarningsChart';
import StatsCard from '@/components/dashboard/StatsCard';
import { TrendingUp, TrendingDown, DollarSign, Users, Clock, Star, Loader2 } from 'lucide-react';
import { gigAnalyticsService, GigAnalyticsData } from '@/services/gigAnalyticsService';
import { reviewAnalyticsService, GigRatingAnalytics } from '@/services/reviewAnalyticsService';

interface GigAnalyticsProps {
  gig: ExpertGig;
}

const GigAnalytics: React.FC<GigAnalyticsProps> = ({ gig }) => {
  const [analytics, setAnalytics] = useState<GigAnalyticsData | null>(null);
  const [ratingAnalytics, setRatingAnalytics] = useState<GigRatingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'year'>('month');
  const [chartLoading, setChartLoading] = useState(false);

  // Initial load
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both analytics data in parallel
        const [analyticsData, ratingData] = await Promise.all([
          gigAnalyticsService.fetchGigAnalytics(gig.id, timePeriod),
          reviewAnalyticsService.fetchGigRatingAnalytics(gig.id)
        ]);

        setAnalytics(analyticsData);
        setRatingAnalytics(ratingData);

      } catch (err) {
        console.error('Error loading analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    if (gig.id) {
      loadAnalytics();
    }
  }, [gig.id, timePeriod]);

  // Handle time period change - only reload chart data
  const handleTimePeriodChange = async (newPeriod: 'week' | 'month' | 'year') => {
    setTimePeriod(newPeriod);
    setChartLoading(true);
    
    try {
      const data = await gigAnalyticsService.fetchGigAnalytics(gig.id, newPeriod);
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading chart data:', err);
    } finally {
      setChartLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">{error || 'No analytics data available'}</p>
        <p className="text-sm text-yellow-600 mt-2">
          Analytics will be available once you have bookings for this gig.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-border rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">Gig Analytics</h1>
        <p className="text-muted-foreground">Performance insights for "{gig.title}"</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title="Today's Revenue" 
          value={`Rs. ${analytics.revenue.today.toLocaleString()}`} 
          change={analytics.revenue.growth.daily >= 0 ? `+${analytics.revenue.growth.daily}%` : `${analytics.revenue.growth.daily}%`}
          changeType={analytics.revenue.growth.daily >= 0 ? "positive" : "negative"}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatsCard 
          title="Weekly Revenue" 
          value={`Rs. ${analytics.revenue.week.toLocaleString()}`} 
          change={analytics.revenue.growth.weekly >= 0 ? `+${analytics.revenue.growth.weekly}%` : `${analytics.revenue.growth.weekly}%`}
          changeType={analytics.revenue.growth.weekly >= 0 ? "positive" : "negative"}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatsCard 
          title="Monthly Revenue" 
          value={`Rs. ${analytics.revenue.month.toLocaleString()}`} 
          change={analytics.revenue.growth.monthly >= 0 ? `+${analytics.revenue.growth.monthly}%` : `${analytics.revenue.growth.monthly}%`}
          changeType={analytics.revenue.growth.monthly >= 0 ? "positive" : "negative"}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Revenue Trend</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleTimePeriodChange('week')}
                disabled={chartLoading}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timePeriod === 'week'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${chartLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Week
              </button>
              <button
                onClick={() => handleTimePeriodChange('month')}
                disabled={chartLoading}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timePeriod === 'month'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${chartLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Month
              </button>
              <button
                onClick={() => handleTimePeriodChange('year')}
                disabled={chartLoading}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timePeriod === 'year'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${chartLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Year
              </button>
            </div>
          </div>
          {chartLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <EarningsChart data={analytics.chartData} period={timePeriod} />
          )}
        </div>
        
        <div className="bg-white border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Booking Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Bookings</span>
              <span className="text-lg font-semibold">{analytics.bookings.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">This Month</span>
              <span className="text-lg font-semibold">{analytics.bookings.thisMonth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completed</span>
              <span className="text-lg font-semibold text-green-600">{analytics.bookings.completed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cancelled</span>
              <span className="text-lg font-semibold text-red-600">{analytics.bookings.cancelled}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">Completion Rate</span>
              <span className="text-lg font-semibold text-blue-600">{analytics.bookings.completionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="text-2xl font-bold">
              {ratingAnalytics ? ratingAnalytics.average_rating.toFixed(1) : 'N/A'}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">Average Rating</div>
          <div className="text-xs text-muted-foreground mt-1">
            {ratingAnalytics ? `${ratingAnalytics.total_reviews} reviews` : 'No reviews'}
          </div>
        </div>

        <div className="bg-white border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <span className="text-2xl font-bold">{analytics.performance.responseTime}</span>
          </div>
          <div className="text-sm text-muted-foreground">Response Time</div>
          <div className="text-xs text-green-600 mt-1">
            <TrendingDown className="h-3 w-3 inline mr-1" />
            Improving
          </div>
        </div>

        <div className="bg-white border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 text-green-500" />
            <span className="text-2xl font-bold">{analytics.performance.repeatCustomers}</span>
          </div>
          <div className="text-sm text-muted-foreground">Repeat Customers</div>
          <div className="text-xs text-green-600 mt-1">
            <TrendingUp className="h-3 w-3 inline mr-1" />
            +25% this month
          </div>
        </div>

        <div className="bg-white border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-purple-500" />
            <span className="text-2xl font-bold">{analytics.performance.avgSessionDuration}</span>
          </div>
          <div className="text-sm text-muted-foreground">Avg Session</div>
          <div className="text-xs text-muted-foreground mt-1">
            Duration
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Insights & Recommendations</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <div className="font-medium text-green-800">Strong Performance</div>
              <div className="text-sm text-green-700">
                Your gig rating of {analytics.performance.rating.toFixed(1)} is above average. 
                Keep up the excellent service quality!
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <Users className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <div className="font-medium text-blue-800">Customer Retention</div>
              <div className="text-sm text-blue-700">
                {analytics.performance.repeatCustomers} repeat customers indicate strong client satisfaction. 
                Consider offering loyalty discounts.
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
            <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <div className="font-medium text-yellow-800">Response Time</div>
              <div className="text-sm text-yellow-700">
                Your response time of {analytics.performance.responseTime} is good. 
                Aim for under 2 hours to boost your ranking.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GigAnalytics;
