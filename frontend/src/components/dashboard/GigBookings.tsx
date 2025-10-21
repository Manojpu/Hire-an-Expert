import React, { useState, useEffect, useCallback } from 'react';
import { ExpertGig } from '@/services/gigService';
import BookingCard from '@/components/dashboard/BookingCard';
import { Calendar, Filter, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { bookingService, Booking } from '@/services/bookingService';

interface GigBookingsProps {
  gig: ExpertGig;
}

// Create a simpler interface for UI bookings to avoid conflicts
interface UIBooking {
  id: string;
  clientName: string;
  time: string;
  date: string;
  duration: string;
  status: 'pending' | 'confirmed' | 'joined' | 'completed' | 'cancelled';
  type: string;
  price: number;
  gigTitle: string;
  dateTime: string;
  client: { name: string };
  service: string;
  amount: number;
  meetingLink?: string;
}

const GigBookings: React.FC<GigBookingsProps> = ({ gig }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [bookings, setBookings] = useState<UIBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load bookings from backend
  const loadBookings = useCallback(async () => {
    if (!gig?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('Loading bookings for gig:', gig.id);
      
      const gigBookings = await bookingService.getBookingsByGig(gig.id);
      console.log('Loaded bookings:', gigBookings);
      
      // Transform backend data to match frontend expectations
      const transformedBookings = gigBookings.map((booking) => {
        console.log('Transforming booking:', booking);
        const hourlyRate = typeof booking.gig?.hourly_rate === 'string' 
          ? parseFloat(booking.gig.hourly_rate) 
          : (booking.gig?.hourly_rate as number) || gig.hourly_rate || 0;
        const duration = booking.duration || 30;
        const calculatedPrice = hourlyRate * duration / 60;

        // Map meeting_link (snake_case) to meetingLink (camelCase) for BookingCard
        return {
          id: booking.id.toString(),
          clientName: booking.user?.name || `User ${String(booking.user_id).substring(0, 8)}...`,
          time: booking.scheduled_time 
            ? new Date(booking.scheduled_time).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })
            : 'Time TBD',
          date: booking.scheduled_time 
            ? new Date(booking.scheduled_time).toLocaleDateString()
            : new Date().toLocaleDateString(),
          duration: `${duration} min`,
          status: booking.status,
          type: booking.type || 'standard',
          price: calculatedPrice,
          gigTitle: booking.gig?.title || gig.title,
          dateTime: booking.scheduled_time || new Date().toISOString(),
          client: { name: booking.user?.name || `User ${String(booking.user_id).substring(0, 8)}...` },
          service: booking.service || 'Consultation',
          amount: calculatedPrice,
          meetingLink: booking.meeting_link // <-- FIX: map for BookingCard
        } as UIBooking;
      });
      
      console.log('Transformed bookings:', transformedBookings);
      setBookings(transformedBookings);
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
      // Fall back to empty array instead of mock data
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [gig?.id, gig.hourly_rate, gig.title]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Handle booking actions
  const handleAcceptBooking = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      await bookingService.confirmBooking(bookingId);
      await loadBookings(); // Reload bookings
    } catch (err) {
      console.error('Error accepting booking:', err);
      setError('Failed to accept booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      await bookingService.cancelBooking(bookingId);
      await loadBookings(); // Reload bookings
    } catch (err) {
      console.error('Error rejecting booking:', err);
      setError('Failed to reject booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleJoinBooking = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      await bookingService.joinBooking(bookingId);
      await loadBookings(); // Reload bookings
      // Navigate to Agora meeting room
      window.location.href = `/meeting/${bookingId}`;
    } catch (err) {
      console.error('Error joining booking:', err);
      setError('Failed to join booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      await bookingService.completeBooking(bookingId);
      await loadBookings(); // Reload bookings
    } catch (err) {
      console.error('Error completing booking:', err);
      setError('Failed to complete booking');
    } finally {
      setActionLoading(null);
    }
  };

  // Callback to refresh bookings when BookingCard changes status
  const handleStatusChange = async () => {
    await loadBookings();
  };

  // Mock bookings data for fallback (keeping for reference)
  const mockBookings = [
    {
      id: '1',
      clientName: 'John Doe',
      time: '10:00 AM - 10:30 AM',
      date: '2024-01-15',
      duration: '30 min',
      status: 'confirmed' as const,
      type: 'consultation',
      price: gig.hourly_rate * 0.5,
      gigTitle: gig.title,
      dateTime: new Date('2024-01-15T10:00:00').toISOString(),
      client: { name: 'John Doe' },
      service: 'Technology Consultation',
      amount: gig.hourly_rate * 0.5
    },
    {
      id: '2',
      clientName: 'Jane Smith',
      time: '2:00 PM - 2:45 PM',
      date: '2024-01-15',
      duration: '45 min',
      status: 'pending' as const,
      type: 'consultation',
      price: gig.hourly_rate * 0.75,
      gigTitle: gig.title,
      dateTime: new Date('2024-01-15T14:00:00').toISOString(),
      client: { name: 'Jane Smith' },
      service: 'Business Consultation',
      amount: gig.hourly_rate * 0.75
    },
    {
      id: '3',
      clientName: 'Mike Johnson',
      time: '4:00 PM - 5:00 PM',
      date: '2024-01-16',
      duration: '60 min',
      status: 'completed' as const,
      type: 'consultation',
      price: gig.hourly_rate,
      gigTitle: gig.title,
      dateTime: new Date('2024-01-16T16:00:00').toISOString(),
      client: { name: 'Mike Johnson' },
      service: 'Strategic Planning',
      amount: gig.hourly_rate
    },
    {
      id: '4',
      clientName: 'Sarah Wilson',
      time: '11:00 AM - 11:30 AM',
      date: '2024-01-17',
      duration: '30 min',
      status: 'cancelled' as const,
      type: 'consultation',
      price: gig.hourly_rate * 0.5,
      gigTitle: gig.title,
      dateTime: new Date('2024-01-17T11:00:00').toISOString(),
      client: { name: 'Sarah Wilson' },
      service: 'Quick Consultation',
      amount: gig.hourly_rate * 0.5
    }
  ];

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter;
    const matchesSearch = booking.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Gig Bookings</h1>
            <p className="text-muted-foreground">Manage bookings for "{gig.title}"</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadBookings} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({statusCounts.all})</SelectItem>
              <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
              <SelectItem value="confirmed">Confirmed ({statusCounts.confirmed})</SelectItem>
              <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
              <SelectItem value="cancelled">Cancelled ({statusCounts.cancelled})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="font-medium">Error loading bookings</p>
            </div>
            <p className="text-red-600 mt-1 text-sm">{error}</p>
            <Button 
              onClick={loadBookings} 
              className="mt-2 bg-red-500 hover:bg-red-600"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white border border-border rounded-lg p-8 text-center">
            <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Loading bookings...</h3>
            <p className="text-muted-foreground">
              Fetching booking data from the server.
            </p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white border border-border rounded-lg p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No bookings found</h3>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? "No bookings have been made for this gig yet."
                : `No ${filter} bookings found.`
              }
            </p>
          </div>
        ) : (
          filteredBookings.map(booking => (
            <BookingCard 
              key={booking.id} 
              booking={booking}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{statusCounts.pending}</div>
          <div className="text-sm text-muted-foreground">Pending Requests</div>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{statusCounts.confirmed}</div>
          <div className="text-sm text-muted-foreground">Confirmed Bookings</div>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-600">{statusCounts.completed}</div>
          <div className="text-sm text-muted-foreground">Completed Sessions</div>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{statusCounts.cancelled}</div>
          <div className="text-sm text-muted-foreground">Cancelled Bookings</div>
        </div>
      </div>
    </div>
  );
};

export default GigBookings;
