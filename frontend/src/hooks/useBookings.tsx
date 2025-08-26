import { useState } from 'react';

export function useBookings(initial = { requests: [], upcoming: [], completed: [] }) {
  const [bookings, setBookings] = useState(initial);

  const acceptBooking = async (id: string) => {
    setBookings((b: any) => ({
      ...b,
      requests: b.requests.filter((x: any) => x.id !== id),
      upcoming: [...b.upcoming, { ...(b.requests.find((x: any) => x.id === id) || {}), status: 'confirmed' }]
    }));
    return { success: true };
  };

  const rejectBooking = async (id: string) => {
    setBookings((b: any) => ({
      ...b,
      requests: b.requests.map((r: any) => r.id === id ? { ...r, status: 'rejected' } : r)
    }));
    return { success: true };
  };

  const markAsCompleted = async (id: string) => {
    setBookings((b: any) => ({
      ...b,
      upcoming: b.upcoming.filter((x: any) => x.id !== id),
      completed: [...b.completed, { ...(b.upcoming.find((x: any) => x.id === id) || {}), status: 'completed', completedAt: new Date().toISOString() }]
    }));
    return { success: true };
  };

  return { bookings, acceptBooking, rejectBooking, markAsCompleted, setBookings };
}
