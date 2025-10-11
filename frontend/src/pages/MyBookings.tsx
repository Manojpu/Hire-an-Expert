import React, { useState, useEffect } from "react";
import { MOCK_EXPERTS } from "@/data/mockExperts";
import { useAuth } from "@/context/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getICalHref, getGoogleCalendarUrl } from "@/lib/calendar";
import { bookingService, Booking } from "@/services/bookingService";
import { Loader2 } from "lucide-react";

const MyBookings = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch bookings from API when component mounts or userId changes
  useEffect(() => {
    async function fetchUserBookings() {
      if (!userId) {
        setBookings([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        const userBookings = await bookingService.getUserBookings();
        console.log("Fetched bookings:", userBookings); // Debug log
        setBookings(userBookings || []);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError(
          "Failed to load your bookings. Please ensure you are logged in."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchUserBookings();
  }, [userId]);

  // Modified action handlers for the API
  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      await bookingService.updateBookingStatus(bookingId, status);
      // Refresh bookings after update
      const updatedBookings = await bookingService.getUserBookings();
      setBookings(updatedBookings);

      toast({
        title: `Booking ${status}`,
        description: `Booking has been ${status}`,
      });
    } catch (err) {
      console.error(`Failed to update booking status:`, err);
      toast({
        title: "Update failed",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    }
  };

  if (!userId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="text-xl font-semibold mb-4">
          Authentication Required
        </div>
        <div className="text-muted-foreground">
          Please sign in to view your bookings.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">My Bookings</h2>

      {loading && (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mr-2" />
          <p>Loading your bookings...</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="mt-4 space-y-4">
          {bookings.length === 0 && (
            <div className="text-muted-foreground">No bookings yet.</div>
          )}

          {bookings.map((booking) => {
            // Get expert info from mock data for backward compatibility
            const expertId = booking.gig_id;
            const expert = MOCK_EXPERTS.find((e) => e.id === expertId);

            // Get gig details from the API response
            const gigDetails = booking.gig_details;

            // Action handlers
            const onExpertApprove = () =>
              handleUpdateStatus(booking.id, "confirmed");
            const onExpertReject = () =>
              handleUpdateStatus(booking.id, "cancelled");
            const onClientCancel = () =>
              handleUpdateStatus(booking.id, "cancelled");
            return (
              <div
                key={booking.id}
                className="border rounded p-4 bg-background flex items-start justify-between"
              >
                <div className="flex-1">
                  {/* Display service description if available */}
                  <div className="font-medium">
                    {gigDetails?.service_description
                      ? gigDetails.service_description.substring(0, 50) +
                        (gigDetails.service_description.length > 50
                          ? "..."
                          : "")
                      : expert
                      ? `Booking for Gig — ${expert.name}`
                      : `Booking for Gig ID: ${booking.gig_id.substring(0, 8)}`}
                  </div>

                  {/* Display rate if available */}
                  {gigDetails && (
                    <div className="text-sm font-medium text-primary-600">
                      {gigDetails.hourly_rate} {gigDetails.currency}/hour
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground mt-1">
                    {new Date(booking.scheduled_time).toLocaleString()}
                  </div>

                  <div className="text-sm text-muted-foreground mt-2">
                    Status:{" "}
                    <span className="font-medium">{booking.status}</span>
                  </div>
                </div>

                {/* Display thumbnail if available */}
                {gigDetails?.thumbnail_url && (
                  <div className="flex-shrink-0 ml-4 mr-4">
                    <img
                      src={gigDetails.thumbnail_url}
                      alt="Gig thumbnail"
                      className="w-16 h-16 object-cover rounded"
                    />
                  </div>
                )}

                <div className="flex flex-col items-end gap-2">
                  {/* Expert actions */}
                  {user?.role === "expert" &&
                    user?.id === expert?.userId &&
                    booking.status === "pending" && (
                      <div className="flex gap-2">
                        <Button onClick={onExpertApprove} size="sm">
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={onExpertReject}
                          size="sm"
                        >
                          Reject
                        </Button>
                      </div>
                    )}

                  {/* Client actions */}
                  {user?.role === "client" &&
                    booking.user_id === userId &&
                    booking.status === "pending" && (
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          variant="ghost"
                          onClick={onClientCancel}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                  {/* We don't have amount in the API response, but if you add it, uncomment this
                <div className="text-sm text-muted-foreground">
                  Amount: Rs. {booking.amount || "N/A"}
                </div> 
                */}

                  {/* Link would come from your database if you implement it */}
                  {booking.status === "confirmed" && (
                    <a
                      href={`https://meet.mock/room-${booking.id.substring(
                        0,
                        8
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline"
                    >
                      Join Meeting
                    </a>
                  )}

                  {/* Calendar links would need to be updated for the new booking format */}
                  {booking.status === "confirmed" && (
                    <div className="mt-2 flex gap-2">
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          toast({
                            title: "Calendar export",
                            description: "This feature will be available soon!",
                          });
                        }}
                        className="text-xs text-muted-foreground underline"
                      >
                        Add to Calendar
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
