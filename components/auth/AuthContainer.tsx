"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";
import { QRCodeForm } from "./QRCodeForm";
import { Lock, Shield, MapPin } from "lucide-react";

const STAGGER = 0.1;

export function AuthContainer() {
  const [activeTab, setActiveTab] = useState<"signin" | "qrcode" | "signup">("signin");

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-16 lg:px-24 w-full max-w-xl mx-auto py-16 relative">
      
      {/* Subtle animated background gradient right column */}
      <motion.div 
        animate={{ 
          opacity: [0.1, 0.2, 0.1],
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 right-0 w-full h-[50vh] pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(circle at top right, rgba(13, 148, 136, 0.08) 0%, transparent 60%)",
        }}
      />

      <div className="w-full flex flex-col relative z-10 max-w-[420px] mx-auto">
        {/* Mobile only logo/tagline */}
        <div className="md:hidden flex flex-col items-center mb-12 text-center">
          <span className="text-3xl font-bold text-brand tracking-tight mb-2">Bol.</span>
          <span className="text-sm text-muted-foreground font-medium">Messaging finally evolved.</span>
        </div>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: STAGGER * 1 }}
          className="flex flex-col items-center text-center mb-10"
        >
          <h2 className="text-[2.5rem] font-bold tracking-tight text-foreground mb-3 leading-tight">Welcome to Bol</h2>
          <p className="text-muted-foreground text-base">Sign in or create your account</p>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: STAGGER * 2 }}
          className="bg-[#F6F8F7] p-1.5 rounded-full flex relative w-full mb-10 border border-border/60 shadow-sm"
        >
          {["signin", "qrcode", "signup"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 relative rounded-full py-3 text-sm font-semibold transition-colors z-10 ${
                activeTab === tab ? "text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "signin" ? "Sign In" : tab === "qrcode" ? "QR Code" : "Create Account"}
            </button>
          ))}
          
          {/* Active Tab Background (Sliding Animation) */}
          <motion.div
            layoutId="activeTabIndicator"
            className="absolute top-1.5 bottom-1.5 w-[calc(33.333%-4px)] bg-brand rounded-full shadow-md"
            initial={false}
            animate={{
              left: activeTab === "signin" ? "6px" : activeTab === "qrcode" ? "calc(33.333% + 2px)" : "calc(66.666% - 2px)"
            }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        </motion.div>

        {/* Forms Container */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: STAGGER * 3 }}
          className="w-full relative min-h-[400px]"
        >
          <AnimatePresence mode="wait">
            {activeTab === "signin" && (
              <motion.div
                key="signin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <SignInForm onSwitchToSignup={() => setActiveTab("signup")} />
              </motion.div>
            )}
            {activeTab === "qrcode" && (
              <motion.div
                key="qrcode"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <QRCodeForm />
              </motion.div>
            )}
            {activeTab === "signup" && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <SignUpForm onSwitchToSignin={() => setActiveTab("signin")} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Trust Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: STAGGER * 4 }}
          className="mt-12 pt-6 border-t border-border flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[11px] font-medium text-muted-foreground/80"
        >
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 opacity-70" />
            End-to-end encrypted
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 opacity-70" />
            No ads ever
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 opacity-70" />
            Built in Pakistan
          </div>
        </motion.div>

      </div>
    </div>
  );
}
