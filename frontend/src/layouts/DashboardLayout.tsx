import React, { PropsWithChildren } from "react";
import { Outlet } from "react-router-dom";

const DashboardLayout: React.FC<PropsWithChildren> = ({ children }) => (
  <div className="min-h-screen bg-background">
    {children || <Outlet />}
  </div>
);

export default DashboardLayout;
