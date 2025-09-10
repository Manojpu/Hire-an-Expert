import React from "react";
import ApplyGig from "./ApplyGig";

const CreateGig = () => {
  return (
    <div>
      <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold">Create a Gig</h1>
      <p className="text-muted-foreground mt-2">Expert application wizard will go here.</p>
      </div>
      <div>
        <ApplyGig />
      </div>
    </div>
  );
};

export default CreateGig;
