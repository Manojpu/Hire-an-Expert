
import { useState } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import { mockBookings, experts } from '@/data/mockData';
import { format } from 'date-fns';

const Profile = () => {
  const { state } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);

  const user = state.user;
  const userBookings = mockBookings.filter(booking => booking.clientId === user?.id);
  
  if (!user) {
    return null;
  }

  const getExpertById = (expertId: string) => experts.find(e => e.id === expertId);

  return (
    <div className="min-h-screen bg-background ">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
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
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {format(new Date(user.joinDate), 'MMM yyyy')}
                    </div>
                    {user.verified && (
                      <Badge variant="secondary" className="text-xs">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {isEditing ? 'Save Changes' : 'Edit Profile'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

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
                        defaultValue={user.name}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={user.email}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        defaultValue={user.location}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
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
                                  {format(new Date(booking.dateTime), 'MMM dd, yyyy')}
                                  <br />
                                  {format(new Date(booking.dateTime), 'h:mm a')}
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
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about your bookings
                      </p>
                    </div>
                    <Switch id="email-notifications" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive SMS reminders before consultations
                      </p>
                    </div>
                    <Switch id="sms-notifications" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing-emails">Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about new experts and features
                      </p>
                    </div>
                    <Switch id="marketing-emails" defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="profile-visibility">Public Profile</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow others to see your profile and reviews
                      </p>
                    </div>
                    <Switch id="profile-visibility" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="contact-visibility">Contact Information</Label>
                      <p className="text-sm text-muted-foreground">
                        Show your contact details to booked experts
                      </p>
                    </div>
                    <Switch id="contact-visibility" defaultChecked />
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
