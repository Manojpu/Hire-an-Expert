import React, { useState, FormEvent } from "react";
import { getIdToken } from "firebase/auth";
import { useAuth } from "../context/auth/AuthContext.jsx";
import { Navigate, Link } from "react-router-dom";
import { doCreateUserWithEmailAndPassword, doSignInWithGoogle } from "../firebase/auth.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, Loader2, User, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

const Signup: React.FC = () => {
  const { loggedIn } = useAuth();
  const [formData, setFormData] = useState<SignupFormData>({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isSigningUp, setIsSigningUp] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setErrorMessage("All fields are required");
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return false;
    }
    
    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage("Please enter a valid email address");
      return false;
    }
    
    return true;
  };

  const handleInputChange = (field: keyof SignupFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm() || isSigningUp) return;

    setIsSigningUp(true);
    setErrorMessage("");

    try {
      // Create user with Firebase Auth
      const userCredential = await doCreateUserWithEmailAndPassword(formData.email, formData.password);
      
      // Get ID token for backend authentication
      const idToken = await getIdToken(userCredential.user);

      // Create user profile in User Service
      try {
        const response = await fetch("http://127.0.0.1:8001/internal/users/provision", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Webhook-Secret": "7f6b8e2e6b9147f0b34a84d5b673d3e85d3a21b6b3c847c0a9e32f8f8a172ab4"
          },
          body: JSON.stringify({ 
            firebase_uid: userCredential.user.uid,
            email: formData.email,
            full_name: userCredential.user.displayName || formData.email.split('@')[0],
            is_expert: true,
            expert_profiles: []
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("User profile created successfully:", result);
        } else {
          console.warn("User profile creation failed, but Firebase signup successful");
        }
      } catch (backendError) {
        console.warn("User service error (Firebase signup still successful):", (backendError as Error).message);
      }

      console.log("Signup successful!");
      
    } catch (error) {
      console.error("Signup error:", error);
      setErrorMessage((error as Error).message || "An error occurred during signup");
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (isSigningUp) return;

    setIsSigningUp(true);
    setErrorMessage("");

    try {
      const userCredential = await doSignInWithGoogle();
      
      // Get ID token for backend authentication
      const idToken = await getIdToken(userCredential.user);

      // Create user profile in User Service
      try {
        const response = await fetch("http://127.0.0.1:8001/internal/users/provision", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Webhook-Secret": "7f6b8e2e6b9147f0b34a84d5b673d3e85d3a21b6b3c847c0a9e32f8f8a172ab4"
          },
          body: JSON.stringify({ 
            firebase_uid: userCredential.user.uid,
            email: userCredential.user.email,
            full_name: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'User',
            is_expert: true,
            expert_profiles: []
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Google signup successful:", result);
        } else {
          console.warn("User profile creation failed, but Google signup successful");
        }
      } catch (backendError) {
        console.warn("User service error (Google signup still successful):", (backendError as Error).message);
      }

    } catch (error) {
      console.error("Google signup error:", error);
      setErrorMessage((error as Error).message || "An error occurred during Google signup");
    } finally {
      setIsSigningUp(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, text: "", color: "" };
    
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score < 2) return { strength: 1, text: "Weak", color: "text-destructive" };
    if (score < 4) return { strength: 2, text: "Medium", color: "text-warning" };
    return { strength: 3, text: "Strong", color: "text-success" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Redirect if user is already logged in
  if (loggedIn) {
    return <Navigate to="/dashboard" replace={true} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Logo & Brand */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <img src="/logo.png" alt="AddWise Logo" className="w-10 h-10 object-contain" />
            </div>
            <span className="text-3xl font-extrabold">
              <span className="text-red-600">A</span>
              <span className="text-foreground">ddWise</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-muted-foreground">Join our community of experts and clients</p>
        </div>

        {/* Signup Card */}
        <Card className="shadow-hover border-border/50 bg-background/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold text-center">Sign Up</CardTitle>
            <CardDescription className="text-center">
              Create your account to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Sign Up Button */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full relative hover:bg-accent/50 transition-all duration-200"
              onClick={handleGoogleSignUp}
              disabled={isSigningUp}
            >
              {isSigningUp ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange("email")}
                    placeholder="Enter your email"
                    className="pl-10 transition-all duration-200 focus:ring-primary/20"
                    disabled={isSigningUp}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    placeholder="Create a password"
                    className="pl-10 pr-10 transition-all duration-200 focus:ring-primary/20"
                    disabled={isSigningUp}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isSigningUp}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Password strength:</span>
                      <span className={cn("font-medium", passwordStrength.color)}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          passwordStrength.strength === 1 && "w-1/3 bg-destructive",
                          passwordStrength.strength === 2 && "w-2/3 bg-warning",
                          passwordStrength.strength === 3 && "w-full bg-success"
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange("confirmPassword")}
                    placeholder="Confirm your password"
                    className={cn(
                      "pl-10 pr-10 transition-all duration-200 focus:ring-primary/20",
                      formData.confirmPassword && formData.password !== formData.confirmPassword 
                        ? "border-destructive focus:ring-destructive/20" 
                        : formData.confirmPassword && formData.password === formData.confirmPassword 
                        ? "border-success focus:ring-success/20" 
                        : ""
                    )}
                    disabled={isSigningUp}
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                      <CheckCircle className="h-4 w-4 text-success" />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isSigningUp}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive font-medium">{errorMessage}</p>
                </div>
              )}

              {/* Terms and Privacy */}
              <div className="text-xs text-muted-foreground">
                By creating an account, you agree to our{" "}
                <Link to="/terms" className="text-primary hover:text-primary/80 font-medium">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-primary hover:text-primary/80 font-medium">
                  Privacy Policy
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-200"
                disabled={isSigningUp}
              >
                {isSigningUp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="text-center pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link to="/support" className="hover:text-foreground transition-colors">
              Support
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2024 AddWise. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
