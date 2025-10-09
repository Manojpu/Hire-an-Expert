import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

// We'll fetch the publishable key from the backend
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

  // Fetch the publishable key from the backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("http://localhost:8004/payments/config");
        if (!response.ok) {
          throw new Error("Failed to load payment configuration");
        }

        const config = await response.json();
        if (!config.publishableKey) {
          throw new Error("No publishable key found");
        }

        // Initialize Stripe only once
        if (!stripePromise) {
          stripePromise = loadStripe(config.publishableKey);
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

    fetchConfig();
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
