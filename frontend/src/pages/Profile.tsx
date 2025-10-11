import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Settings,
  Star,
  Clock,
  CalendarRange,
  DollarSign,
  Loader2,
} from "lucide-react";
import Header from "@/components/navigation/Header";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/auth/AuthContext";
import { experts } from "@/data/mockData";
import { format } from "date-fns";
import { doPasswordUpdate } from "@/firebase/auth.js";
import ExpertAvailabilityDisplay from "@/components/expert/ExpertAvailabilityDisplay";
import AvailabilitySettings from "@/components/dashboard/AvailabilitySettings";
import { bookingService, Booking } from "@/services/bookingService";
import { toSriLankaTime } from "@/utils/dateUtils";

// Utility function to safely format dates
const safeFormatDate = (
  dateValue: string | number | Date | undefined | null,
  formatString: string,
  fallback: string = "Not available"
): string => {
  if (!dateValue) return fallback;
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return fallback;
    return format(date, formatString);
  } catch (error) {
    console.error("Date formatting error:", error);
    return fallback;
  }
};

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, loggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Booking states
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  // Profile editing states
  const [editedProfile, setEditedProfile] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
  });

  // Preference states
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    sms_notifications: false,
    marketing_emails: true,
    profile_visibility: true,
    contact_visibility: true,
  });
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Password update states
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  // If no userId in URL, show current user's profile
  // If userId in URL, show that specific user's profile
  const isOwnProfile =
    !userId || userId === (currentUser?.uid || currentUser?.id);
  const user = isOwnProfile ? currentUser : null; // You might want to fetch user data by userId here
  // Load user preferences on component mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_USER_SERVICE_URL}/users/${
            user.id
          }/preferences`,
          {
            headers: {
              Authorization: `Bearer ${await user.getIdToken?.()}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const userPrefs = await response.json();
          const prefsObj = {};
          userPrefs.forEach((pref) => {
            prefsObj[pref.key] = pref.value === "true";
          });
          setPreferences((prev) => ({ ...prev, ...prefsObj }));
        }
        setPreferencesLoaded(true);
      } catch (error) {
        console.error("Error loading preferences:", error);
        setPreferencesLoaded(true);
      }
    };

    if (user?.id && isOwnProfile) {
      loadUserPreferences();
    }
  }, [user?.id, isOwnProfile, user]);

  // Initialize edited profile when user data is available
  useEffect(() => {
    if (user) {
      setEditedProfile({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
        location: user.location || "",
      });
    }
  }, [user]);

  // Load user bookings when the component mounts or when tab changes to bookings
  useEffect(() => {
    async function fetchUserBookings() {
      if (!user?.id) {
        setUserBookings([]);
        return;
      }

      // Only fetch if we're on the bookings tab to avoid unnecessary API calls
      if (activeTab !== "bookings") return;

      try {
        setBookingsLoading(true);
        setBookingsError(null);
        const fetchedBookings = await bookingService.getUserBookings();
        console.log("Fetched bookings in profile:", fetchedBookings);
        setUserBookings(fetchedBookings || []);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setBookingsError(
          "Failed to load your bookings. Please try again later."
        );
      } finally {
        setBookingsLoading(false);
      }
    }

    fetchUserBookings();
  }, [user?.id, activeTab]);

  // This ensures bookings are loaded when the component first loads with the bookings tab active
  useEffect(() => {
    if (activeTab === "bookings" && user?.id) {
      const loadInitialBookings = async () => {
        try {
          setBookingsLoading(true);
          setBookingsError(null);
          const fetchedBookings = await bookingService.getUserBookings();
          setUserBookings(fetchedBookings || []);
        } catch (err) {
          console.error("Error fetching initial bookings:", err);
          setBookingsError(
            "Failed to load your bookings. Please try again later."
          );
        } finally {
          setBookingsLoading(false);
        }
      };

      loadInitialBookings();
    }
  }, []);

  const savePreferences = async (updatedPreferences) => {
    setSavingPreferences(true);
    try {
      const prefArray = Object.entries(updatedPreferences).map(
        ([key, value]) => ({
          key,
          value: value.toString(),
        })
      );

      const response = await fetch(
        `${import.meta.env.VITE_USER_SERVICE_URL}/users/${user.id}/preferences`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${await user.getIdToken?.()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ preferences: prefArray }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.detail ||
          `Failed to save preferences (${response.status})`;
        console.error("Error saving preferences:", errorMessage);
        setSaveMessage(
          `Error saving preferences: ${errorMessage}. Please try again.`
        );
        setTimeout(() => setSaveMessage(""), 6000);
      } else {
        // Show brief success message for preferences
        setSaveMessage("Preferences saved successfully!");
        setTimeout(() => setSaveMessage(""), 2000);
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      setSaveMessage(
        "Error saving preferences: Unable to connect to server. Please try again."
      );
      setTimeout(() => setSaveMessage(""), 6000);
    } finally {
      setSavingPreferences(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);
    savePreferences(updatedPreferences);
  };

  const handleProfileInputChange = (field, value) => {
    setEditedProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveProfileChanges = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    setSaveMessage("");

    console.log("Saving profile changes:", editedProfile);
    console.log("User ID:", user.id);
    console.log("Current user object:", user);

    try {
      // Get the Firebase ID token with detailed logging
      let authToken = null;
      try {
        console.log("Attempting to get Firebase token...");
        authToken = await user.getIdToken?.();
        console.log("Firebase token obtained:", authToken ? "Yes" : "No");
        if (authToken) {
          console.log("Token preview:", authToken.substring(0, 50) + "...");
        }
      } catch (tokenError) {
        console.error("Error getting Firebase token:", tokenError);
        setSaveMessage(
          "Error getting authentication token. Please sign out and sign back in."
        );
        setTimeout(() => setSaveMessage(""), 8000);
        return;
      }

      const headers = {
        "Content-Type": "application/json",
      };

      // Only add Authorization header if we have a token
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
        console.log("Authorization header added");
      } else {
        console.log("No authentication token available");
      }

      console.log(
        "Making API request to:",
        `${import.meta.env.VITE_USER_SERVICE_URL}/users/${user.id}`
      );
      console.log("Request headers:", headers);
      console.log("Request body:", editedProfile);

      const response = await fetch(
        `${import.meta.env.VITE_USER_SERVICE_URL}/users/${user.id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(editedProfile),
        }
      );

      console.log("API Response received");
      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      // If authentication fails, try the test endpoint
      // if (response.status === 401 && authToken) {
      //   console.log('Authentication failed, trying test endpoint...');
      //   response = await fetch(`${import.meta.env.VITE_USER_SERVICE_URL}/test/users/${user.id}`, {
      //     method: 'PUT',
      //     headers: {
      //       'Content-Type': 'application/json'
      //     },
      //     body: JSON.stringify(editedProfile)
      //   });
      //   console.log('Test endpoint response status:', response.status);
      // }

      console.log("Final response status:", response.status);
      console.log("Final response ok:", response.ok);

      if (response.ok) {
        setIsEditing(false);
        setSaveMessage("Profile updated successfully!");
        // Clear message after 3 seconds
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        // Get specific error message from response
        const errorData = await response.json().catch(() => null);
        console.log("Error response data:", errorData);

        let errorMessage;
        if (response.status === 401) {
          errorMessage =
            "Invalid authentication token. Please sign out and sign back in.";
        } else if (response.status === 403) {
          errorMessage = "You do not have permission to update this profile.";
        } else if (response.status === 404) {
          errorMessage = "User profile not found.";
        } else if (response.status === 422) {
          errorMessage =
            errorData?.detail ||
            "Invalid profile data. Please check your inputs.";
        } else {
          errorMessage =
            errorData?.detail ||
            `Failed to update profile (${response.status})`;
        }

        setSaveMessage(`Error updating profile: ${errorMessage}`);
        setTimeout(() => setSaveMessage(""), 8000);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        setSaveMessage(
          "Error updating profile: Unable to connect to server. Please check your connection and try again."
        );
      } else {
        setSaveMessage(
          "Error updating profile: An unexpected error occurred. Please try again."
        );
      }
      setTimeout(() => setSaveMessage(""), 8000);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEditing = () => {
    // Reset to original values
    setEditedProfile({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      bio: user.bio || "",
      location: user.location || "",
    });
    setIsEditing(false);
    setSaveMessage("");
  };

  const handleEditToggle = () => {
    if (isEditing) {
      const hasChanges =
        JSON.stringify(editedProfile) !==
        JSON.stringify({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          bio: user.bio || "",
          location: user.location || "",
        });

      if (hasChanges) {
        saveProfileChanges();
      } else {
        setIsEditing(false);
      }
    } else {
      setIsEditing(true);
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updatePassword = async () => {
    // Clear previous messages
    setPasswordMessage("");

    // Validation
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordMessage("Please fill in all password fields.");
      setTimeout(() => setPasswordMessage(""), 5000);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      setTimeout(() => setPasswordMessage(""), 5000);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage("Password must be at least 6 characters long.");
      setTimeout(() => setPasswordMessage(""), 5000);
      return;
    }

    setUpdatingPassword(true);

    try {
      await doPasswordUpdate(passwordData.newPassword);
      setPasswordMessage("Password updated successfully!");

      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => setPasswordMessage(""), 5000);
    } catch (error) {
      console.error("Error updating password:", error);

      let errorMessage = "Failed to update password.";
      if (error.code === "auth/weak-password") {
        errorMessage =
          "Password is too weak. Please choose a stronger password.";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage =
          "For security, please sign out and sign back in before changing your password.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setPasswordMessage(errorMessage);
      setTimeout(() => setPasswordMessage(""), 8000);
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (!loggedIn || !user) {
    return null;
  }

  const getExpertById = (expertId: string) =>
    experts.find((e) => e.id === expertId);

  console.log(user.isExpert);
  return (
    <div className="min-h-screen bg-transparent ">
      <main className="container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Profile Image */}
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user.profileImage} alt={user.name} />
                    <AvatarFallback className="text-2xl">
                      {user?.name?.charAt(0) ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary/90 rounded-full p-2 text-primary-foreground">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl font-bold text-foreground">
                    {user.name}
                  </h1>
                  <p className="text-muted-foreground mb-2">{user.email}</p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                    {user.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {user.location}
                      </div>
                    )}
                    {(user.created_at || user.joinDate) && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Joined{" "}
                        {safeFormatDate(
                          user.created_at || user.joinDate,
                          "MMM yyyy"
                        )}
                      </div>
                    )}
                    {user.emailVerified && (
                      <Badge variant="secondary" className="text-xs">
                        ✓ Email Verified
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    onClick={handleEditToggle}
                    disabled={isSaving}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {isSaving
                      ? "Saving..."
                      : isEditing
                      ? "Save Changes"
                      : "Edit Profile"}
                  </Button>
                  {isEditing && (
                    <Button
                      variant="outline"
                      onClick={cancelEditing}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Message */}
          {saveMessage && (
            <Card
              className={`mb-4 ${
                saveMessage.includes("Error")
                  ? "border-red-200 bg-red-50"
                  : "border-green-200 bg-green-50"
              }`}
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-sm ${
                      saveMessage.includes("Error")
                        ? "text-red-800"
                        : "text-green-800"
                    }`}
                  >
                    {saveMessage}
                  </p>
                  {saveMessage.includes("Error") && isEditing && (
                    <Button
                      size="sm"
                      onClick={saveProfileChanges}
                      disabled={isSaving}
                      variant="outline"
                      className="ml-4 border-red-300 text-red-700 hover:bg-red-100"
                    >
                      {isSaving ? "Retrying..." : "Retry"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value);
              // If changing to bookings tab, trigger a refresh of data
              if (value === "bookings" && user?.id) {
                setBookingsLoading(true);
                setBookingsError(null);
                bookingService
                  .getUserBookings()
                  .then((bookings) => {
                    console.log("Refreshed bookings on tab change:", bookings);
                    setUserBookings(bookings || []);
                    setBookingsLoading(false);
                  })
                  .catch((err) => {
                    console.error("Error refreshing bookings:", err);
                    setBookingsError(
                      "Failed to load your bookings. Please try again later."
                    );
                    setBookingsLoading(false);
                  });
              }
            }}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-4 lg:grid-cols-5">
              <TabsTrigger value="profile" className="flex-1">
                Profile
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex-1">
                Bookings {!bookingsLoading && `(${userBookings.length})`}
                {bookingsLoading && (
                  <Loader2 className="ml-1 h-3 w-3 animate-spin" />
                )}
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex-1">
                Preferences
              </TabsTrigger>
              <TabsTrigger value="security" className="flex-1">
                Security
              </TabsTrigger>
              {user?.isExpert && (
                <TabsTrigger value="availability" className="flex-1">
                  Availability
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="profile" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={editedProfile.name}
                        onChange={(e) =>
                          handleProfileInputChange("name", e.target.value)
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedProfile.email}
                        onChange={(e) =>
                          handleProfileInputChange("email", e.target.value)
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={editedProfile.phone}
                        onChange={(e) =>
                          handleProfileInputChange("phone", e.target.value)
                        }
                        placeholder="Enter your phone number"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={editedProfile.location}
                        onChange={(e) =>
                          handleProfileInputChange("location", e.target.value)
                        }
                        placeholder="e.g., New York, USA"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editedProfile.bio}
                      onChange={(e) =>
                        handleProfileInputChange("bio", e.target.value)
                      }
                      placeholder="Tell us about yourself..."
                      disabled={!isEditing}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Expert Availability Section - Only shown for experts */}
              {user && user.is_expert && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Availability Schedule</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Your current availability for client bookings
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ExpertAvailabilityDisplay
                      userId={user.id || user.uid || ""}
                      token={user.getIdToken ? user.getIdToken : undefined}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="bookings" className="space-y-6 mt-6">
              <div className="grid gap-4">
                {bookingsLoading ? (
                  <Card className="border border-muted/50">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-full bg-primary/10 absolute animate-ping opacity-50"></div>
                        <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center">
                          <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                      </div>
                      <h3 className="text-xl font-medium mt-6 mb-2">
                        Loading your bookings
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Please wait while we fetch your booking details...
                      </p>
                    </CardContent>
                  </Card>
                ) : bookingsError ? (
                  <Card className="border-red-100 bg-red-50/50">
                    <CardContent className="text-center py-10">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
                        <Mail className="h-8 w-8 text-red-600" />
                      </div>
                      <h3 className="text-xl font-medium mb-2 text-red-800">
                        Error Loading Bookings
                      </h3>
                      <p className="text-red-600 mb-6 max-w-md mx-auto">
                        {bookingsError}
                      </p>
                      <Button
                        onClick={() => {
                          setBookingsLoading(true);
                          setBookingsError(null);
                          // Reset the active tab to trigger a refetch
                          setActiveTab("profile");
                          setTimeout(() => setActiveTab("bookings"), 10);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Retry Loading
                      </Button>
                    </CardContent>
                  </Card>
                ) : userBookings.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="bg-muted/30 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock className="h-12 w-12 text-muted-foreground opacity-60" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        No bookings found
                      </h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        You don't have any bookings yet. Start your journey by
                        booking a consultation with one of our skilled experts.
                      </p>
                      <Button size="lg" className="px-6">
                        Browse Experts
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  userBookings.map((booking) => {
                    // Get gig details from the API response
                    const gigDetails = booking.gig_details;

                    // Get expert info from our data if needed
                    const expert = experts.find((e) => e.id === booking.gig_id);

                    return (
                      <Card
                        key={booking.id}
                        className="overflow-hidden group hover:shadow-md transition-all duration-300"
                      >
                        {/* Status indicator at the top */}
                        <div
                          className={`h-1.5 w-full ${
                            booking.status === "confirmed"
                              ? "bg-emerald-500"
                              : booking.status === "completed"
                              ? "bg-blue-500"
                              : booking.status === "cancelled"
                              ? "bg-rose-500"
                              : "bg-amber-400"
                          }`}
                        ></div>

                        <CardContent className="pt-6 pb-6">
                          <div className="flex flex-col md:flex-row gap-5">
                            {/* Left column: Expert/Gig Info */}
                            <div className="flex items-start gap-4 md:w-1/3">
                              {/* Thumbnail or Expert Avatar */}
                              {gigDetails?.thumbnail_url ? (
                                <div className="h-24 w-24 rounded-md overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow transition-all duration-300">
                                  <img
                                    src={gigDetails.thumbnail_url}
                                    alt="Gig thumbnail"
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-500"
                                  />
                                </div>
                              ) : (
                                <Avatar className="h-20 w-20 shadow-sm">
                                  <AvatarImage
                                    src={expert?.profileImage}
                                    alt={expert?.name || "Expert"}
                                    className="transition-transform group-hover:scale-105 duration-500"
                                  />
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                                    {expert?.name?.charAt(0) || "E"}
                                  </AvatarFallback>
                                </Avatar>
                              )}

                              <div>
                                <h4 className="font-semibold text-lg text-foreground">
                                  {gigDetails?.service_description
                                    ? gigDetails.service_description.substring(
                                        0,
                                        50
                                      ) +
                                      (gigDetails.service_description.length >
                                      50
                                        ? "..."
                                        : "")
                                    : expert?.name
                                    ? `Session with ${expert.name}`
                                    : `Booking ID: ${booking.id.substring(
                                        0,
                                        8
                                      )}`}
                                </h4>

                                {expert && (
                                  <div className="flex items-center text-sm text-muted-foreground gap-1 mt-1">
                                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                                    <span>{expert.rating || "4.9"}</span>
                                    <span className="text-muted-foreground/50 mx-1">
                                      •
                                    </span>
                                    <span>{expert?.title || "Expert"}</span>
                                  </div>
                                )}

                                {/* Price display */}
                                {gigDetails && (
                                  <div className="flex items-center gap-1 mt-3">
                                    {gigDetails.currency === "USD" && (
                                      <DollarSign className="h-4 w-4 text-primary" />
                                    )}
                                    <span className="font-medium text-primary">
                                      {gigDetails.currency === "USD"
                                        ? "$"
                                        : gigDetails.currency === "LKR"
                                        ? "Rs. "
                                        : gigDetails.currency === "EUR"
                                        ? "€"
                                        : `${gigDetails.currency} `}
                                      {gigDetails.hourly_rate}/hour
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Middle column: Booking Details */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-2 md:mt-0">
                              <div>
                                <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium block">
                                  Scheduled Time:
                                </span>
                                <p className="font-medium flex items-center mt-1 text-foreground">
                                  <Calendar className="h-4 w-4 mr-1.5 text-primary" />
                                  {toSriLankaTime(booking.scheduled_time)}
                                </p>
                              </div>

                              <div>
                                <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium block">
                                  Status:
                                </span>
                                <Badge
                                  variant={
                                    booking.status === "confirmed"
                                      ? "default"
                                      : booking.status === "pending"
                                      ? "secondary"
                                      : booking.status === "completed"
                                      ? "outline"
                                      : "destructive"
                                  }
                                  className="mt-1"
                                >
                                  {booking.status === "confirmed" && (
                                    <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse mr-1.5"></div>
                                  )}
                                  {booking.status.charAt(0).toUpperCase() +
                                    booking.status.slice(1)}
                                </Badge>
                              </div>

                              <div>
                                <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium block">
                                  Booking Date:
                                </span>
                                <p className="font-medium mt-1 flex items-center text-foreground">
                                  <CalendarRange className="h-4 w-4 mr-1.5 text-primary" />
                                  {new Date(
                                    booking.created_at
                                  ).toLocaleDateString()}
                                </p>
                              </div>

                              <div>
                                <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium block">
                                  Booking ID:
                                </span>
                                <p className="font-medium mt-1 text-xs text-foreground/80 font-mono">
                                  {booking.id.substring(0, 13)}...
                                </p>
                              </div>
                            </div>

                            {/* Right column: Actions */}
                            <div className="flex flex-col items-end gap-2 justify-center">
                              {/* Total amount calculation - hourly_rate * 1 hour */}
                              {gigDetails && (
                                <div className="text-xl font-bold text-primary">
                                  {gigDetails.currency === "USD"
                                    ? "$"
                                    : gigDetails.currency === "LKR"
                                    ? "Rs. "
                                    : gigDetails.currency === "EUR"
                                    ? "€"
                                    : `${gigDetails.currency} `}
                                  {gigDetails.hourly_rate}
                                </div>
                              )}

                              <div className="flex gap-2 mt-2">
                                {booking.status === "confirmed" && (
                                  <Button
                                    size="sm"
                                    className="bg-primary hover:bg-primary/90 transition-all"
                                  >
                                    Join Meeting
                                  </Button>
                                )}
                                {booking.status === "completed" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                  >
                                    Leave Review
                                  </Button>
                                )}
                                {booking.status === "pending" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-rose-500 border-rose-200 hover:bg-rose-50"
                                    onClick={async () => {
                                      try {
                                        setBookingsLoading(true);
                                        await bookingService.updateBookingStatus(
                                          booking.id,
                                          "cancelled"
                                        );
                                        toast.success(
                                          "Booking cancelled successfully"
                                        );
                                        // Refresh bookings list
                                        const updatedBookings =
                                          await bookingService.getUserBookings();
                                        setUserBookings(updatedBookings || []);
                                      } catch (err) {
                                        console.error(
                                          "Error cancelling booking:",
                                          err
                                        );
                                        toast.error("Failed to cancel booking");
                                      } finally {
                                        setBookingsLoading(false);
                                      }
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="group-hover:border-primary/70 group-hover:text-primary transition-colors"
                                >
                                  Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Notification Preferences
                    {savingPreferences && (
                      <span className="text-sm text-muted-foreground">
                        Saving...
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about your bookings
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={preferences.email_notifications}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange("email_notifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">
                        SMS Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive SMS reminders before consultations
                      </p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={preferences.sms_notifications}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange("sms_notifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing-emails">Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about new experts and features
                      </p>
                    </div>
                    <Switch
                      id="marketing-emails"
                      checked={preferences.marketing_emails}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange("marketing_emails", checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Privacy Settings
                    {savingPreferences && (
                      <span className="text-sm text-muted-foreground">
                        Saving...
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="profile-visibility">Public Profile</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow others to see your profile and reviews
                      </p>
                    </div>
                    <Switch
                      id="profile-visibility"
                      checked={preferences.profile_visibility}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange("profile_visibility", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="contact-visibility">
                        Contact Information
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Show your contact details to booked experts
                      </p>
                    </div>
                    <Switch
                      id="contact-visibility"
                      checked={preferences.contact_visibility}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange("contact_visibility", checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Expert Availability Tab - Only visible for experts */}
            {user?.isExpert && (
              <TabsContent value="availability" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Manage Your Availability</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Set your weekly schedule and mark dates when you're
                      unavailable
                    </p>
                  </CardHeader>
                  <CardContent>
                    <AvailabilitySettings
                      userId={user.id || user.uid || "me"}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="security" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Password Message */}
                  {passwordMessage && (
                    <div
                      className={`p-3 rounded-md ${
                        passwordMessage.includes("successfully") ||
                        passwordMessage.includes("Success")
                          ? "bg-green-50 border border-green-200 text-green-800"
                          : "bg-red-50 border border-red-200 text-red-800"
                      }`}
                    >
                      <p className="text-sm">{passwordMessage}</p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        handlePasswordChange("newPassword", e.target.value)
                      }
                      disabled={updatingPassword}
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirm-password">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        handlePasswordChange("confirmPassword", e.target.value)
                      }
                      disabled={updatingPassword}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button
                    onClick={updatePassword}
                    disabled={
                      updatingPassword ||
                      !passwordData.newPassword ||
                      !passwordData.confirmPassword
                    }
                  >
                    {updatingPassword
                      ? "Updating Password..."
                      : "Update Password"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable 2FA</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-destructive">Delete Account</Label>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;
