import React, { useMemo, useState, useEffect } from "react";
import { getBookings, updateBookingStatus, cancelBooking, confirmBookingWithPayment, capturePayment, Booking } from "@/lib/bookings";
import { MOCK_EXPERTS } from "@/data/mockExperts";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getICalHref, getGoogleCalendarUrl } from "@/lib/calendar";

const MyBookings = () => {
  const { state } = useAuth();
  const userId = state.user?.id;
  const [tick, setTick] = useState(0);

  const bookings = useMemo(() => {
    if (!userId) return [] as Booking[];
    return getBookings().filter((b) => b.clientId === userId || b.expertId === userId);
  }, [userId]);

  useEffect(() => {
    // listen for storage events to update bookings across tabs
    const handler = () => setTick((t) => t + 1);
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // refresh when tick changes
  useEffect(() => {
    // no-op, tick used to re-evaluate bookings via useMemo's closure by reading from localStorage inside the render
  }, [tick]);

  if (!userId) {
    return <div className="min-h-[60vh] flex items-center justify-center">Please sign in to view your bookings.</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">My Bookings</h2>
      <div className="mt-4 space-y-4">
        {bookings.length === 0 && <div className="text-muted-foreground">No bookings yet.</div>}
        {bookings.map((b) => {
          const expert = MOCK_EXPERTS.find((e) => e.id === b.expertId) || MOCK_EXPERTS.find((e) => e.userId === b.expertId);
          const onExpertApprove = () => { updateBookingStatus(b.id, 'approved'); setTick(t => t+1); toast({ title: 'Request approved', description: `You approved booking request ${b.id}. Client can now pay to confirm.` }); };
          const onExpertReject = () => { updateBookingStatus(b.id, 'cancelled'); setTick(t => t+1); toast({ title: 'Request rejected', description: `You rejected booking request ${b.id}.` }); };
          const onClientCancel = () => { cancelBooking(b.id); setTick(t => t+1); toast({ title: 'Booking cancelled', description: `Booking ${b.id} was cancelled.` }); };
          const onClientPay = () => { const updated = capturePayment(b.id, b.amount); setTick(t => t+1); toast({ title: 'Payment successful', description: `Booking confirmed. Meeting: ${updated?.meetingLink || 'N/A'}` }); };
          return (
            <div key={b.id} className="border rounded p-4 bg-background flex items-start justify-between">
              <div>
                <div className="font-medium">{b.service} {expert ? `— ${expert.name}` : ''}</div>
                <div className="text-sm text-muted-foreground">{new Date(b.dateTime).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground mt-2">Status: <span className="font-medium">{b.status}</span></div>
              </div>

              <div className="flex flex-col items-end gap-2">
                { /* Expert actions */ }
                {state.user?.role === 'expert' && state.user?.id === expert?.userId && b.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button onClick={onExpertApprove} size="sm">Approve</Button>
                    <Button variant="ghost" onClick={onExpertReject} size="sm">Reject</Button>
                  </div>
                )}

                { /* Client actions */ }
                {state.user?.role === 'client' && state.user?.id === b.clientId && (
                  <div className="flex flex-col items-end gap-2">
                    {b.status === 'approved' && (
                      <Button onClick={onClientPay} size="sm">Pay & Confirm</Button>
                    )}
                    {b.status === 'pending' && (
                      <Button variant="ghost" onClick={onClientCancel} size="sm">Cancel</Button>
                    )}
                  </div>
                )}

                <div className="text-sm text-muted-foreground">Amount: Rs. {b.amount}</div>
                {b.meetingLink && (
                  <a href={b.meetingLink} target="_blank" rel="noreferrer" className="text-xs text-primary underline">Join Meeting</a>
                )}
                {b.status === 'confirmed' && (
                  <div className="mt-2 flex gap-2">
                    <a href={getICalHref(b)} download={`booking-${b.id}.ics`} className="text-xs text-muted-foreground underline">Add to iCal</a>
                    <a href={getGoogleCalendarUrl(b)} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline">Add to Google Calendar</a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};


export default MyBookings;
