import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth/AuthContext';

/**
 * Smart redirect component that routes users to their appropriate dashboard
 * based on their role after login/signup
 */
const DashboardRedirect: React.FC = () => {
  const { user, loading, loggedIn } = useAuth();
  const navigate = useNavigate();
  const [redirectAttempts, setRedirectAttempts] = useState(0);

  useEffect(() => {
    // Wait for auth state to load
    if (loading) return;

    // If not logged in, redirect to home
    if (!loggedIn || !user) {
      console.log('🏠 User not logged in, redirecting to home');
      navigate('/', { replace: true });
      return;
    }

    // If logged in and user has a role, redirect to appropriate dashboard
    if (user.role) {
      const normalizedRole = user.role.toLowerCase();
      
      console.log(`🎯 Redirecting user with role: ${normalizedRole}`);
      
      switch (normalizedRole) {
        case 'expert':
          navigate('/expert', { replace: true });
          break;
        case 'client':
          navigate('/client-dashboard', { replace: true });
          break;
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        default:
          // Default to client dashboard if role is unknown
          console.warn(`⚠️ Unknown role: ${user.role}, defaulting to client dashboard`);
          navigate('/client-dashboard', { replace: true });
          break;
      }
    } else if (redirectAttempts < 5) {
      // If user exists but role is not loaded yet, wait a bit and retry
      console.log(`⏳ User role not loaded yet, attempt ${redirectAttempts + 1}/5`);
      const timer = setTimeout(() => {
        setRedirectAttempts(prev => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // After 5 attempts (5 seconds), default to client dashboard
      console.warn('❌ User role not loaded after 5 seconds, defaulting to client dashboard');
      navigate('/client-dashboard', { replace: true });
    }
  }, [user, loading, loggedIn, navigate, redirectAttempts]);

  // Show loading spinner while determining redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">
          {loading ? 'Loading authentication...' : 'Redirecting to your dashboard...'}
        </p>
        {redirectAttempts > 2 && (
          <p className="text-xs text-muted-foreground">Loading user profile... ({redirectAttempts}/5)</p>
        )}
        {!loggedIn && !loading && (
          <p className="text-xs text-muted-foreground">Redirecting to home...</p>
        )}
      </div>
    </div>
  );
};

export default DashboardRedirect;