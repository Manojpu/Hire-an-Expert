// AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../../firebase/firebase";
import { onAuthStateChanged, getIdToken } from "firebase/auth";

const AuthContext = createContext();

export function useAuth(){
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null); // Firebase user
  const [userProfile, setUserProfile] = useState(null);   // User service profile
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    return unsubscribe;
  }, [])

  async function initializeUser(currentUser) {
    if (currentUser) {
      setFirebaseUser(currentUser);
      setLoggedIn(true);
      
      // Fetch user profile from User Service
      try {
        const idToken = await getIdToken(currentUser);
        const response = await fetch(`http://127.0.0.1:8001/users/firebase/${currentUser.uid}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);
          console.log("User profile loaded:", profile);
        } else {
          console.warn("Failed to load user profile from User Service");
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
      }
    } else {
      setFirebaseUser(null);
      setUserProfile(null);
      setLoggedIn(false);
    }
    setLoading(false);
  }

  // Combined user object with both Firebase and User Service data
  const user = firebaseUser ? {
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
      location: userProfile.location,  // User's geographical location
      isExpert: userProfile.is_expert,
      created_at: userProfile.created_at,
      updated_at: userProfile.updated_at,
      
      // Field mappings for frontend compatibility
      profileImage: userProfile.profile_image_url,  // Map profile_image_url to profileImage
      joinDate: userProfile.created_at  // Map created_at to joinDate for backward compatibility
    })
  } : null;

  const value = {
    user,                    // Combined user object
    firebaseUser,           // Raw Firebase user
    userProfile,            // Raw User Service profile
    loggedIn,
    loading,
    refreshUserProfile: () => initializeUser(firebaseUser) // Utility to refresh profile
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

