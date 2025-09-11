
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, Mail, Phone, MapPin, Calendar, Settings, Star, Clock } from 'lucide-react';
import Header from '@/components/navigation/Header';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/auth/AuthContext';
import { mockBookings, experts } from '@/data/mockData';
import { format } from 'date-fns';

// Utility function to safely format dates
const safeFormatDate = (dateValue: string | number | Date | undefined | null, formatString: string, fallback: string = 'Not available'): string => {
  if (!dateValue) return fallback;
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return fallback;
    return format(date, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return fallback;
  }
};

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, loggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Profile editing states
  const [editedProfile, setEditedProfile] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: ''
  });
  
  // Preference states
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    sms_notifications: false,
    marketing_emails: true,
    profile_visibility: true,
    contact_visibility: true
  });
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  // If no userId in URL, show current user's profile
  // If userId in URL, show that specific user's profile
  const isOwnProfile = !userId || userId === (currentUser?.uid || currentUser?.id);
  const user = isOwnProfile ? currentUser : null; // You might want to fetch user data by userId here
  
  const userBookings = mockBookings.filter(booking => booking.clientId === user?.id);
  // Load user preferences on component mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8001/users/${user.id}/preferences`, {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken?.()}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userPrefs = await response.json();
          const prefsObj = {};
          userPrefs.forEach(pref => {
            prefsObj[pref.key] = pref.value === 'true';
          });
          setPreferences(prev => ({ ...prev, ...prefsObj }));
        }
        setPreferencesLoaded(true);
      } catch (error) {
        console.error('Error loading preferences:', error);
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
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || ''
      });
    }
  }, [user]);

  const savePreferences = async (updatedPreferences) => {
    setSavingPreferences(true);
    try {
      const prefArray = Object.entries(updatedPreferences).map(([key, value]) => ({
        key,
        value: value.toString()
      }));

      const response = await fetch(`http://127.0.0.1:8001/users/${user.id}/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken?.()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preferences: prefArray })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.detail || `Failed to save preferences (${response.status})`;
        console.error('Error saving preferences:', errorMessage);
        setSaveMessage(`Error saving preferences: ${errorMessage}. Please try again.`);
        setTimeout(() => setSaveMessage(''), 6000);
      } else {
        // Show brief success message for preferences
        setSaveMessage('Preferences saved successfully!');
        setTimeout(() => setSaveMessage(''), 2000);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveMessage('Error saving preferences: Unable to connect to server. Please try again.');
      setTimeout(() => setSaveMessage(''), 6000);
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
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveProfileChanges = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    setSaveMessage('');
    
    console.log('Saving profile changes:', editedProfile);
    console.log('User ID:', user.id);
    console.log('Current user object:', user);
    
    try {
      // Get the Firebase ID token with detailed logging
      let authToken = null;
      try {
        console.log('Attempting to get Firebase token...');
        authToken = await user.getIdToken?.();
        console.log('Firebase token obtained:', authToken ? 'Yes' : 'No');
        if (authToken) {
          console.log('Token preview:', authToken.substring(0, 50) + '...');
        }
      } catch (tokenError) {
        console.error('Error getting Firebase token:', tokenError);
        setSaveMessage('Error getting authentication token. Please sign out and sign back in.');
        setTimeout(() => setSaveMessage(''), 8000);
        return;
      }

      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Only add Authorization header if we have a token
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log('Authorization header added');
      } else {
        console.log('No authentication token available');
      }

      console.log('Making API request to:', `http://127.0.0.1:8001/users/${user.id}`);
      console.log('Request headers:', headers);
      console.log('Request body:', editedProfile);

      const response = await fetch(`http://127.0.0.1:8001/users/${user.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editedProfile)
      });

      console.log('API Response received');
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // If authentication fails, try the test endpoint
      // if (response.status === 401 && authToken) {
      //   console.log('Authentication failed, trying test endpoint...');
      //   response = await fetch(`http://127.0.0.1:8001/test/users/${user.id}`, {
      //     method: 'PUT',
      //     headers: {
      //       'Content-Type': 'application/json'
      //     },
      //     body: JSON.stringify(editedProfile)
      //   });
      //   console.log('Test endpoint response status:', response.status);
      // }

      console.log('Final response status:', response.status);
      console.log('Final response ok:', response.ok);

      if (response.ok) {
        setIsEditing(false);
        setSaveMessage('Profile updated successfully!');
        // Clear message after 3 seconds
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        // Get specific error message from response
        const errorData = await response.json().catch(() => null);
        console.log('Error response data:', errorData);
        
        let errorMessage;
        if (response.status === 401) {
          errorMessage = 'Invalid authentication token. Please sign out and sign back in.';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to update this profile.';
        } else if (response.status === 404) {
          errorMessage = 'User profile not found.';
        } else if (response.status === 422) {
          errorMessage = errorData?.detail || 'Invalid profile data. Please check your inputs.';
        } else {
          errorMessage = errorData?.detail || `Failed to update profile (${response.status})`;
        }
        
        setSaveMessage(`Error updating profile: ${errorMessage}`);
        setTimeout(() => setSaveMessage(''), 8000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setSaveMessage('Error updating profile: Unable to connect to server. Please check your connection and try again.');
      } else {
        setSaveMessage('Error updating profile: An unexpected error occurred. Please try again.');
      }
      setTimeout(() => setSaveMessage(''), 8000);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEditing = () => {
    // Reset to original values
    setEditedProfile({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      bio: user.bio || '',
      location: user.location || ''
    });
    setIsEditing(false);
    setSaveMessage('');
  };

  const handleEditToggle = () => {
    if (isEditing) {
      const hasChanges = JSON.stringify(editedProfile) !== JSON.stringify({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || ''
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
  
  if (!loggedIn || !user) {
    return null;
  }

  const getExpertById = (expertId: string) => experts.find(e => e.id === expertId);

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
                    <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <button className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary/90 rounded-full p-2 text-primary-foreground">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
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
                        Joined {safeFormatDate(user.created_at || user.joinDate, 'MMM yyyy')}
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
                    {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
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
            <Card className={`mb-4 ${saveMessage.includes('Error') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${saveMessage.includes('Error') ? 'text-red-800' : 'text-green-800'}`}>
                    {saveMessage}
                  </p>
                  {saveMessage.includes('Error') && isEditing && (
                    <Button 
                      size="sm" 
                      onClick={saveProfileChanges}
                      disabled={isSaving}
                      variant="outline"
                      className="ml-4 border-red-300 text-red-700 hover:bg-red-100"
                    >
                      {isSaving ? 'Retrying...' : 'Retry'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="bookings">Bookings ({userBookings.length})</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
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
                        onChange={(e) => handleProfileInputChange('name', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedProfile.email}
                        onChange={(e) => handleProfileInputChange('email', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={editedProfile.phone}
                        onChange={(e) => handleProfileInputChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={editedProfile.location}
                        onChange={(e) => handleProfileInputChange('location', e.target.value)}
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
                      onChange={(e) => handleProfileInputChange('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                      disabled={!isEditing}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings" className="space-y-6 mt-6">
              <div className="grid gap-4">
                {userBookings.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="font-semibold mb-2">No bookings yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start your journey by booking a consultation with one of our experts.
                      </p>
                      <Button>Browse Experts</Button>
                    </CardContent>
                  </Card>
                ) : (
                  userBookings.map((booking) => {
                    const expert = getExpertById(booking.expertId);
                    if (!expert) return null;

                    return (
                      <Card key={booking.id}>
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={expert.profileImage} alt={expert.name} />
                                <AvatarFallback>{expert.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold">{expert.name}</h4>
                                <p className="text-sm text-muted-foreground">{expert.title}</p>
                              </div>
                            </div>

                            <div className="flex-1 grid md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Service:</span>
                                <p className="font-medium">{booking.service}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Date & Time:</span>
                                <p className="font-medium">
                                  {safeFormatDate(booking.dateTime, 'MMM dd, yyyy')}
                                  <br />
                                  {safeFormatDate(booking.dateTime, 'h:mm a')}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Status:</span>
                                <br />
                                <Badge 
                                  variant={
                                    booking.status === 'confirmed' ? 'default' :
                                    booking.status === 'pending' ? 'secondary' :
                                    booking.status === 'completed' ? 'outline' : 'destructive'
                                  }
                                  className="text-xs"
                                >
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <div className="text-lg font-bold text-primary">
                                LKR {booking.amount}
                              </div>
                              <div className="flex gap-2">
                                {booking.status === 'confirmed' && (
                                  <Button size="sm" variant="outline">
                                    Join Meeting
                                  </Button>
                                )}
                                {booking.status === 'completed' && (
                                  <Button size="sm" variant="outline">
                                    Leave Review
                                  </Button>
                                )}
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
                      <span className="text-sm text-muted-foreground">Saving...</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about your bookings
                      </p>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      checked={preferences.email_notifications}
                      onCheckedChange={(checked) => handlePreferenceChange('email_notifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive SMS reminders before consultations
                      </p>
                    </div>
                    <Switch 
                      id="sms-notifications" 
                      checked={preferences.sms_notifications}
                      onCheckedChange={(checked) => handlePreferenceChange('sms_notifications', checked)}
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
                      onCheckedChange={(checked) => handlePreferenceChange('marketing_emails', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Privacy Settings
                    {savingPreferences && (
                      <span className="text-sm text-muted-foreground">Saving...</span>
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
                      onCheckedChange={(checked) => handlePreferenceChange('profile_visibility', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="contact-visibility">Contact Information</Label>
                      <p className="text-sm text-muted-foreground">
                        Show your contact details to booked experts
                      </p>
                    </div>
                    <Switch 
                      id="contact-visibility" 
                      checked={preferences.contact_visibility}
                      onCheckedChange={(checked) => handlePreferenceChange('contact_visibility', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                  
                  <Button>Update Password</Button>
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

      <Footer />

    </div>
  );
};


export default Profile;
