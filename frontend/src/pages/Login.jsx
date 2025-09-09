// components/Login.jsx
import { useState } from "react";
import { getIdToken } from "firebase/auth";
import { useAuth } from "../context/auth/AuthContext.jsx";
import { Navigate } from "react-router-dom";
import { doSignInWithEmailAndPassword, doSignInWithGoogle } from "../firebase/auth.js";

function Login() {
  const { loggedIn } = useAuth(); // Fixed: use loggedIn instead of userLoggedIn
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const validateForm = () => {
    if (!email || !password) {
      setErrorMessage("Email and password are required");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email");
      return false;
    }
    
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (isSigningIn) return;

    setIsSigningIn(true);
    setErrorMessage("");

    try {
      // Sign in with Firebase Auth
      const userCredential = await doSignInWithEmailAndPassword(email, password);
      
      // Get ID token for backend authentication
      const idToken = await getIdToken(userCredential.user);

      // Optional: validate with backend (don't block login if this fails)
      try {
        const response = await fetch("http://127.0.0.1:8001/ping", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}` // Fixed: add Bearer prefix
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Backend validation successful:", result);
        } else {
          console.warn("Backend validation failed, but login still successful");
        }
      } catch (backendError) {
        console.warn("Backend validation error (login still successful):", backendError.message);
      }

      // Success - user will be automatically redirected due to userLoggedIn state change
      console.log("Login successful!");
      
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(error.message || "An error occurred during login");
    } finally {
      setIsSigningIn(false);
    }
  };

  const onGoogleSignIn = async (e) => {
    e.preventDefault();
    
    if (isSigningIn) return;

    setIsSigningIn(true);
    setErrorMessage("");

    try {
      const userCredential = await doSignInWithGoogle();
      
      // Get ID token for backend authentication
      const idToken = await getIdToken(userCredential.user);

      // Optional: validate with backend (don't block login if this fails)
      try {
        const response = await fetch("http://127.0.0.1:8001/ping", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Google login successful:", result);
        } else {
          console.warn("Backend validation failed, but Google login still successful");
        }
      } catch (backendError) {
        console.warn("Backend validation error (Google login still successful):", backendError.message);
      }

    } catch (error) {
      console.error("Google login error:", error);
      setErrorMessage(error.message || "An error occurred during Google login");
      setIsSigningIn(false);
    }
  };

  // Redirect if user is already logged in
  if (loggedIn) {
    return <Navigate to="/dashboard" replace={true} />;
  }

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <div>
          <input 
            type="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Email"
            disabled={isSigningIn}
            required
          />
        </div>
        
        <div>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Password"
            disabled={isSigningIn}
            required
          />
        </div>
        
        {errorMessage && (
          <div className="error-message" style={{color: 'red', margin: '10px 0'}}>
            {errorMessage}
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={isSigningIn}
          style={{
            padding: '10px 20px',
            backgroundColor: isSigningIn ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSigningIn ? 'not-allowed' : 'pointer',
            marginBottom: '10px',
            width: '100%'
          }}
        >
          {isSigningIn ? "Signing In..." : "Login"}
        </button>
      </form>
      
      <div style={{textAlign: 'center', margin: '10px 0'}}>
        <span>OR</span>
      </div>
      
      <button 
        onClick={onGoogleSignIn}
        disabled={isSigningIn}
        style={{
          padding: '10px 20px',
          backgroundColor: isSigningIn ? '#ccc' : '#db4437',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isSigningIn ? 'not-allowed' : 'pointer',
          width: '100%'
        }}
      >
        {isSigningIn ? "Signing In..." : "Sign In with Google"}
      </button>
    </div>
  );
}

export default Login;

// Alternative: Simplified version without form validation
function LoginSimplified() {
  const { loggedIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (isSigningIn) return;

    setIsSigningIn(true);
    setErrorMessage("");

    try {
      const userCredential = await doSignInWithEmailAndPassword(email, password);
      const idToken = await getIdToken(userCredential.user);

      // Optional: validate with backend
      const response = await fetch("http://127.0.0.1:8001/ping", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${idToken}`
        },
      });

      if (response.ok) {
        console.log("Login successful!");
      }
      
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  const onGoogleSignIn = async (e) => {
    e.preventDefault();
    
    if (isSigningIn) return;

    setIsSigningIn(true);
    setErrorMessage("");

    try {
      await doSignInWithGoogle();
    } catch (error) {
      setErrorMessage(error.message);
      setIsSigningIn(false);
    }
  };

  if (loggedIn) {
    return <Navigate to="/dashboard" replace={true} />;
  }

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <input 
          type="email"
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="Email"
          required
        />
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Password"
          required
        />
        {errorMessage && <div style={{color: 'red'}}>{errorMessage}</div>}
        <button type="submit" disabled={isSigningIn}>
          {isSigningIn ? "Signing In..." : "Login"}
        </button>
      </form>
      <button onClick={onGoogleSignIn} disabled={isSigningIn}>
        {isSigningIn ? "Signing In..." : "Sign In with Google"}
      </button>
    </div>
  );
}