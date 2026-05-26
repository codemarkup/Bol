"use client";

import { motion } from "framer-motion";
import { MessageSquare, Lock, Sparkles, Mic, Plus } from "lucide-react";

export function EmptyState() {
  const containerVariants: import("framer-motion").Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: import("framer-motion").Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
  };

  return (
    <div className="w-full h-full bg-white relative overflow-hidden flex flex-col">
      {/* Subtle Teal Radial Gradient Top-Right */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      
      {/* Main Flex Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-2xl w-full flex flex-col items-center text-center z-10 mt-4 md:mt-8"
        >
          {/* App Icon (Breathing animation) */}
          <motion.div 
            variants={itemVariants}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20 mb-3"
          >
            <MessageSquare className="w-10 h-10 text-white" strokeWidth={1.5} />
          </motion.div>

          {/* Wordmark & Tagline */}
          <motion.div variants={itemVariants} className="mb-3">
            <h1 className="text-3xl md:text-4xl font-bold text-[#0F0F14] tracking-tight mb-1.5 md:mb-2">Bol</h1>
            <p className="text-[#6B7280] text-base md:text-lg max-w-md mx-auto">
              Experience next-generation messaging with intelligent summaries and crystal clear audio.
            </p>
          </motion.div>

          {/* Divider */}
          <motion.div variants={itemVariants} className="w-16 h-[1px] bg-[#ECECEC] mb-4" />

          {/* Feature Cards (Slightly smaller & much closer to text) */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 w-full mb-6 mx-auto">
            {[
              { icon: Lock, title: "End-to-End Encrypted", desc: "Your privacy is our top priority." },
              { icon: Sparkles, title: "AI Catch-up", desc: "Never lose context of a busy thread." },
              { icon: Mic, title: "Voice Notes", desc: "Studio-quality audio messaging." },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div 
                  key={i}
                  variants={itemVariants}
                  className="bg-[#F6F8F7] border border-[#ECECEC] rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-md hover:border-brand/20 transition-all cursor-default"
                >
                  <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-brand mb-2 shadow-sm">
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[14px] md:text-[15px] font-semibold text-[#0F0F14] mb-0.5">{feature.title}</h3>
                  <p className="text-[12px] md:text-[13px] text-[#6B7280] leading-relaxed">{feature.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Action Button (Moved UP away from bottom) */}
          <motion.div variants={itemVariants} className="mb-8">
            <button className="bg-brand text-white px-5 py-2.5 md:px-6 md:py-3 rounded-full font-medium flex items-center gap-2 hover:bg-brand/90 hover:scale-105 transition-all shadow-lg shadow-brand/20 text-[15px] md:text-base">
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              <span>Start a New Conversation</span>
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer Text - Stuck to the absolute bottom of flex container */}
      <div className="w-full flex justify-center py-4 bg-white/80 backdrop-blur-sm z-20 shrink-0">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-[12px] text-[#9CA3AF] flex items-center gap-1.5"
        >
          <Lock className="w-3 h-3" />
          Your personal messages are end-to-end encrypted
        </motion.p>
      </div>
    </div>
  );
}
