"use client";

import { motion } from "framer-motion";
import { Radio, Image as ImageIcon, Mic, Type } from "lucide-react";

interface PulseEmptyStateProps {
  onCreatePulse: () => void;
  onExplore: () => void;
}

export function PulseEmptyState({ onCreatePulse, onExplore }: PulseEmptyStateProps) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-white relative overflow-hidden">
      
      {/* Decorative Floating Background Cards */}
      <motion.div 
        className="absolute w-32 h-40 bg-white border border-[#ECECEC] rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center z-0"
        style={{ top: '20%', left: '15%', rotate: -12 }}
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <ImageIcon className="w-8 h-8 text-[#0D9488]/40" />
      </motion.div>

      <motion.div 
        className="absolute w-28 h-36 bg-white border border-[#ECECEC] rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center z-0"
        style={{ bottom: '25%', left: '22%', rotate: 8 }}
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <Mic className="w-8 h-8 text-[#0D9488]/40" />
      </motion.div>

      <motion.div 
        className="absolute w-36 h-48 bg-white border border-[#ECECEC] rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center z-0"
        style={{ top: '30%', right: '15%', rotate: 15 }}
        animate={{ y: [0, -25, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <Type className="w-8 h-8 text-[#0D9488]/40" />
      </motion.div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center z-10 max-w-lg text-center px-6">
        <motion.div 
          className="w-[180px] h-[180px] bg-[#EEF4F3] rounded-full flex items-center justify-center mb-8"
          animate={{ scale: [1.0, 1.04, 1.0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Radio className="w-16 h-16 text-[#0D9488]" strokeWidth={1.5} />
        </motion.div>

        <h2 className="text-[28px] font-bold text-[#0F0F14] mb-3">Share your Status</h2>
        <p className="text-[16px] text-[#6B7280] max-w-[360px] leading-relaxed mb-10">
          Photos, videos, and voice moments — gone in 24 hours.
        </p>

        <div className="flex items-center gap-4">
          <button 
            onClick={onCreatePulse}
            className="px-6 py-3 bg-[#0D9488] hover:bg-[#0F766E] text-white font-medium rounded-full transition-colors"
          >
            Share a Moment
          </button>
          <button 
            onClick={onExplore}
            className="px-6 py-3 bg-transparent hover:bg-[#F6F8F7] text-[#0D9488] font-medium rounded-full transition-colors"
          >
            Explore Statuses
          </button>
        </div>
      </div>
    </div>
  );
}
