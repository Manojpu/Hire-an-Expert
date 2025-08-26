import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'client' | 'expert' | 'admin';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { state } = useAuth();

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && state.user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};