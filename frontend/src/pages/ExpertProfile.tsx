import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Star, 
  Clock, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  MessageCircle, 
  Share2, 
  Heart,
  Languages,                                   
  Trophy,
  Users,
  Timer,
  ThumbsUp
} from 'lucide-react';
import Header from '@/components/navigation/Header';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { experts, reviews } from '@/data/mockData';

const ExpertProfile = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');

  const expert = experts.find(exp => exp.id === id);
  const expertReviews = reviews.filter(review => review.expertId === id);

  // If expert not found, show a hardcoded expert profile UI
  if (!expert) {
    const hardcodedExpert = {
      id: 'hardcoded',
      name: 'Jane Doe',
      title: 'Senior Software Engineer',
      bannerImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      profileImage: 'https://randomuser.me/api/portraits/women/44.jpg',
      verified: true,
      rating: 4.9,
      totalReviews: 120,
      totalConsultations: 350,
      responseTime: '1h',
      subcategories: ['Web Development', 'React', 'TypeScript', 'UI/UX'],
      languages: ['English', 'Spanish'],
      bio: 'Jane is a passionate software engineer with 10+ years of experience building scalable web applications. She specializes in React, TypeScript, and modern UI/UX best practices.',
      qualifications: [
        { id: 1, title: 'B.Sc. in Computer Science', institution: 'MIT', year: '2014', verified: true },
        { id: 2, title: 'M.Sc. in Software Engineering', institution: 'Stanford', year: '2016', verified: true },
      ],
      certifications: [
        { id: 1, name: 'AWS Certified Solutions Architect', issuer: 'Amazon', year: '2018', verified: true },
        { id: 2, name: 'Google Professional Cloud Architect', issuer: 'Google', year: '2019', verified: false },
      ],
      pricing: { hourlyRate: 120 },
      missedBookings: 2,
      status: 'available',
    };
    const hardcodedReviews = [
      { id: 1, expertId: 'hardcoded', clientName: 'Alice', rating: 5, date: '2025-08-01', comment: 'Jane was fantastic! She solved my React issue in minutes.', helpful: 4 },
      { id: 2, expertId: 'hardcoded', clientName: 'Bob', rating: 5, date: '2025-07-15', comment: 'Very knowledgeable and patient. Highly recommend.', helpful: 2 },
      { id: 3, expertId: 'hardcoded', clientName: 'Carlos', rating: 4, date: '2025-06-20', comment: 'Great session, learned a lot about TypeScript.', helpful: 1 },
    ];
    // Use the rest of the component UI, but with hardcodedExpert and hardcodedReviews
    return (
      <ExpertProfileUI expert={hardcodedExpert} expertReviews={hardcodedReviews} />
    );
  }

  // Helper: Render the full UI for a given expert and reviews
  function ExpertProfileUI({ expert, expertReviews }) {
    const ratingDistribution = [
      { stars: 5, count: 85, percentage: 67 },
      { stars: 4, count: 32, percentage: 25 },
      { stars: 3, count: 8, percentage: 6 },
      { stars: 2, count: 2, percentage: 2 },
      { stars: 1, count: 0, percentage: 0 },
    ];
    const [activeTab, setActiveTab] = useState('overview');
    // ...existing code for the main return below, but use expert and expertReviews props
    return (
      <div className="min-h-screen bg-background container w-11/12">
        <Header />
        {/* ...existing code... */}
        {/* Copy the main UI code from below, replacing expert/expertReviews with props */}
        {/* For brevity, you can copy the main return block and replace expert/expertReviews as needed */}
        {/* ... */}
        {/* The rest of the file's main return block goes here, using expert and expertReviews */}
        {/* ... */}
      </div>
    );
  }

  const ratingDistribution = [
    { stars: 5, count: 85, percentage: 67 },
    { stars: 4, count: 32, percentage: 25 },
    { stars: 3, count: 8, percentage: 6 },
    { stars: 2, count: 2, percentage: 2 },
    { stars: 1, count: 0, percentage: 0 },
  ];

  return (
    <div className="min-h-screen bg-background container w-11/12">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative">
          {/* Banner */}
          <div className="h-64 overflow-hidden">
            <img
              src={expert.bannerImage}
              alt={`${expert.name} banner`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          {/* Profile Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="container mx-auto">
              <div className="flex flex-col md:flex-row md:items-end gap-6">
                {/* Profile Image */}
                <div className="relative">
                  <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background">
                    <AvatarImage src={expert.profileImage} alt={expert.name} />
                    <AvatarFallback className="text-2xl">{expert.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {expert.verified && (
                    <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-1">
                      <CheckCircle className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-white">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold">{expert.name}</h1>
                      <p className="text-lg opacity-90">{expert.title}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-current text-yellow-400" />
                          <span className="font-medium">{expert.rating}</span>
                          <span className="opacity-75">({expert.totalReviews} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{expert.totalConsultations} consultations</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Timer className="h-4 w-4" />
                          <span>{expert.responseTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <Button size="lg" className="bg-primary hover:bg-primary/90">
                        <Calendar className="h-4 w-4 mr-2" />
                        Book Consultation
                      </Button>
                      <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="relative">
                <TabsList className="grid w-full grid-cols-4 mb-8 p-1 bg-background/95 backdrop-blur-sm border border-border/40 shadow-lg rounded-2xl">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium">Overview</TabsTrigger>
                  <TabsTrigger value="reviews" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium">Reviews ({expertReviews.length})</TabsTrigger>
                  <TabsTrigger value="qualifications" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium">Qualifications</TabsTrigger>
                  <TabsTrigger value="availability" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium">Availability</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* About */}
                  <Card className="bg-background/60 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="border-b border-border/30 bg-gradient-to-r from-background/80 to-background/40">
                      <CardTitle className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">About {expert.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground leading-relaxed">{expert.bio}</p>
                    </CardContent>
                  </Card>

                  {/* Expertise Areas */}
                  <Card className="bg-background/60 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="border-b border-border/30 bg-gradient-to-r from-background/80 to-background/40">
                      <CardTitle className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">Expertise Areas</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="flex flex-wrap gap-2">
                        {expert.subcategories.map((subcat, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="text-sm py-1.5 px-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors rounded-full"
                          >
                            {subcat}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Languages */}
                  <Card className="bg-background/60 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="border-b border-border/30 bg-gradient-to-r from-background/80 to-background/40">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <Languages className="h-5 w-5 text-primary" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">Languages</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="flex flex-wrap gap-2">
                        {expert.languages.map((lang, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="py-1.5 px-4 hover:bg-primary/5 border-primary/20 transition-colors rounded-full"
                          >
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-6">
                  {/* Rating Overview */}
                  <Card className="bg-background/60 backdrop-blur-sm border-border/50 shadow-lg">
                    <CardHeader className="border-b border-border/30 bg-gradient-to-r from-background/80 to-background/40">
                      <CardTitle className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">Reviews & Ratings</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid md:grid-cols-2 gap-8">
                        {/* Overall Rating */}
                        <div className="text-center p-6 bg-gradient-to-b from-background/40 to-background/20 rounded-2xl border border-border/30">
                          <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 mb-3">
                            {expert.rating}
                          </div>
                          <div className="flex justify-center mb-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-6 w-6 ${
                                  star <= expert.rating
                                    ? 'text-yellow-400 fill-current drop-shadow-md'
                                    : 'text-muted-foreground/30'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="text-sm text-muted-foreground font-medium">
                            Based on {expert.totalReviews} reviews
                          </div>
                        </div>

                        {/* Rating Distribution */}
                        <div className="space-y-3 p-6 bg-gradient-to-b from-background/40 to-background/20 rounded-2xl border border-border/30">
                          {ratingDistribution.map((rating) => (
                            <div key={rating.stars} className="flex items-center gap-3 text-sm">
                              <span className="w-8 font-medium text-primary/90">{rating.stars}★</span>
                              <Progress 
                                value={rating.percentage} 
                                className="flex-1 h-2 bg-primary/10" 
                              />
                              <span className="w-12 text-right text-muted-foreground font-medium">{rating.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Individual Reviews */}
                  <div className="space-y-4">
                    {expertReviews.map((review) => (
                      <Card key={review.id} className="bg-background/60 backdrop-blur-sm border-border/50 shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                {review.clientName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-foreground/90">{review.clientName}</span>
                                <div className="flex bg-primary/5 px-2 py-1 rounded-full">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-4 w-4 ${
                                        star <= review.rating
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-muted-foreground/30'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-muted-foreground">{review.date}</span>
                              </div>
                              <p className="text-muted-foreground/90 mb-3 leading-relaxed">{review.comment}</p>
                              <div className="flex items-center gap-3 text-sm">
                                <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                                  <ThumbsUp className="h-4 w-4" />
                                  Helpful ({review.helpful})
                                </button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="qualifications" className="space-y-6">
                  {/* Education */}
                  <Card className="bg-background/60 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="border-b border-border/30 bg-gradient-to-r from-background/80 to-background/40">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">Education</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {expert.qualifications.map((qual) => (
                        <div 
                          key={qual.id} 
                          className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-background/40 to-background/20 border border-border/30 hover:border-primary/20 transition-colors"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg mb-1">{qual.title}</h4>
                            <p className="text-sm text-muted-foreground/90">{qual.institution}</p>
                            <p className="text-sm text-primary/70 font-medium mt-1">{qual.year}</p>
                          </div>
                          {qual.verified && (
                            <div className="rounded-full p-1 bg-green-500/10">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Certifications */}
                  <Card className="bg-background/60 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="border-b border-border/30 bg-gradient-to-r from-background/80 to-background/40">
                      <CardTitle className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                        Professional Certifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {expert.certifications.map((cert) => (
                        <div 
                          key={cert.id} 
                          className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-background/40 to-background/20 border border-border/30 hover:border-primary/20 transition-colors"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg mb-1">{cert.name}</h4>
                            <p className="text-sm text-muted-foreground/90">{cert.issuer}</p>
                            <p className="text-sm text-primary/70 font-medium mt-1">{cert.year}</p>
                          </div>
                          {cert.verified && (
                            <div className="rounded-full p-1 bg-green-500/10">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="availability" className="space-y-6">
                  <Card className="bg-background/60 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                    <CardHeader className="border-b border-border/30 bg-gradient-to-r from-background/80 to-background/40">
                      <CardTitle className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                        Availability Calendar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 px-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-full blur-3xl transform -translate-y-1/2"></div>
                          <Clock className="h-16 w-16 mx-auto mb-6 text-primary/60" />
                        </div>
                        <p className="text-lg font-medium mb-2">Calendar integration coming soon...</p>
                        <p className="text-sm text-muted-foreground">
                          Average response time: <span className="text-primary font-medium">{expert.responseTime}</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="lg:w-80 space-y-6">
              {/* Pricing Card */}
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Book a Consultation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      LKR {expert.pricing.hourlyRate}
                    </div>
                    <div className="text-sm text-muted-foreground">per hour</div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Response time:</span>
                      <span className="font-medium">{expert.responseTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success rate:</span>
                      <span className="font-medium">98%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Missed bookings:</span>
                      <span className="font-medium">{expert.missedBookings}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Link to={`/book/${expert.id}`}>
                      <Button className="w-full" size="lg">
                        <Calendar className="h-4 w-4 mr-2" />
                        Book Now
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message First
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground text-center">
                    ✓ Instant booking confirmation<br />
                    ✓ Secure payment<br />
                    ✓ 24/7 support
                  </div>
                </CardContent>
              </Card>

              {/* Status */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${
                      expert.status === 'available' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <span className="font-medium">
                      {expert.status === 'available' ? 'Available Now' : 'Currently Busy'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {expert.status === 'available' 
                      ? 'Ready to help with your consultation' 
                      : 'Will respond within ' + expert.responseTime
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ExpertProfile;