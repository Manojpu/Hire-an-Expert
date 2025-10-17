import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  MessageCircle, 
  Share2, 
  Heart,                            
  Trophy,
  Users,
  ArrowLeft
} from 'lucide-react';
import Header from '@/components/navigation/Header';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { userServiceAPI, ExpertData } from '@/services/userService';
import { gigServiceAPI } from '@/services/gigService';
import { Gig } from '@/types/publicGigs';

const ExpertProfile = () => {
  const { id: expertId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [expert, setExpert] = useState<ExpertData | null>(null);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [gigsLoading, setGigsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch expert data from backend
  useEffect(() => {
    const fetchExpertData = async () => {
      if (!expertId) {
        setError('No expert ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('🔄 Fetching expert profile for Firebase UID:', expertId);

        // Fetch expert data from user service
        const expertData = await userServiceAPI.getUserByFirebaseUid(expertId);
        console.log('✅ Expert data loaded successfully:', expertData);
        console.log('✅ is_expert value:', expertData.is_expert, 'type:', typeof expertData.is_expert);
        
        // TEMPORARILY DISABLED - Check if user is actually an expert
        // if (!expertData.is_expert) {
        //   console.warn('⚠️ User is not an expert:', expertData);
        //   setError('This user is not registered as an expert.');
        //   setLoading(false);
        //   return;
        // }
        
        console.log('✅ Setting expert data (is_expert check disabled for testing)');
        setExpert(expertData);
        setError('');
        console.log('✅ Expert state updated, expert is now:', expertData);

        // Fetch expert's gigs
        setGigsLoading(true);
        try {
          const response = await gigServiceAPI.getPublic({});
          const expertGigs = response.gigs.filter((gig: Gig) => gig.expert_id === expertId);
          console.log('✅ Expert gigs filtered:', expertGigs.length, 'gigs');
          setGigs(expertGigs);
        } catch (gigsErr) {
          console.error('❌ Error loading expert gigs:', gigsErr);
        } finally {
          setGigsLoading(false);
        }
      } catch (err) {
        console.error('❌ Error fetching expert data:', err);
        setError('Failed to load expert profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchExpertData();
  }, [expertId]);                         

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-12 flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading expert profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show error state
  console.log('🔍 Render check - error:', error, 'expert:', expert);
  
  if (error || !expert) {
    console.log('❌ Showing error state because:', { hasError: !!error, expertIsNull: !expert });
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-12 flex items-center justify-center min-h-[70vh]">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">Expert Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error || "The expert profile you're looking for doesn't exist or has been removed."}
            </p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  console.log('✅ Rendering expert profile for:', expert?.name);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              {expert.profile_image_url ? (
                <img
                  src={expert.profile_image_url}
                  alt={expert.name}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
                  <Users className="h-12 w-12 text-slate-500" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{expert.name}</h1>
                    {expert.bio && (
                      <p className="text-muted-foreground mb-3">{expert.bio}</p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className="bg-green-100 text-green-800">
                        {expert.role === 'expert' ? 'Verified Expert' : expert.role}
                      </Badge>
                      {expert.is_expert && (
                        <Badge className="bg-blue-100 text-blue-800">
                          Expert Member
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {expert.email && (
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">{expert.email}</span>
                    </div>
                  )}
                  {expert.phone && (
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">{expert.phone}</span>
                    </div>
                  )}
                  {expert.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">{expert.location}</span>
                    </div>
                  )}
                  {expert.created_at && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">
                        Member since {new Date(expert.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expert Specializations */}
        {expert.expert_profiles && expert.expert_profiles.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Specializations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expert.expert_profiles.map((profile) => (
                  <div key={profile.id} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Trophy className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{profile.specialization}</h3>
                        {profile.is_verified && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      {profile.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {profile.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services Offered */}
        <Card>
          <CardHeader>
            <CardTitle>Services Offered</CardTitle>
          </CardHeader>
          <CardContent>
            {gigsLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading services...</p>
              </div>
            ) : gigs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No services available at the moment.
              </p>
            ) : (
              <div className="space-y-4">
                {gigs.map((gig) => (
                  <Card
                    key={gig.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/gig/${gig.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">
                            {gig.service_description || 'Service'}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{gig.response_time || '< 24 hours'}</span>
                            </div>
                            {gig.category?.name && (
                              <span className="capitalize">{gig.category.name}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">
                            {gig.currency} {gig.hourly_rate?.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">per hour</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Contact Expert</h3>
            <div className="flex gap-3">
              <Button className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              {gigs.length > 0 && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/gig/${gigs[0].id}/book`)}
                >
                  Book Consultation
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default ExpertProfile;
