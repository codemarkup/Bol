"use client";

import { motion } from "framer-motion";
import { Sparkles, Battery, Wifi, Signal } from "lucide-react";
import { MockupPhone } from "../ui/MockupPhone";

export function FloatingChatCard() {
  return (
    <motion.div
      animate={{ y: [-8, 8, -8] }}
      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      className="relative z-10 scale-[0.62] xl:scale-[0.68] 2xl:scale-[0.85]"
    >
      <MockupPhone className="shadow-2xl shadow-brand/20 border-gray-900/40">
        {/* Cover the white screen with dark background */}
        <div className="absolute inset-0 bg-[#121216] flex flex-col pt-12 pb-6 px-4">
          
          {/* Fake iOS Status Bar icons (since we're dark mode) */}
          <div className="absolute top-3 right-5 flex items-center gap-1.5 text-white/50 z-30">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <Battery className="w-4 h-4" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5 mt-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-surface overflow-hidden">
                <img src="https://i.pravatar.cc/100?img=5" alt="Group" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-semibold text-sm">Design Team</span>
                <span className="text-white/40 text-[10px]">8 members</span>
              </div>
            </div>
            <div className="bg-brand/20 border border-brand/30 px-2 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand" />
              <span className="text-[10px] font-semibold text-brand">AI Summary</span>
            </div>
          </div>

          {/* Chat Bubbles */}
          <div className="flex flex-col gap-3">
            {/* Bubble 1 */}
            <div className="flex gap-2">
              <img src="https://i.pravatar.cc/100?img=1" alt="Sara" className="w-6 h-6 rounded-full mt-1 shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="text-white/40 text-[10px] ml-1">Sara</span>
                <div className="bg-white/5 text-white/90 text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm border border-white/5">
                  Did anyone take notes?
                </div>
              </div>
            </div>

            {/* Bubble 2 */}
            <div className="flex gap-2 self-end flex-row-reverse">
              <img src="https://i.pravatar.cc/100?img=11" alt="Ahmed" className="w-6 h-6 rounded-full mt-1 shrink-0" />
              <div className="flex flex-col gap-1 items-end">
                <span className="text-white/40 text-[10px] mr-1">Ahmed</span>
                <div className="bg-brand text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm">
                  Haan, sending figma links now.
                </div>
              </div>
            </div>

            {/* Bubble 3 */}
            <div className="flex gap-2">
              <img src="https://i.pravatar.cc/100?img=12" alt="Ali" className="w-6 h-6 rounded-full mt-1 shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="text-white/40 text-[10px] ml-1">Ali</span>
                <div className="bg-white/5 text-white/90 text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm border border-white/5">
                  Perfect. Review tomorrow?
                </div>
              </div>
            </div>

            {/* Catch me up Button */}
            <div className="mt-4 w-full flex justify-center mt-auto">
              <button className="flex items-center justify-center gap-1.5 bg-brand/20 hover:bg-brand/30 border border-brand/30 transition-colors w-full py-3 rounded-xl">
                <Sparkles className="w-4 h-4 text-brand" />
                <span className="text-xs font-semibold text-brand">Catch me up →</span>
              </button>
            </div>
          </div>
        </div>
      </MockupPhone>
    </motion.div>
  );
}
