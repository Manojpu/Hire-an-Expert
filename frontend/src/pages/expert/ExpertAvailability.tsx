import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AvailabilitySettings from "@/components/dashboard/AvailabilitySettings";

const ExpertAvailability: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/expert/profile")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Availability Management</h1>
          <p className="text-muted-foreground">
            Set your availability across all your services
          </p>
        </div>
      </div>

      <AvailabilitySettings />
    </div>
  );
};

export default ExpertAvailability;
