import React, { useState } from 'react';
import { ExpertGig } from '@/services/gigService';
import BookingCard from '@/components/dashboard/BookingCard';
import { Calendar, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GigBookingsProps {
  gig: ExpertGig;
}

const GigBookings: React.FC<GigBookingsProps> = ({ gig }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock bookings data specific to this gig
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

  const filteredBookings = mockBookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter;
    const matchesSearch = booking.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: mockBookings.length,
    pending: mockBookings.filter(b => b.status === 'pending').length,
    confirmed: mockBookings.filter(b => b.status === 'confirmed').length,
    completed: mockBookings.filter(b => b.status === 'completed').length,
    cancelled: mockBookings.filter(b => b.status === 'cancelled').length
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
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            View Calendar
          </Button>
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
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
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
            <BookingCard key={booking.id} booking={booking} />
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
