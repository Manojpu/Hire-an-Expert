import { useState } from "react";
import { getIdToken } from "firebase/auth";
import { useAuth } from "../context/auth/AuthContext.jsx";
import { doCreateUserWithEmailAndPassword } from "../firebase/auth";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");         
  const [isSigningUp, setIsSigningUp] = useState(false);

  const { loggedIn } = useAuth();

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setErrorMessage("All fields are required");
      return false;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return false;
    }
    
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
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

    if (isSigningUp) return;

    setIsSigningUp(true);
    setErrorMessage("");

    try {
      // Create user with Firebase Auth
      const userCredential = await doCreateUserWithEmailAndPassword(email, password);
      
      // Get ID token for backend authentication
      const idToken = await getIdToken(userCredential.user);

      // Send user data to your backend
      const response = await fetch("http://127.0.0.1:8000/signup", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}` // Include token in header
        },
        body: JSON.stringify({ 
          email, 
          firebase_uid: userCredential.user.uid 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Backend signup failed");
      }

      const result = await response.json();
      console.log("Backend signup successful:", result);
      
      // Optionally redirect or show success message
      alert("Signup successful!");
      
    } catch (error) {
      console.error("Signup error:", error);
      setErrorMessage(error.message || "An error occurred during signup");
      
      // If backend fails but Firebase user was created, you might want to delete the Firebase user
      // This depends on your application logic
      
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="signup-container">
      <h2>Sign Up</h2>
      <form onSubmit={onSubmit}>
        <div>
          <input 
            type="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Email"
            disabled={isSigningUp}
            required
          />
        </div>
        
        <div>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Password"
            disabled={isSigningUp}
            required
          />
        </div>
        
        <div>
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            placeholder="Confirm Password"
            disabled={isSigningUp}
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
          disabled={isSigningUp}
          style={{
            padding: '10px 20px',
            backgroundColor: isSigningUp ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSigningUp ? 'not-allowed' : 'pointer'
          }}
        >
          {isSigningUp ? "Signing Up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}

export default Signup;