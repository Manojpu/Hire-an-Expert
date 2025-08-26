import React from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const BookingCard: React.FC<any> = ({ booking, onAccept, onReject, onJoin }) => {
  return (
    <div className="bg-white border border-border rounded-lg p-4 shadow-sm">
      <div className="flex justify-between">
        <div>
          <div className="font-medium">{booking.client?.name || 'Client'}</div>
          <div className="text-sm text-muted-foreground">{booking.service}</div>
          <div className="text-sm text-muted-foreground">{format(new Date(booking.dateTime), 'PPpp')}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-sm text-muted-foreground">Rs. {booking.amount}</div>
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
