import { getIdToken } from "firebase/auth";
import { auth } from "../firebase/firebase";

const BOOKING_SERVICE_BASE_URL =
  import.meta.env.VITE_BOOKING_SERVICE_URL || "http://localhost:8003";

// Types used by components
export interface Booking {
  id: number | string;
  user_id: number | string;
  gig_id: string;
  status: "pending" | "confirmed" | "joined" | "completed" | "cancelled";
  created_at: string;
  scheduled_time?: string;
  duration?: number;
  amount?: number | string; // Total amount/payment for the booking
  service?: string;
  type?: string;
  notes?: string;
  meeting_link?: string; // Agora meeting channel name
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
  gig_details?: {
    id?: number | string;
    title?: string;
    service_description?: string;
    hourly_rate?: string | number;
    currency?: string;
    thumbnail_url?: string;
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
    // Use the dedicated confirm endpoint that generates meeting link
    return this.makeRequest<Booking>(`/bookings/${bookingId}/confirm`, {
      method: "PUT",
    });
  }

  async joinBooking(bookingId: string): Promise<Booking> {
    // Use the dedicated join endpoint that updates status to joined
    return this.makeRequest<Booking>(`/bookings/${bookingId}/join`, {
      method: "PUT",
    });
  }

  async cancelBooking(bookingId: string): Promise<Booking> {
    return this.updateBooking(bookingId, { status: "cancelled" });
  }

  async completeBooking(bookingId: string): Promise<Booking> {
    // Use the dedicated complete endpoint that updates status to completed
    return this.makeRequest<Booking>(`/bookings/${bookingId}/complete`, {
      method: "PUT",
    });
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
    // These endpoints don't exist - return mock data for now
    // TODO: Implement proper analytics aggregation from gig-level analytics
    console.warn("getExpertRevenue: endpoint not implemented, returning mock data");
    return {
      total_revenue: 0,
      monthly_revenue: 0,
      completed_bookings: 0,
      average_rating: 0
    };
  }

  async getExpertConsultations(expertId?: string): Promise<{
    total_consultations: number;
    monthly_consultations: number;
    pending_consultations: number;
    confirmed_consultations: number;
  }> {
    // These endpoints don't exist - calculate from actual bookings
    try {
      const bookings = await this.makeRequest<Booking[]>(`/bookings/by-current-user`);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      return {
        total_consultations: bookings.length,
        monthly_consultations: bookings.filter(b => new Date(b.created_at) >= monthStart).length,
        pending_consultations: bookings.filter(b => b.status === 'pending').length,
        confirmed_consultations: bookings.filter(b => b.status === 'confirmed').length
      };
    } catch (error) {
      console.error("Error calculating consultation stats:", error);
      return {
        total_consultations: 0,
        monthly_consultations: 0,
        pending_consultations: 0,
        confirmed_consultations: 0
      };
    }
  }

  async getRecentBookings(limit = 5): Promise<Booking[]> {
    try {
      // Use /by-current-user endpoint and limit results on frontend
      const allBookings = await this.makeRequest<Booking[]>(`/bookings/by-current-user`);
      // Sort by created_at descending and take the first 'limit' items
      return allBookings
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error("Error fetching recent bookings:", error);
      return [];
    }
  }
}

export const bookingService = new BookingService();
export default bookingService;
