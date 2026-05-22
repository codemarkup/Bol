"use client";

import { cn } from "@/lib/utils";
import { Play, Sparkles } from "lucide-react";
import { ReactNode } from "react";

export function ChatContainer({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 px-4 pb-4">{children}</div>;
}

export function ChatBubble({
  isSender,
  message,
  time,
  senderName,
  avatar,
}: {
  isSender?: boolean;
  message: ReactNode;
  time?: string;
  senderName?: string;
  avatar?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full",
        isSender ? "justify-end" : "justify-start gap-2"
      )}
    >
      {!isSender && avatar && (
        <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0 mt-auto mb-1 overflow-hidden">
          <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
        </div>
      )}
      <div className={cn("flex flex-col max-w-[80%]", isSender ? "items-end" : "items-start")}>
        {!isSender && senderName && (
          <span className="text-[10px] text-muted-foreground ml-1 mb-0.5 font-medium">
            {senderName}
          </span>
        )}
        <div
          className={cn(
            "px-3 py-2 text-[13px] leading-tight rounded-2xl",
            isSender
              ? "bg-[#0D9488] text-white rounded-br-sm"
              : "bg-white border border-border/50 text-foreground shadow-sm rounded-bl-sm"
          )}
        >
          {message}
        </div>
        {time && (
          <span className="text-[9px] text-muted-foreground/70 mt-1 mx-1">
            {time}
          </span>
        )}
      </div>
    </div>
  );
}

export function SystemMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-center w-full my-2">
      <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
        {text}
      </span>
    </div>
  );
}

export function AISummaryCard({ points }: { points: string[] }) {
  return (
    <div className="my-2 bg-white border border-brand/20 shadow-sm rounded-xl p-3 mx-2 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand to-[#14b8a6]"></div>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-brand" />
        <span className="text-xs font-semibold text-brand">AI Catch-Up</span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {points.map((point, i) => (
          <li key={i} className="text-[11px] text-foreground/80 flex items-start gap-1.5 leading-snug">
            <span className="w-1 h-1 rounded-full bg-brand/50 mt-1.5 shrink-0"></span>
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function VoiceNoteBubble({ isSender, duration }: { isSender?: boolean; duration: string }) {
  return (
    <ChatBubble
      isSender={isSender}
      message={
        <div className="flex items-center gap-2 min-w-[120px]">
          <button className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
            isSender ? "bg-white/20 text-white" : "bg-brand/10 text-brand"
          )}>
            <Play className="w-3 h-3 ml-0.5 fill-current" />
          </button>
          {/* Simple waveform mock */}
          <div className="flex items-center gap-0.5 flex-1 h-4">
            {[1, 3, 2, 4, 2, 3, 1, 2, 1].map((h, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex-1 rounded-full",
                  isSender ? "bg-white/60" : "bg-brand/40"
                )} 
                style={{ height: `${h * 25}%` }}
              ></div>
            ))}
          </div>
          <span className="text-[10px] opacity-80">{duration}</span>
        </div>
      }
    />
  );
}
