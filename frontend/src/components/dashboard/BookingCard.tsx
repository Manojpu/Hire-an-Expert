import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { format, isValid } from 'date-fns';
import { bookingService } from '@/services/bookingService';
import { toast } from '@/hooks/use-toast';

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
    status: 'pending' | 'confirmed' | 'joined' | 'completed' | 'cancelled';
    meetingLink?: string;
  };
  onStatusChange?: () => void; // Callback to refresh parent data
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onStatusChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  // Always use lowercase for status
  const [currentStatus, setCurrentStatus] = useState(booking.status.toLowerCase() as typeof booking.status);

  const formatDateTime = (dateTime: string | undefined) => {
    if (!dateTime) return 'No date specified';
    const date = new Date(dateTime);
    if (!isValid(date)) return 'Invalid date';
    return format(date, 'PPpp');
  };

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await bookingService.confirmBooking(booking.id);
      setCurrentStatus('confirmed'); // lowercase
      toast({
        title: "Booking Confirmed",
        description: "Meeting link has been generated successfully.",
      });
      onStatusChange?.(); // Notify parent to refresh
    } catch (error) {
      console.error('Error accepting booking:', error);
      toast({
        title: "Error",
        description: "Failed to confirm booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await bookingService.cancelBooking(booking.id);
      setCurrentStatus('cancelled'); // lowercase
      toast({
        title: "Booking Cancelled",
        description: "The booking has been cancelled.",
      });
      onStatusChange?.(); // Notify parent to refresh
    } catch (error) {
      console.error('Error rejecting booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    setIsLoading(true);
    try {
      // Update status to "joined" in backend (lowercase)
      await bookingService.joinBooking(booking.id);
      setCurrentStatus('joined');
      toast({
        title: "Joining Meeting",
        description: "Redirecting to meeting room...",
      });
      // Navigate to Agora meeting room
      window.location.href = `/meeting/${booking.id}`;
      onStatusChange?.(); // Notify parent to refresh
    } catch (error) {
      console.error('Error joining meeting:', error);
      toast({
        title: "Error",
        description: "Failed to join meeting. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleDone = async () => {
    setIsLoading(true);
    try {
      await bookingService.completeBooking(booking.id);
      setCurrentStatus('completed'); // lowercase
      toast({
        title: "Booking Completed",
        description: "Thank you! The booking has been marked as completed.",
      });
      onStatusChange?.(); // Notify parent to refresh
    } catch (error) {
      console.error('Error completing booking:', error);
      toast({
        title: "Error",
        description: "Failed to complete booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
          <div className="text-xs text-muted-foreground mt-1">
            Status: <span className="font-semibold capitalize">{currentStatus}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-sm text-muted-foreground">Rs. {booking.amount || booking.price}</div>
          <div className="flex gap-2">
            {/* PENDING: Show Accept/Reject buttons */}
            {currentStatus === 'pending' && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleReject}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Reject'}
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleAccept}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Accept'}
                </Button>
              </>
            )}
            
            {/* CONFIRMED: Show Join Meeting button */}
            {currentStatus === 'confirmed' && booking.meetingLink && (
              <Button 
                size="sm" 
                onClick={handleJoin}
                disabled={isLoading}
              >
                {isLoading ? 'Joining...' : 'Join Meeting'}
              </Button>
            )}
            
            {/* JOINED: Show Done button */}
            {currentStatus === 'joined' && (
              <Button 
                size="sm" 
                onClick={handleDone}
                disabled={isLoading}
                variant="default"
              >
                {isLoading ? 'Processing...' : 'Done'}
              </Button>
            )}
            
            {/* COMPLETED: Show completion message */}
            {currentStatus === 'completed' && (
              <div className="text-sm text-green-600 font-medium">
                ✓ Completed
              </div>
            )}
            
            {/* CANCELLED: Show cancellation message */}
            {currentStatus === 'cancelled' && (
              <div className="text-sm text-red-600 font-medium">
                ✗ Cancelled
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
