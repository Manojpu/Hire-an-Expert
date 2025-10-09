import React, { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  format,
  addMinutes,
  startOfDay,
  addDays,
  isBefore,
  isEqual,
  parseISO,
  isAfter,
} from "date-fns";
import { MOCK_EXPERTS } from "@/data/mockExperts";
import {
  isSlotBooked,
  addBooking,
  Booking,
  confirmBookingWithPayment,
} from "@/lib/bookings";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { MessageCircle, Heart } from "lucide-react";
import { useAuth } from "@/context/auth/AuthContext";

const SLOT_START_HOUR = 9;
const SLOT_END_HOUR = 18; // 6 PM
const SLOT_MINUTES = 30; // 30-minute increments

const Book = () => {
  const { expertId } = useParams();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlotIso, setSelectedSlotIso] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(60);
  const [type, setType] = useState<"online" | "physical">("online");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState<string | null>(null);
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);
  const { state } = useAuth();
  const navigate = useNavigate();

  const expert = useMemo(
    () => MOCK_EXPERTS.find((e) => e.id === expertId || e.slug === expertId),
    [expertId]
  );

  // next 7 days
  const days = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) =>
        addDays(startOfDay(new Date()), i)
      ),
    []
  );

  // generate slots for selected day using useMemo so hooks are always called before returns
  const daySlots = useMemo(() => {
    if (!selectedDate)
      return [] as { dt: Date; iso: string; past: boolean; booked: boolean }[];
    const slots: { dt: Date; iso: string; past: boolean; booked: boolean }[] =
      [];
    const now = new Date();
    for (let h = SLOT_START_HOUR; h < SLOT_END_HOUR; h++) {
      for (let m = 0; m < 60; m += SLOT_MINUTES) {
        const dt = addMinutes(startOfDay(selectedDate), h * 60 + m);
        const iso = dt.toISOString();
        const booked = expert ? isSlotBooked(expert.id, iso) : false;
        const past = isBefore(dt, now);
        slots.push({ dt, iso, past, booked });
      }
    }
    return slots;
  }, [selectedDate, expert]);

  if (!expert)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        Expert not found
      </div>
    );

  const handleSelectSlot = (
    iso: string,
    slotObj: { dt: Date; booked: boolean; past: boolean }
  ) => {
    if (slotObj.booked || slotObj.past) return;
    setSelectedSlotIso(iso);
  };

  const platformFeePercent = 0.05;
  const baseRate = expert.pricing?.hourlyRate || 0;
  const durationHours = duration / 60;
  const subtotal = baseRate * durationHours;
  const platformFee = Math.round(subtotal * platformFeePercent);
  const total = Math.round(subtotal + platformFee);

  const handleBook = () => {
    if (!selectedSlotIso) {
      toast({
        title: "Select a time slot",
        description: "Please choose an available time slot before requesting.",
      });
      return;
    }
    if (!description.trim()) {
      toast({
        title: "Describe the consultation",
        description: "Please add a short description of your consultation.",
      });
      return;
    }
    if (!state.user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to request a booking.",
      });
      return;
    }

    // create a pending booking request (expert must approve before payment)
    const booking = addBooking({
      clientId: state.user.id,
      expertId: expert.id,
      service: "Consultation",
      dateTime: selectedSlotIso,
      duration,
      type,
      amount: total,
      description,
      status: "pending",
    });
    setPendingBooking(booking);
    toast({
      title: "Request sent",
      description:
        "Your booking request was sent to the expert. You can pay once the expert approves.",
    });
    navigate("/my-bookings");
  };

  const saveForLater = () => {
    if (!selectedSlotIso) {
      toast({
        title: "Select a time slot",
        description: "Please choose a time slot before saving.",
      });
      return;
    }

    const key = "consultify_wishlist_v1";
    try {
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      list.push({
        expertId: expert.id,
        date: selectedDate.toISOString(),
        slot: selectedSlotIso,
      });
      localStorage.setItem(key, JSON.stringify(list));
      toast({
        title: "Saved",
        description: "This booking was saved for later.",
      });
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      toast({
        title: "Error",
        description: "Unable to save for later. Please try again.",
      });
    }
  };

  const handleShare = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          toast({
            title: "Link copied",
            description: "The link has been copied to your clipboard.",
          });
        })
        .catch(() => {
          toast({
            title: "Unable to copy",
            description: "Please copy the URL manually.",
          });
        });
    } else {
      toast({
        title: "Unable to copy",
        description: "Please copy the URL manually.",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 container w-11/12 py-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-start justify-between bg-background/60 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-lg">
          <div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Book Consultation with {expert.name}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <span className="text-sm font-medium">{expert.title}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{expert.rating}</span>
                <span className="text-yellow-400">★</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleShare}
              className="bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background/90"
            >
              Share
            </Button>
            <Link
              to={`/expert/${expert.slug}`}
              className="text-sm text-primary font-medium hover:text-primary/80 transition-colors"
            >
              View Profile →
            </Link>
          </div>
        </div>

        <div className="bg-background/60 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-background/80 to-background/40">
            <div className="flex gap-6 items-center">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                <img
                  src={expert.profileImage}
                  alt={expert.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold">{expert.name}</div>
                <div className="text-sm text-muted-foreground/90">
                  {expert.title}
                </div>
                <div className="mt-3 text-sm font-medium text-primary/90">
                  Select a date and available time slot below
                </div>
              </div>
              <div className="w-48">
                <div className="text-sm font-medium text-foreground/90 mb-1.5">
                  Duration
                </div>
                <select
                  className="w-full px-4 py-2.5 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>

                <div className="text-sm font-medium text-foreground/90 mb-1.5 mt-4">
                  Language
                </div>
                <select
                  className="w-full px-4 py-2.5 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  value={language || ""}
                  onChange={(e) => setLanguage(e.target.value || null)}
                >
                  <option value="">Preferred language</option>
                  {expert.languages?.map((l: string) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex gap-3 pb-4 overflow-auto scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
                {days.map((d) => (
                  <button
                    key={d.toISOString()}
                    onClick={() => {
                      setSelectedDate(d);
                      setSelectedSlotIso(null);
                    }}
                    className={`px-5 py-4 rounded-xl min-w-[100px] text-left transition-all ${
                      d.toDateString() === selectedDate.toDateString()
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                        : "bg-background/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:bg-background"
                    }`}
                  >
                    <div className="text-sm font-semibold">
                      {format(d, "EEE")}
                    </div>
                    <div className="text-xs opacity-80 mt-0.5">
                      {format(d, "dd MMM")}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-4 gap-3">
                {daySlots.map((s) => {
                  const disabled = s.booked || s.past;
                  const selected = selectedSlotIso === s.iso;
                  const className = `px-4 py-3 rounded-xl text-sm text-center transition-all ${
                    s.booked
                      ? "bg-red-50/50 backdrop-blur-sm text-red-600 border border-red-200 cursor-not-allowed"
                      : s.past
                      ? "bg-gray-50/50 backdrop-blur-sm text-muted-foreground/50 border border-gray-100 cursor-not-allowed"
                      : selected
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                      : "bg-background/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:bg-background"
                  }`;
                  return (
                    <button
                      key={s.iso}
                      disabled={disabled}
                      onClick={() => handleSelectSlot(s.iso, s)}
                      className={className}
                    >
                      {format(s.dt, "hh:mm a")}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8">
                <label className="text-sm font-medium text-foreground/90">
                  Meeting Type
                </label>
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() => setType("online")}
                    className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                      type === "online"
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "bg-background/80 backdrop-blur-sm border border-border/50 hover:border-primary/30"
                    }`}
                  >
                    Online
                  </button>
                  <button
                    onClick={() => setType("physical")}
                    className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                      type === "physical"
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "bg-background/80 backdrop-blur-sm border border-border/50 hover:border-primary/30"
                    }`}
                  >
                    Physical
                  </button>
                </div>
              </div>

              <div className="mt-8">
                <label className="text-sm font-medium text-foreground/90">
                  Consultation Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-3 p-4 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all h-32 resize-none"
                  placeholder="Briefly describe your goals for this session..."
                />
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleBook}
                    className="px-8 py-6 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  >
                    Request Booking
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={saveForLater}
                    className="px-6 py-6 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                  >
                    <Heart className="w-4 h-4 mr-2" /> Save for Later
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside className="space-y-6">
        <div className="sticky top-24 bg-background/60 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg overflow-hidden">
          <div className="p-6 bg-gradient-to-b from-background/80 to-background/40">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                <img
                  src={expert.profileImage}
                  alt={expert.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="font-semibold text-lg">{expert.name}</div>
                <div className="text-sm text-muted-foreground/90">
                  {expert.title}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-xl bg-background/80 backdrop-blur-sm border border-border/30">
                <div className="text-sm font-medium text-foreground/90">
                  Base rate
                </div>
                <div className="text-xl font-bold text-primary mt-1">
                  {expert.pricing.currency} {baseRate}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-background/80 backdrop-blur-sm border border-border/30">
                <div className="text-sm font-medium text-foreground/90">
                  Duration
                </div>
                <div className="font-medium mt-1">{duration} minutes</div>
              </div>

              <div className="p-4 rounded-xl bg-background/80 backdrop-blur-sm border border-border/30">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-foreground/90">
                      Subtotal
                    </div>
                    <div className="font-medium mt-1">Rs. {subtotal}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Platform fee (5%)
                    </div>
                    <div className="font-medium">Rs. {platformFee}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-background border border-primary/20">
                <div className="text-sm font-medium text-foreground/90">
                  Total Amount
                </div>
                <div className="text-3xl font-bold text-primary mt-1">
                  Rs. {total}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-background/60 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="font-medium text-foreground/90">
              Cancellation Policy
            </div>
            <div className="text-sm text-muted-foreground/90 mt-2 leading-relaxed">
              Free cancellation up to 24 hours before the session. A full refund
              will be provided for cancellations made within this period.
            </div>
          </div>
        </div>
      </aside>

      {/* Fixed positioning for chat button */}
      <Link
        to={`/chat/${expert.userId}`}
        className="fixed right-8 bottom-8 z-50"
      >
        <Button className="rounded-full p-4 shadow-lg bg-primary hover:bg-primary/90 transition-all">
          <MessageCircle className="w-5 h-5" />
        </Button>
      </Link>

      {/* Payment flow happens from My Bookings after expert approves; keep modal available elsewhere if needed */}
    </div>
  );
};

export default Book;
