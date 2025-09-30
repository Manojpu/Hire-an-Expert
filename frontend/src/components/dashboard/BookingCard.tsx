import React from 'react';
import { Button } from '@/components/ui/button';
import { format, isValid } from 'date-fns';

interface BookingCardProps {
  booking: {
    id: string;
    client?: { name: string };
    clientName?: string;
    service?: string;
    type?: string;
    dateTime?: string;
    time?: string;
    amount?: number;
    price?: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    meetingLink?: string;
  };
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onJoin?: (link: string) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onAccept, onReject, onJoin }) => {
  const formatDateTime = (dateTime: string | undefined) => {
    if (!dateTime) return 'No date specified';
    const date = new Date(dateTime);
    if (!isValid(date)) return 'Invalid date';
    return format(date, 'PPpp');
  };

  return (
    <div className="bg-white border border-border rounded-lg p-4 shadow-sm">
      <div className="flex justify-between">
        <div>
          <div className="font-medium">{booking.client?.name || booking.clientName || 'Client'}</div>
          <div className="text-sm text-muted-foreground">{booking.service || booking.type}</div>
          <div className="text-sm text-muted-foreground">
            {booking.dateTime ? formatDateTime(booking.dateTime) : (booking.time || 'Time not specified')}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-sm text-muted-foreground">Rs. {booking.amount || booking.price}</div>
          <div className="flex gap-2">
            {booking.status === 'pending' && (
              <>
                <Button variant="ghost" size="sm" onClick={() => onReject?.(booking.id)}>Reject</Button>
                <Button size="sm" onClick={() => onAccept?.(booking.id)}>Accept</Button>
              </>
            )}
            {booking.status === 'confirmed' && (
              <Button size="sm" onClick={() => onJoin?.(booking.meetingLink)}>Join</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
