import React, { useState } from 'react';
import { mockExpertData } from '@/data/mockExpertData';
import BookingCard from '@/components/dashboard/BookingCard';

const BookingsManagement: React.FC = () => {
  const [active, setActive] = useState<'requests'|'upcoming'|'completed'>('requests');
  const tabs = [
    { id: 'requests', label: 'Requests', count: mockExpertData.bookingRequests.length },
    { id: 'upcoming', label: 'Upcoming', count: mockExpertData.upcomingBookings.length },
    { id: 'completed', label: 'Completed', count: mockExpertData.completed?.length || 0 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Booking Management</h1>
        <div className="flex gap-2">
          <button className="btn-outline">Export Data</button>
          <button className="btn-outline">Filter</button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-md p-4">
        <div className="flex gap-2 mb-4">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActive(t.id as any)} className={`px-3 py-2 rounded ${active===t.id? 'bg-primary text-white':'bg-card'}`}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        <div>
          {active === 'requests' && (
            <div className="space-y-3">
              {mockExpertData.bookingRequests.map(b => <BookingCard key={b.id} booking={b} />)}
            </div>
          )}

          {active === 'upcoming' && (
            <div className="space-y-3">
              {mockExpertData.upcomingBookings.map(b => <BookingCard key={b.id} booking={b} />)}
            </div>
          )}

          {active === 'completed' && (
            <div className="space-y-3">{(mockExpertData.completed || []).map(b => <BookingCard key={b.id} booking={b} />)}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingsManagement;
