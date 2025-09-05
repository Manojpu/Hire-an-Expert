import { useEffect } from "react";
import { useGigs } from "../hooks/useGigs";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

/**
 * Component that displays a list of gigs
 */
export function GigsList() {
  const { gigs, loading, error, loadGigs } = useGigs();

  useEffect(() => {
    // Load gigs when component mounts
    loadGigs();
  }, [loadGigs]);

  if (loading) {
    return <div className="py-8 text-center">Loading gigs...</div>;
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => loadGigs()}>Try Again</Button>
      </div>
    );
  }

  if (gigs.length === 0) {
    return <div className="py-8 text-center">No gigs available.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
      {gigs.map((gig) => (
        <Card key={gig.id} className="overflow-hidden">
          <CardHeader>
            <CardTitle>{gig.title}</CardTitle>
            <CardDescription>${gig.price.toFixed(2)}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{gig.description}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="sm">
              View Details
            </Button>
            <Button size="sm">Book Now</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
