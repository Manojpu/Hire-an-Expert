import { toast } from "sonner";
import { getIdToken } from "firebase/auth";
import { auth } from "../firebase/firebase"; // Import the Firebase auth instance directly

const API_URL = import.meta.env.VITE_PAYMENT_SERVICE_URL || "http://localhost:8004/payments";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

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
  next_action?: {
    type: string;
    redirect_to_url?: {
      url: string;
      return_url: string;
    };
  };
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
      const response = await fetchWithRetry(`${API_URL}/config`);

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
      // Using the imported auth instance directly
      const currentUser = auth.currentUser;

      let token = null;
      if (currentUser) {
        token = await getIdToken(currentUser);
      }

      const response = await fetchWithRetry(
        `${API_URL}/create-payment-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(data),
        }
      );

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
      // Using the imported auth instance directly
      const currentUser = auth.currentUser;

      let token = null;
      if (currentUser) {
        token = await getIdToken(currentUser);
      }

      const maxRetries = 3;
      let retries = 0;

      while (retries < maxRetries) {
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
          if (response.status === 404) {
            // Payment not found, might be processing
            await new Promise((resolve) => setTimeout(resolve, 2000));
            retries++;
            continue;
          }
          throw new Error(error.detail || "Failed to get payment status");
        }

        const data = await response.json();

        // If payment is processing, wait and retry
        if (data.status === "processing" && retries < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          retries++;
          continue;
        }

        return data;
      }

      throw new Error("Payment status check timed out");
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
