import React from 'react';
import { ExpertGig } from '@/services/gigService';
import EarningsChart from '@/components/dashboard/EarningsChart';
import StatsCard from '@/components/dashboard/StatsCard';
import { TrendingUp, TrendingDown, DollarSign, Users, Clock, Star } from 'lucide-react';

interface GigAnalyticsProps {
  gig: ExpertGig;
}

const GigAnalytics: React.FC<GigAnalyticsProps> = ({ gig }) => {
  // Mock analytics data specific to this gig
  const analytics = {
    revenue: {
      today: 7500,
      week: 25000,
      month: 85000,
      growth: {
        daily: 15,
        weekly: 8,
        monthly: 12
      }
    },
    bookings: {
      total: gig.total_consultations,
      thisMonth: 28,
      completed: 25,
      cancelled: 3,
      completionRate: 89.3
    },
    performance: {
      rating: gig.rating,
      totalReviews: gig.total_reviews,
      responseTime: gig.response_time,
      repeatCustomers: 18,
      avgSessionDuration: '45 min'
    },
    chartData: [
      { date: '2024-01-01', revenue: 3000 },
      { date: '2024-01-02', revenue: 4500 },
      { date: '2024-01-03', revenue: 3200 },
      { date: '2024-01-04', revenue: 5800 },
      { date: '2024-01-05', revenue: 7200 },
      { date: '2024-01-06', revenue: 6100 },
      { date: '2024-01-07', revenue: 8500 },
      { date: '2024-01-08', revenue: 7800 },
      { date: '2024-01-09', revenue: 9200 },
      { date: '2024-01-10', revenue: 8800 },
      { date: '2024-01-11', revenue: 10500 },
      { date: '2024-01-12', revenue: 12000 },
      { date: '2024-01-13', revenue: 11200 },
      { date: '2024-01-14', revenue: 13500 },
      { date: '2024-01-15', revenue: 15000 }
    ]
  };

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
          change={`+${analytics.revenue.growth.daily}%`}
          changeType="positive"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatsCard 
          title="Weekly Revenue" 
          value={`Rs. ${analytics.revenue.week.toLocaleString()}`} 
          change={`+${analytics.revenue.growth.weekly}%`}
          changeType="positive"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatsCard 
          title="Monthly Revenue" 
          value={`Rs. ${analytics.revenue.month.toLocaleString()}`} 
          change={`+${analytics.revenue.growth.monthly}%`}
          changeType="positive"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <EarningsChart data={analytics.chartData} />
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
            <span className="text-2xl font-bold">{analytics.performance.rating.toFixed(1)}</span>
          </div>
          <div className="text-sm text-muted-foreground">Average Rating</div>
          <div className="text-xs text-muted-foreground mt-1">
            {analytics.performance.totalReviews} reviews
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
