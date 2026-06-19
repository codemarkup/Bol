"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play, Sparkles, Image as ImageIcon, SmilePlus, Plus, Check, CheckCheck, Clock } from "lucide-react";
import { ReactNode, useState, useEffect, useRef } from "react";
import EmojiPicker, { Emoji, EmojiStyle } from 'emoji-picker-react';

const COMMON_EMOJIS = ["❤️", "😂", "😮", "😢", "🙏", "👍"];
const toUnified = (emoji: string) => [...emoji].map(c => c.codePointAt(0)?.toString(16)).join('-');

export const renderTextWithEmojis = (text?: string | null) => {
  if (!text) return null;
  try {
    const regex = new RegExp('([\\p{RGI_Emoji}])', 'v');
    const parts = text.split(regex);
    return (
      <span className="inline-flex flex-wrap items-center gap-x-[1px] align-middle">
        {parts.map((part, i) => {
          if (part.match(regex)) {
            return (
              <span key={i} className="inline-flex relative top-[3px] mx-[1px]">
                <Emoji unified={toUnified(part)} emojiStyle={EmojiStyle.APPLE} size={20} />
              </span>
            );
          }
          return <span key={i} className="whitespace-pre-wrap">{part}</span>;
        })}
      </span>
    );
  } catch (e) {
    return <span className="whitespace-pre-wrap">{text}</span>;
  }
};

function ReactionHoverPanel({ isSent, onReact, showPanel, setShowPanel }: { isSent: boolean, onReact?: (emoji: string) => void, showPanel: boolean, setShowPanel: (s: boolean) => void }) {
  const [showFullPicker, setShowFullPicker] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowPanel(false);
        setShowFullPicker(false);
      }
    }
    
    if (showPanel) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPanel, setShowPanel]);

  return (
    <div ref={panelRef}>
      <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isSent ? '-left-10' : '-right-10'}`}>
        <button 
          onClick={() => {
            setShowPanel(!showPanel);
            setShowFullPicker(false);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm text-[#9CA3AF] hover:text-brand transition-colors border border-[#ECECEC]"
        >
          <SmilePlus className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute top-0 -translate-y-[calc(100%+4px)] z-20 ${isSent ? 'right-0' : 'left-0'}`}
          >
            {showFullPicker ? (
              <div className="shadow-xl rounded-2xl overflow-hidden bg-white border border-[#ECECEC]">
                <EmojiPicker 
                  onEmojiClick={(e) => {
                    onReact?.(e.emoji);
                    setShowPanel(false);
                    setShowFullPicker(false);
                  }} 
                  emojiStyle={EmojiStyle.APPLE}
                  lazyLoadEmojis={true}
                  searchDisabled={false}
                  skinTonesDisabled={true}
                  width={300}
                  height={350}
                />
              </div>
            ) : (
              <div className="flex items-center gap-1 p-1.5 bg-white border border-[#ECECEC] rounded-full shadow-lg">
                {COMMON_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact?.(emoji);
                      setShowPanel(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center hover:bg-[#F6F8F7] rounded-full transition-colors hover:scale-110 origin-bottom"
                  >
                    <Emoji unified={toUnified(emoji)} emojiStyle={EmojiStyle.APPLE} size={22} />
                  </button>
                ))}
                <div className="w-[1px] h-6 bg-[#ECECEC] mx-1" />
                <button
                  onClick={() => setShowFullPicker(true)}
                  className="w-8 h-8 flex items-center justify-center text-[#6B7280] hover:text-brand hover:bg-[#F6F8F7] rounded-full transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type MessageBubbleProps = {
  type: "text" | "voice" | "image" | "video" | "ai_summary" | "typing";
  isSent: boolean;
  text?: string;
  time?: string;
  sender?: string;
  senderColor?: string;
  showSenderName?: boolean;
  reactions?: { emoji: string; count: number }[];
  read?: boolean;
  status?: 'pending' | 'sent' | 'delivered' | 'read';
  replyTo?: { id: string; content: string; senderName: string } | null;
  onContextMenu?: (e: React.MouseEvent) => void;
  onReact?: (emoji: string) => void;
  mediaUrl?: string;
  durationSeconds?: number;
  waveformData?: number[];
  transcriptStatus?: 'none' | 'processing' | 'done' | 'failed';
  messageId?: string;
  onMediaClick?: () => void;
  isDeleted?: boolean;
};

export function MessageBubble(props: MessageBubbleProps) {
  const { type, isSent, text, time, sender, senderColor, showSenderName, reactions, read, status, replyTo, onContextMenu, onReact, mediaUrl, durationSeconds, waveformData, transcriptStatus, messageId, onMediaClick, isDeleted } = props;
  const [showReactionPanel, setShowReactionPanel] = useState(false);
  
  if (isDeleted) {
    return (
      <div className={`flex w-full ${isSent ? "justify-end" : "justify-start"} mb-2`}>
        <div 
          onContextMenu={onContextMenu}
          className={`px-3 py-2 md:px-4 md:py-2.5 rounded-[18px] flex items-center gap-2 max-w-[85%] md:max-w-[70%] border border-[#ECECEC]/50 shadow-sm ${
            isSent ? "bg-[#F3F4F6] text-[#6B7280] rounded-tr-[4px]" : "bg-[#F9FAFB] text-[#6B7280] rounded-tl-[4px]"
          }`}
        >
          <div className="flex items-center gap-2 opacity-70">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
            <span className="text-[14px] italic leading-[1.4] tracking-[-0.01em]">This message was deleted</span>
          </div>
          <div className="flex items-center gap-1 mt-1 shrink-0 self-end ml-2 opacity-60">
            <span className="text-[10px] uppercase font-medium">{time}</span>
          </div>
        </div>
      </div>
    );
  }

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

  if (type === "image" || type === "video") {
    const actualMediaUrl = mediaUrl || text || "";
    const isActuallyVideo = String(actualMediaUrl).toLowerCase().match(/\.(mp4|webm|mov|quicktime|mkv)(\?.*)?$/) || type === "video" || String(actualMediaUrl).includes("type=video");
    
    return (
      <motion.div 
        initial={{ opacity: 0, x: isSent ? 10 : -10 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`flex flex-col w-full ${isSent ? "items-end" : "items-start"}`}
      >
        <div className="relative max-w-[65%] group" onContextMenu={onContextMenu}>
          <div className={`relative flex flex-col shadow-[0_6px_20px_rgba(0,0,0,0.06)] p-1.5 ${isSent ? "bg-[#111827] text-white rounded-[18px] rounded-tr-[4px]" : "bg-white border border-[#ECECEC] text-[#0F0F14] rounded-[18px] rounded-tl-[4px]"}`}>
            <div 
              className="relative w-full sm:w-[280px] bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl overflow-hidden flex items-center justify-center min-h-[120px] cursor-pointer group/media"
              onClick={onMediaClick}
            >
              <motion.div layoutId={`media-${messageId}`} className="relative w-full h-full flex items-center justify-center">
                {!isActuallyVideo ? (
                  <img src={actualMediaUrl} alt="Image" className="w-full h-auto max-h-[300px] object-cover group-hover/media:brightness-90 transition-all" />
                ) : (
                  <div className="relative w-full h-full">
                    <video src={actualMediaUrl} className="w-full h-auto max-h-[300px] object-cover group-hover/media:brightness-90 transition-all pointer-events-none" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                        <Play className="w-5 h-5 ml-1" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
            <div className="flex justify-between items-center mt-1 px-1 gap-1">
              <span className={`text-[10px] ${isSent ? "text-white/50" : "text-[#9CA3AF]"}`}>
                {time}
              </span>
              {isSent && (
                <span className="flex items-center ml-1">
                  {status === 'pending' ? <Clock className="w-3 h-3 text-white/50" /> :
                   (status === 'read' || read) ? <CheckCheck className="w-3 h-3 text-[#00E5FF] drop-shadow-[0_0_2px_rgba(0,229,255,0.4)]" /> :
                   status === 'delivered' ? <CheckCheck className="w-3 h-3 text-white/50" /> :
                   <Check className="w-3 h-3 text-white/50" />}
                </span>
              )}
            </div>
          </div>
          {reactions && reactions.length > 0 && (
            <div className={`absolute -bottom-2 ${isSent ? "right-2" : "left-2"} flex items-center gap-1 z-10`}>
              {reactions.map((reaction, i) => (
                <div key={i} className="bg-white border border-[#ECECEC] rounded-full px-1.5 py-0.5 flex items-center gap-1 shadow-sm hover:scale-110 transition-transform cursor-pointer" title="Reacted">
                  <Emoji unified={toUnified(reaction.emoji)} emojiStyle={EmojiStyle.APPLE} size={14} />
                  <span className="text-[10px] font-medium text-[#6B7280]">{reaction.count}</span>
                </div>
              ))}
            </div>
          )}
          <ReactionHoverPanel isSent={isSent} onReact={onReact} showPanel={showReactionPanel} setShowPanel={setShowReactionPanel} />
        </div>
      </motion.div>
    );
  }

  if (type === "voice") {
    return <VoiceBubble {...props} />
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: isSent ? 10 : -10 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`flex flex-col w-full ${isSent ? "items-end" : "items-start"}`}
    >
      <div className="relative max-w-[65%] group" onContextMenu={onContextMenu}>
        <div className={`relative flex flex-col shadow-[0_6px_20px_rgba(0,0,0,0.06)] px-4 py-3 ${isSent ? "bg-[#111827] text-white rounded-[18px] rounded-tr-[4px]" : "bg-white border border-[#ECECEC] text-[#0F0F14] rounded-[18px] rounded-tl-[4px]"}`}>
          {showSenderName && !isSent && sender && (
            <span className={`text-[11px] font-semibold mb-0.5 ${senderColor || 'text-brand'}`}>{sender}</span>
          )}
          {/* WhatsApp-style quoted reply */}
          {replyTo && (
            <div 
              onClick={() => {
                if ((replyTo as any).pulseData?.user_id) {
                  window.location.href = `/status?user=${(replyTo as any).pulseData.user_id}`;
                }
              }}
              className={`flex gap-2 mb-2 rounded-xl px-3 py-2 cursor-pointer hover:opacity-90 transition-opacity ${
              isSent ? 'bg-white/10 border-l-2 border-[#00E5FF]' : 'bg-[#F6F8F7] border-l-2 border-brand'
            }`}>
              {(replyTo as any).pulseData?.media_url ? (
                <div className="w-10 h-10 shrink-0 rounded-md overflow-hidden bg-black/10">
                  {((replyTo as any).pulseData.media_type === 'video') ? (
                    <video src={(replyTo as any).pulseData.media_url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={(replyTo as any).pulseData.media_url} className="w-full h-full object-cover" />
                  )}
                </div>
              ) : (replyTo as any).pulseData?.background_color && (
                <div className="w-10 h-10 shrink-0 rounded-md overflow-hidden flex items-center justify-center" style={{ backgroundColor: (replyTo as any).pulseData.background_color }}>
                  <div className="w-full h-full flex items-center justify-center text-white text-[8px] font-bold p-1 text-center leading-tight line-clamp-2">
                    {(replyTo as any).pulseData.text_content}
                  </div>
                </div>
              )}
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <p className={`text-[11px] font-semibold truncate ${ isSent ? 'text-[#00E5FF]' : 'text-brand' }`}>{replyTo.senderName}</p>
                <p className={`text-[12px] truncate ${ isSent ? 'text-white/60' : 'text-[#6B7280]' }`}>{replyTo.content}</p>
              </div>
            </div>
          )}
          <div className="flex items-end gap-2">
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap flex items-center flex-wrap">{renderTextWithEmojis(text)}</p>
            <div className="flex justify-end items-center gap-1 shrink-0 pb-0.5 opacity-80">
              <span className={`text-[11px] ${isSent ? "text-white" : "text-[#9CA3AF]"}`}>{time}</span>
              {isSent && (
                <span className="flex items-center ml-1 shrink-0">
                  {status === 'pending' ? <Clock className="w-3.5 h-3.5 text-white/60" /> :
                   (status === 'read' || read) ? <CheckCheck className="w-3.5 h-3.5 text-[#00E5FF] drop-shadow-[0_0_2px_rgba(0,229,255,0.4)]" /> :
                   status === 'delivered' ? <CheckCheck className="w-3.5 h-3.5 text-white/60" /> :
                   <Check className="w-3.5 h-3.5 text-white/60" />}
                </span>
              )}
            </div>
          </div>
        </div>
        {reactions && reactions.length > 0 && (
          <div className={`absolute -bottom-2 ${isSent ? "right-2" : "left-2"} flex items-center gap-1 z-10`}>
            {reactions.map((reaction, i) => (
              <div key={i} className="bg-white border border-[#ECECEC] rounded-full px-1.5 py-0.5 flex items-center gap-1 shadow-sm hover:scale-110 transition-transform cursor-pointer" title="Reacted">
                <Emoji unified={toUnified(reaction.emoji)} emojiStyle={EmojiStyle.APPLE} size={14} />
                <span className="text-[10px] font-medium text-[#6B7280]">{reaction.count}</span>
              </div>
            ))}
          </div>
        )}
        
        <ReactionHoverPanel isSent={isSent} onReact={onReact} showPanel={showReactionPanel} setShowPanel={setShowReactionPanel} />
      </div>
    </motion.div>
  );
}

function VoiceBubble(props: MessageBubbleProps) {
  const { isSent, text, time, sender, senderColor, showSenderName, reactions, read, status, onContextMenu, onReact, mediaUrl, durationSeconds, waveformData = [], transcriptStatus } = props;
  const [showReactionPanel, setShowReactionPanel] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current && mediaUrl) {
      audioRef.current = new Audio(mediaUrl);
      audioRef.current.preload = 'metadata';
      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current!.currentTime);
      };
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
    }

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play().catch(e => console.error("Audio playback failed", e));
      setIsPlaying(true);
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const drawSmoothWaveform = (data: number[]) => {
    if (!data || !data.length) return "";
    const w = 200; 
    const h = 24;  
    const step = w / (data.length - 1);
    
    const points = data.map((val, i) => ({
      x: i * step,
      y: h - (Math.max(0.1, val) * h)
    }));

    let path = `M 0 ${h} L 0 ${points[0].y} `;
    
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX = (curr.x + next.x) / 2;
      path += `C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y} `;
    }
    
    path += `L ${w} ${h} Z`;
    return path;
  };

  const duration = durationSeconds || 0;
  const progress = duration > 0 ? currentTime / duration : 0;
  const displayWaveform = waveformData && waveformData.length > 0 ? waveformData : Array.from({ length: 40 }).map(() => 0.1);

  return (
    <motion.div 
      initial={{ opacity: 0, x: isSent ? 10 : -10 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`flex flex-col w-full ${isSent ? "items-end" : "items-start"}`}
    >
      <div className="relative max-w-[65%] group" onContextMenu={onContextMenu}>
        <div className={`relative flex flex-col shadow-[0_6px_20px_rgba(0,0,0,0.06)] px-4 py-3 ${isSent ? "bg-[#111827] text-white rounded-[18px] rounded-tr-[4px]" : "bg-white border border-[#ECECEC] text-[#0F0F14] rounded-[18px] rounded-tl-[4px]"}`}>
          {showSenderName && !isSent && sender && (
            <span className={`text-[11px] font-semibold mb-0.5 ${senderColor || 'text-brand'}`}>{sender}</span>
          )}
          <div className="flex flex-col gap-2 min-w-[240px]">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm hover:scale-105 transition-all ${isSent ? 'bg-white text-[#0F0F14]' : 'bg-brand text-white'}`}>
                {isPlaying ? (
                  <div className="flex gap-0.5 items-center justify-center">
                    <div className="w-1 h-3 bg-current rounded-sm" />
                    <div className="w-1 h-3 bg-current rounded-sm" />
                  </div>
                ) : (
                  <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                )}
              </button>
              
              <div 
                className="relative flex-1 h-[24px] w-full min-w-[120px] cursor-pointer group"
                onClick={(e) => {
                  if (!audioRef.current || duration === 0) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const newProgress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  audioRef.current.currentTime = newProgress * duration;
                  setCurrentTime(newProgress * duration);
                }}
              >
                {/* Background Waveform */}
                <svg viewBox="0 0 200 24" preserveAspectRatio="none" className={`absolute inset-0 w-full h-full transition-colors ${isSent ? 'fill-white/20' : 'fill-[#E5E7EB]'}`}>
                  <path d={drawSmoothWaveform(displayWaveform)} />
                </svg>

                {/* Foreground Waveform (Filled) */}
                <svg viewBox="0 0 200 24" preserveAspectRatio="none" className={`absolute inset-0 w-full h-full transition-colors ${isSent ? 'fill-white' : 'fill-brand'}`} style={{ clipPath: `inset(0 ${100 - (progress * 100)}% 0 0)` }}>
                  <path d={drawSmoothWaveform(displayWaveform)} />
                </svg>
                
                {/* Playhead Knob (Hover only) */}
                <div 
                  className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${isSent ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-brand shadow-[0_0_8px_rgba(13,148,136,0.8)]'}`}
                  style={{ left: `calc(${progress * 100}% - 5px)` }}
                />
              </div>

              <span className={`text-[12px] font-medium shrink-0 w-8 text-right ${isSent ? "text-white/70" : "text-[#9CA3AF]"}`}>
                {formatDuration(isPlaying ? currentTime : duration)}
              </span>
            </div>
            
            {transcriptStatus !== 'none' && transcriptStatus !== 'failed' && (
              <div className="flex items-start gap-1.5 mt-1 pt-2 border-t border-black/5 dark:border-white/10">
                <Sparkles className="w-3 h-3 text-brand mt-0.5 shrink-0" />
                {transcriptStatus === 'processing' ? (
                  <p className={`text-[12px] italic leading-snug animate-pulse ${isSent ? "text-white/60" : "text-[#9CA3AF]"}`}>Transcribing...</p>
                ) : (
                  <p className={`text-[12px] italic leading-snug ${isSent ? "text-white/80" : "text-[#6B7280]"}`}>{text}</p>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end items-center mt-1.5 gap-1">
            <span className={`text-[10px] ${isSent ? "text-white/50" : "text-[#9CA3AF]"}`}>{time}</span>
            {isSent && (
              <span className="flex items-center">
                {status === 'pending' ? <Clock className="w-3 h-3 text-white/50" /> :
                 (status === 'read' || read) ? <CheckCheck className="w-3 h-3 text-[#00E5FF] drop-shadow-[0_0_2px_rgba(0,229,255,0.4)]" /> :
                 status === 'delivered' ? <CheckCheck className="w-3 h-3 text-white/50" /> :
                 <Check className="w-3 h-3 text-white/50" />}
              </span>
            )}
          </div>
        </div>
        {reactions && reactions.length > 0 && (
          <div className={`absolute -bottom-2 ${isSent ? "right-2" : "left-2"} flex items-center gap-1 z-10`}>
            {reactions.map((reaction, i) => (
              <div key={i} className="bg-white border border-[#ECECEC] rounded-full px-1.5 py-0.5 flex items-center gap-1 shadow-sm hover:scale-110 transition-transform cursor-pointer" title="Reacted">
                <Emoji unified={toUnified(reaction.emoji)} emojiStyle={EmojiStyle.APPLE} size={14} />
                <span className="text-[10px] font-medium text-[#6B7280]">{reaction.count}</span>
              </div>
            ))}
          </div>
        )}
        <ReactionHoverPanel isSent={isSent} onReact={onReact} showPanel={showReactionPanel} setShowPanel={setShowReactionPanel} />
      </div>
    </motion.div>
  );
}

