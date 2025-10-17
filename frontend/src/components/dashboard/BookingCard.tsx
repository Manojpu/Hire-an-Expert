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
  onComplete?: (id: string) => void;
  isLoading?: boolean;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onAccept, onReject, onJoin, onComplete, isLoading }) => {
  const [hasJoined, setHasJoined] = React.useState(false);

  const formatDateTime = (dateTime: string | undefined) => {
    if (!dateTime) return 'No date specified';
    const date = new Date(dateTime);
    if (!isValid(date)) return 'Invalid date';
    return format(date, 'PPpp');
  };

  const handleJoin = (link: string | undefined) => {
    setHasJoined(true);
    onJoin?.(link);
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onReject?.(booking.id)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Reject'}
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => onAccept?.(booking.id)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Accept'}
                </Button>
              </>
            )}
            {booking.status === 'confirmed' && !hasJoined && (
              <Button size="sm" onClick={() => handleJoin(booking.meetingLink)}>
                Join
              </Button>
            )}
            {booking.status === 'confirmed' && hasJoined && (
              <Button 
                size="sm" 
                onClick={() => onComplete?.(booking.id)}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Done'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
