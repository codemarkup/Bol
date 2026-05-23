"use client";

import { motion } from "framer-motion";
import { Sparkles, Mic, Shield, Smartphone } from "lucide-react";
import { FloatingChatCard } from "./FloatingChatCard";

export function LeftColumnArt() {
  return (
    <div className="relative w-full h-screen flex flex-col px-6 xl:px-8 2xl:px-12 py-5 xl:py-6 2xl:py-10 justify-between z-10 overflow-hidden">
      {/* Animated Subtle Gradient Background */}
      <motion.div 
        animate={{ 
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at center, rgba(13, 148, 136, 0.15) 0%, transparent 50%)",
          backgroundSize: "200% 200%"
        }}
      />

      {/* Tiny Decorative Dots */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 z-0 pointer-events-none origin-center"
      >
        <div className="absolute top-[20%] left-[10%] w-1.5 h-1.5 rounded-full bg-brand/30 blur-[1px]"></div>
        <div className="absolute top-[60%] right-[15%] w-2 h-2 rounded-full bg-brand/20 blur-[1px]"></div>
        <div className="absolute bottom-[30%] left-[20%] w-1 h-1 rounded-full bg-brand/40 blur-[0.5px]"></div>
      </motion.div>

      {/* Top: Logo */}
      <div className="relative z-10 shrink-0">
        <span className="text-white font-bold text-2xl 2xl:text-3xl tracking-tight">Bol.</span>
      </div>

      {/* Center Content (Text + Card side by side) */}
      <div className="relative z-10 flex items-center justify-between my-auto w-full gap-2 xl:gap-4 2xl:gap-8">
        
        {/* Left Side: Text & Features */}
        <div className="flex flex-col shrink min-w-0 max-w-[340px] 2xl:max-w-[420px]">
          <div className="flex flex-col gap-1 2xl:gap-3">
            <h1 className="text-[1.7rem] xl:text-[2rem] 2xl:text-[3.2rem] font-bold tracking-tight text-white leading-[1.1]">
              Where every<br />conversation<br />matters.
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0"></span>
              <span className="text-brand text-[9px] xl:text-[10px] 2xl:text-xs font-bold tracking-widest uppercase">Messaging Finally Evolved</span>
            </div>
          </div>

          {/* Feature List */}
          <div className="flex flex-col gap-2.5 xl:gap-3 2xl:gap-5 mt-5 xl:mt-6 2xl:mt-10">
            <FeatureRow 
              icon={<Sparkles className="w-3 h-3 2xl:w-4 2xl:h-4 text-brand" strokeWidth={1.5} />}
              title="AI Catch-Up Summaries"
              description="Smart summary in one tap."
            />
            <FeatureRow 
              icon={<Mic className="w-3 h-3 2xl:w-4 2xl:h-4 text-brand" strokeWidth={1.5} />}
              title="Voice Transcription"
              description="Every voice note, searchable."
            />
            <FeatureRow 
              icon={<Shield className="w-3 h-3 2xl:w-4 2xl:h-4 text-brand" strokeWidth={1.5} />}
              title="Intelligent Privacy"
              description="Per-contact controls. No phone needed."
            />
            <FeatureRow 
              icon={<Smartphone className="w-3 h-3 2xl:w-4 2xl:h-4 text-brand" strokeWidth={1.5} />}
              title="True Multi-Device"
              description="Every device equal. Just works."
            />
          </div>
        </div>

        {/* Right Side: Floating Chat Preview */}
        <div className="relative z-10 shrink-0 hidden lg:flex items-center justify-center">
          {/* Huge teal glow behind card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#0D9488] opacity-20 blur-[80px] rounded-full pointer-events-none z-0"></div>
          
          <div className="relative z-10">
            <FloatingChatCard />
          </div>
        </div>
      </div>

      {/* Very Bottom text */}
      <div className="relative z-30 shrink-0">
        <span className="text-white/30 text-[10px] 2xl:text-[11px] font-medium tracking-wide">Built in Pakistan. Designed for the world.</span>
      </div>

      {/* Bottom Fade Gradient */}
      <div className="absolute bottom-0 left-0 w-full h-20 2xl:h-28 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none z-20" />
    </div>
  );
}

function FeatureRow({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex items-center gap-2 2xl:gap-3">
      <div className="w-5 h-5 2xl:w-6 2xl:h-6 rounded-md bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-white text-[11px] xl:text-xs 2xl:text-sm font-medium">{title}</span>
        <span className="text-gray-400 text-[10px] xl:text-[11px] 2xl:text-xs leading-snug">{description}</span>
      </div>
    </div>
  );
}
