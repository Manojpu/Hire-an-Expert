import React, { useState, useEffect, useCallback } from 'react';
import StatsCard from '@/components/dashboard/StatsCard';
import BookingCard from '@/components/dashboard/BookingCard';
import EarningsChart from '@/components/dashboard/EarningsChart';
import { ExpertGig } from '@/services/gigService';
import { Badge } from '@/components/ui/badge';
import { Star, Users, Clock, DollarSign, Calendar, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { bookingService, Booking } from '@/services/bookingService';

interface GigOverviewProps {
  gig: ExpertGig;
  onUpdate: (gig: ExpertGig) => void;
}

const GigOverview: React.FC<GigOverviewProps> = ({ gig }) => {
  const [loading, setLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [gigStats, setGigStats] = useState({
    todayBookings: 0,
    weeklyBookings: 0,
    monthlyRevenue: 0,
    totalConsultations: gig.total_consultations || 0,
    pendingRequests: 0,
    avgResponseTime: gig.response_time || '< 24 hours',
    rating: gig.rating || 0,
    totalReviews: gig.total_reviews || 0
  });

  // Extended gig type to handle category object
  const gigWithCategory = gig as ExpertGig & {
    category?: {
      id: string;
      name: string;
      slug: string;
    };
  };

  // Function to load today's bookings for this gig
  const loadTodayBookings = useCallback(async () => {
    if (!gig?.id) return;
    
    try {
      setBookingsLoading(true);
      setBookingsError(null);
      console.log('Loading today\'s bookings for gig:', gig.id);
      
      // Get all bookings for this gig
      const allBookings = await bookingService.getBookingsByGig(gig.id);
      console.log('All bookings loaded:', allBookings);
      
      // Filter for today's bookings
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const todaysBookings = allBookings.filter(booking => {
        if (!booking.scheduled_time) return false;
        const bookingDate = new Date(booking.scheduled_time);
        return bookingDate >= todayStart && bookingDate < todayEnd;
      });
      
      console.log('Today\'s bookings filtered:', todaysBookings);
      setTodayBookings(todaysBookings);
      
      // Update stats
      setGigStats(prev => ({
        ...prev,
        todayBookings: todaysBookings.length,
        pendingRequests: allBookings.filter(b => b.status === 'pending').length
      }));
      
    } catch (err) {
      console.error('Error loading today\'s bookings:', err);
      setBookingsError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setBookingsLoading(false);
    }
  }, [gig?.id]);

  useEffect(() => {
    // Load real statistics and bookings from the backend
    setGigStats(prev => ({
      ...prev,
      // Use real data from the gig
      totalConsultations: gig.total_consultations || 0,
      avgResponseTime: gig.response_time || '< 24 hours',
      rating: gig.rating || 0,
      totalReviews: gig.total_reviews || 0,
      // Mock data for fields we don't have in the API yet
      weeklyBookings: Math.floor(Math.random() * 20),
      monthlyRevenue: Math.floor(Math.random() * 50000)
    }));

    // Load today's bookings
    loadTodayBookings();
  }, [gig, loadTodayBookings]);

  // Transform API booking data to match BookingCard component expectations
  const transformedTodayBookings = todayBookings.map(booking => {
    const hourlyRate = gig.hourly_rate || 0;
    const duration = booking.duration || 30;
    const calculatedPrice = hourlyRate * duration / 60;
    
    return {
      id: booking.id.toString(),
      clientName: booking.user?.name || `User ${booking.user_id}`,
      time: booking.scheduled_time 
        ? new Date(booking.scheduled_time).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })
        : 'Time TBD',
      duration: `${duration} min`,
      status: booking.status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
      type: booking.type || 'standard',
      price: calculatedPrice,
      dateTime: booking.scheduled_time || new Date().toISOString(),
      client: { name: booking.user?.name || `User ${booking.user_id}` },
      service: booking.service || 'Consultation',
      amount: calculatedPrice
    };
  });

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
            <h1 className="text-2xl font-bold mb-2">
              {gig.name || 
               (gig.service_description && gig.service_description.length > 60 
                ? gig.service_description.substring(0, 60) + '...' 
                : gig.service_description) || 
               'Professional Service'}
            </h1>
            <p className="text-muted-foreground mb-3">
              {gig.bio || gig.service_description || 'Professional consulting service'}
            </p>
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(gig.status)}>
                {(gig.status || 'draft').toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground capitalize">
                {gigWithCategory.category?.name || 'Professional Service'}
              </span>
              <span className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {(gigStats.rating || 0).toFixed(1)} ({gigStats.totalReviews || 0} reviews)
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">Rs. {(gig.hourly_rate || 0).toLocaleString()}</div>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Today's Schedule</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadTodayBookings} 
                disabled={bookingsLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${bookingsLoading ? 'animate-spin' : ''}`} />
                {bookingsLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
            
            <div className="space-y-3">
              {bookingsLoading ? (
                <div className="bg-white border border-border rounded-lg p-6 text-center">
                  <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-spin" />
                  <p className="text-muted-foreground">Loading today's bookings...</p>
                </div>
              ) : bookingsError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <p className="text-red-600 mb-2">Error loading bookings</p>
                  <p className="text-sm text-red-500 mb-3">{bookingsError}</p>
                  <Button 
                    onClick={loadTodayBookings} 
                    size="sm"
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Try Again
                  </Button>
                </div>
              ) : transformedTodayBookings.length === 0 ? (
                <div className="bg-white border border-border rounded-lg p-6 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <h4 className="font-medium mb-1">No scheduled bookings for today</h4>
                  <p className="text-sm">Your calendar is clear for today</p>
                </div>
              ) : (
                transformedTodayBookings.map(booking => (
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
                  <div className="text-sm text-muted-foreground">
                    {gigStats.pendingRequests === 1 ? 'Request' : 'Requests'} waiting for response
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    // Navigate to bookings page with pending filter
                    console.log('Navigate to pending bookings for gig:', gig.id);
                  }}
                >
                  View All
                </Button>
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
