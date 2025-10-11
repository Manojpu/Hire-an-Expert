import { toast } from "sonner";
import { getAuth, getIdToken } from "firebase/auth";
import { auth } from "../firebase/firebase"; // Import the Firebase auth instance directly

const API_URL = "http://localhost:8003/bookings"; // Assuming booking service is on port 8003

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

// Type definitions from your lib/bookings.ts, but aligned with backend format
export interface Booking {
  id: string;
  user_id: string; // matches backend format
  gig_id: string; // matches backend format
  status: "pending" | "confirmed" | "completed" | "cancelled";
  scheduled_time: string; // ISO format from backend
  created_at: string;
}

// Get all bookings for the current user
export async function getUserBookings() {
  try {
    // We're using the imported auth instance directly from firebase.js
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error("User not authenticated");
      throw new Error("Authentication required");
    }

    // Get the token directly from Firebase
    const token = await getIdToken(currentUser);

    const response = await fetchWithRetry(`${API_URL}/by-current-user`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch bookings");
    }

    const bookings = await response.json();
    return bookings as Booking[];
  } catch (error) {
    console.error("Failed to fetch user bookings:", error);

    // Provide more specific error messages
    if (error instanceof Error && error.message === "Authentication required") {
      toast.error("Please sign in to view your bookings");
    } else {
      toast.error("Could not load your bookings");
    }

    return [];
  }
}

// Create a new booking
export async function createBooking(bookingData: {
  gig_id: string;
  scheduled_time: string;
}) {
  try {
    // We're using the imported auth instance directly from firebase.js
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error("User not authenticated");
      throw new Error("Authentication required");
    }

    // Get the token directly from Firebase
    const token = await getIdToken(currentUser);

    const response = await fetchWithRetry(`${API_URL}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create booking");
    }

    const booking = await response.json();
    return booking as Booking;
  } catch (error) {
    console.error("Failed to create booking:", error);
    toast.error("Could not create booking");
    throw error;
  }
}

// Get a specific booking by ID
export async function getBookingById(bookingId: string) {
  try {
    // We're using the imported auth instance directly from firebase.js
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error("User not authenticated");
      throw new Error("Authentication required");
    }

    // Get the token directly from Firebase
    const token = await getIdToken(currentUser);

    const response = await fetchWithRetry(`${API_URL}/${bookingId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch booking");
    }

    const booking = await response.json();
    return booking as Booking;
  } catch (error) {
    console.error(`Failed to fetch booking ${bookingId}:`, error);
    toast.error("Could not load booking details");
    return null;
  }
}

// Update a booking's status
export async function updateBookingStatus(bookingId: string, status: string) {
  try {
    // We're using the imported auth instance directly from firebase.js
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error("User not authenticated");
      throw new Error("Authentication required");
    }

    // Get the token directly from Firebase
    const token = await getIdToken(currentUser);

    const response = await fetchWithRetry(`${API_URL}/${bookingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update booking");
    }

    const booking = await response.json();
    return booking as Booking;
  } catch (error) {
    console.error(`Failed to update booking ${bookingId}:`, error);
    toast.error("Could not update booking status");
    throw error;
  }
}

// Delete a booking
export async function deleteBooking(bookingId: string) {
  try {
    // We're using the imported auth instance directly from firebase.js
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error("User not authenticated");
      throw new Error("Authentication required");
    }

    // Get the token directly from Firebase
    const token = await getIdToken(currentUser);

    const response = await fetchWithRetry(`${API_URL}/${bookingId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to delete booking");
    }

    return true;
  } catch (error) {
    console.error(`Failed to delete booking ${bookingId}:`, error);
    toast.error("Could not delete booking");
    throw error;
  }
}

export const bookingService = {
  getUserBookings,
  createBooking,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
};
