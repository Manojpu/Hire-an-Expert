import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGigs } from "../hooks/useGigs";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";

/**
 * Page component for displaying a single gig's details
 */
export function GigDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentGig, loading, error, loadGig } = useGigs();

  useEffect(() => {
    if (id) {
      loadGig(id);
    }
  }, [id, loadGig]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-4 w-1/4 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => loadGig(id!)}>Try Again</Button>
        <Button variant="outline" onClick={() => navigate(-1)} className="ml-4">
          Go Back
        </Button>
      </div>
    );
  }

  if (!currentGig) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="mb-4">Gig not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{currentGig.title}</CardTitle>
          <CardDescription>
            Price: ${currentGig.price.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>{currentGig.description}</p>
          <div className="mt-6 text-sm text-gray-500">
            <p>
              Created: {new Date(currentGig.created_at).toLocaleDateString()}
            </p>
            <p>Expert ID: {currentGig.expert_id}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back to Gigs
          </Button>
          <Button>Book This Service</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default GigDetails;
