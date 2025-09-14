import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useAuth } from "@/context/auth/AuthContext.jsx";
import Login from "@/pages/Login.tsx";
import SignUp from "@/pages/Signup.tsx";

const Home = lazy(() => import("@/pages/Home"));
const Category = lazy(() => import("@/pages/GigCategory"));
const Expert = lazy(() => import("@/pages/Expert"));
const Book = lazy(() => import("@/pages/Book"));
const Chat = lazy(() => import("@/pages/Chat"));
const Profile = lazy(() => import("@/pages/Profile"));
const ExpertDashboard = lazy(() => import("@/pages/expert/ExpertDashboard"));
const Admin = lazy(() => import("@/pages/Admin"));
const BecomeExpert = lazy(() => import("@/pages/CreateGig"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const MyBookings = lazy(() => import("@/pages/MyBookings"));
const Experts = lazy(() => import("@/pages/Experts"));
const ClientDashboard = lazy(() => import("@/pages/ClientDashboard"));
const ExpertProfile = lazy(() => import("@/pages/ExpertProfile"));

const ProtectedRoute = ({ children, role, isExpert }: { children: JSX.Element; role?: string; isExpert?: boolean }) => {
  const { user, loggedIn } = useAuth();
  if (!loggedIn || !user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  if (isExpert && !user.isExpert) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => (
  <Suspense fallback={<div className="p-1">Loading...</div>}>
    <Routes>
      {/* Expert Dashboard - New gig-based structure */}
      <Route
        path="/expert/*"
        element={
          <ProtectedRoute isExpert={true}>
            <ExpertDashboard />
          </ProtectedRoute>
        }
      />

      {/* Legacy expert dashboard route - redirect to new structure */}
      <Route
        path="/expert-dashboard/*"
        element={<Navigate to="/expert" replace />}
      />

      {/* Standalone pages (no header/footer) */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Main layout with footer */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="categories" element={<Category />} />
        <Route path="category/:slug" element={<Category />} />
        <Route path="expert/:slug" element={<Expert />} />
        <Route
          path="book/:expertId"
          element={<Book />}
        />
        <Route
          path="chat/:conversationId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile/:userId"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/*"
          element={
            <ProtectedRoute role="admin">
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route path="create-gig" element={<BecomeExpert />} />
        <Route path="expert-profile" element={<ExpertProfile />} />
        <Route
          path="my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="client-dashboard"
          element={
            <ProtectedRoute role="client">
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
  <Route path="experts" element={<Experts />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  </Suspense>
);

export default AppRoutes;
