"use client";

import { motion } from "framer-motion";
import { Play, Sparkles, Image as ImageIcon } from "lucide-react";
import { ReactNode } from "react";

type MessageBubbleProps = {
  type: "text" | "voice" | "image" | "ai_summary" | "typing";
  isSent: boolean;
  text?: string;
  time?: string;
  sender?: string;
  senderColor?: string;
  showSenderName?: boolean;
  reactions?: { emoji: string; count: number }[];
  read?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
};

export function MessageBubble({ type, isSent, text, time, sender, senderColor, showSenderName, reactions, read, onContextMenu }: MessageBubbleProps) {
  
  if (type === "typing") {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-4 w-full"
      >
        <div className="bg-white border border-[#ECECEC] rounded-[18px] rounded-tl-[4px] px-4 py-3 flex items-center gap-1 shadow-sm">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [0.8, 1.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.15 }}
              className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full"
            />
          ))}
        </div>
        <span className="text-[12px] text-[#9CA3AF]">{sender} is typing...</span>
      </motion.div>
    );
  }

  if (type === "ai_summary") {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex justify-start w-full my-6"
      >
        <div className="bg-[#F6F8F7] border-l-[3px] border-brand rounded-xl rounded-l-none px-4 py-3.5 max-w-[65%] shadow-sm w-full">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span className="text-[11px] font-semibold text-brand uppercase tracking-wider">AI Summary</span>
          </div>
          <p className="text-[13px] text-[#6B7280] leading-relaxed mb-2">{text}</p>
          <button className="text-[11px] font-medium text-brand hover:underline">View full thread →</button>
        </div>
      </motion.div>
    );
  }

  const BubbleWrapper = ({ children }: { children: ReactNode }) => (
    <motion.div 
      initial={{ opacity: 0, x: isSent ? 10 : -10 }} 
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`flex flex-col mb-2 w-full ${isSent ? "items-end" : "items-start"}`}
    >
      <div 
        className="relative max-w-[65%] group"
        onContextMenu={onContextMenu}
      >
        <div className={`
          relative flex flex-col shadow-sm
          ${isSent 
            ? "bg-[#0F0F14] text-white rounded-[18px] rounded-tr-[4px]" 
            : "bg-white border border-[#ECECEC] text-[#0F0F14] rounded-[18px] rounded-tl-[4px]"
          }
          ${type === "image" ? "p-1.5" : "px-4 py-3"}
        `}>
          {showSenderName && !isSent && sender && (
            <span className={`text-[11px] font-semibold mb-0.5 ${senderColor || 'text-brand'}`}>{sender}</span>
          )}
          {children}
        </div>
        
        {/* Reactions */}
        {reactions && reactions.length > 0 && (
          <div className={`absolute -bottom-2 ${isSent ? "right-2" : "left-2"} flex items-center gap-1 z-10`}>
            {reactions.map((reaction, i) => (
              <div key={i} className="bg-white border border-[#ECECEC] rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm hover:scale-110 transition-transform cursor-pointer" title="Reacted">
                <span className="text-[12px]">{reaction.emoji}</span>
                <span className="text-[10px] font-medium text-[#6B7280]">{reaction.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );

  if (type === "image") {
    return (
      <BubbleWrapper>
        <div className="relative w-full sm:w-[280px] h-[180px] bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl overflow-hidden flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-gray-400 opacity-50" />
          <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded-md text-white text-[10px] font-medium">
            3+
          </div>
        </div>
        <div className="flex justify-end mt-1 mr-1">
          <span className={`text-[10px] ${isSent ? "text-white/50" : "text-[#9CA3AF]"}`}>{time}</span>
          {isSent && (
            <span className={`ml-1 text-[10px] ${read ? "text-brand" : "text-white/50"}`}>✓✓</span>
          )}
        </div>
      </BubbleWrapper>
    );
  }

  if (type === "voice") {
    return (
      <BubbleWrapper>
        <div className="flex flex-col gap-2 min-w-[240px]">
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-full bg-brand flex items-center justify-center shrink-0 shadow-sm hover:scale-105 transition-transform">
              <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
            </button>
            <div className="flex items-center gap-0.5 flex-1 h-6">
              {/* Fake Waveform */}
              {Array.from({ length: 25 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 rounded-full ${i < 8 ? "bg-brand" : "bg-[#E5E7EB]"}`}
                  style={{ height: `${Math.max(15, Math.random() * 100)}%` }}
                />
              ))}
            </div>
            <span className={`text-[12px] font-medium shrink-0 ${isSent ? "text-white/70" : "text-[#9CA3AF]"}`}>0:32</span>
          </div>
          <div className="flex items-start gap-1.5 mt-1 pt-2 border-t border-black/5 dark:border-white/10">
            <Sparkles className="w-3 h-3 text-brand mt-0.5 shrink-0" />
            <p className={`text-[12px] italic leading-snug ${isSent ? "text-white/80" : "text-[#6B7280]"}`}>
              Transcript: {text}
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-1.5">
          <span className={`text-[10px] ${isSent ? "text-white/50" : "text-[#9CA3AF]"}`}>{time}</span>
          {isSent && (
            <span className={`ml-1 text-[10px] ${read ? "text-brand" : "text-white/50"}`}>✓✓</span>
          )}
        </div>
      </BubbleWrapper>
    );
  }

  return (
    <BubbleWrapper>
      <div className="flex items-end gap-2">
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{text}</p>
        <div className="flex justify-end items-center gap-1 shrink-0 pb-0.5 opacity-60">
          <span className={`text-[11px] ${isSent ? "text-white" : "text-[#9CA3AF]"}`}>{time}</span>
          {isSent && (
            <span className={`text-[13px] leading-none ${read ? "text-brand" : "text-white"}`}>✓✓</span>
          )}
        </div>
      </div>
    </BubbleWrapper>
  );
}
