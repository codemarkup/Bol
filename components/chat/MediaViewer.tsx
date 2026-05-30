"use client";

import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { X, Download, Forward, Sparkles, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { MessageItem } from "@/hooks/useMessages";

interface MediaViewerProps {
  mediaList: MessageItem[];
  initialIndex: number;
  onClose: () => void;
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
    scale: 0.95
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
    scale: 0.95
  })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export function MediaViewer({ mediaList, initialIndex, onClose }: MediaViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [[page, direction], setPage] = useState([initialIndex, 0]);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeIndex = Math.max(0, Math.min(page, mediaList.length - 1));
  const currentMedia = mediaList[activeIndex];

  const actualMediaUrl = currentMedia?.media_url || currentMedia?.content || "";
  const isVideo = String(actualMediaUrl).toLowerCase().match(/\.(mp4|webm|mov|quicktime|mkv)(\?.*)?$/) || currentMedia?.type === "video" || String(actualMediaUrl).includes("type=video");

  // Drag to dismiss
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-200, 0, 200], [0, 1, 0]);
  const scale = useTransform(y, [-200, 0, 200], [0.8, 1, 0.8]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') paginate(1);
      if (e.key === 'ArrowLeft') paginate(-1);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, activeIndex]);

  const paginate = (newDirection: number) => {
    const newPage = activeIndex + newDirection;
    if (newPage >= 0 && newPage < mediaList.length) {
      setPage([newPage, newDirection]);
    }
  };

  const handleInteraction = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 2500);
  };

  useEffect(() => {
    handleInteraction();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [activeIndex]);

  const handleDownload = async () => {
    try {
      const response = await fetch(actualMediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bol_Media_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      window.open(actualMediaUrl, '_blank');
    }
  };

  if (!currentMedia || !mounted) return null;

  return createPortal(
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center overflow-hidden"
      onClick={() => setControlsVisible(v => !v)}
      onMouseMove={handleInteraction}
    >
      {/* Blurred background layer matching media color (simulated with large blur) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
        {!isVideo && <img src={actualMediaUrl} className="w-full h-full object-cover blur-[100px] scale-150 saturate-150" alt="backdrop" />}
      </div>

      {/* Top Floating Bar */}
      <AnimatePresence>
        {controlsVisible && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-4 left-4 right-4 h-16 bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/10 flex items-center justify-between px-6 z-20 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand to-[#00E5FF] flex items-center justify-center text-white font-bold text-sm shadow-inner">
                {currentMedia.senderName?.charAt(0) || "Y"}
              </div>
              <div className="flex flex-col">
                <span className="text-white font-semibold text-sm">{currentMedia.senderName || "You"}</span>
                <span className="text-white/60 text-xs">{currentMedia.time}</span>
              </div>
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium tracking-widest hidden md:block">
              {activeIndex + 1} / {mediaList.length}
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <button title="Forward" className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
                <Forward className="w-5 h-5" />
              </button>
              <button onClick={handleDownload} title="Download" className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
                <Download className="w-5 h-5" />
              </button>
              <div className="w-[1px] h-6 bg-white/20 mx-2" />
              <button onClick={onClose} title="Close" className="text-white bg-white/10 hover:bg-white/20 transition-colors p-2 rounded-full backdrop-blur-md">
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Media Carousel */}
      <div className="relative w-full h-full flex items-center justify-center z-10">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={1}
            onDrag={handleInteraction}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.y, velocity.y);
              if (swipe > 10000 || Math.abs(offset.y) > 150) {
                onClose();
              }
            }}
            style={{ y, opacity, scale }}
            className="absolute inset-0 flex items-center justify-center p-4 md:p-20"
          >
            {isVideo ? (
              <motion.div layoutId={`media-${currentMedia.id}`} className="relative w-full h-full flex items-center justify-center">
                <video 
                  src={actualMediaUrl} 
                  controls={controlsVisible}
                  autoPlay
                  onClick={e => e.stopPropagation()}
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] focus:outline-none ring-1 ring-white/10"
                />
              </motion.div>
            ) : (
              <motion.div layoutId={`media-${currentMedia.id}`} className="relative w-full h-full flex items-center justify-center">
                <img 
                  src={actualMediaUrl} 
                  alt="Media Viewer" 
                  onClick={e => e.stopPropagation()}
                  className="max-w-full max-h-full object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.5)] cursor-grab active:cursor-grabbing rounded-lg"
                  draggable={false}
                />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {activeIndex > 0 && controlsVisible && (
          <button 
            className="absolute left-4 md:left-8 z-20 p-4 rounded-full bg-black/20 text-white/70 hover:bg-white/10 hover:text-white backdrop-blur-xl transition-all"
            onClick={(e) => { e.stopPropagation(); paginate(-1); }}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}
        {activeIndex < mediaList.length - 1 && controlsVisible && (
          <button 
            className="absolute right-4 md:right-8 z-20 p-4 rounded-full bg-black/20 text-white/70 hover:bg-white/10 hover:text-white backdrop-blur-xl transition-all"
            onClick={(e) => { e.stopPropagation(); paginate(1); }}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>

      {/* Bottom Floating Action Panel & Thumbnails */}
      <AnimatePresence>
        {controlsVisible && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-20 w-full max-w-2xl px-4"
            onClick={e => e.stopPropagation()}
          >
            {/* AI Actions */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-2xl px-2 py-2 rounded-2xl border border-white/10 shadow-2xl">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium group">
                <Sparkles className="w-4 h-4 text-brand group-hover:text-[#00E5FF] transition-colors" />
                {isVideo ? "Summarize Video" : "Extract Text"}
              </button>
              <div className="w-[1px] h-6 bg-white/20" />
              <button className="px-4 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium">
                Save
              </button>
              <button className="px-4 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium">
                Forward
              </button>
            </div>

            {/* Thumbnail Strip */}
            {mediaList.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto max-w-full p-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 no-scrollbar">
                {mediaList.map((m, idx) => {
                  const mUrl = m.media_url || m.content || "";
                  const mIsVideo = String(mUrl).toLowerCase().match(/\.(mp4|webm|mov|quicktime|mkv)(\?.*)?$/) || m.type === "video" || String(mUrl).includes("type=video");
                  const isActive = idx === activeIndex;

                  return (
                    <button
                      key={m.id}
                      onClick={() => setPage([idx, idx > activeIndex ? 1 : -1])}
                      className={`relative shrink-0 transition-all duration-300 rounded-lg overflow-hidden ${isActive ? 'w-16 h-16 ring-2 ring-brand opacity-100 scale-110 shadow-lg z-10' : 'w-12 h-12 opacity-50 hover:opacity-100'}`}
                    >
                      {mIsVideo ? (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white/70" />
                        </div>
                      ) : (
                        <img src={mUrl} className="w-full h-full object-cover" alt="thumbnail" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body
  );
}
