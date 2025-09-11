import React, { useState, useEffect } from 'react';
import { ExpertGig, gigServiceAPI } from '@/services/gigService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Users, DollarSign, Calendar, Edit, FileText, IdCard, Upload } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import EarningsChart from '@/components/dashboard/EarningsChart';

interface OverallExpertProfileProps {
  onBack: () => void;
}

const OverallExpertProfile: React.FC<OverallExpertProfileProps> = ({ onBack }) => {
  const [gigs, setGigs] = useState<ExpertGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [expertData, setExpertData] = useState({
    id: 'EXP-2024-001',
    name: 'Dr. Rajesh Perera',
    email: 'rajesh.perera@example.com',
    phone: '+94 77 123 4567',
    nic: '199012345678',
    joinedDate: '2024-01-15',
    verified: true,
    profileImage: '/placeholder-avatar.jpg'
  });

  useEffect(() => {
    loadGigs();
  }, []);

  const loadGigs = async () => {
    try {
      setLoading(true);
      const myGigs = await gigServiceAPI.getMyGigs();
      setGigs(myGigs);
    } catch (error) {
      console.error('Error loading gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate aggregate statistics
  const aggregateStats = {
    totalGigs: gigs.length,
    activeGigs: gigs.filter(g => g.status === 'active').length,
    totalConsultations: gigs.reduce((sum, g) => sum + g.total_consultations, 0),
    totalReviews: gigs.reduce((sum, g) => sum + g.total_reviews, 0),
    averageRating: gigs.length > 0 
      ? gigs.reduce((sum, g) => sum + g.rating, 0) / gigs.length 
      : 0,
    totalRevenue: gigs.reduce((sum, g) => sum + (g.hourly_rate * g.total_consultations * 0.8), 0), // Estimated
    monthlyRevenue: 125000, // Mock data
    weeklyRevenue: 35000, // Mock data
  };

  const chartData = [
    { date: '2024-01-01', revenue: 15000 },
    { date: '2024-01-02', revenue: 18000 },
    { date: '2024-01-03', revenue: 22000 },
    { date: '2024-01-04', revenue: 19000 },
    { date: '2024-01-05', revenue: 25000 },
    { date: '2024-01-06', revenue: 28000 },
    { date: '2024-01-07', revenue: 32000 },
    { date: '2024-01-08', revenue: 29000 },
    { date: '2024-01-09', revenue: 35000 },
    { date: '2024-01-10', revenue: 38000 },
    { date: '2024-01-11', revenue: 42000 },
    { date: '2024-01-12', revenue: 45000 },
    { date: '2024-01-13', revenue: 48000 },
    { date: '2024-01-14', revenue: 52000 },
    { date: '2024-01-15', revenue: 55000 }
  ];

  const getStatusColor = (status: ExpertGig['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
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
              <h1 className="text-3xl font-bold">Expert Profile</h1>
              <p className="text-muted-foreground">Overall account and performance overview</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onBack}>
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
                  <label className="text-sm font-medium text-muted-foreground">Expert ID</label>
                  <div className="font-mono text-sm mt-1">{expertData.id}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <div className="mt-1">{expertData.name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="mt-1">{expertData.email}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <div className="mt-1">{expertData.phone}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">NIC Number</label>
                  <div className="mt-1 font-mono">{expertData.nic}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Joined Date</label>
                  <div className="mt-1">{new Date(expertData.joinedDate).toLocaleDateString()}</div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Verification Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={expertData.verified ? "default" : "secondary"}>
                        {expertData.verified ? "Verified Expert" : "Pending Verification"}
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
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium text-sm">NIC Copy</div>
                    <div className="text-xs text-muted-foreground">Uploaded</div>
                  </div>
                  <Badge variant="outline" className="text-green-600">Verified</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium text-sm">Educational Certificates</div>
                    <div className="text-xs text-muted-foreground">3 files</div>
                  </div>
                  <Badge variant="outline" className="text-green-600">Verified</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium text-sm">Professional License</div>
                    <div className="text-xs text-muted-foreground">1 file</div>
                  </div>
                  <Badge variant="outline" className="text-yellow-600">Pending</Badge>
                </div>
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
                <span className="text-lg font-semibold">Rs. {aggregateStats.weeklyRevenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="text-lg font-semibold">Rs. {aggregateStats.monthlyRevenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Earned</span>
                <span className="text-lg font-semibold">Rs. {aggregateStats.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">Total Reviews</span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {aggregateStats.totalReviews}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

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
                {gigs.map(gig => (
                  <div key={gig.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{gig.title}</h3>
                        <Badge className={getStatusColor(gig.status)}>
                          {gig.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 capitalize">
                        {gig.category.replace('-', ' ')} • Rs. {gig.hourly_rate.toLocaleString()}/hr
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="text-center">
                        <div className="font-medium text-foreground">{gig.rating.toFixed(1)}</div>
                        <div>Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-foreground">{gig.total_reviews}</div>
                        <div>Reviews</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-foreground">{gig.total_consultations}</div>
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
