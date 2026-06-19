"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, Eye, Smile, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Pulse } from "./PulseFeed";

interface PulseViewerProps {
  userId: string;
  currentUserId: string | null;
  onBack: () => void;
  onClose: () => void;
  onNextUser: (nextUserId: string) => void;
}

const EMOJI_REACTIONS = ['❤️', '😂', '😮', '🙏', '👍'];

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function PulseViewer({ userId, currentUserId, onBack, onClose, onNextUser }: PulseViewerProps) {
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const progressRef = useRef(0);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number, emoji: string, x: number }[]>([]);
  
  const [showViewersList, setShowViewersList] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const currentPulse = pulses[currentIndex];
  const isOwner = currentUserId === userId;

  const fetchViewers = async () => {
    if (!currentPulse) return;
    setIsPaused(true);
    setShowViewersList(true);
    
    const supabase = createClient();
    const { data: views } = await supabase.from('pulse_views').select('viewer_id, viewed_at').eq('pulse_id', currentPulse.id).order('viewed_at', { ascending: false });
    
    if (views && views.length > 0) {
      const viewerIds = views.map(v => v.viewer_id);
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', viewerIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      const viewersData = views.map(v => ({
        id: v.viewer_id,
        viewed_at: v.viewed_at,
        full_name: profileMap.get(v.viewer_id)?.full_name || 'Unknown',
        avatar_url: profileMap.get(v.viewer_id)?.avatar_url || ''
      }));
      setViewers(viewersData);
    } else {
      setViewers([]);
    }
  };

  useEffect(() => {
    const fetchPulses = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('pulses')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true }); // Oldest first for chronological viewing
        
      if (data && data.length > 0) {
        // Fetch profile
        const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', userId).single();
        
        const pulsesWithProfiles = data.map(p => ({
          ...p,
          profiles: profile || { full_name: 'Unknown', avatar_url: '' }
        }));
        // Fetch viewed pulses by current user to determine starting index
        let firstUnviewedIndex = 0;
        if (currentUserId && currentUserId !== userId) {
          const { data: views } = await supabase.from('pulse_views').select('pulse_id').eq('viewer_id', currentUserId);
          const viewedIds = new Set(views?.map(v => v.pulse_id) || []);
          firstUnviewedIndex = pulsesWithProfiles.findIndex(p => !viewedIds.has(p.id));
        }
        
        setPulses(pulsesWithProfiles as any);
        setCurrentIndex(firstUnviewedIndex !== -1 ? firstUnviewedIndex : 0);
      } else {
        onClose(); // No pulses found or all expired
      }
    };
    fetchPulses();
  }, [userId, onClose, currentUserId]);

  // Record view
  useEffect(() => {
    if (!currentPulse || !currentUserId || isOwner) return;
    const recordView = async () => {
      const supabase = createClient();
      const { error } = await supabase.from('pulse_views').insert({
        pulse_id: currentPulse.id,
        viewer_id: currentUserId
      });
      if (error && error.code !== '23505') { // Ignore unique violation
        console.error("Failed to record view:", error);
      }
    };
    recordView();
  }, [currentPulse, currentUserId, isOwner]);

  // Reset on index change
  useEffect(() => {
    setIsMediaLoaded(false);
    setProgress(0);
    progressRef.current = 0;
    if (pulses[currentIndex]?.media_type === 'text') {
      setIsMediaLoaded(true);
    }
  }, [currentIndex, pulses]);

  // Progress and Auto-advance for images/text
  useEffect(() => {
    if (!currentPulse || isPaused || !isMediaLoaded) return;
    if (currentPulse.media_type === 'video' || currentPulse.media_type === 'voice') return;

    let duration = 5000; // Default 5s for photo/text
    let startTime = Date.now();
    let initialProgress = progressRef.current;

    let animationFrameId: number;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const additionalProgress = (elapsed / duration) * 100;
      const newProgress = Math.min(initialProgress + additionalProgress, 100);
      
      setProgress(newProgress);
      progressRef.current = newProgress;

      if (newProgress < 100) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        handleNext();
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentIndex, currentPulse, isPaused, isMediaLoaded]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, pulses.length]);

  const handleNext = () => {
    setProgress(0);
    if (currentIndex < pulses.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Find next user and trigger onNextUser, or close if none
      // For simplicity in this demo, just close
      onClose();
    }
  };

  const handlePrev = () => {
    setProgress(0);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicking on controls, don't navigate
    if ((e.target as HTMLElement).closest('.controls-layer')) return;
    if (showViewersList) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > rect.width / 2) {
      handleNext();
    } else {
      handlePrev();
    }
  };

  const sendReaction = (emoji: string) => {
    // Send DM reaction
    // Also animate local float
    const id = Date.now();
    setFloatingEmojis(prev => [...prev, { id, emoji, x: Math.random() * 60 + 20 }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 2000);
  };

  const submitReply = async () => {
    if (!replyText.trim() || !currentUserId || !currentPulse) return;
    setIsSubmittingReply(true);
    
    const supabase = createClient();
    
    // Check if convo exists
    let { data: convs } = await supabase.rpc('get_conversation_with_user', {
      other_user_id: currentPulse.user_id
    });
    
    let convId = convs?.[0]?.id;
    if (!convId) {
      // Create conv
      const { data: newConv } = await supabase.from('conversations').insert({ type: 'direct', created_by: currentUserId }).select().single();
      if (newConv) {
        convId = newConv.id;
        await supabase.from('conversation_members').insert([
          { conversation_id: convId, user_id: currentUserId, role: 'admin' },
          { conversation_id: convId, user_id: currentPulse.user_id, role: 'member' }
        ]);
      }
    }

    if (convId) {
      await supabase.from('messages').insert({
        conversation_id: convId,
        sender_id: currentUserId,
        content: replyText.trim(),
        message_type: 'text',
        // In a real app we'd add metadata referencing the pulse
      });
    }

    setReplyText("");
    setIsSubmittingReply(false);
    // Show a success toast or similar
  };

  if (!currentPulse) return <div className="h-full bg-black flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[#0D9488] border-t-transparent animate-spin" /></div>;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col group select-none">
      
      {/* Blurred Background Layer */}
      <div className="absolute inset-0 z-0">
        {currentPulse.media_type === 'photo' && currentPulse.media_url ? (
          <img src={currentPulse.media_url} className="w-full h-full object-cover opacity-30 blur-3xl scale-110" />
        ) : currentPulse.media_type === 'video' && currentPulse.media_url ? (
          <video src={currentPulse.media_url} className="w-full h-full object-cover opacity-30 blur-3xl scale-110" muted loop playsInline />
        ) : currentPulse.media_type === 'text' ? (
          <div className="w-full h-full opacity-30 blur-3xl scale-110" style={{ backgroundColor: currentPulse.background_color || '#0D9488' }} />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-[#0D9488]/20 to-black opacity-50" />
        )}
      </div>

      {/* Main Content Layer */}
      <div 
        className="absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-8"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        onClick={handleTap}
      >
        <motion.div 
          layoutId={`pulse-card-${currentPulse.id}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-lg aspect-[9/16] max-h-full rounded-[24px] overflow-hidden shadow-2xl bg-black"
        >
          {currentPulse.media_type === 'photo' && (
            <img 
              src={currentPulse.media_url} 
              className="w-full h-full object-contain" 
              onLoad={() => setIsMediaLoaded(true)}
            />
          )}
          {currentPulse.media_type === 'video' && (
            <video 
              ref={videoRef}
              src={currentPulse.media_url} 
              className="w-full h-full object-contain" 
              autoPlay 
              playsInline 
              muted={false}
              onLoadedData={() => setIsMediaLoaded(true)}
              onPlay={() => setIsPaused(false)}
              onPause={() => setIsPaused(true)}
              onTimeUpdate={() => {
                if (videoRef.current && videoRef.current.duration) {
                  const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
                  setProgress(p);
                  progressRef.current = p;
                }
              }}
              onEnded={handleNext}
            />
          )}
          {currentPulse.media_type === 'text' && (
            <div 
              className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
              style={{ backgroundColor: currentPulse.background_color || '#0D9488' }}
            >
              <p className="text-white text-3xl font-bold leading-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                {currentPulse.caption}
              </p>
            </div>
          )}
          {currentPulse.media_type === 'voice' && (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center p-8">
              <audio 
                ref={audioRef} 
                src={currentPulse.media_url} 
                autoPlay 
                onLoadedData={() => setIsMediaLoaded(true)}
                onPlay={() => setIsPaused(false)} 
                onPause={() => setIsPaused(true)} 
                onTimeUpdate={() => {
                  if (audioRef.current && audioRef.current.duration) {
                    const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
                    setProgress(p);
                    progressRef.current = p;
                  }
                }}
                onEnded={handleNext}
              />
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 mb-8 shadow-2xl relative">
                <img src={currentPulse.profiles?.avatar_url} className="w-full h-full object-cover" />
                {!isPaused && <div className="absolute inset-0 bg-[#0D9488]/20 animate-pulse" />}
              </div>
              <div className="flex items-center justify-center h-16 gap-1.5 opacity-80">
                {currentPulse.waveform_data ? currentPulse.waveform_data.map((h, i) => (
                  <motion.div 
                    key={i}
                    className="w-1.5 bg-[#0D9488] rounded-full"
                    animate={{ height: isPaused ? `${h * 100}%` : [`${h * 100}%`, `${Math.max(10, h * 150)}%`, `${h * 100}%`] }}
                    transition={{ duration: 0.5, repeat: isPaused ? 0 : Infinity, delay: i * 0.05 }}
                    style={{ minHeight: '10%' }}
                  />
                )) : (
                  Array.from({ length: 20 }).map((_, i) => (
                    <motion.div 
                      key={i}
                      className="w-1.5 bg-white/50 rounded-full"
                      animate={{ height: isPaused ? '20%' : ['20%', '80%', '20%'] }}
                      transition={{ duration: 0.5 + Math.random() * 0.5, repeat: isPaused ? 0 : Infinity }}
                      style={{ minHeight: '20%' }}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Caption Overlay */}
          {currentPulse.caption && currentPulse.media_type !== 'text' && (
            <div className="absolute bottom-0 inset-x-0 pt-24 pb-8 px-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end pointer-events-none">
              <p className="text-white text-[15px] font-medium text-shadow-sm leading-snug">
                {currentPulse.caption}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* UI Controls Layer */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 sm:p-8">
        
        {/* Top Bar */}
        <div className="w-full max-w-lg mx-auto flex flex-col gap-3 controls-layer pointer-events-auto">
          {/* Progress Bars */}
          <div className="flex gap-1.5">
            {pulses.map((p, i) => (
              <div key={p.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                <motion.div 
                  className="h-full bg-white rounded-full"
                  initial={{ width: i < currentIndex ? '100%' : '0%' }}
                  animate={{ width: i === currentIndex ? `${progress}%` : i < currentIndex ? '100%' : '0%' }}
                  transition={{ ease: "linear", duration: 0.1 }}
                />
              </div>
            ))}
          </div>

          {/* User Info & Actions */}
          <div className="flex justify-between items-start pt-1">
            <div className="flex items-center gap-3 drop-shadow-md">
              <img src={currentPulse.profiles?.avatar_url} className="w-9 h-9 rounded-full object-cover border border-white/20" />
              <div className="flex flex-col">
                <span className="text-white text-[15px] font-bold text-shadow-sm leading-tight">
                  {currentPulse.profiles?.full_name}
                </span>
                <span className="text-white/80 text-[12px] font-medium text-shadow-sm">
                  {formatTimeAgo(currentPulse.created_at)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 drop-shadow-md">
              {currentPulse.mood && (
                <div className="px-2.5 py-1 bg-black/30 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-1.5">
                  <span className="text-[12px]">{MOODS.find(m => m.id === currentPulse.mood)?.emoji}</span>
                  <span className="text-white/90 text-[11px] font-medium uppercase tracking-wider">{currentPulse.mood}</span>
                </div>
              )}
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="w-full max-w-lg mx-auto controls-layer pointer-events-auto mt-auto">
          {isOwner ? (
            <div className="flex justify-center pb-4">
              <button onClick={fetchViewers} className="flex flex-col items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
                <Eye className="w-6 h-6 text-white" />
                <span className="text-white text-xs font-semibold">{currentPulse.view_count} views</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl mb-4 sm:mb-0">
              <div className="flex-1 flex items-center bg-white/10 rounded-xl px-4 py-2.5 focus-within:bg-white/20 transition-colors">
                <input 
                  type="text" 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => setIsPaused(true)}
                  onBlur={() => setIsPaused(false)}
                  onKeyDown={(e) => e.key === 'Enter' && submitReply()}
                  placeholder={`Reply to ${currentPulse.profiles?.full_name?.split(' ')[0]}'s Status...`}
                  className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/60 text-[14px]"
                />
                {replyText.trim() && (
                  <button onClick={submitReply} className="ml-2 p-1 text-[#0D9488] hover:text-[#5EEAD4]">
                    {isSubmittingReply ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {EMOJI_REACTIONS.map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => sendReaction(emoji)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-transform hover:scale-110 active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Emojis Animation Layer */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        <AnimatePresence>
          {floatingEmojis.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: '100%', x: `${item.x}%`, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], y: '-20%', x: `${item.x + (Math.random() * 10 - 5)}%`, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute bottom-20 text-4xl"
            >
              {item.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Viewers List Modal */}
      <AnimatePresence>
        {showViewersList && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl max-h-[70vh] flex flex-col pointer-events-auto"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECECEC] shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#0F0F14]" />
                <h2 className="text-[16px] font-bold text-[#0F0F14]">Viewed by {viewers.length}</h2>
              </div>
              <button 
                onClick={() => { setShowViewersList(false); setIsPaused(false); }}
                className="w-8 h-8 rounded-full bg-[#F6F8F7] flex items-center justify-center hover:bg-[#E5E7EB] transition-colors"
              >
                <X className="w-5 h-5 text-[#6B7280]" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {viewers.length === 0 ? (
                <div className="py-12 text-center text-[#6B7280] text-[14px]">
                  No views yet.
                </div>
              ) : (
                viewers.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-4 hover:bg-[#F6F8F7] rounded-2xl transition-colors">
                    <div className="flex items-center gap-3">
                      <img src={v.avatar_url} className="w-12 h-12 rounded-full object-cover bg-[#ECECEC]" />
                      <div className="flex flex-col">
                        <span className="text-[15px] font-bold text-[#0F0F14]">{v.full_name}</span>
                        <span className="text-[12px] text-[#6B7280]">{formatTimeAgo(v.viewed_at)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Ensure MOODS is available to viewer
const MOODS = [
  { id: 'chill', emoji: '😌', label: 'Chill' },
  { id: 'celebration', emoji: '🎉', label: 'Celebration' },
  { id: 'work', emoji: '💻', label: 'Work' },
  { id: 'cricket', emoji: '🏏', label: 'Cricket' },
  { id: 'travel', emoji: '✈️', label: 'Travel' },
  { id: 'food', emoji: '🍕', label: 'Food' },
  { id: 'music', emoji: '🎵', label: 'Music' },
  { id: 'love', emoji: '❤️', label: 'Love' },
  { id: 'random', emoji: '✨', label: 'Random' },
];
