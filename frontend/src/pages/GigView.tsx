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
  const [gig, setGig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGig = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError("No gig ID provided");
          return;
        }

        console.log("Fetching gig with ID:", id);

        // Try to fetch using mock data first
        try {
          const response = await getGigById(id);
          console.log("Received gig data:", response);
          setGig(response);
          setError("");
          return;
        } catch (mockErr) {
          console.log("Mock data not found, trying API call");
          // If mock data fails, we'll try a direct API call as fallback
        }

        // Fallback to direct API call if mock data doesn't have this gig
        const apiUrl = "http://localhost:8002/gigs/" + id;
        console.log("Trying direct API call to:", apiUrl);
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }

        const gigData = await response.json();
        console.log("API returned gig data:", gigData);
        setGig(gigData);
        setError("");
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
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <div className="h-12 w-12 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
                  <Users className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Expert Profile</h3>
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span>Top Rated Expert</span>
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
                <Button variant="outline" className="w-full" size="lg">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Expert
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
