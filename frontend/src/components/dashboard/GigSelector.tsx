import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ChevronRight, Star, DollarSign, Users } from 'lucide-react';
import { ExpertGig, gigServiceAPI } from '@/services/gigService';

interface GigSelectorProps {
  onGigSelect: (gig: ExpertGig) => void;
  onCreateNew: () => void;
  onViewOverall: () => void;
}

const GigSelector: React.FC<GigSelectorProps> = ({ onGigSelect, onCreateNew, onViewOverall }) => {
  const [gigs, setGigs] = useState<ExpertGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGigs();
  }, []);

  const loadGigs = async () => {
    try {
      setLoading(true);
      const myGigs = await gigServiceAPI.getMyGigs();
      setGigs(myGigs);
      setError(null);
    } catch (err) {
      console.error('Error loading gigs:', err);
      setError('Unable to load your gigs at this time. The gig service may be offline.');
      // Don't clear existing gigs on error, keep them if they exist
    } finally {
      setLoading(false);
    }
  };

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
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading your gigs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Expert Dashboard</h1>
            <p className="text-muted-foreground">
              Select a gig to manage or view your overall expert profile
            </p>
          </div>

          {/* Error State */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600">⚠️</div>
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800 mb-2">Service Temporarily Unavailable</h3>
                <p className="text-sm text-yellow-700 mb-4">
                  {error} You can still access the expert dashboard features below.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={loadGigs}>
                    Try Again
                  </Button>
                  <Button variant="outline" size="sm" onClick={onCreateNew}>
                    Create New Gig
                  </Button>
                  <Button variant="outline" size="sm" onClick={onViewOverall}>
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions when there's an error */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overall Expert Profile Card */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onViewOverall}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Overall Expert Profile</span>
                  <ChevronRight className="h-5 w-5" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  View your complete expert profile and account settings
                </p>
                <Button onClick={onViewOverall}>View Profile</Button>
              </CardContent>
            </Card>

            {/* Create New Gig Card */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-dashed" onClick={onCreateNew}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Create New Gig</span>
                  <Plus className="h-5 w-5" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Start offering a new service by creating a new gig
                </p>
                <Button onClick={onCreateNew} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Gig
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Expert Dashboard</h1>
          <p className="text-muted-foreground">
            Select a gig to manage or view your overall expert profile
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Overall Expert Profile Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Overall Expert Profile</span>
                <ChevronRight className="h-5 w-5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                View your complete expert profile, all gigs summary, and account settings
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {gigs.length} Gigs
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Total Revenue
                  </span>
                </div>
                <Button onClick={onViewOverall}>View Profile</Button>
              </div>
            </CardContent>
          </Card>

          {/* Create New Gig Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Create New Gig</span>
                <Plus className="h-5 w-5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Start offering a new service by creating a new gig
              </p>
              <Button onClick={onCreateNew} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Gig
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Existing Gigs */}
        {gigs.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Gigs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gigs.map((gig) => (
                <Card key={gig.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{gig.title}</CardTitle>
                        <p className="text-sm text-muted-foreground capitalize">{gig.category.replace('-', ' ')}</p>
                      </div>
                      <Badge className={getStatusColor(gig.status)}>
                        {gig.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {gig.bio || gig.service_description}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {gig.rating.toFixed(1)}
                        </span>
                        <span>{gig.total_reviews} reviews</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Rs. {gig.hourly_rate}/hr
                        </span>
                        <span>{gig.total_consultations} consultations</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => onGigSelect(gig)} 
                      className="w-full"
                      variant={gig.status === 'active' ? 'default' : 'outline'}
                    >
                      Manage Gig
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {gigs.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-4">
              <Users className="h-16 w-16 mx-auto text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No gigs yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first gig to start offering your services
            </p>
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Gig
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GigSelector;
