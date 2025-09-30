import React from 'react';
import StatsCard from '@/components/dashboard/StatsCard';
import BookingCard from '@/components/dashboard/BookingCard';
import EarningsChart from '@/components/dashboard/EarningsChart';
import { ExpertGig } from '@/services/gigService';
import { Badge } from '@/components/ui/badge';
import { Star, Users, Clock, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GigOverviewProps {
  gig: ExpertGig;
  onUpdate: (gig: ExpertGig) => void;
}

const GigOverview: React.FC<GigOverviewProps> = ({ gig }) => {
  // Mock data for this gig specifically
  const gigStats = {
    todayBookings: 3,
    weeklyBookings: 12,
    monthlyRevenue: 45000,
    totalConsultations: gig.total_consultations,
    pendingRequests: 5,
    avgResponseTime: gig.response_time,
    rating: gig.rating,
    totalReviews: gig.total_reviews
  };

  const mockBookings = [
    {
      id: '1',
      clientName: 'John Doe',
      time: '10:00 AM',
      duration: '30 min',
      status: 'confirmed' as const,
      type: 'consultation',
      price: 2500,
      dateTime: new Date().toISOString(),
      client: { name: 'John Doe' },
      service: 'Technology Consultation',
      amount: 2500
    },
    {
      id: '2',
      clientName: 'Jane Smith',
      time: '2:00 PM',
      duration: '45 min',
      status: 'pending' as const,
      type: 'consultation',
      price: 3750,
      dateTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
      client: { name: 'Jane Smith' },
      service: 'Business Consultation',
      amount: 3750
    }
  ];

  const getStatusColor = (status: ExpertGig['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Gig Header */}
      <div className="bg-white border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{gig.title}</h1>
            <p className="text-muted-foreground mb-3">{gig.bio}</p>
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(gig.status)}>
                {gig.status}
              </Badge>
              <span className="text-sm text-muted-foreground capitalize">
                {gig.category.replace('-', ' ')}
              </span>
              <span className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {gig.rating.toFixed(1)} ({gig.total_reviews} reviews)
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">Rs. {gig.hourly_rate.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">per hour</div>
          </div>
        </div>
        
        {gig.status !== 'active' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-yellow-800">Gig Status: {gig.status}</h3>
                <p className="text-sm text-yellow-700">
                  {gig.status === 'pending' && 'Your gig is under review. You\'ll be notified once it\'s approved.'}
                  {gig.status === 'draft' && 'Complete your gig setup to make it live.'}
                  {gig.status === 'inactive' && 'Your gig is inactive. Activate it to start receiving bookings.'}
                </p>
              </div>
              {gig.status === 'inactive' && (
                <Button>Activate Gig</Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Today's Bookings" 
          value={gigStats.todayBookings.toString()} 
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatsCard 
          title="This Week" 
          value={gigStats.weeklyBookings.toString()} 
          change="+15%" 
          changeType="positive"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatsCard 
          title="Monthly Revenue" 
          value={`Rs. ${gigStats.monthlyRevenue.toLocaleString()}`} 
          change="+8%" 
          changeType="positive"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatsCard 
          title="Total Consultations" 
          value={gigStats.totalConsultations.toString()}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Today's Schedule</h3>
            <div className="space-y-3">
              {mockBookings.length === 0 ? (
                <div className="bg-white border border-border rounded-lg p-6 text-center text-muted-foreground">
                  No scheduled bookings for today
                </div>
              ) : (
                mockBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Pending Requests</h3>
            <div className="bg-white border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{gigStats.pendingRequests}</div>
                  <div className="text-sm text-muted-foreground">Requests waiting for response</div>
                </div>
                <Button>View All</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-6">
          <div className="bg-white border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Gig Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Response Time</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {gigStats.avgResponseTime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rating</span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {gigStats.rating.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Reviews</span>
                <span>{gigStats.totalReviews}</span>
              </div>
            </div>
          </div>

          <EarningsChart data={[
            { date: '2024-01-01', revenue: 5000 },
            { date: '2024-01-02', revenue: 7500 },
            { date: '2024-01-03', revenue: 6000 },
            { date: '2024-01-04', revenue: 8000 },
            { date: '2024-01-05', revenue: 12000 },
          ]} />
        </div>
      </div>
    </div>
  );
};

export default GigOverview;
