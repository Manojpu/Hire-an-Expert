import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useParams,
  Link,
  useLocation,
} from "react-router-dom";
import { ExpertGig, gigServiceAPI } from "@/services/gigService";
import GigOverview from "@/components/dashboard/GigOverview";
import GigBookings from "@/components/dashboard/GigBookings";
import GigAnalytics from "@/components/dashboard/GigAnalytics";
import GigProfile from "@/components/dashboard/GigProfile";
import GigAvailability from "@/components/dashboard/GigAvailability";
import {
  ArrowLeft,
  Home,
  Calendar,
  BarChart3,
  User,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface GigDashboardProps {
  onBack: () => void;
}

const GigDashboard: React.FC<GigDashboardProps> = ({ onBack }) => {
  const { gigId } = useParams<{ gigId: string }>();
  const [gig, setGig] = useState<ExpertGig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (gigId) {
      loadGig(gigId);
    }
  }, [gigId]);

  const loadGig = async (id: string) => {
    try {
      setLoading(true);
      const gigData = await gigServiceAPI.getGigById(id);
      setGig(gigData);
      setError(null);
    } catch (err) {
      console.error("Error loading gig:", err);
      setError("Failed to load gig details");
    } finally {
      setLoading(false);
    }
  };

  const handleGigUpdate = (updatedGig: ExpertGig) => {
    setGig(updatedGig);
  };

  const navigationItems = [
    {
      icon: Home,
      label: "Overview",
      href: `/expert/gig/${gigId}/overview`,
    },
    {
      icon: Calendar,
      label: "Bookings",
      href: `/expert/gig/${gigId}/bookings`,
    },
    {
      icon: BarChart3,
      label: "Analytics",
      href: `/expert/gig/${gigId}/analytics`,
    },
    {
      icon: Calendar,
      label: "Availability",
      href: `/expert/gig/${gigId}/availability`,
    },
    {
      icon: User,
      label: "Profile",
      href: `/expert/gig/${gigId}/profile`,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="text-center">Loading gig details...</div>
        </div>
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">{error || "Gig not found"}</div>
            <Button onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Gigs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Gigs
              </Button>
              <div>
                <h1 className="text-xl font-bold">{gig.title}</h1>
                <p className="text-sm text-muted-foreground capitalize">
                  {gig.category_id
                    ? gig.category_id.toString().replace("-", " ")
                    : "General"}{" "}
                  • {gig.status || "Active"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-border">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-6">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.href ||
                (location.pathname.endsWith("/gig/" + gigId) &&
                  item.href.includes("overview"));

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-2 px-3 py-4 border-b-2 transition-colors ${
                    isActive
                      ? "border-primary text-primary font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Routes>
          <Route
            path="overview"
            element={<GigOverview gig={gig} onUpdate={handleGigUpdate} />}
          />
          <Route path="bookings" element={<GigBookings gig={gig} />} />
          <Route path="analytics" element={<GigAnalytics gig={gig} />} />
          <Route
            path="availability"
            element={<GigAvailability gig={gig} onUpdate={handleGigUpdate} />}
          />
          <Route
            path="profile"
            element={<GigProfile gig={gig} onUpdate={handleGigUpdate} />}
          />
          <Route path="" element={<Navigate to="overview" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default GigDashboard;
