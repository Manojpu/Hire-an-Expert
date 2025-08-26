import React from 'react';
import StatsCard from '@/components/dashboard/StatsCard';
import BookingCard from '@/components/dashboard/BookingCard';
import EarningsChart from '@/components/dashboard/EarningsChart';
import AvailabilityCalendar from '@/components/dashboard/AvailabilityCalendar';
import { mockExpertData } from '@/data/mockExpertData';

const Overview: React.FC = () => {
  const earnings = mockExpertData.earnings;
  const requests = mockExpertData.bookingRequests.slice(0, 5);
  const upcoming = mockExpertData.upcomingBookings.slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Today's Earnings" value={`Rs. ${earnings.today.toLocaleString()}`} change={`+${earnings.growth?.daily ?? 0}%`} changeType="positive" />
        <StatsCard title="This Week" value={`Rs. ${earnings.week.toLocaleString()}`} change={`+${earnings.growth?.weekly ?? 0}%`} changeType="positive" />
        <StatsCard title="This Month" value={`Rs. ${earnings.month.toLocaleString()}`} change={`+${earnings.growth?.monthly ?? 0}%`} changeType="positive" />
        <StatsCard title="Pending Requests" value={mockExpertData.bookingRequests.length} />
      </div>

      <div className="lg:col-span-3 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-3">Pending Requests</h3>
          <div className="space-y-3">
            {requests.length === 0 ? <div className="text-muted-foreground">No pending requests</div> : requests.map(r => (
              <BookingCard key={r.id} booking={r} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Today's Schedule</h3>
          <div className="space-y-3">
            {upcoming.length === 0 ? <div className="text-muted-foreground">No scheduled bookings for today</div> : upcoming.map(u => <BookingCard key={u.id} booking={u} />)}
          </div>
        </div>
      </div>

      <div className="lg:col-span-1 space-y-4">
        <EarningsChart data={earnings.chartData} />
        <AvailabilityCalendar />
      </div>
    </div>
  );
};

export default Overview;
