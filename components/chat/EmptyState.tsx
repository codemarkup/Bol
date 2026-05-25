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
    <div className="w-full h-full bg-white relative flex flex-col items-center justify-center overflow-hidden p-6">
      {/* Subtle Teal Radial Gradient Top-Right */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-2xl w-full flex flex-col items-center text-center z-10"
      >
        {/* App Icon (Breathing animation) */}
        <motion.div 
          variants={itemVariants}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-20 h-20 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20 mb-6"
        >
          <MessageSquare className="w-10 h-10 text-white" strokeWidth={1.5} />
        </motion.div>

        {/* Wordmark & Tagline */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-4xl font-bold text-[#0F0F14] tracking-tight mb-3">Bol</h1>
          <p className="text-[#6B7280] text-lg max-w-md mx-auto">
            Experience next-generation messaging with intelligent summaries and crystal clear audio.
          </p>
        </motion.div>

        {/* Divider */}
        <motion.div variants={itemVariants} className="w-16 h-[1px] bg-[#ECECEC] mb-10" />

        {/* Feature Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-12">
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
                className="bg-[#F6F8F7] border border-[#ECECEC] rounded-2xl p-5 flex flex-col items-center text-center hover:shadow-md hover:border-brand/20 transition-all cursor-default"
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand mb-3 shadow-sm">
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-semibold text-[#0F0F14] mb-1">{feature.title}</h3>
                <p className="text-[13px] text-[#6B7280] leading-relaxed">{feature.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Action Button */}
        <motion.div variants={itemVariants}>
          <button className="bg-brand text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 hover:bg-brand/90 hover:scale-105 transition-all shadow-lg shadow-brand/20">
            <Plus className="w-5 h-5" />
            <span>Start a New Conversation</span>
          </button>
        </motion.div>

        {/* Footer Text */}
        <motion.div variants={itemVariants} className="mt-8">
          <p className="text-[12px] text-[#9CA3AF] flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            Your personal messages are end-to-end encrypted
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
