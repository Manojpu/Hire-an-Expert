import React from "react";
import { Outlet } from "react-router-dom";
import Header from "@/components/navigation/Header";
import Footer from "@/components/ui/footer";

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface text-foreground bg-gradient-to-b from-primary-50/30 to-white">
      <Header />
      <main className="mx-auto py-8">
        <Outlet />
      </main>
      {/* <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ExpertConnect — Connecting you with verified experts.
        </div>
      </footer> */}
      <Footer />
    </div>
  );
};

export default MainLayout;
