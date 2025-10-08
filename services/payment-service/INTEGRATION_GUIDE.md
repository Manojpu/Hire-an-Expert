# Payment Service Integration Guide

This guide explains how to integrate the Payment Service with your frontend components to enable payments for booking gigs.

## Overview

The payment service provides two main methods for processing payments:

1. **Stripe Checkout**: Redirects users to a Stripe-hosted checkout page
2. **Stripe Elements**: Allows you to embed payment forms directly in your UI

## Prerequisites

1. Make sure the Payment Service is running
2. Your frontend should have the Stripe.js library loaded
3. You need to have a booking ID before initiating payment

## 1. Using Stripe Checkout (Redirect Flow)

This is the simplest method that redirects users to a Stripe-hosted checkout page.

### React Component Integration

```tsx
import { useState } from "react";
import axios from "axios";

interface BookingData {
  id: string;
  price: number;
  gigTitle: string;
}

const StripeCheckoutButton = ({ booking }: { booking: BookingData }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:8004/payments/create-checkout-session",
        {
          booking_id: booking.id,
          booking_price: booking.price,
          gig_title: booking.gigTitle,
        }
      );

      // Redirect to the Stripe checkout page
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Payment error:", error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className="bg-gradient-primary"
    >
      {isLoading ? "Processing..." : `Pay Rs. ${booking.price}`}
    </button>
  );
};

export default StripeCheckoutButton;
```

### Success and Cancel Pages

You'll need to create success and cancel pages at the paths you configured in the .env file:

- `/booking/:id/success`
- `/booking/:id/cancel`

These pages should handle post-payment logic, such as showing confirmation messages and updating UI.

## 2. Using Stripe Elements (Embedded Flow)

For a more customized experience, you can use Stripe Elements to embed the payment form directly in your UI.

### React Component Integration

First, install the required packages:

```bash
npm install @stripe/react-stripe-js @stripe/stripe-js
```

Create a PaymentForm component:

```tsx
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "axios";

// Initialize Stripe
const stripePromise = loadStripe(
  "pk_test_51RtBSuC1Izya10mhxF5BJyutYn6OzIwcdICvGhvlYU4LrtFrX4ZgamJ1qjtBDzlJQ0dJzz6ILDQnkHlTQJlGJ2Wy009bTLhC06"
);

// Payment Form Component
const CheckoutForm = ({ booking, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      // Create a payment intent on the server
      const response = await axios.post(
        "http://localhost:8004/payments/create-payment-intent",
        {
          booking_id: booking.id,
          amount: booking.amount,
          gig_title: booking.service,
        }
      );

      const { clientSecret } = response.data;

      // Confirm the payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: booking.userName || "Client",
          },
        },
      });

      if (result.error) {
        setErrorMessage(result.error.message);
        onError && onError(result.error);
      } else {
        if (result.paymentIntent.status === "succeeded") {
          onSuccess && onSuccess(result.paymentIntent);
        }
      }
    } catch (error) {
      setErrorMessage("An error occurred while processing your payment.");
      onError && onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <CardElement options={cardStyle} className="p-3 border rounded" />
      </div>

      {errorMessage && (
        <div className="text-red-500 text-sm mb-4">{errorMessage}</div>
      )}

      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full bg-gradient-primary text-white py-2 px-4 rounded"
      >
        {isLoading ? "Processing..." : `Pay Rs. ${booking.amount}`}
      </button>
    </form>
  );
};

// Wrapper component with Stripe Elements
const PaymentForm = ({ booking, onSuccess, onError }) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm booking={booking} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
};

export default PaymentForm;
```

### Integrating with Your Payment Modal

Replace the current payment button with the full payment form:

```tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Booking } from "@/lib/bookings";
import PaymentForm from "./PaymentForm"; // Import the payment form

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  onPaymentSuccess: (paymentIntent: any) => void;
  onPaymentError: (error: any) => void;
};

const PaymentModal: React.FC<Props> = ({
  open,
  onOpenChange,
  booking,
  onPaymentSuccess,
  onPaymentError,
}) => {
  if (!booking) return null;

  const base = booking.amount;
  const durationMultiplier = booking.duration / 60; // e.g., 1 for 60 minutes
  const subtotal = Math.round(base * durationMultiplier);
  const platformFee = Math.round(subtotal * 0.05);
  const total = subtotal + platformFee;

  // Create a booking object with the calculated total
  const paymentBooking = {
    ...booking,
    amount: total,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          <div className="text-sm text-muted-foreground">Service</div>
          <div className="font-medium">{booking.service}</div>

          <div className="mt-4 text-sm text-muted-foreground">Details</div>
          <div className="mt-2">
            <div className="flex justify-between text-sm">
              <span>Base rate</span>
              <span>Rs. {base}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Duration multiplier</span>
              <span>x{durationMultiplier}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Subtotal</span>
              <span>Rs. {subtotal}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Platform fee (5%)</span>
              <span>Rs. {platformFee}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold mt-3 mb-4">
              <span>Total</span>
              <span>Rs. {total}</span>
            </div>
          </div>

          {/* Payment Form */}
          <PaymentForm
            booking={paymentBooking}
            onSuccess={(paymentIntent) => {
              onPaymentSuccess(paymentIntent);
              onOpenChange(false);
            }}
            onError={onPaymentError}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
```

## 3. Handling Payment Status

You can check the payment status using the payment service:

```tsx
import { useEffect, useState } from "react";
import axios from "axios";

const PaymentStatus = ({ paymentIntentId }) => {
  const [status, setStatus] = useState("loading");
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8004/payments/payment-status/${paymentIntentId}`
        );
        setStatus(response.data.status);
        setPaymentData(response.data);
      } catch (error) {
        setStatus("error");
      }
    };

    checkStatus();
  }, [paymentIntentId]);

  return (
    <div>
      <h3>Payment Status: {status}</h3>
      {paymentData && (
        <div>
          <p>Amount: Rs. {paymentData.amount}</p>
          <p>Created: {new Date(paymentData.created_at).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

export default PaymentStatus;
```

## 4. Environment Setup

Make sure you have the correct environment variables set in your frontend:

```tsx
// In your environment setup or config file
export const PAYMENT_SERVICE_URL =
  process.env.REACT_APP_PAYMENT_SERVICE_URL || "http://localhost:8004";
export const STRIPE_PUBLIC_KEY =
  process.env.REACT_APP_STRIPE_PUBLIC_KEY ||
  "pk_test_51RtBSuC1Izya10mhxF5BJyutYn6OzIwcdICvGhvlYU4LrtFrX4ZgamJ1qjtBDzlJQ0dJzz6ILDQnkHlTQJlGJ2Wy009bTLhC06";
```

## 5. Webhook Setup for Production

For production, you'll need to configure Stripe webhooks to point to your payment service endpoint:

1. Log in to your Stripe Dashboard
2. Go to Developers > Webhooks
3. Add Endpoint: `https://your-payment-service.com/payments/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Get the signing secret and update your `.env` file
