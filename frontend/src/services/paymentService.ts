import { toast } from "sonner";

const API_URL = "http://localhost:8004/payments";

// Type definitions
export interface CreatePaymentIntentRequest {
  booking_id: string;
  amount: number;
  gig_title: string;
  customer_email?: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}

export interface PaymentStatus {
  status: string;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
}

// Service functions
export const paymentService = {
  /**
   * Get payment service configuration
   */
  async getConfig(): Promise<{
    publishableKey: string;
    currency: string;
    platformFeePercent: number;
  }> {
    try {
      const response = await fetch(`${API_URL}/config`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to get payment configuration");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Error getting payment configuration:", error);
      toast.error("Failed to load payment configuration: " + error.message);
      throw error;
    }
  },

  /**
   * Create a payment intent for processing a payment
   */
  async createPaymentIntent(
    data: CreatePaymentIntentRequest
  ): Promise<CreatePaymentIntentResponse> {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/create-payment-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create payment intent");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      toast.error("Failed to create payment: " + error.message);
      throw error;
    }
  },

  /**
   * Get the status of a payment intent
   */
  async getPaymentStatus(paymentIntentId: string): Promise<PaymentStatus> {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/payment-status/${paymentIntentId}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to get payment status");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Error getting payment status:", error);
      toast.error("Failed to check payment status: " + error.message);
      throw error;
    }
  },

  /**
   * Get all payments for a booking
   */
  async getBookingPayments(bookingId: string): Promise<any[]> {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/bookings/${bookingId}/payments`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to get booking payments");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Error getting booking payments:", error);
      toast.error("Failed to load payment history: " + error.message);
      throw error;
    }
  },
};
