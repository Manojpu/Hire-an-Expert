import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentFormProps {
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  amount: number;
  currency: string;
}

export default function PaymentForm({
  onPaymentSuccess,
  onPaymentError,
  amount,
  currency,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe hasn't loaded yet. Please wait.");
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: "if_required", // Only redirect if 3D Secure is needed
      });

      if (error) {
        // Payment failed
        console.error("Payment error:", error);
        onPaymentError(error.message || "Payment failed");
        toast.error(error.message || "Payment failed");
      } else if (paymentIntent) {
        // Payment succeeded
        console.log("Payment succeeded:", paymentIntent);
        onPaymentSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      onPaymentError(err.message || "An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-md mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Amount to pay:</span>
          <span className="text-lg font-bold">
            {currency} {amount.toFixed(2)}
          </span>
        </div>
      </div>

      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={isProcessing || !stripe || !elements}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${currency} ${amount.toFixed(2)}`
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Your payment information is secure and encrypted.
      </p>
    </form>
  );
}
