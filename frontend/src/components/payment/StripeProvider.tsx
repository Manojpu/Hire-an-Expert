import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { ReactNode } from "react";

// Load the Stripe.js library with your publishable key
const stripePromise = loadStripe(
  "pk_test_51RtBSuC1Izya10mhxF5BJyutYn6OzIwcdICvGhvlYU4LrtFrX4ZgamJ1qjtBDzlJQ0dJzz6ILDQnkHlTQJlGJ2Wy009bTLhC06"
);

type StripeProviderProps = {
  children: ReactNode;
  options?: {
    clientSecret?: string;
    appearance?: any;
  };
};

export default function StripeProvider({
  children,
  options = {},
}: StripeProviderProps) {
  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
