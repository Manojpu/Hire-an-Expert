import React from "react";
import ApplyExpert from "./ApplyExpert";

const BecomeExpert = () => {
  return (
    <div>
      <div className="container mx-auto py-5 w-11/12">
        <h1 className="text-2xl font-bold">Become an Expert</h1>
        <p className="text-muted-foreground mt-2">Expert application wizard will go here.</p>
      </div>
      <div>
        <ApplyExpert/>
      </div>
    </div>
  );
};

export default BecomeExpert;
