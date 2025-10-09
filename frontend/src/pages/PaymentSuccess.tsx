import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { paymentService } from "@/services/paymentService";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  const paymentIntentId = searchParams.get("payment_intent");
  const redirectStatus = searchParams.get("redirect_status");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!paymentIntentId) {
        setStatus("error");
        return;
      }

      try {
        const paymentStatus = await paymentService.getPaymentStatus(
          paymentIntentId
        );

        switch (paymentStatus.status) {
          case "succeeded":
            setStatus("success");
            setPaymentInfo(paymentStatus);
            break;
          case "processing":
            // Payment is still processing, poll for updates
            setTimeout(verifyPayment, 3000);
            break;
          case "requires_payment_method":
            // Payment failed, redirect to payment page
            navigate(`/book/${paymentStatus.metadata?.gig_id}`);
            break;
          case "requires_confirmation":
          case "requires_action":
            // Redirect to handle additional actions (like 3D Secure)
            window.location.href =
              paymentStatus.next_action?.redirect_to_url?.url || "/my-bookings";
            break;
          default:
            setStatus("error");
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        setStatus("error");
      }
    };

    verifyPayment();
  }, [paymentIntentId, redirectStatus, navigate]);

  return (
    <div className="container max-w-md mx-auto py-12">
      <Card>
        <CardHeader className="text-center">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <CardTitle className="text-xl">Verifying Payment...</CardTitle>
              <CardDescription>
                Please wait while we verify your payment.
              </CardDescription>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Payment Successful!</CardTitle>
              <CardDescription className="text-base">
                Your payment has been processed successfully.
              </CardDescription>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center">
              <div className="bg-red-100 p-3 rounded-full mb-4">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
              <CardTitle className="text-xl">
                Payment Verification Failed
              </CardTitle>
              <CardDescription>
                We couldn't verify your payment. Please contact support if you
                believe this is an error.
              </CardDescription>
            </div>
          )}
        </CardHeader>

        {status === "success" && paymentInfo && (
          <CardContent className="space-y-4">
            <div className="border rounded-md p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">
                  ${paymentInfo.amount.toFixed(2)}{" "}
                  {paymentInfo.currency.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment ID:</span>
                <span className="font-mono text-xs">
                  {paymentIntentId?.substring(0, 16)}...
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        )}

        <CardFooter className="flex justify-center pt-2">
          <Button onClick={() => navigate("/my-bookings")} className="w-full">
            View My Bookings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
