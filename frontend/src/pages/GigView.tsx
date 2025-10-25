import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  MessageCircle,
  Users,
  Briefcase,
  Award,
  CheckCircle,
  Star,
  ArrowLeft,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getGigById } from "@/services/gigService";
import { userServiceAPI, ExpertData } from "@/services/userService";
import { reviewAnalyticsService } from "@/services/reviewAnalyticsService";
import { reviewServiceAPI, Review } from "@/services/reviewService";
import { messageService } from "@/services/messageService";
import { useAuth } from "@/context/auth/AuthContext";

// Helper functions to handle different data structures
const getCategoryIdentifier = (gig: any): string => {
  if (!gig) return "";

  // Handle backend API response structure (Gig type)
  if (gig.category && typeof gig.category === "object" && gig.category.slug) {
    return gig.category.slug;
  }

  // Handle mock data structure (ExpertGig type)
  if (gig.category_id) {
    return gig.category_id.toString();
  }

  // Fallback to category as string
  if (gig.category && typeof gig.category === "string") {
    return gig.category;
  }

  return "all-categories";
};

const getCategoryName = (gig: any): string => {
  if (!gig) return "Category";

  // Handle backend API response structure (Gig type)
  if (gig.category && typeof gig.category === "object" && gig.category.name) {
    return gig.category.name;
  }

  // Handle mock data structure (ExpertGig type)
  if (gig.category && typeof gig.category === "string") {
    return gig.category;
  }

  // Fallback
  if (gig.category_id) {
    return typeof gig.category_id === "string" ? gig.category_id : "Category";
  }

  return "Category";
};

// Using any type to handle different response structures
const GigView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gig, setGig] = useState<any>(null);
  const [expert, setExpert] = useState<ExpertData | null>(null);
  const [expertLoading, setExpertLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ratingData, setRatingData] = useState({
    average_rating: 0,
    total_reviews: 0,
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [contactingExpert, setContactingExpert] = useState(false);

  useEffect(() => {
    const fetchGig = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError("No gig ID provided");
          return;
        }

        console.log("Fetching gig with ID:", id);

        // Fetch gig through the gigService which uses API Gateway
        const gigData = await getGigById(id);
        console.log("✅ Received gig data:", gigData);
        setGig(gigData);
        setError("");
        
        // Expert data will be fetched by the separate useEffect below
      } catch (err) {
        console.error("Error fetching gig:", err);
        setError("Failed to load service details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGig();
    }
  }, [id]);

  // Fetch expert data when gig is loaded
  useEffect(() => {
    const fetchExpertData = async () => {
      if (!gig?.expert_id) {
        console.log("No expert_id found in gig");
        return;
      }

      try {
        setExpertLoading(true);
        console.log("Fetching expert data for user ID:", gig.expert_id);

        // expert_id is the user database ID, not Firebase UID
        const expertData = await userServiceAPI.getUserById(
          gig.expert_id
        );
        console.log("Expert data loaded:", expertData);
        setExpert(expertData);
      } catch (err) {
        console.error("Error fetching expert data:", err);
        // Don't show error to user, just log it
      } finally {
        setExpertLoading(false);
      }
    };

    if (gig) {
      fetchExpertData();
    }
  }, [gig]);

  // Fetch rating data when id changes
  useEffect(() => {
    const fetchRating = async () => {
      if (!id) return;

      try {
        const data = await reviewAnalyticsService.fetchGigRatingAnalytics(id);
        setRatingData({
          average_rating: data.average_rating,
          total_reviews: data.total_reviews,
        });
      } catch (error) {
        console.error("Error fetching rating:", error);
        setRatingData({ average_rating: 0, total_reviews: 0 });
      }
    };

    fetchRating();
  }, [id]);

  // Fetch reviews when id changes
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;

      try {
        setReviewsLoading(true);
        const data = await reviewServiceAPI.getGigReviews(id, 1, 50); // Get first 50 reviews
        setReviews(data.reviews);
        setReviewsTotal(data.total);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setReviews([]);
        setReviewsTotal(0);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [id]);

  // Handler for contacting the expert
  const handleContactExpert = async () => {
    // Check if user is logged in
    if (!user) {
      alert("Please log in to contact the expert");
      navigate("/login");
      return;
    }

    // Check if expert data is loaded
    if (!expert) {
      alert("Expert information is still loading. Please wait...");
      return;
    }

    // Check if user is trying to contact themselves
    if (user.uid === expert.firebase_uid) {
      alert("You cannot contact yourself");
      return;
    }

    try {
      setContactingExpert(true);
      console.log(`💬 Initiating conversation with expert: ${expert.firebase_uid}`);
      console.log(`Current user: ${user.uid}`);

      // Create or get existing conversation using Firebase UIDs
      const conversation = await messageService.getOrCreateConversation(
        user.uid, // current user's Firebase UID (sender)
        expert.firebase_uid // expert's Firebase UID (receiver)
      );

      console.log(`✅ Conversation ready: ${conversation.id}`);

      // Get expert name from expert data
      const expertName =
        expert.name ||
        expert.email?.split("@")[0] ||
        gig?.title ||
        "Expert";

      // Navigate to messages page with the conversation ID as state
      navigate("/messages", {
        state: {
          conversationId: conversation.id,
          expertId: expert.firebase_uid, // Use Firebase UID for messaging
          expertName: expertName,
        },
        replace: true, // Use replace to prevent back button issues
      });
    } catch (error) {
      console.error("❌ Error contacting expert:", error);
      alert("Failed to start conversation. Please try again.");
    } finally {
      setContactingExpert(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-12 flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="container py-12 flex items-center justify-center min-h-[70vh]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Service Not Found</h2>
          <p className="text-muted-foreground mb-6">
            {error ||
              "The service you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb Navigation */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:underline">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link
          to={`/category/${getCategoryIdentifier(gig)}`}
          className="hover:underline capitalize"
        >
          {getCategoryName(gig)}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium">Service Details</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2">
          {/* Service Banner/Thumbnail */}
          <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-8 relative">
            {gig.banner_image_url || gig.thumbnail_url ? (
              <img
                src={gig.banner_image_url || gig.thumbnail_url}
                alt={`${gig.service_description || "Service"} image`}
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 flex items-center justify-center">
                <span className="text-slate-400">No image available</span>
              </div>
            )}
          </div>

          {/* Service Title & Description */}
          <h1 className="text-3xl font-bold mb-4">
            {gig.title || gig.service_description || "Expert Service"}
          </h1>

          <div className="flex flex-wrap gap-3 mb-6">
            {/* Show languages if available */}
            {gig.languages &&
              Array.isArray(gig.languages) &&
              gig.languages.map((language, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm"
                >
                  {language}
                </span>
              ))}

            {/* Alternatively show expertise areas if available */}
            {gig.expertise_areas &&
              Array.isArray(gig.expertise_areas) &&
              gig.expertise_areas.map((area, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm"
                >
                  {area}
                </span>
              ))}
          </div>

          <Separator className="my-6" />

          {/* Service Details */}
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-bold mb-4">About This Service</h2>
              <p className="text-muted-foreground">
                {gig.service_description || "No detailed description provided."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">Experience & Expertise</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <Briefcase className="h-5 w-5 mr-3 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Professional Experience</h3>
                    <p className="text-sm text-muted-foreground">
                      {gig.experience ||
                        (gig.experience_years
                          ? `${gig.experience_years}+ years of experience`
                          : "Experience level not specified")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Award className="h-5 w-5 mr-3 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Education</h3>
                    <p className="text-sm text-muted-foreground">
                      {gig.education || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Work Experience */}
              {gig.work_experience && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Work Experience Details</h3>
                  <p className="text-sm text-muted-foreground">
                    {gig.work_experience}
                  </p>
                </div>
              )}

              {/* Certifications */}
              {gig.certifications &&
                Array.isArray(gig.certifications) &&
                gig.certifications.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Certifications</h3>
                    <ul className="text-sm text-muted-foreground list-disc pl-5">
                      {gig.certifications.map((cert, i) => (
                        <li key={i}>
                          {typeof cert === "string"
                            ? cert
                            : cert.url
                            ? cert.url
                            : JSON.stringify(cert)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">Availability</h2>
              <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-3 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Scheduling Preferences</h3>
                  <p className="text-sm text-muted-foreground">
                    {gig.availability_preferences || "Flexible schedule"}
                  </p>
                </div>
              </div>
            </section>

            {/* Reviews Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Reviews</h2>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                  <span className="font-semibold text-lg">
                    {ratingData.average_rating > 0
                      ? ratingData.average_rating.toFixed(1)
                      : "N/A"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({reviewsTotal} {reviewsTotal === 1 ? "review" : "reviews"})
                  </span>
                </div>
              </div>

              {reviewsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading reviews...
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 border rounded-lg bg-slate-50 dark:bg-slate-900">
                  <Star className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                  <p className="text-muted-foreground">No reviews yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Be the first to book and review this service
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card
                      key={review.id}
                      className="border-0 bg-slate-50 dark:bg-slate-900"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
                              <Users className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                Anonymous User
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating
                                    ? "fill-amber-500 text-amber-500"
                                    : "text-slate-300 dark:text-slate-700"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {review.comment}
                          </p>
                        )}
                        {review.is_verified && (
                          <div className="flex items-center gap-1 mt-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600 dark:text-green-500">
                              Verified Purchase
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 shadow-sm border-0 bg-background/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Starting at
                  </span>
                  <h2 className="text-3xl font-bold">
                    {gig.currency} {gig.hourly_rate?.toLocaleString()}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    per hour
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  title="Share this service"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Expert Brief Info */}
              <div
                className="flex items-center gap-4 mb-6 pb-6 border-b cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-lg p-2 -m-2"
                onClick={() =>
                  gig?.expert_id && navigate(`/expert/${gig.expert_id}`)
                }
                title="View expert profile"
              >
                {expert?.profile_image_url ? (
                  <img
                    src={expert.profile_image_url}
                    alt={expert.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
                    <Users className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {expertLoading ? (
                      <span className="text-muted-foreground">Loading...</span>
                    ) : expert ? (
                      expert.name
                    ) : (
                      "Expert Profile"
                    )}
                  </h3>
                  <div className="flex items-center text-sm text-muted-foreground gap-1">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    <span>{gig.response_time || "< 24 hours"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Verified Expert</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span className="font-medium text-foreground">
                      {ratingData.average_rating > 0
                        ? ratingData.average_rating.toFixed(1)
                        : "No ratings yet"}
                    </span>
                  </div>
                  {ratingData.total_reviews > 0 && (
                    <span className="text-muted-foreground">
                      ({ratingData.total_reviews}{" "}
                      {ratingData.total_reviews === 1 ? "review" : "reviews"})
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button
                  className="w-full bg-gradient-primary"
                  size="lg"
                  onClick={() => navigate(`/gig/${id}/book`)}
                >
                  Book Consultation
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={handleContactExpert}
                  disabled={contactingExpert || !user || expertLoading || !expert}
                >
                  {contactingExpert ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : expertLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Expert
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GigView;
