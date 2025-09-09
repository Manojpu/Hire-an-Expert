import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import loginBg from "@/assets/login-bg.jpg";
import { getIdToken } from "firebase/auth";
import { useAuth } from "../context/auth/AuthContext.jsx";
import { doSignInWithEmailAndPassword, doSignInWithGoogle } from "../firebase/auth.js";
import { useNavigate } from "react-router-dom";
import { Sun, Moon, Eye, EyeOff } from "lucide-react";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.25, ease: "easeIn" } },
};

const inputVariant = {
  rest: { boxShadow: "inset 0 0 0 0 rgba(0,0,0,0)", y: 0 },
  focus: { boxShadow: "0 6px 20px rgba(99,102,241,0.08)", y: -2, transition: { duration: 0.18 } },
};

const buttonVariant = {
  rest: { boxShadow: "0 6px 24px rgba(59,130,246,0.08)", y: 0 },
  hover: { boxShadow: "0 10px 30px rgba(59,130,246,0.18), 0 0 30px rgba(99,102,241,0.06)", y: -1, transition: { duration: 0.18 } },
};

export default function Login() {
  const { loggedIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [prefersDark, setPrefersDark] = useState(() => {
    try {
      return document.documentElement.classList.contains("dark");
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", prefersDark);
  }, [prefersDark]);

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
    setErrorMessage("");
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (isSigningIn) return;

    setIsSigningIn(true);
    try {
      const userCredential = await doSignInWithEmailAndPassword(email, password);
      const idToken = await getIdToken(userCredential.user);
      try {
        await fetch("/ping", { method: "POST", headers: { Authorization: `Bearer ${idToken}` } });
      } catch (err) {}
    } catch (err) {
      setErrorMessage(err?.message || "Login failed");
    } finally {
      setIsSigningIn(false);
    }
  };

  const onGoogleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      const userCredential = await doSignInWithGoogle();
      const idToken = await getIdToken(userCredential.user);
      try {
        await fetch("/ping", { method: "POST", headers: { Authorization: `Bearer ${idToken}` } });
      } catch (err) {}
    } catch (err) {
      setErrorMessage(err?.message || "Google sign in failed");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key="login-page"
        style={{
          backgroundImage: `url(${loginBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="min-h-screen flex items-center justify-center px-4 py-12"
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
        <div className="relative w-full flex items-center justify-center">
          <motion.section
            className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-white/20 dark:bg-slate-900/30 backdrop-blur-2xl border border-white/20 dark:border-slate-700/30 shadow-2xl"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1, transition: { delay: 0.08 } }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <img src="/logo.png" alt="AddWise logo" className="w-12 h-12 rounded-lg object-contain" />
                <div>
                  <h1 className="text-2xl font-extrabold text-white dark:text-slate-100">Welcome back</h1>
                </div>
              </div>

              <button
                aria-label="Toggle theme"
                onClick={() => setPrefersDark((s) => !s)}
                className="inline-flex items-center justify-center rounded-full p-2 bg-white/10 dark:bg-slate-800/20 hover:bg-white/20 transition-colors"
              >
                {prefersDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-white" />}
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4" aria-labelledby="login-heading">
              <label className="block">
                <span className="text-sm text-slate-200">Email</span>
                <motion.input
                  aria-label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 block w-full rounded-lg bg-white/60 dark:bg-slate-800/50 border border-white/30 dark:border-slate-700/40 px-4 py-3 placeholder-slate-400 focus:outline-none"
                  variants={inputVariant}
                  initial="rest"
                  whileFocus="focus"
                  animate="rest"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-200">Password</span>
                <div className="relative">
                  <motion.input
                    aria-label="Password"
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-2 block w-full rounded-lg bg-white/60 dark:bg-slate-800/50 border border-white/30 dark:border-slate-700/40 px-4 py-3 placeholder-slate-400 focus:outline-none"
                    variants={inputVariant}
                    initial="rest"
                    whileFocus="focus"
                    animate="rest"
                  />
                  <button
                    type="button"
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                    onClick={() => setPasswordVisible((s) => !s)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-200"
                  >
                    {passwordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </label>

              {errorMessage && (
                <div role="alert" className="text-sm text-red-400 bg-red-900/10 p-2 rounded-md">{errorMessage}</div>
              )}

              <motion.button
                type="submit"
                whileHover="hover"
                variants={buttonVariant}
                disabled={isSigningIn}
                className="w-full mt-1 inline-flex items-center justify-center gap-3 rounded-xl px-5 py-3 text-white bg-gradient-to-r from-primary-500 to-primary-600 disabled:opacity-60 focus:outline-none"
                aria-disabled={isSigningIn}
              >
                <motion.span layout>{isSigningIn ? "Signing in..." : "Sign in"}</motion.span>
              </motion.button>

              <div className="flex items-center gap-3">
                <hr className="flex-1 border-t border-white/30 dark:border-slate-700/30" />
                <span className="text-xs text-slate-200">or</span>
                <hr className="flex-1 border-t border-white/30 dark:border-slate-700/30" />
              </div>

              <button
                type="button"
                onClick={onGoogleSignIn}
                disabled={isSigningIn}
                className="w-full inline-flex items-center justify-center gap-3 rounded-xl px-5 py-3 border border-white/30 dark:border-slate-700/30 bg-white/10 hover:scale-[1.01] transition-transform"
              >
                <svg className="w-5 h-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path fill="#4285f4" d="M533.5 278.4c0-17.4-1.6-34.1-4.6-50.4H272v95.4h147.4c-6.4 34.6-25.6 63.9-54.6 83.6v69.5h88.2c51.6-47.5 81.5-117.6 81.5-198.1z"/>
                  <path fill="#34a853" d="M272 544.3c73.6 0 135.4-24.4 180.6-66.1l-88.2-69.5c-24.5 16.5-55.9 26.3-92.4 26.3-71 0-131.1-47.8-152.6-112.2H30.8v70.5C75.9 487.2 168.6 544.3 272 544.3z"/>
                  <path fill="#fbbc04" d="M119.4 323.0c-8.6-25.6-8.6-52.9 0-78.5V173.9H30.8c-37.5 74.9-37.5 163.3 0 238.2l88.6-69.1z"/>
                  <path fill="#ea4335" d="M272 109.2c39.9 0 75.8 13.7 104.1 40.7l78.1-78.1C407.2 22.7 345.4 0 272 0 168.6 0 75.9 57.1 30.8 143.8l88.6 70.5C140.9 157 201 109.2 272 109.2z"/>
                </svg>
                <span>Sign in with Google</span>
              </button>

              <div className="text-center text-sm text-slate-200">
                Don't have an account? <a href="/signup" className="text-primary-300 dark:text-primary-400 underline">Sign up</a>
              </div>
            </form>
          </motion.section>
        </div>
      </motion.main>
    </AnimatePresence>
  );
}