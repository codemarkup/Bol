"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignInForm({ onSwitchToSignup }: { onSwitchToSignup: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [magicLinkState, setMagicLinkState] = useState<"idle" | "loading" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setErrorMsg("");
    setMagicLinkState("loading");
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setMagicLinkState("idle");
    } else {
      setMagicLinkState("success");
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account'
        }
      },
    });
    
    if (error) {
      setErrorMsg(error.message);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Google Button */}
      <motion.button
        onClick={handleGoogleSignIn}
        whileHover={{ y: -2, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)" }}
        whileTap={{ y: 0 }}
        className="w-full flex items-center justify-between bg-white border border-[#D1D5DB] rounded-xl px-5 py-4 transition-all hover:border-gray-400 group"
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
      {errorMsg && <p className="text-red-500 text-sm mt-2 text-center">{errorMsg}</p>}

      {/* Divider */}
      <div className="flex items-center my-8">
        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#ECECEC] to-transparent"></div>
        <span className="px-4 text-xs font-medium text-muted-foreground">or</span>
        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#ECECEC] to-transparent"></div>
      </div>

      {/* Magic Link Form */}
      <form onSubmit={handleMagicLink} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-xs font-medium text-muted-foreground ml-1">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-white border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-gray-400"
            required
          />
          <p className="text-[11px] text-muted-foreground ml-1 mt-1">We'll send a magic link to your inbox. No password needed.</p>
        </div>

        <motion.button
          type="submit"
          whileHover={magicLinkState === "idle" ? { scale: 1.01, boxShadow: "0 0 20px rgba(13, 148, 136, 0.3)" } : {}}
          whileTap={magicLinkState === "idle" ? { scale: 0.99 } : {}}
          disabled={magicLinkState !== "idle"}
          className={`w-full mt-2 relative overflow-hidden flex items-center justify-center py-3.5 rounded-xl text-sm font-semibold transition-all ${
            magicLinkState === "success" 
              ? "bg-green-500 text-white" 
              : "bg-brand text-white shadow-sm"
          }`}
        >
          <AnimatePresence mode="wait">
            {magicLinkState === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                Send Magic Link <ArrowRight className="w-4 h-4" />
              </motion.div>
            )}
            {magicLinkState === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="w-4 h-4 animate-spin" /> Sending...
              </motion.div>
            )}
            {magicLinkState === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Link sent! Check your inbox
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </form>
    </div>
  );
}
