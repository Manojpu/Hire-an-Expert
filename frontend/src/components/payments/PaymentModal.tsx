import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Booking } from "@/lib/bookings";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  onConfirmPayment: (bookingId: string, amount: number) => void;
};

const PaymentModal: React.FC<Props> = ({ open, onOpenChange, booking, onConfirmPayment }) => {
  if (!booking) return null;

  const base = booking.amount;
  const durationMultiplier = booking.duration / 60; // e.g., 1 for 60 minutes
  const subtotal = Math.round(base * durationMultiplier);
  const platformFee = Math.round(subtotal * 0.05);
  const total = subtotal + platformFee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Payment</DialogTitle>
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
            <div className="flex justify-between text-sm font-semibold mt-3">
              <span>Total</span>
              <span>Rs. {total}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onConfirmPayment(booking.id, total); onOpenChange(false); }} className="bg-gradient-primary">Pay Rs. {total}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
