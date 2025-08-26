import React from "react";
import ApplyExpert from "./ApplyExpert";

const BecomeExpert = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold">Become an Expert</h1>
      <p className="text-muted-foreground mt-2">Expert application wizard will go here.</p>
      <div>
        <ApplyExpert/>
      </div>
    </div>
  );
};

export default BecomeExpert;
