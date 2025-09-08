// AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext();

export function useAuth(){
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loggedIn,setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    return unsubscribe;
  }, [])

  async function initializeUser(currentUser) {
    if (currentUser) {
      setUser({...currentUser});
      setLoggedIn(true);
    } else {
      setUser(null);
      setLoggedIn(false);
    }
    setLoading(false);
  }

  const value ={
    user,
    loggedIn,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

