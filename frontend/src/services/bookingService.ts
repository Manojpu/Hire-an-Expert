import { getIdToken } from "firebase/auth";
import { auth } from "../firebase/firebase";

const BOOKING_SERVICE_BASE_URL =
  import.meta.env.VITE_BOOKING_SERVICE_URL || "http://localhost:8003";

// Types used by components
export interface Booking {
  id: number | string;
  user_id: number | string;
  gig_id: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  created_at: string;
  scheduled_time?: string;
  duration?: number;
  service?: string;
  type?: string;
  notes?: string;
  // Optional nested data from backend
  user?: {
    id: number | string;
    name?: string;
    email?: string;
  };
  gig?: {
    id: number | string;
    title?: string;
    hourly_rate?: string | number;
  };
}

export interface BookingCreate {
  gig_id: string;
  scheduled_time?: string;
  notes?: string;
}

export interface BookingUpdate {
  status?: string;
  scheduled_time?: string;
  notes?: string;
}

class BookingService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BOOKING_SERVICE_BASE_URL;
  }

  private async authHeaders() {
    if (auth.currentUser) {
      const token = await getIdToken(auth.currentUser);
      return { Authorization: `Bearer ${token}` };
    }
    return {} as Record<string, string>;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultHeaders: HeadersInit = {
      "Content-Type": "application/json",
      ...(await this.authHeaders()),
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    if (response.status === 204) {
      // Return a safe empty object cast for endpoints that return no content
      return {} as T;
    }

    return (await response.json()) as T;
  }

  // Queries used by multiple components
  async getAllBookings(skip = 0, limit = 100): Promise<Booking[]> {
    return this.makeRequest<Booking[]>(`/bookings/?skip=${skip}&limit=${limit}`);
  }

  async getBookingsByGig(gigId: string): Promise<Booking[]> {
    return this.makeRequest<Booking[]>(`/bookings/gig/${gigId}`);
  }

  async getUserBookings(): Promise<Booking[]> {
    return this.makeRequest<Booking[]>("/bookings/user");
  }

  async getBooking(bookingId: string): Promise<Booking> {
    return this.makeRequest<Booking>(`/bookings/${bookingId}`);
  }

  async createBooking(booking: BookingCreate): Promise<Booking> {
    return this.makeRequest<Booking>("/bookings/", {
      method: "POST",
      body: JSON.stringify(booking),
    });
  }

  async updateBooking(bookingId: string, updates: BookingUpdate): Promise<Booking> {
    return this.makeRequest<Booking>(`/bookings/${bookingId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteBooking(bookingId: string): Promise<void> {
    await this.makeRequest<void>(`/bookings/${bookingId}`, { method: "DELETE" });
  }

  async confirmBooking(bookingId: string): Promise<Booking> {
    return this.updateBooking(bookingId, { status: "confirmed" });
  }

  async cancelBooking(bookingId: string): Promise<Booking> {
    return this.updateBooking(bookingId, { status: "cancelled" });
  }

  async completeBooking(bookingId: string): Promise<Booking> {
    return this.updateBooking(bookingId, { status: "completed" });
  }

  async healthCheck(): Promise<{ status: string; service: string; port: number }> {
    return this.makeRequest<{ status: string; service: string; port: number }>("/health");
  }

  // Stats used by OverallExpertProfile and dashboards
  async getExpertRevenue(expertId?: string): Promise<{
    total_revenue: number;
    monthly_revenue: number;
    completed_bookings: number;
    average_rating: number;
  }> {
    const endpoint = expertId
      ? `/bookings/expert/${expertId}/revenue`
      : "/bookings/my/revenue";
    return this.makeRequest(endpoint);
  }

  async getExpertConsultations(expertId?: string): Promise<{
    total_consultations: number;
    monthly_consultations: number;
    pending_consultations: number;
    confirmed_consultations: number;
  }> {
    const endpoint = expertId
      ? `/bookings/expert/${expertId}/consultations`
      : "/bookings/my/consultations";
    return this.makeRequest(endpoint);
  }

  async getRecentBookings(limit = 5): Promise<Booking[]> {
    return this.makeRequest<Booking[]>(`/bookings/my/recent?limit=${limit}`);
  }
}

export const bookingService = new BookingService();
export default bookingService;
