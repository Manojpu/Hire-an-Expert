import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

// Get the publishable key from environment variables
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
let stripePromise: ReturnType<typeof loadStripe> | null = null;

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Stripe with the publishable key from environment variables
  useEffect(() => {
    const initializeStripe = async () => {
      try {
        if (!publishableKey) {
          throw new Error(
            "No Stripe publishable key found in environment variables"
          );
        }

        // Initialize Stripe only once
        if (!stripePromise) {
          stripePromise = loadStripe(publishableKey);
        }
      } catch (err) {
        console.error("Failed to load Stripe configuration:", err);
        setError("Payment system configuration failed to load");
        toast.error(
          "Payment system configuration failed to load. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    initializeStripe();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Loading payment system...</div>;
  }

  if (error || !stripePromise) {
    return (
      <div className="p-4 text-center text-red-500">
        {error || "Payment system unavailable"}
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
