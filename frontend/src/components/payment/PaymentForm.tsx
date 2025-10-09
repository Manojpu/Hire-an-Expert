import { useState, useEffect } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type PaymentStatus = "initial" | "processing" | "succeeded" | "error";

type PaymentFormProps = {
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  amount: number;
  currency?: string;
  clientSecret?: string;
};

export default function PaymentForm({
  onPaymentSuccess,
  onPaymentError,
  amount,
  currency = "LKR",
  clientSecret,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("initial");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet. Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      // Use the client secret to confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: "if_required",
      });

      if (error) {
        console.error("Payment confirmation error:", error);
        setErrorMessage(error.message || "Payment failed. Please try again.");
        setPaymentStatus("error");
        onPaymentError(error.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        setPaymentStatus("succeeded");
        onPaymentSuccess(paymentIntent.id);
      } else if (paymentIntent) {
        // Handle other payment statuses if needed
        switch (paymentIntent.status) {
          case "processing":
            setPaymentStatus("processing");
            break;
          case "requires_action":
            // If 3D Secure authentication is required, Stripe.js will handle it
            break;
          default:
            setPaymentStatus("initial");
        }
        // Still call success handler with the ID so the app can check status later
        onPaymentSuccess(paymentIntent.id);
      } else {
        setErrorMessage("Unexpected error occurred. Please try again.");
        setPaymentStatus("error");
        onPaymentError("Unexpected error occurred");
      }
    } catch (err: any) {
      console.error("Payment submission error:", err);
      setErrorMessage(err.message || "An unexpected error occurred");
      setPaymentStatus("error");
      onPaymentError(err.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if the component has everything it needs to render
  useEffect(() => {
    if (!stripe || !elements) {
      return;
    }
    
    // Clear any previous errors when dependencies change
    setErrorMessage(null);
  }, [stripe, elements]);
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="mb-4">
              <h3 className="font-medium text-lg mb-2">Payment Details</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your payment information to complete your booking.
              </p>
            </div>
            
            <PaymentElement options={{
              layout: {
                type: 'tabs',
                defaultCollapsed: false,
              }
            }} />
            
            <AddressElement options={{ 
              mode: "billing",
              fields: {
                phone: 'always',
              },
              validation: {
                phone: {
                  required: 'auto',
                }
              }
            }} />
          </div>
        </CardContent>
      </Card>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Payment Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {paymentStatus === "succeeded" && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Payment Successful</AlertTitle>
          <AlertDescription>
            Your payment has been processed successfully.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!stripe || !elements || isProcessing}
          className="w-full md:w-auto"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${amount.toFixed(2)} ${currency}`
          )}
        </Button>
      </div>
    </form>
  );
}
