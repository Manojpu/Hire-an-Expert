import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth/AuthContext.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import * as z from "zod";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  CreditCard,
  Clock,
  CheckCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

// Import Stripe components
import StripeProvider from "@/components/payment/StripeProvider";
import PaymentForm from "@/components/payment/PaymentForm";
import { paymentService } from "@/services/paymentService";

// Define the form schema
const formSchema = z.object({
  date: z.date({
    required_error: "Please select a date for your consultation",
  }),
  timeSlot: z.string({
    required_error: "Please select a time slot",
  }),
});

type AvailabilityRule = {
  id: string;
  day_of_week: number; // 0 is Sunday, 1 is Monday, etc.
  start_time_utc: string;
  end_time_utc: string;
};

type TimeSlot = {
  id: string;
  startTime: string; // Format: "09:00"
  endTime: string; // Format: "10:00"
  label: string; // Format: "9:00 AM - 10:00 AM"
};

const BookConsultation = () => {
  const { id: gigId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [gig, setGig] = useState<any>(null);
  const [expertId, setExpertId] = useState<string | null>(null);
  const [availabilityRules, setAvailabilityRules] = useState<
    AvailabilityRule[]
  >([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  // Stripe payment states
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  // Fetch gig details when component loads
  useEffect(() => {
    const fetchGigDetails = async () => {
      try {
        setLoading(true);
        if (!gigId) {
          setBookingError("No gig ID provided");
          return;
        }

        // Try to fetch using API
        const apiUrl = `http://localhost:8000/api/gigs/${gigId}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }

        const gigData = await response.json();
        setGig(gigData);
        setExpertId(gigData.expert_id);
        setBookingError("");
      } catch (err) {
        console.error("Error fetching gig:", err);
        setBookingError(
          "Failed to load service details. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    if (gigId) {
      fetchGigDetails();
    }
  }, [gigId]);

  // Fetch expert availability when expert ID is available
  useEffect(() => {
    const fetchExpertAvailability = async () => {
      if (!expertId) return;

      try {
        const response = await fetch(
          `http://localhost:8000/api/users/${expertId}/availability-rules`
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch availability rules: ${response.status}`
          );
        }

        const rules = await response.json();
        setAvailabilityRules(rules);
      } catch (err) {
        console.error("Error fetching expert availability:", err);
        toast.error(
          "Failed to load expert availability. Please try again later."
        );
      }
    };

    fetchExpertAvailability();
  }, [expertId]);

  // Fetch booked slots when date changes
  const fetchBookedSlots = async (date: Date) => {
    if (!gigId) return;

    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const response = await fetch(
        `http://localhost:8000/api/bookings/gigs/${gigId}/available-slots?date=${formattedDate}`,
        {
          headers: {
            Authorization: `Bearer ${await user?.getIdToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch booked slots: ${response.status}`);
      }

      const bookedTimes = await response.json();
      setBookedSlots(bookedTimes);
    } catch (err) {
      console.error("Error fetching booked slots:", err);
      toast.error(
        "Failed to check slot availability. Some slots may not be available."
      );
    }
  };

  // When date changes, fetch booked slots
  useEffect(() => {
    const selectedDate = form.watch("date");
    if (selectedDate) {
      fetchBookedSlots(selectedDate);
    }
  }, [form.watch("date"), gigId, user]);

  // Generate time slots when date changes or booked slots update
  useEffect(() => {
    const selectedDate = form.watch("date");
    if (!selectedDate || !availabilityRules.length) return;

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = selectedDate.getDay();

    // Find rules for the selected day
    const rulesForDay = availabilityRules.filter(
      (rule) => rule.day_of_week === dayOfWeek
    );

    // Generate time slots based on rules (1-hour increments)
    const slots: TimeSlot[] = [];

    rulesForDay.forEach((rule) => {
      const startHour = parseInt(rule.start_time_utc.split(":")[0]);
      const endHour = parseInt(rule.end_time_utc.split(":")[0]);

      for (let hour = startHour; hour < endHour; hour++) {
        const startTime = `${hour.toString().padStart(2, "0")}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, "0")}:00`;

        // Create ISO datetime string for this slot to check against booked slots
        const bookingDate = format(selectedDate, "yyyy-MM-dd");
        const slotTimeIso = `${bookingDate}T${startTime}:00Z`;

        // Skip this slot if it's already booked
        if (
          bookedSlots.some((bookedTime) => {
            const bookedDateTime = new Date(bookedTime);
            const slotDateTime = new Date(slotTimeIso);
            return bookedDateTime.getTime() === slotDateTime.getTime();
          })
        ) {
          continue;
        }

        // Format for display (e.g., "9:00 AM - 10:00 AM")
        const startDisplay =
          hour <= 12
            ? `${hour === 0 ? 12 : hour}:00 ${hour < 12 ? "AM" : "PM"}`
            : `${hour - 12}:00 PM`;

        const endDisplay =
          hour + 1 <= 12
            ? `${hour + 1 === 0 ? 12 : hour + 1}:00 ${
                hour + 1 < 12 ? "AM" : "PM"
              }`
            : `${hour + 1 - 12}:00 PM`;

        slots.push({
          id: `${rule.id}-${hour}`,
          startTime,
          endTime,
          label: `${startDisplay} - ${endDisplay}`,
        });
      }
    });

    setAvailableTimeSlots(slots);
  }, [form.watch("date"), availabilityRules, bookedSlots]);

  // Initialize the payment intent when moving to payment step
  const initializePayment = async (bookingId: string) => {
    setPaymentLoading(true);
    try {
      // Create a payment intent with our backend
      const paymentData = {
        booking_id: bookingId,
        amount: gig.hourly_rate,
        gig_title: gig.title || gig.service_description,
        customer_email: user?.email,
        metadata: {
          booking_id: bookingId,
          gig_id: gigId,
          expert_id: expertId || "",
        },
      };

      const { clientSecret: secret } = await paymentService.createPaymentIntent(
        paymentData
      );
      setClientSecret(secret);
    } catch (error) {
      console.error("Error initializing payment:", error);
      toast.error("Failed to initialize payment. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      const paymentStatus = await paymentService.getPaymentStatus(
        paymentIntentId
      );

      switch (paymentStatus.status) {
        case "succeeded":
          setBookingComplete(true);
          toast.success("Payment successful! Your consultation is confirmed.");
          // Don't navigate away automatically
          break;

        case "processing":
          toast.info("Your payment is being processed. Please wait a moment.");
          // Don't navigate away, stay on the payment page
          break;

        case "requires_action":
        case "requires_confirmation":
          // Handle additional actions (like 3D Secure)
          if (paymentStatus.next_action?.redirect_to_url?.url) {
            // We still need to redirect for 3D Secure authentication
            window.location.href =
              paymentStatus.next_action.redirect_to_url.url;
          } else {
            toast.info("Additional verification may be required.");
            // Stay on the current page
          }
          break;

        default:
          toast.info(`Payment status: ${paymentStatus.status}`);
        // Stay on the current page
      }
    } catch (error) {
      console.error("Error handling payment success:", error);
      toast.error(
        "There was an issue confirming your payment. Please check your booking status."
      );
      // Stay on the current page instead of navigating away
    }
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    toast.error(`Payment error: ${error}`);
    // No navigation - stay on the payment page
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!user) {
        toast.error("You must be logged in to book a consultation");
        navigate("/login");
        return;
      }

      // Move to payment step
      if (bookingStep === 1) {
        setPaymentLoading(true);
        setBookingStep(2);

        // Create booking
        const selectedSlot = availableTimeSlots.find(
          (slot) => slot.id === values.timeSlot
        );
        if (!selectedSlot) {
          throw new Error("Invalid time slot selected");
        }

        // Format date and time for booking
        const bookingDate = format(values.date, "yyyy-MM-dd");
        const scheduledTime = `${bookingDate}T${selectedSlot.startTime}:00Z`;

        const bookingPayload = {
          gig_id: gigId,
          scheduled_time: scheduledTime,
        };

        // Get a fresh token directly from the user object
        let idToken = "";
        if (user && user.getIdToken) {
          idToken = await user.getIdToken();
        } else {
          throw new Error("Unable to get authentication token");
        }

        // Submit booking to API
        const response = await fetch("http://localhost:8000/api/bookings/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(bookingPayload),
        });

        if (!response.ok) {
          const errorData = await response.json();

          // Special handling for the case where the slot is already booked
          if (
            response.status === 400 &&
            errorData.detail?.includes("already booked")
          ) {
            toast.error(
              "This time slot has just been booked by someone else. Please select another time."
            );

            // Go back to step 1 and refresh available slots
            setBookingStep(1);
            setPaymentLoading(false);
            fetchBookedSlots(values.date);
            return;
          }

          throw new Error(errorData.detail || "Failed to create booking");
        }
        const bookingResult = await response.json();
        setBookingId(bookingResult.id);

        // Initialize payment intent
        await initializePayment(bookingResult.id);

        return;
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error(error.message || "Failed to book consultation");
      setBookingError(error.message || "Failed to book consultation");
      setPaymentLoading(false);
      setBookingStep(1);
    }
  };

  if (loading) {
    return (
      <div className="container py-12 flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (bookingError || !gig) {
    return (
      <div className="container py-12 flex items-center justify-center min-h-[70vh]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Service Not Found</h2>
          <p className="text-muted-foreground mb-6">
            {bookingError ||
              "The service you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  // We no longer need the separate success page rendering
  // The success state is now handled inline within the payment step

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Book Consultation</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main booking form */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">
                {bookingStep === 1 ? "Select Date and Time" : "Payment Details"}
              </CardTitle>
              <CardDescription>
                {bookingStep === 1
                  ? "Choose when you'd like to schedule your consultation"
                  : "Complete your booking by providing payment information"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {bookingStep === 1 ? (
                    <>
                      {/* Date Selection */}
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => {
                                    // Disable dates in the past
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);

                                    // Also disable dates where the expert has no availability
                                    const dayOfWeek = date.getDay();
                                    const hasAvailability =
                                      availabilityRules.some(
                                        (rule) => rule.day_of_week === dayOfWeek
                                      );

                                    return date < today || !hasAvailability;
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Time Slots */}
                      {form.watch("date") && (
                        <FormField
                          control={form.control}
                          name="timeSlot"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Available Time Slots</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="grid grid-cols-2 md:grid-cols-3 gap-3"
                                >
                                  {availableTimeSlots.length > 0 ? (
                                    availableTimeSlots.map((slot) => (
                                      <div key={slot.id}>
                                        <RadioGroupItem
                                          value={slot.id}
                                          id={slot.id}
                                          className="peer sr-only"
                                        />
                                        <label
                                          htmlFor={slot.id}
                                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                        >
                                          <Clock className="mb-2 h-4 w-4" />
                                          <span className="text-sm font-medium">
                                            {slot.label}
                                          </span>
                                        </label>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="col-span-full p-4 border rounded-md text-center text-muted-foreground">
                                      No available time slots for this date.
                                    </div>
                                  )}
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      {/* Payment Form with Stripe */}
                      <div className="space-y-4">
                        {bookingComplete ? (
                          <div className="rounded-md bg-green-50 p-6 text-green-800 dark:bg-green-900/20 dark:text-green-500 text-center">
                            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600 dark:text-green-400" />
                            <h3 className="text-lg font-medium mb-2">
                              Booking Successful!
                            </h3>
                            <p className="mb-4">
                              Your consultation has been booked and payment
                              processed successfully.
                            </p>
                            <Button
                              onClick={() => navigate("/my-bookings")}
                              className="mx-auto"
                            >
                              View My Bookings
                            </Button>
                          </div>
                        ) : paymentLoading ? (
                          <div className="flex flex-col items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                            <p>Preparing payment form...</p>
                          </div>
                        ) : clientSecret ? (
                          <StripeProvider options={{ clientSecret }}>
                            <PaymentForm
                              onPaymentSuccess={handlePaymentSuccess}
                              onPaymentError={handlePaymentError}
                              amount={gig.hourly_rate}
                              currency="LKR"
                            />
                          </StripeProvider>
                        ) : (
                          <div className="rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-500">
                            <p>
                              Failed to initialize payment. Please try again.
                            </p>
                            <Button
                              variant="outline"
                              className="mt-2"
                              onClick={() =>
                                bookingId && initializePayment(bookingId)
                              }
                            >
                              Retry
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="flex justify-between pt-4">
                    {bookingStep === 2 && !bookingComplete && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setBookingStep(1)}
                      >
                        Back
                      </Button>
                    )}
                    {!bookingComplete && bookingStep === 1 && (
                      <Button
                        type="submit"
                        className="ml-auto"
                        disabled={
                          !form.watch("date") || !form.watch("timeSlot")
                        }
                      >
                        Proceed to Payment
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-xl">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">Service</h4>
                <p className="text-muted-foreground">
                  {gig.title || gig.service_description}
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium">Price</h4>
                <div className="flex justify-between items-center">
                  <span>Hourly Rate</span>
                  <span>${gig.hourly_rate}</span>
                </div>
              </div>

              {form.watch("date") && form.watch("timeSlot") && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium">Selected Slot</h4>
                    <p className="text-muted-foreground">
                      {format(form.watch("date"), "PPPP")}
                      <br />
                      {
                        availableTimeSlots.find(
                          (slot) => slot.id === form.watch("timeSlot")
                        )?.label
                      }
                    </p>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col border-t pt-4">
              <div className="flex justify-between w-full mb-2">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">${gig.hourly_rate}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                You'll be charged immediately when you confirm this booking.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookConsultation;
