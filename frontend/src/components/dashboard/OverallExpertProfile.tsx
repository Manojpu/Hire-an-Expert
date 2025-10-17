import React, { useState, useEffect, useCallback } from "react";
import { ExpertGig, gigServiceAPI } from "@/services/gigService";
import { 
  userServiceAPI, 
  ExpertData, 
  ExpertProfile, 
  VerificationDocument, 
  AvailabilityRule, 
  DateOverride, 
  UserPreference 
} from "@/services/userService";
import { reviewServiceAPI } from "@/services/reviewService";
import { bookingService } from "@/services/bookingService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Users,
  DollarSign,
  Calendar,
  Edit,
  FileText,
  IdCard,
  Upload,
  Clock,
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import EarningsChart from "@/components/dashboard/EarningsChart";
import { useNavigate, useParams } from "react-router-dom";

interface OverallExpertProfileProps {
  onBack?: () => void;
}

const OverallExpertProfile: React.FC<OverallExpertProfileProps> = ({
  onBack,
}) => {
  const navigate = useNavigate();
  const { expertId } = useParams();
  const isAdminView = expertId !== undefined; // If expertId is in URL, it's admin view
  
  console.log('OverallExpertProfile - expertId:', expertId, 'isAdminView:', isAdminView);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (isAdminView) {
      navigate("/admin-requests");
    } else {
      navigate("/expert");
    }
  };
  const [gigs, setGigs] = useState<ExpertGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<ExpertData | null>(null);
  const [expertProfile, setExpertProfile] = useState<ExpertProfile | null>(null);
  const [gigStats, setGigStats] = useState({
    total_gigs: 0,
    active_gigs: 0,
    views: 0,
    bookings: 0
  });
  const [revenueStats, setRevenueStats] = useState({
    total_revenue: 0,
    monthly_revenue: 0,
    completed_bookings: 0,
    average_rating: 0
  });
  const [consultationStats, setConsultationStats] = useState({
    total_consultations: 0,
    monthly_consultations: 0,
    pending_consultations: 0,
    confirmed_consultations: 0
  });
  const [recentReviews, setRecentReviews] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [verificationDocuments, setVerificationDocuments] = useState<VerificationDocument[]>([]);
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>([]);
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreference[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load user and expert profile data
      if (isAdminView && expertId) {
        // Admin viewing specific expert
        const user = await userServiceAPI.getUserById(expertId);
        setUserData(user);
        // Get the first expert profile if available
        if (user.expert_profiles && user.expert_profiles.length > 0) {
          setExpertProfile(user.expert_profiles[0]);
        }
      } else {
        // Expert viewing their own profile
        const profile = await userServiceAPI.getCurrentUserProfile();
        setUserData(profile);
        // Get the first expert profile if available
        if (profile.expert_profiles && profile.expert_profiles.length > 0) {
          setExpertProfile(profile.expert_profiles[0]);
        }
      }

      // Load gigs data
      let gigs;
      if (isAdminView && expertId) {
        gigs = await gigServiceAPI.getMyGigs(); // TODO: Add admin endpoint
      } else {
        gigs = await gigServiceAPI.getMyGigs();
      }
      setGigs(gigs);

      // Load statistics
      const [gigStatsData, revenueData, consultationData] = await Promise.all([
        gigServiceAPI.getGigStats().catch(err => {
          console.warn("Failed to load gig stats:", err);
          return { total_gigs: 0, active_gigs: 0, views: 0, bookings: 0 };
        }),
        bookingService.getExpertRevenue(expertId).catch(err => {
          console.warn("Failed to load revenue stats:", err);
          return { total_revenue: 0, monthly_revenue: 0, completed_bookings: 0, average_rating: 0 };
        }),
        bookingService.getExpertConsultations(expertId).catch(err => {
          console.warn("Failed to load consultation stats:", err);
          return { total_consultations: 0, monthly_consultations: 0, pending_consultations: 0, confirmed_consultations: 0 };
        })
      ]);

      setGigStats(gigStatsData);
      setRevenueStats(revenueData);
      setConsultationStats(consultationData);

      // Load recent data and user service data
      const [reviews, bookings, verificationDocs, availabilityData, dateOverrideData, preferences] = await Promise.all([
        reviewServiceAPI.getMyReviews().catch(err => {
          console.warn("Failed to load reviews:", err);
          return { reviews: [], total_reviews: 0, average_rating: 0 };
        }),
        bookingService.getRecentBookings(5).catch(err => {
          console.warn("Failed to load recent bookings:", err);
          return [];
        }),
        userServiceAPI.getVerificationDocuments().catch(err => {
          console.warn("Failed to load verification documents:", err);
          return [];
        }),
        userServiceAPI.getAvailabilityRules().catch(err => {
          console.warn("Failed to load availability rules:", err);
          return [];
        }),
        userServiceAPI.getDateOverrides().catch(err => {
          console.warn("Failed to load date overrides:", err);
          return [];
        }),
        userServiceAPI.getUserPreferences().catch(err => {
          console.warn("Failed to load user preferences:", err);
          return [];
        })
      ]);

      // Handle reviews response (it returns ExpertReviewSummary with recent_reviews array)
      const reviewsData = Array.isArray(reviews) 
        ? reviews 
        : ('recent_reviews' in reviews ? reviews.recent_reviews : 
           ('reviews' in reviews ? reviews.reviews : []));
      setRecentReviews(reviewsData);
      setRecentBookings(bookings);
      setVerificationDocuments(verificationDocs);
      setAvailabilityRules(availabilityData);
      setDateOverrides(dateOverrideData);
      setUserPreferences(preferences);

    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setLoading(false);
    }
  }, [isAdminView, expertId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate aggregate statistics using real API data
  const aggregateStats = {
    totalGigs: gigStats.total_gigs || gigs.length,
    activeGigs: gigStats.active_gigs || gigs.filter((g) => g.status === "active").length,
    totalConsultations: consultationStats.total_consultations || 
      gigs.reduce((sum, g) => sum + (g.total_consultations || 0), 0),
    totalReviews: gigs.reduce((sum, g) => sum + (g.total_reviews || 0), 0),
    averageRating: revenueStats.average_rating || 
      (gigs.length > 0 ? gigs.reduce((sum, g) => sum + (g.rating || 0), 0) / gigs.length : 0),
    totalRevenue: revenueStats.total_revenue || 0,
    monthlyRevenue: revenueStats.monthly_revenue || 0,
    weeklyRevenue: Math.round(revenueStats.monthly_revenue / 4) || 0, // Estimated weekly from monthly
  };

  const chartData = [
    { date: "2024-01-01", revenue: 15000 },
    { date: "2024-01-02", revenue: 18000 },
    { date: "2024-01-03", revenue: 22000 },
    { date: "2024-01-04", revenue: 19000 },
    { date: "2024-01-05", revenue: 25000 },
    { date: "2024-01-06", revenue: 28000 },
    { date: "2024-01-07", revenue: 32000 },
    { date: "2024-01-08", revenue: 29000 },
    { date: "2024-01-09", revenue: 35000 },
    { date: "2024-01-10", revenue: 38000 },
    { date: "2024-01-11", revenue: 42000 },
    { date: "2024-01-12", revenue: 45000 },
    { date: "2024-01-13", revenue: 48000 },
    { date: "2024-01-14", revenue: 52000 },
    { date: "2024-01-15", revenue: 55000 },
  ];

  const getStatusColor = (status: ExpertGig["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "draft":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading expert profile...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">
                {isAdminView ? "Expert Profile (Admin View)" : "Expert Profile"}
              </h1>
              <p className="text-muted-foreground">
                {isAdminView 
                  ? "Admin view of expert account and performance" 
                  : "Overall account and performance overview"
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack}>
                Back to Gigs
              </Button>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Expert Basic Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IdCard className="h-5 w-5" />
                Expert Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Expert ID
                  </label>
                  <div className="font-mono text-sm mt-1">{userData?.id || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </label>
                  <div className="mt-1">{userData?.name || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <div className="mt-1">{userData?.email || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Phone
                  </label>
                  <div className="mt-1">{userData?.phone || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Specialization
                  </label>
                  <div className="mt-1">{expertProfile?.specialization || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Joined Date
                  </label>
                  <div className="mt-1">
                    {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Verification Status
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={expertProfile?.is_verified ? "default" : "secondary"}
                      >
                        {expertProfile?.is_verified
                          ? "Verified Expert"
                          : "Pending Verification"}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Update Documents
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {verificationDocuments.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No verification documents uploaded yet
                  </div>
                ) : (
                  verificationDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium text-sm">
                          {doc.document_type === "ID_PROOF" ? "ID Proof" : 
                           doc.document_type === "PROFESSIONAL_LICENSE" ? "Professional License" : 
                           "Other Document"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        Uploaded
                      </Badge>
                    </div>
                  ))
                )}
                
                {/* Add Upload Button */}
                <Button variant="outline" size="sm" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aggregate Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Gigs"
            value={aggregateStats.totalGigs.toString()}
            icon={<Users className="h-4 w-4" />}
          />
          <StatsCard
            title="Active Gigs"
            value={aggregateStats.activeGigs.toString()}
            icon={<Calendar className="h-4 w-4" />}
          />
          <StatsCard
            title="Total Consultations"
            value={aggregateStats.totalConsultations.toString()}
            icon={<Users className="h-4 w-4" />}
          />
          <StatsCard
            title="Average Rating"
            value={aggregateStats.averageRating.toFixed(1)}
            icon={<Star className="h-4 w-4" />}
          />
        </div>

        {/* Revenue Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <EarningsChart data={chartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Week</span>
                <span className="text-lg font-semibold">
                  Rs. {aggregateStats.weeklyRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  This Month
                </span>
                <span className="text-lg font-semibold">
                  Rs. {aggregateStats.monthlyRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Earned
                </span>
                <span className="text-lg font-semibold">
                  Rs. {aggregateStats.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">
                  Total Reviews
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {aggregateStats.totalReviews}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Availability Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Availability Management</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage when you're available for bookings
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/expert/availability")}
            >
              Manage Availability
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Weekly Schedule</h3>
                </div>
                {availabilityRules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No availability rules set</p>
                ) : (
                  <div className="space-y-2">
                    {availabilityRules.map((rule) => {
                      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                      return (
                        <div key={rule.id} className="flex items-center justify-between p-3 border rounded">
                          <span className="text-sm font-medium">{days[rule.day_of_week]}</span>
                          <span className="text-sm text-muted-foreground">
                            {rule.start_time_utc} - {rule.end_time_utc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Date Exceptions ({dateOverrides.length})</h3>
                </div>
                {dateOverrides.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No date exceptions set</p>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {dateOverrides.slice(0, 5).map((override) => (
                      <div key={override.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">
                          {new Date(override.unavailable_date).toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="text-red-600">Unavailable</Badge>
                      </div>
                    ))}
                    {dateOverrides.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        +{dateOverrides.length - 5} more exceptions
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => navigate("/expert/availability")}>
                Manage Availability
              </Button>
              <Button variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                Update Rates
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Account Preferences
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage your account settings and notification preferences
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userPreferences.length === 0 ? (
                <div className="col-span-2 text-center py-4 text-muted-foreground">
                  No preferences configured
                </div>
              ) : (
                userPreferences.map((pref) => (
                  <div key={pref.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium text-sm capitalize">
                        {pref.key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Updated {new Date(pref.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={pref.value === 'true' ? 'default' : 'outline'}>
                      {pref.value === 'true' ? 'Enabled' : pref.value === 'false' ? 'Disabled' : pref.value}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Gigs List */}
        <Card>
          <CardHeader>
            <CardTitle>My Gigs</CardTitle>
          </CardHeader>
          <CardContent>
            {gigs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No gigs created yet
              </div>
            ) : (
              <div className="space-y-4">
                {gigs.map((gig) => (
                  <div
                    key={gig.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{gig.title || gig.service_description || 'Untitled Gig'}</h3>
                        <Badge className={getStatusColor(gig.status)}>
                          {gig.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 capitalize">
                        {gig.category_id
                          ? `Category #${gig.category_id}`
                          : "General"}{" "}
                        • Rs. {gig.hourly_rate?.toLocaleString() || "0"}/hr
                      </p>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="text-center">
                        <div className="font-medium text-foreground">
                          {(gig.rating || 0).toFixed(1)}
                        </div>
                        <div>Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-foreground">
                          {gig.total_reviews || 0}
                        </div>
                        <div>Reviews</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-foreground">
                          {gig.total_consultations || 0}
                        </div>
                        <div>Sessions</div>
                      </div>
                    </div>

                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverallExpertProfile;
