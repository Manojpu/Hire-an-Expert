const BOOKING_SERVICE_BASE_URL = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:8003';

export interface Booking {
  id: number | string;
  user_id: number | string; // Changed to support UUID strings
  gig_id: string; // Changed to string to support UUID
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  scheduled_time?: string;
  duration?: number;
  service?: string; // New field replacing service_type
  type?: string; // New field for booking type
  notes?: string;
  // Frontend-specific fields for UI compatibility
  clientName?: string;
  time?: string;
  date?: string;
  price?: number;
  gigTitle?: string;
  dateTime?: string;
  client?: { name: string };
  amount?: number;
  // Nested user and gig data from backend
  user?: { 
    id: number;
    name?: string; 
    email?: string; 
  };
  gig?: { 
    id: number;
    title?: string; 
    hourly_rate?: string | number; 
  };
}

export interface BookingCreate {
  gig_id: string; // Changed to string to support UUID
}

export interface BookingUpdate {
  status?: string;
  scheduled_time?: string;
}

class BookingService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BOOKING_SERVICE_BASE_URL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      // Add authentication header if available
      // 'Authorization': `Bearer ${getAuthToken()}`,
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    // Handle empty responses
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Get all bookings
  async getAllBookings(skip: number = 0, limit: number = 100): Promise<Booking[]> {
    return this.makeRequest<Booking[]>(`/bookings/?skip=${skip}&limit=${limit}`);
  }

  // Get bookings for a specific gig
  async getBookingsByGig(gigId: string): Promise<Booking[]> {
    return this.makeRequest<Booking[]>(`/bookings/gig/${gigId}`);
  }

  // Get bookings for current user
  async getUserBookings(): Promise<Booking[]> {
    return this.makeRequest<Booking[]>('/bookings/user');
  }

  // Get a specific booking
  async getBooking(bookingId: string): Promise<Booking> {
    return this.makeRequest<Booking>(`/bookings/${bookingId}`);
  }

  // Create a new booking
  async createBooking(booking: BookingCreate): Promise<Booking> {
    return this.makeRequest<Booking>('/bookings/', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  }

  // Update a booking
  async updateBooking(bookingId: string, updates: BookingUpdate): Promise<Booking> {
    return this.makeRequest<Booking>(`/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Delete a booking
  async deleteBooking(bookingId: string): Promise<void> {
    return this.makeRequest<void>(`/bookings/${bookingId}`, {
      method: 'DELETE',
    });
  }

  // Confirm a booking
  async confirmBooking(bookingId: string): Promise<Booking> {
    return this.updateBooking(bookingId, { status: 'confirmed' });
  }

  // Cancel a booking
  async cancelBooking(bookingId: string): Promise<Booking> {
    return this.updateBooking(bookingId, { status: 'cancelled' });
  }

  // Complete a booking
  async completeBooking(bookingId: string): Promise<Booking> {
    return this.updateBooking(bookingId, { status: 'completed' });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; service: string; port: number }> {
    return this.makeRequest<{ status: string; service: string; port: number }>('/health');
  }

  // Get expert revenue statistics
  async getExpertRevenue(expertId?: string): Promise<{
    total_revenue: number;
    monthly_revenue: number;
    completed_bookings: number;
    average_rating: number;
  }> {
    const endpoint = expertId ? `/bookings/expert/${expertId}/revenue` : '/bookings/my/revenue';
    return this.makeRequest<{
      total_revenue: number;
      monthly_revenue: number;
      completed_bookings: number;
      average_rating: number;
    }>(endpoint);
  }

  // Get expert consultation statistics
  async getExpertConsultations(expertId?: string): Promise<{
    total_consultations: number;
    monthly_consultations: number;
    pending_consultations: number;
    confirmed_consultations: number;
  }> {
    const endpoint = expertId ? `/bookings/expert/${expertId}/consultations` : '/bookings/my/consultations';
    return this.makeRequest<{
      total_consultations: number;
      monthly_consultations: number;
      pending_consultations: number;
      confirmed_consultations: number;
    }>(endpoint);
  }

  // Get recent bookings for expert
  async getRecentBookings(limit: number = 5): Promise<Booking[]> {
    return this.makeRequest<Booking[]>(`/bookings/my/recent?limit=${limit}`);
  }
}

export const bookingService = new BookingService();
export default bookingService;
