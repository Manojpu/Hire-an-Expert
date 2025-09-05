import { useState, useEffect } from "react";
import { useGigs } from "../hooks/useGigs";
import { CreateGigForm } from "./CreateGigForm";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { toast } from "./ui/use-toast";

/**
 * Component for experts to manage their gigs
 */
export function ExpertGigManager() {
  const { gigs, loading, error, loadGigs, deleteGig } = useGigs();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // We would normally filter gigs by the current expert's ID
  // For demonstration purposes, we're showing all gigs
  useEffect(() => {
    loadGigs();
  }, [loadGigs]);

  const handleDelete = async (id: string) => {
    try {
      await deleteGig(id);
      toast({
        title: "Success",
        description: "Gig deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete gig",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Services</h2>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button>Create New Service</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
              <DialogDescription>
                Add a new service that clients can book.
              </DialogDescription>
            </DialogHeader>
            <CreateGigForm />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading your services...</div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => loadGigs()}>Retry</Button>
        </div>
      ) : gigs.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent className="pt-6">
            <p className="mb-4">You haven't created any services yet.</p>
            <Button onClick={() => setShowCreateForm(true)}>
              Create Your First Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {gigs.map((gig) => (
            <Card key={gig.id}>
              <CardHeader>
                <CardTitle>{gig.title}</CardTitle>
                <CardDescription>${gig.price.toFixed(2)}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-2">{gig.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(gig.id)}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
