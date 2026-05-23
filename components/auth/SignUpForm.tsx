"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, X, Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SignUpForm({ onSwitchToSignin }: { onSwitchToSignin: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // UI States
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulated username check
  useEffect(() => {
    if (!username) {
      setUsernameStatus("idle");
      return;
    }
    
    setUsernameStatus("checking");
    const timer = setTimeout(() => {
      // Simulate "taken" if they type exactly "ahmed"
      if (username.toLowerCase() === "ahmed") {
        setUsernameStatus("taken");
      } else {
        setUsernameStatus("available");
      }
    }, 600);
    
    return () => clearTimeout(timer);
  }, [username]);

  // Password strength calculation
  const calculateStrength = (pass: string) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length > 5) strength += 1;
    if (pass.length > 8) strength += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) strength += 1;
    if (/[0-9!@#$%^&*]/.test(pass)) strength += 1;
    return strength;
  };

  const strength = calculateStrength(password);
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) return;
    
    setIsSubmitting(true);
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 1000));
    router.push("/");
  };

  const handleGoogleSignIn = () => {
    router.push("/");
  };

  return (
    <div className="flex flex-col w-full">
      {/* Google Button */}
      <motion.button
        type="button"
        onClick={handleGoogleSignIn}
        whileHover={{ y: -2, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)" }}
        whileTap={{ y: 0 }}
        className="w-full flex items-center justify-between bg-white border border-[#D1D5DB] rounded-xl px-5 py-4 transition-all hover:border-gray-400 group mb-6"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="font-semibold text-foreground text-sm">Continue with Google</span>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </motion.button>

      {/* Divider */}
      <div className="flex items-center mb-8">
        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#ECECEC] to-transparent"></div>
        <span className="px-4 text-xs font-medium text-muted-foreground">or create with email</span>
        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#ECECEC] to-transparent"></div>
      </div>

      <form onSubmit={handleSignUp} className="flex flex-col gap-5">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-medium text-muted-foreground ml-1">Full Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sara Ahmed"
            className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-gray-400"
            required
          />
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="username" className="text-xs font-medium text-muted-foreground ml-1">Username</label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400 text-sm font-medium">@</span>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
              placeholder="sara_ahmed"
              className="w-full bg-white border border-border rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-gray-400"
              required
            />
          </div>
          {/* Availability Indicator */}
          <div className="h-5 ml-1 mt-0.5">
            <AnimatePresence mode="wait">
              {usernameStatus === "checking" && (
                <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
                </motion.div>
              )}
              {usernameStatus === "available" && (
                <motion.div key="available" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-[11px] text-brand font-medium">
                  <Check className="w-3 h-3" /> @{username} is available
                </motion.div>
              )}
              {usernameStatus === "taken" && (
                <motion.div key="taken" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
                  <X className="w-3 h-3" /> @{username} is taken — try @{username}_bol
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="signup-email" className="text-xs font-medium text-muted-foreground ml-1">Email address</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-gray-400"
            required
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-end ml-1">
            <label htmlFor="password" className="text-xs font-medium text-muted-foreground">Password</label>
            <span className="text-[10px] text-muted-foreground/70">Optional — leave blank for magic link</span>
          </div>
          <div className="relative flex items-center">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-gray-400 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Password Strength Meter */}
          <div className="h-2 flex gap-1 mt-1 px-1">
            {[1, 2, 3, 4].map((level) => (
              <motion.div
                key={level}
                className={`h-1 flex-1 rounded-full ${
                  password.length === 0 ? "bg-gray-100" :
                  level <= strength ? 
                    (strength === 1 ? "bg-red-400" : 
                     strength === 2 ? "bg-orange-400" : 
                     strength === 3 ? "bg-yellow-400" : "bg-brand") 
                  : "bg-gray-100"
                }`}
                initial={false}
                animate={{ opacity: password.length === 0 ? 0.5 : 1 }}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2 mt-2">
          <div className="relative flex items-center mt-0.5">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="peer appearance-none w-4 h-4 border border-border rounded bg-white checked:bg-brand checked:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all cursor-pointer"
            />
            <Check className="absolute left-0 top-0 w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity p-0.5" />
          </div>
          <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer leading-tight">
            I agree to the <Link href="#" className="text-brand hover:underline decoration-brand/30 underline-offset-2">Terms of Service</Link> and <Link href="#" className="text-brand hover:underline decoration-brand/30 underline-offset-2">Privacy Policy</Link>
          </label>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          whileHover={!isSubmitting && agreedToTerms ? { scale: 1.01 } : {}}
          whileTap={!isSubmitting && agreedToTerms ? { scale: 0.99 } : {}}
          disabled={!agreedToTerms || isSubmitting}
          className={`w-full mt-2 relative overflow-hidden flex items-center justify-center py-3 rounded-xl text-sm font-semibold transition-all ${
            agreedToTerms 
              ? "bg-brand text-white hover:bg-brand/90 hover:shadow-md hover:shadow-brand/20" 
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</span>
          ) : (
            <span className="flex items-center gap-2">Create My Account <ArrowRight className="w-4 h-4" /></span>
          )}
        </motion.button>
      </form>
      
      <div className="mt-6 flex justify-center">
        <button 
          onClick={onSwitchToSignin}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Already have an account? <span className="text-brand font-medium">Sign in →</span>
        </button>
      </div>
    </div>
  );
}
