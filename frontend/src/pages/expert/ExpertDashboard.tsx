import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { ExpertGig, gigServiceAPI } from "@/services/gigService";
import GigSelector from "@/components/dashboard/GigSelector";
import GigDashboard from "@/components/dashboard/GigDashboard";
import OverallExpertProfile from "@/components/dashboard/OverallExpertProfile";
import ExpertAvailability from "@/pages/expert/ExpertAvailability";

type DashboardView = "selector" | "gig" | "profile";

const ExpertDashboardPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<DashboardView>("selector");
  const [selectedGig, setSelectedGig] = useState<ExpertGig | null>(null);
  const [loading, setLoading] = useState(true);
  const [gigs, setGigs] = useState<ExpertGig[]>([]);
  const navigate = useNavigate();

  const handleGigSelect = useCallback(
    (gig: ExpertGig) => {
      setSelectedGig(gig);
      setCurrentView("gig");
      navigate(`/expert/gig/${gig.id}`);
    },
    [navigate]
  );

  const handleCreateNew = useCallback(() => {
    navigate("/create-gig");
  }, [navigate]);

  const handleViewOverall = useCallback(() => {
    setCurrentView("profile");
    navigate("/expert/profile");
  }, [navigate]);

  const handleBackToSelector = useCallback(() => {
    setSelectedGig(null);
    setCurrentView("selector");
    navigate("/expert");
  }, [navigate]);

  useEffect(() => {
    const checkExpertStatus = async () => {
      try {
        setLoading(true);
        const myGigs = await gigServiceAPI.getMyGigs();
        setGigs(myGigs);

        // If user has no gigs, show the gig selector (they can choose to create or view profile)
        if (myGigs.length === 0) {
          setCurrentView("selector");
          return;
        }

        // If user has only one gig, go directly to that gig's dashboard
        if (myGigs.length === 1) {
          handleGigSelect(myGigs[0]);
          return;
        }

        // Otherwise show the gig selector
        setCurrentView("selector");
      } catch (error) {
        console.error("Error checking expert status:", error);
        // On error, show the selector instead of redirecting to create-gig
        // This allows users to try creating a gig or view their profile
        setCurrentView("selector");
        setGigs([]); // Set empty gigs array so the selector shows "no gigs" state
      } finally {
        setLoading(false);
      }
    };

    checkExpertStatus();
  }, [navigate, handleGigSelect]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">
            Loading Expert Dashboard...
          </div>
          <div className="text-sm text-muted-foreground">
            Checking your gigs and preferences
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Gig Selector - Default view when user has multiple gigs */}
      <Route
        index
        element={
          <GigSelector
            onGigSelect={handleGigSelect}
            onCreateNew={handleCreateNew}
            onViewOverall={handleViewOverall}
          />
        }
      />

      {/* Overall Expert Profile */}
      <Route
        path="profile"
        element={<OverallExpertProfile onBack={handleBackToSelector} />}
      />

      {/* Expert Availability Management */}
      <Route path="availability" element={<ExpertAvailability />} />

      {/* Individual Gig Dashboard */}
      <Route
        path="gig/:gigId/*"
        element={<GigDashboard onBack={handleBackToSelector} />}
      />
    </Routes>
  );
};

export default ExpertDashboardPage;
