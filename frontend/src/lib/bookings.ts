// Replaced external uuid dependency with a lightweight fallback ID generator
function generateId() {
  // base36 timestamp + random suffix for short unique ids in dev
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

export type Booking = {
  id: string;
  clientId?: string | null;
  expertId: string;
  service: string;
  dateTime: string; // ISO
  duration: number; // minutes
  type: 'online' | 'physical';
  status: 'pending' | 'approved' | 'confirmed' | 'completed' | 'cancelled';
  amount: number;
  description?: string;
  meetingLink?: string;
  notes?: string;
};

const STORAGE_KEY = 'consultify_bookings_v1';

export function getBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Booking[];
  } catch (e) {
    console.error('Failed to read bookings from localStorage', e);
    return [];
  }
}

export function saveBookings(bookings: Booking[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch (e) {
    console.error('Failed to save bookings to localStorage', e);
  }
}

export function addBooking(b: Omit<Booking, 'id' | 'status'> & { status?: Booking['status'] }) {
  const bookings = getBookings();
  const booking: Booking = {
    id: generateId(),
    status: b.status || 'pending',
    ...b,
  } as Booking;
  bookings.push(booking);
  saveBookings(bookings);
  return booking;
}

export function isSlotBooked(expertId: string, isoDateTime: string) {
  const bookings = getBookings();
  return bookings.some((b) => b.expertId === expertId && b.dateTime === isoDateTime && b.status !== 'cancelled');
}

export function updateBookingStatus(bookingId: string, status: Booking['status']) {
  const bookings = getBookings();
  const idx = bookings.findIndex((b) => b.id === bookingId);
  if (idx === -1) return null;
  bookings[idx].status = status;
  saveBookings(bookings);
  return bookings[idx];
}

export function cancelBooking(bookingId: string) {
  return updateBookingStatus(bookingId, 'cancelled');
}

export function getBookingsForUser(userId: string) {
  const bookings = getBookings();
  return bookings.filter((b) => b.clientId === userId || b.expertId === userId);
}

export function generateMeetingLink(bookingId: string) {
  // simple deterministic placeholder meeting link
  return `https://meet.mock/room-${bookingId}`;
}

export function capturePayment(bookingId: string, amount: number) {
  // Simulate payment capture: in a real implementation integrate with Stripe/PayPal
  const bookings = getBookings();
  const idx = bookings.findIndex((b) => b.id === bookingId);
  if (idx === -1) return null;
  // attach a fake meeting link and mark as confirmed
  bookings[idx].meetingLink = generateMeetingLink(bookingId);
  bookings[idx].status = 'confirmed';
  saveBookings(bookings);
  return bookings[idx];
}

export function confirmBookingWithPayment(bookingId: string, amount: number) {
  // This function simulates payment capture and confirmation
  return capturePayment(bookingId, amount);
}
