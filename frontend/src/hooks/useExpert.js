// useExpert.ts - Custom hook for expert user checks
import React from 'react';
import { useAuth } from '../context/auth/AuthContext';

export function useExpert() {
  const { user, userProfile, loggedIn } = useAuth();
  
  // Check if user is an expert based on multiple criteria
  const isExpert = Boolean(
    user && (
      user.isExpert || 
      user.role === 'expert' || 
      userProfile?.is_expert ||
      userProfile?.role === 'expert'
    )
  );
  
  // Check if user is a regular customer
  const isCustomer = Boolean(
    user && !isExpert && (
      user.role === 'customer' || 
      userProfile?.role === 'customer' ||
      (!user.role && !userProfile?.role) // Default to customer
    )
  );
  
  // Check if user is an admin
  const isAdmin = Boolean(
    user && (
      user.role === 'admin' || 
      userProfile?.role === 'admin'
    )
  );
  
  return {
    isExpert,
    isCustomer,
    isAdmin,
    userRole: user?.role || userProfile?.role || 'customer',
    user,
    loggedIn
  };
}

// Higher-order component for expert-only routes
export function withExpertOnly(Component) {
  return function ExpertOnlyComponent(props) {
    const { isExpert, loggedIn } = useExpert();
    
    if (!loggedIn) {
      return <div>Please log in to access this page</div>;
    }
    
    if (!isExpert) {
      return <div>Access denied. Expert privileges required.</div>;
    }
    
    return <Component {...props} />;
  };
}

// Component for conditional rendering based on user type
export function ExpertOnly({ children, fallback = null }) {
  const { isExpert } = useExpert();
  return isExpert ? children : fallback;
}

export function CustomerOnly({ children, fallback = null }) {
  const { isCustomer } = useExpert();
  return isCustomer ? children : fallback;
}

export function AdminOnly({ children, fallback = null }) {
  const { isAdmin } = useExpert();
  return isAdmin ? children : fallback;
}
