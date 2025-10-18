import React, { useState, useEffect } from 'react';
import { ExpertGig } from '@/services/gigService';
import { reviewServiceAPI, Review } from '@/services/reviewService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Users, TrendingUp } from 'lucide-react';

interface GigReviewsProps {
  gig: ExpertGig;
}

const GigReviews: React.FC<GigReviewsProps> = ({ gig }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_reviews: 0,
    average_rating: 0,
    rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        console.log('Loading reviews for gig:', gig.id);
        const data = await reviewServiceAPI.getGigReviews(gig.id, 1, 50); // Max 50 per backend validation
        console.log('Reviews data received:', data);
        console.log('Reviews array:', data.reviews);
        console.log('Total reviews:', data.total);
        setReviews(data.reviews || []);
      } catch (error) {
        console.error('Error loading reviews:', error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    const loadStats = async () => {
      try {
        console.log('Loading stats for gig:', gig.id);
        const statsData = await reviewServiceAPI.getGigReviewStats(gig.id);
        console.log('Stats data received:', statsData);
        setStats(statsData);
      } catch (error) {
        console.error('Error loading review stats:', error);
      }
    };

    loadReviews();
    loadStats();
  }, [gig.id]);

  const getRatingPercentage = (rating: number) => {
    if (stats.total_reviews === 0) return 0;
    return Math.round((stats.rating_distribution[rating as keyof typeof stats.rating_distribution] / stats.total_reviews) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="h-8 w-8 fill-amber-500 text-amber-500" />
              <span className="text-3xl font-bold">
                {stats.average_rating > 0 ? stats.average_rating.toFixed(1) : 'N/A'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Based on {stats.total_reviews} {stats.total_reviews === 1 ? 'review' : 'reviews'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold">{stats.total_reviews}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Customer feedback
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-20">
                  <span className="text-sm font-medium">{rating}</span>
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                </div>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${getRatingPercentage(rating)}%` }}
                  />
                </div>
                <div className="w-16 text-right text-sm text-muted-foreground">
                  {getRatingPercentage(rating)}%
                </div>
                <div className="w-12 text-right text-sm font-medium">
                  {stats.rating_distribution[rating as keyof typeof stats.rating_distribution]}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>All Reviews ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-slate-50 dark:bg-slate-900">
              <Star className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
              <p className="text-muted-foreground">No reviews yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Reviews will appear here once customers book your service
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
                        <Users className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Customer Review</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {review.comment && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {review.comment}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs">
                    {review.is_active && (
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-500">
                        <span>Active</span>
                      </div>
                    )}
                    {review.helpful_count > 0 && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span>{review.helpful_count} found helpful</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GigReviews;
