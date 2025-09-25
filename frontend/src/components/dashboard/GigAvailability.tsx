import React from "react";
import { ExpertGig } from "@/services/gigService";
import AvailabilitySettings from "./AvailabilitySettings";

interface GigAvailabilityProps {
  gig: ExpertGig;
  onUpdate?: (updatedGig: ExpertGig) => void;
}

const GigAvailability: React.FC<GigAvailabilityProps> = ({ gig, onUpdate }) => {
  return (
    <div>
      <AvailabilitySettings userId={gig.expert_id || "me"} />
    </div>
  );
};

export default GigAvailability;
