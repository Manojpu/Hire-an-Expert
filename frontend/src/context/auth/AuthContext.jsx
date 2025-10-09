// AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../../firebase/firebase";
import { onAuthStateChanged, getIdToken } from "firebase/auth";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null); // Firebase user
  const [userProfile, setUserProfile] = useState(null); // User service profile
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    
    // Set up token refresh interval (refresh every 50 minutes)
    const tokenRefreshInterval = setInterval(async () => {
      if (firebaseUser) {
        try {
          console.log("🔄 Refreshing Firebase token...");
          await getIdToken(firebaseUser, true); // Force refresh
          console.log("✅ Token refreshed successfully");
        } catch (error) {
          console.error("❌ Token refresh failed:", error);
          // Firebase will handle automatic logout if refresh fails
        }
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => {
      unsubscribe();
      clearInterval(tokenRefreshInterval);
    };
  }, [firebaseUser]);

  async function initializeUser(currentUser) {
    if (currentUser) {
      setFirebaseUser(currentUser);
      setLoggedIn(true);

      // Fetch user profile from User Service
      try {
        const idToken = await getIdToken(currentUser);
        const response = await fetch(
          `${import.meta.env.VITE_USER_SERVICE_URL}/users/firebase/${
            currentUser.uid
          }`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Fetching user profile from User Service", response);
        console.log("Response status:", response.status);
        console.log("Response data:", await response.clone().text());

        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);
          console.log("✅ User profile loaded:", profile);
        } else {
          console.warn("Failed to load user profile from User Service");
          setUserProfile(null);
          
          // If user service fails with 401/403, it might mean token is invalid
          if (response.status === 401 || response.status === 403) {
            console.warn("🔒 Authentication failed - user will be signed out");
            // Don't set loggedIn to false here, let Firebase handle it
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
        
        // Check if it's a network error vs auth error
        if (error.message.includes('token') || error.message.includes('auth')) {
          console.warn("🔒 Token-related error detected");
        }
      }
    } else {
      // This is where automatic logout happens
      console.log("🚪 User signed out automatically (Firebase session ended)");
      setFirebaseUser(null);
      setUserProfile(null);
      setLoggedIn(false);
    }
    setLoading(false);
  }

  // Combined user object with both Firebase and User Service data
  const user = firebaseUser
    ? {
        // Firebase Auth data
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,

        // Firebase methods
        getIdToken: () => getIdToken(firebaseUser),

        // User Service profile data (if available)
        ...(userProfile && {
          id: userProfile.id,
          name: userProfile.name,
          role: userProfile.role,
          phone: userProfile.phone,
          bio: userProfile.bio,
          profile_image_url: userProfile.profile_image_url,
          location: userProfile.location, // User's geographical location
          isExpert: userProfile.is_expert,
          created_at: userProfile.created_at,
          updated_at: userProfile.updated_at,

          // Field mappings for frontend compatibility
          profileImage: userProfile.profile_image_url, // Map profile_image_url to profileImage
          joinDate: userProfile.created_at, // Map created_at to joinDate for backward compatibility
        }),
      }
    : null;

  // Function to validate current session
  const validateSession = async () => {
    if (!firebaseUser) return false;
    
    try {
      // Try to get a fresh token
      const token = await getIdToken(firebaseUser, true);
      return !!token;
    } catch (error) {
      console.error("Session validation failed:", error);
      return false;
    }
  };

  const value = {
    user, // Combined user object
    firebaseUser, // Raw Firebase user
    userProfile, // Raw User Service profile
    loggedIn,
    loading,
    refreshUserProfile: () => initializeUser(firebaseUser), // Utility to refresh profile
    validateSession, // Utility to check if session is still valid
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
