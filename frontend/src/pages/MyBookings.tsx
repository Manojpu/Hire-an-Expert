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
        console.log("Bookings with meeting_link:", userBookings.filter(b => b.meeting_link));
        console.log("Confirmed bookings:", userBookings.filter(b => b.status === 'confirmed'));
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

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      // Call the confirm endpoint which generates meeting link
      await bookingService.confirmBooking(bookingId);
      // Refresh bookings after confirmation
      const updatedBookings = await bookingService.getUserBookings();
      setBookings(updatedBookings);

      toast({
        title: "Booking confirmed",
        description: "Meeting link has been generated. The client can now join.",
      });
    } catch (err) {
      console.error(`Failed to confirm booking:`, err);
      toast({
        title: "Confirmation failed",
        description: "Failed to confirm booking and generate meeting link",
        variant: "destructive",
      });
    }
  };

  const handleJoinMeeting = (bookingId: string) => {
    // Mark this booking as joined
    setJoinedBookings(prev => new Set(prev).add(bookingId));
    // Navigate to Agora meeting room
    window.location.href = `/meeting/${bookingId}`;
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
            const expertId = booking.gig_id;
            const expert = MOCK_EXPERTS.find((e) => e.id === expertId);
            const gigDetails = booking.gig_details || {};
            const onExpertApprove = () => handleConfirmBooking(String(booking.id));
            const onExpertReject = () => handleUpdateStatus(String(booking.id), "cancelled");
            const onClientCancel = () => handleUpdateStatus(String(booking.id), "cancelled");
            return (
              <div key={booking.id} className="border rounded p-4 bg-background flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">
                    {gigDetails.service_description
                      ? gigDetails.service_description.substring(0, 50) + (gigDetails.service_description.length > 50 ? "..." : "")
                      : expert
                      ? `Booking for Gig — ${expert.name}`
                      : `Booking for Gig ID: ${booking.gig_id.substring(0, 8)}`}
                  </div>
                  {gigDetails.hourly_rate && (
                    <div className="text-sm font-medium text-primary-600">
                      {gigDetails.hourly_rate} {gigDetails.currency}/hour
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground mt-1">
                    {toSriLankaTime(booking.scheduled_time)} (Sri Lanka time)
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Status: <span className="font-medium">{booking.status}</span>
                  </div>
                </div>
                {gigDetails.thumbnail_url && (
                  <div className="flex-shrink-0 ml-4 mr-4">
                    <img
                      src={gigDetails.thumbnail_url}
                      alt="Gig thumbnail"
                      className="w-16 h-16 object-cover rounded"
                    />
                  </div>
                )}
                <div className="flex flex-col items-end gap-2">
                  {user?.role === "expert" && user?.id === expert?.userId && booking.status === "pending" && (
                    <div className="flex gap-2">
                      <Button onClick={onExpertApprove} size="sm">Approve</Button>
                      <Button variant="ghost" onClick={onExpertReject} size="sm">Reject</Button>
                    </div>
                  )}
                  {user?.role === "client" && booking.user_id === userId && booking.status === "pending" && (
                    <div className="flex flex-col items-end gap-2">
                      <Button variant="ghost" onClick={onClientCancel} size="sm">Cancel</Button>
                    </div>
                  )}
                  {/* Show Join Meeting button when booking is confirmed and has meeting link */}
                  {booking.status === "confirmed" && booking.meeting_link && !joinedBookings.has(String(booking.id)) && (
                    <div className="flex flex-col items-end gap-2">
                      <Button size="sm" onClick={() => handleJoinMeeting(String(booking.id))}>
                        Join Meeting
                      </Button>
                      <a
                        href="#"
                        className="text-xs text-muted-foreground underline"
                        onClick={(e) => {
                          e.preventDefault();
                          const startTime = new Date(booking.scheduled_time);
                          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
                          const title = `Booking - ${gigDetails.service_description ? gigDetails.service_description.substring(0, 30) : "Expert Session"}`;
                          const description = `Booking session for ${gigDetails.service_description || "Expert Service"}.`;
                          const googleUrl = new URL("https://calendar.google.com/calendar/render");
                          googleUrl.searchParams.append("action", "TEMPLATE");
                          googleUrl.searchParams.append("text", title);
                          googleUrl.searchParams.append("details", description);
                          googleUrl.searchParams.append("dates",
                            `${startTime.toISOString().replace(/[-:]/g, "").split(".")[0]}Z/` +
                            `${endTime.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`
                          );
                          window.open(googleUrl.toString(), "_blank");
                        }}
                      >Add to Calendar</a>
                    </div>
                  )}
                  
                  {/* Show Done button after user has joined the meeting */}
                  {booking.status === "confirmed" && booking.meeting_link && joinedBookings.has(String(booking.id)) && (
                    <Button size="sm" onClick={() => handleCompleteBooking(
                      String(booking.id),
                      booking.gig_id,
                      expert?.name || gigDetails.service_description || "Expert"
                    )}>Done</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
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