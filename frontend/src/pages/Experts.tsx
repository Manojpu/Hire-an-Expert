import React from "react";
import { MOCK_EXPERTS } from "@/data/mockExperts";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Experts = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">All Experts</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_EXPERTS.map((expert) => (
          <Card key={expert.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <img src={expert.profileImage} alt={expert.name} className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <div className="font-medium">{expert.name}</div>
                  <div className="text-sm text-muted-foreground">{expert.title}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Link to={`/expert/${expert.slug}`} className="flex-1 mr-2">
                  <Button className="w-full bg-gradient-primary">View Profile</Button>
                </Link>
                <Link to={`/book/${expert.id}`}>
                  <Button variant="outline">Book</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Experts;
