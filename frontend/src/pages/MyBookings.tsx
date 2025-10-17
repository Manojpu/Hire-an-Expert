import React, { useState, useEffect } from "react";
import { MOCK_EXPERTS } from "@/data/mockExperts";
import { useAuth } from "@/context/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getICalHref, getGoogleCalendarUrl } from "@/lib/calendar";
import { bookingService, Booking } from "@/services/bookingService";
import { reviewServiceAPI } from "@/services/reviewService";
import { toSriLankaTime } from "@/utils/dateUtils";
import { Loader2 } from "lucide-react";
import ReviewModal from "@/components/modals/ReviewModal";

const MyBookings = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [joinedBookings, setJoinedBookings] = useState<Set<string>>(new Set()); // Track which bookings have been joined
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [currentReviewBookingId, setCurrentReviewBookingId] = useState<string | null>(null);
  const [currentReviewGigId, setCurrentReviewGigId] = useState<string | null>(null);
  const [currentReviewExpertName, setCurrentReviewExpertName] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

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
      await bookingService.updateBooking(bookingId, { status });
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

  const handleJoinMeeting = (bookingId: string, meetingLink: string) => {
    // Mark this booking as joined
    setJoinedBookings(prev => new Set(prev).add(bookingId));
    // Open meeting link
    if (meetingLink) {
      window.open(meetingLink, '_blank');
    }
  };

  const handleCompleteBooking = async (bookingId: string, gigId: string, expertName: string) => {
    try {
      await bookingService.completeBooking(bookingId);
      // Refresh bookings after completion
      const updatedBookings = await bookingService.getUserBookings();
      setBookings(updatedBookings);
      // Remove from joined bookings
      setJoinedBookings(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });

      toast({
        title: "Booking completed",
        description: "Booking has been marked as completed",
      });

      // Open review modal after completing
      setCurrentReviewBookingId(bookingId);
      setCurrentReviewGigId(gigId);
      setCurrentReviewExpertName(expertName);
      setReviewModalOpen(true);
    } catch (err) {
      console.error(`Failed to complete booking:`, err);
      toast({
        title: "Update failed",
        description: "Failed to complete booking",
        variant: "destructive",
      });
    }
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!currentReviewBookingId || !currentReviewGigId) {
      toast({
        title: "Error",
        description: "Missing booking or gig information",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingReview(true);
    try {
      await reviewServiceAPI.submitReview(
        currentReviewBookingId,
        currentReviewGigId,
        rating,
        comment || undefined
      );

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });

      setReviewModalOpen(false);
      setCurrentReviewBookingId(null);
      setCurrentReviewGigId(null);
      setCurrentReviewExpertName("");
    } catch (err) {
      console.error("Failed to submit review:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to submit review. Please try again.";
      toast({
        title: "Submission failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReview(false);
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">My Bookings</h2>
        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          All times shown in Sri Lanka time (GMT+5:30)
        </div>
      </div>

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
                    {toSriLankaTime(booking.scheduled_time)} (Sri Lanka time)
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

                  {/* Join/Done button workflow */}
                  {booking.status === "confirmed" && !joinedBookings.has(String(booking.id)) && (
                    <Button
                      size="sm"
                      onClick={() => handleJoinMeeting(
                        String(booking.id),
                        `https://meet.mock/room-${String(booking.id).substring(0, 8)}`
                      )}
                    >
                      Join Meeting
                    </Button>
                  )}
                  
                  {booking.status === "confirmed" && joinedBookings.has(String(booking.id)) && (
                    <Button
                      size="sm"
                      onClick={() => handleCompleteBooking(
                        String(booking.id),
                        booking.gig_id,
                        expert?.name || gigDetails?.service_description || "Expert"
                      )}
                    >
                      Done
                    </Button>
                  )}

                  {/* Calendar integration with Sri Lanka time */}
                  {booking.status === "confirmed" && (
                    <div className="mt-2 flex gap-2">
                      <div className="dropdown">
                        <a
                          href="#"
                          className="text-xs text-muted-foreground underline"
                          onClick={(e) => {
                            e.preventDefault();

                            // Create calendar event based on scheduled time
                            const startTime = new Date(booking.scheduled_time);
                            // Assuming sessions last 1 hour
                            const endTime = new Date(
                              startTime.getTime() + 60 * 60 * 1000
                            );

                            // Format title and description
                            const title = `Booking - ${
                              gigDetails?.service_description?.substring(
                                0,
                                30
                              ) || "Expert Session"
                            }`;
                            const description = `Booking session for ${
                              gigDetails?.service_description ||
                              "Expert Service"
                            }.`;

                            // Create Google Calendar URL
                            const googleUrl = new URL(
                              "https://calendar.google.com/calendar/render"
                            );
                            googleUrl.searchParams.append("action", "TEMPLATE");
                            googleUrl.searchParams.append("text", title);
                            googleUrl.searchParams.append(
                              "details",
                              description
                            );
                            googleUrl.searchParams.append(
                              "dates",
                              `${
                                startTime
                                  .toISOString()
                                  .replace(/[-:]/g, "")
                                  .split(".")[0]
                              }Z/` +
                                `${
                                  endTime
                                    .toISOString()
                                    .replace(/[-:]/g, "")
                                    .split(".")[0]
                                }Z`
                            );

                            // Open in new window
                            window.open(googleUrl.toString(), "_blank");
                          }}
                        >
                          Add to Calendar
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setCurrentReviewBookingId(null);
          setCurrentReviewExpertName("");
        }}
        onSubmit={handleSubmitReview}
        bookingId={currentReviewBookingId || ""}
        expertName={currentReviewExpertName}
        isSubmitting={isSubmittingReview}
      />
    </div>
  );
};

export default MyBookings;
