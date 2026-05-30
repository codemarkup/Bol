"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Phone, Video, Search, MoreVertical, Plus, Smile, Mic, Send, Sparkles, X, ArrowLeft, Pin } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { MessageBubble } from "./MessageBubble";
import { GroupInfoPanel } from "./GroupInfoPanel";
import { Users, Shield } from "lucide-react";
import { MessageItem } from "@/hooks/useMessages";
import { ConversationItem } from "@/hooks/useConversations";
import { createClient } from "@/lib/supabase/client";
import { formatLastSeen, formatDateHeading } from "@/lib/supabase/chat";
import { useVoiceRecorder, VoiceRecording } from "@/hooks/useVoiceRecorder";
import { getPresignedUrl, uploadToR2 } from "@/lib/uploadToR2";
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(
  () => import('emoji-picker-react'),
  { ssr: false }
);

export function MainChat({ 
  conversation,
  messages,
  currentUserId,
  currentDisplayName,
  onSendMessage,
  onTyping,
  otherUserTyping,
  onlineUsers,
  onBack,
  onClose,
  onContextMenu,
  onReact,
  replyTo,
  onCancelReply,
  onLeaveGroup,
  onDeleteGroup,
}: { 
  conversation?: ConversationItem;
  messages: MessageItem[];
  currentUserId?: string;
  currentDisplayName?: string;
  onSendMessage: (content: string, replyTo?: { id: string; content: string; senderName: string }) => Promise<boolean>;
  onTyping: (displayName: string) => void;
  otherUserTyping: string | null;
  onlineUsers: Set<string>;
  onBack?: () => void;
  onClose?: () => void;
  onContextMenu?: (e: React.MouseEvent, type: 'message', message?: any) => void;
  onReact?: (messageId: string, emoji: string) => void;
  replyTo?: { id: string; content: string; senderName: string } | null;
  onCancelReply?: () => void;
  onLeaveGroup?: () => void;
  onDeleteGroup?: () => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { 
    isRecording, 
    recordingDuration, 
    audioLevel,
    presignedUrlRef,
    startRecording, 
    stopRecording,
    cancelRecording
  } = useVoiceRecorder()

  const handleMicMouseDown = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    try {
      await startRecording()
    } catch (error) {
      console.error(error)
    }
  }

  const handleMicMouseUp = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isRecording) return
    
    // Minimum 1 second recording
    if (recordingDuration < 1) {
      cancelRecording()
      return
    }

    try {
      const recording = await stopRecording()
      await sendVoiceMessage(recording)
    } catch (error) {
      console.error('Failed to send voice message:', error)
    }
  }

  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const sendVoiceMessage = async (recording: VoiceRecording) => {
    if (!conversation?.id || !currentUserId) return;
    setIsProcessingVoice(true);
    try {
      let uploadInfo = presignedUrlRef.current
      if (!uploadInfo) {
        uploadInfo = await getPresignedUrl('audio/webm', 'webm', 'voice', conversation.id)
      }
      await uploadToR2(recording.blob, uploadInfo.presignedUrl, 'audio/webm')

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUserId,
          content: null,
          type: 'voice',
          media_url: uploadInfo.publicUrl,
          duration_seconds: recording.duration,
          waveform_data: recording.waveformData,
          transcript_status: 'none'
        })
        .select()
        .single()
        
      if (error) throw error;
    } finally {
      setIsProcessingVoice(false);
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('.emoji-toggle-btn')) {
          setShowEmojiPicker(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emojiData: any) => {
    setInputValue((prev) => prev + emojiData.emoji);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversation?.id || !currentUserId) return;
    
    e.target.value = ''; // Reset so same file can be selected again
    
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) return;

    setIsUploadingMedia(true);
    try {
      const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const { presignedUrl, publicUrl } = await getPresignedUrl(file.type, ext, isVideo ? 'video' : 'image', conversation.id);
      
      await uploadToR2(file, presignedUrl, file.type);
      
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUserId,
          type: isVideo ? 'video' : 'image',
          media_url: publicUrl,
          content: null
        });
        
      if (error) throw error;
    } catch (error) {
      console.error('Failed to upload media:', error);
    } finally {
      setIsUploadingMedia(false);
    }
  };
  
  const isGroup = conversation?.isGroup || false;
  const isOnline = conversation?.otherUserId ? onlineUsers.has(conversation.otherUserId) : false;

  const supabase = createClient();
  const [otherLastSeen, setOtherLastSeen] = useState<string | null>(null);

  // Fetch & subscribe to other user's last_seen
  useEffect(() => {
    if (!conversation?.otherUserId || isGroup) return;
    const uid = conversation.otherUserId;

    const fetchLastSeen = async () => {
      const { data } = await supabase.from('profiles').select('last_seen').eq('id', uid).single();
      setOtherLastSeen(data?.last_seen || null);
    };
    fetchLastSeen();

    const ch = supabase.channel(`last_seen:${uid}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` },
        (payload) => { setOtherLastSeen(payload.new.last_seen || null); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversation?.otherUserId, isGroup, supabase]);

  const [pinnedMsgs, setPinnedMsgs] = useState<any[]>([]);

  useEffect(() => {
    if (!conversation?.id) return;
    const fetchPins = async () => {
      const { data } = await supabase.from('pinned_messages').select('message_id, messages(content)').eq('conversation_id', conversation.id);
      setPinnedMsgs(data || []);
    };
    fetchPins();
    const ch = supabase.channel(`pins:${conversation.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pinned_messages', filter: `conversation_id=eq.${conversation.id}` }, fetchPins)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversation?.id, supabase]);

  const isInitialLoadRef = useRef(true);
  const prevConvIdRef = useRef<string | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (prevConvIdRef.current !== conversation?.id) {
      isInitialLoadRef.current = true;
      prevConvIdRef.current = conversation?.id || null;
    }
    
    if (!bottomRef.current) return;

    if (isInitialLoadRef.current && messages.length > 0) {
      // Initial load with data: snap instantly
      bottomRef.current.scrollIntoView({ behavior: "auto" });
      isInitialLoadRef.current = false;
    } else if (!isInitialLoadRef.current) {
      // Subsequent messages or typing: smooth scroll
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, otherUserTyping, conversation?.id]);

  // Auto-focus input when replyTo is set
  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue("");
    onCancelReply?.();
    await onSendMessage(text, replyTo ?? undefined);
  }, [inputValue, onSendMessage, replyTo, onCancelReply]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Debounced typing indicator
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      if (e.target.value.trim()) onTyping(currentDisplayName || 'Someone');
    }, 300);
  };

  return (
    <div className="flex-1 h-full bg-[#F8F9F8] flex relative z-0 overflow-hidden shadow-[inset_0_0_120px_rgba(0,0,0,0.03)]">
      {/* Premium Chat Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        
        {/* Very subtle Communication Curves (Identity) */}
        <div className="absolute inset-0 opacity-[0.025]">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,45 C30,35 70,65 100,55" fill="none" stroke="#0D9488" strokeWidth="0.1" />
            <path d="M0,55 C40,40 60,70 100,45" fill="none" stroke="#0D9488" strokeWidth="0.2" />
            <path d="M0,35 C50,20 80,60 100,30" fill="none" stroke="#0D9488" strokeWidth="0.1" />
          </svg>
        </div>

        {/* Top-right teal ambient glow */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#0D9488] opacity-[0.12] blur-[120px]"></div>
        
        {/* Bottom-left gray depth layer */}
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#787878] opacity-[0.07] blur-[100px]"></div>
        
        {/* Center warm neutral glow (Focus Area) */}
        <div className="absolute top-[20%] left-[10%] w-[80%] h-[60%] rounded-[100%] bg-white opacity-[0.45] blur-[120px]"></div>
        
        {/* Tactile Noise/Grain texture */}
        <div 
          className="absolute inset-0 opacity-[0.025] mix-blend-multiply" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        ></div>
      </div>

      <div className="flex-1 h-full flex flex-col min-w-0 transition-all relative z-10">
        {/* Header */}
        <div className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-[#ECECEC]/30 bg-white/70 backdrop-blur-[20px] z-20 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Back Button */}
            {onBack && (
              <button onClick={onBack} className="md:hidden mr-1 text-[#0F0F14] hover:text-brand transition-colors p-2 -ml-2 rounded-full hover:bg-[#F6F8F7]">
                <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
              </button>
            )}

            <div className="relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${conversation?.color || 'bg-blue-100 text-blue-700'}`}>
                {conversation?.initials || '?'}
              </div>
              {!isGroup && isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22C55E] rounded-full border-2 border-white"></div>
              )}
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => isGroup && setShowGroupPanel(true)}>
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-bold text-[#0F0F14] truncate hover:underline">{conversation?.name || "Group"}</h2>
              {pinnedMsgs.length > 0 && (
                <div className="flex items-center gap-1 bg-[#F6F8F7] px-2 py-0.5 rounded-full">
                  <span className="text-[10px] flex items-center gap-0.5"><Pin className="w-3 h-3 text-brand" /> {pinnedMsgs.length} pinned</span>
                </div>
              )}
            </div>
              <div className="flex items-center gap-1">
                {isGroup ? (
                  <span className="text-[12px] text-[#6B7280] font-medium leading-none">{conversation?.memberCount || 0} members</span>
                ) : (
                  <span className={`text-[12px] font-medium leading-none ${isOnline ? 'text-[#22C55E]' : 'text-[#9CA3AF]'}`}>
                    {isOnline ? '● online' : otherLastSeen ? `● last seen ${formatLastSeen(otherLastSeen)}` : '● offline'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {isGroup ? (
              <button onClick={() => setShowGroupPanel(!showGroupPanel)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${showGroupPanel ? 'bg-brand/10 text-brand' : 'text-[#6B7280] hover:text-brand hover:bg-[#F6F8F7]'}`}>
                <Users className="w-5 h-5" strokeWidth={1.5} />
              </button>
            ) : (
              <IconButton icon={<Phone />} />
            )}
            <IconButton icon={<Video />} />
            <IconButton icon={<Search />} />
            <IconButton icon={<MoreVertical />} />
            
            <div className="w-[1px] h-6 bg-[#ECECEC] mx-1"></div>
            
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#9CA3AF] hover:text-[#0F0F14] hover:bg-[#F6F8F7] transition-all" aria-label="Close Chat">
              <X className="w-[18px] h-[18px]" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* AI Banner */}
        <AnimatePresence>
          {showBanner && (
            <motion.div
              initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
              className="h-10 px-4 md:px-5 bg-gradient-to-r from-[#EEF4F3]/90 to-white/90 backdrop-blur-md flex items-center justify-between shrink-0 border-b border-[#ECECEC]/50 z-10"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand" />
                <span className="text-[13px] text-[#0F0F14]">
                  AI features coming soon — <button className="text-brand font-medium hover:underline">Learn more</button>
                </span>
              </div>
              <button onClick={() => setShowBanner(false)} className="text-[#6B7280] hover:text-[#0F0F14]">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-8 custom-scrollbar flex flex-col">
          
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-[#9CA3AF] text-sm mt-8">
              No messages yet. Say hello! 👋
            </div>
          )}

          {/* Real Messages */}
          {messages.map((msg, index) => {
            const currentHeading = formatDateHeading(msg.rawTime || new Date().toISOString());
            const previousHeading = index > 0 ? formatDateHeading(messages[index - 1].rawTime || new Date().toISOString()) : null;
            
            const showHeading = currentHeading !== previousHeading;
            
            // Deterministic per-user color for group sender names
            const GROUP_COLORS = ['#0D9488', '#8B5CF6', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];
            const senderColor = isGroup && !msg.isSent
              ? GROUP_COLORS[msg.sender_id.charCodeAt(0) % GROUP_COLORS.length]
              : undefined;
            
            return (
              <div key={`wrapper-${msg.id}`}>
                {showHeading && (
                  <div className="flex items-center justify-center my-8">
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#ECECEC] to-[#ECECEC]"></div>
                    <span className="px-4 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">{currentHeading}</span>
                    <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-[#ECECEC] to-[#ECECEC]"></div>
                  </div>
                )}
                
                {msg.type === 'system' ? (
                  <motion.div key={msg.id} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center my-4">
                    <div className="bg-[#F6F8F7] px-4 py-1.5 rounded-full text-[12px] font-medium text-[#6B7280]">
                      {msg.content}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={msg.id}
                    layout="position"
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="mb-5 origin-bottom"
                  >
                    <MessageBubble
                      type={msg.type as any}
                      isSent={msg.isSent}
                      text={msg.content || msg.transcript}
                      time={msg.time}
                      sender={!msg.isSent ? msg.senderName : undefined}
                      senderColor={senderColor ? `text-[${senderColor}]` : undefined}
                      showSenderName={isGroup && !msg.isSent}
                      reactions={msg.reactions}
                      read={msg.read}
                      replyTo={msg.replyTo}
                      onContextMenu={(e) => onContextMenu?.(e, 'message', msg)}
                      onReact={(emoji) => onReact?.(msg.id, emoji)}
                      mediaUrl={msg.media_url}
                      durationSeconds={msg.duration_seconds}
                      waveformData={msg.waveform_data}
                      transcriptStatus={msg.transcript_status as any}
                    />
                  </motion.div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          <AnimatePresence>
            {otherUserTyping && (
              <motion.div key="typing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mt-3">
                <MessageBubble type="typing" isSent={false} sender={otherUserTyping} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll anchor */}
          <div ref={bottomRef} className="h-4" />
        </div>

        {/* Reply Preview Bar */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden relative z-20"
            >
              <div className="px-4 md:px-6 py-2 bg-white/60 backdrop-blur-md border-t border-[#ECECEC]/50 flex items-center gap-3">
                <div className="w-[3px] h-full min-h-[32px] bg-brand rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-brand truncate">{replyTo.senderName}</p>
                  <p className="text-[13px] text-[#6B7280] truncate">{replyTo.content}</p>
                </div>
                <button
                  onClick={onCancelReply}
                  className="text-[#9CA3AF] hover:text-[#0F0F14] transition-colors p-1 rounded-full hover:bg-[#ECECEC]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Bar */}
        {conversation?.mutedUntil ? (
          <div className="h-[68px] px-4 md:px-6 bg-white/80 backdrop-blur-[20px] border-t border-[#ECECEC]/40 flex items-center justify-center shrink-0 pb-1 z-20">
            <p className="text-[13px] text-red-500 font-medium">You have been muted by an admin {conversation.mutedUntil !== 'forever' ? `until ${new Date(conversation.mutedUntil).toLocaleString()}` : 'forever'}</p>
          </div>
        ) : conversation?.isAnnouncementOnly && conversation?.myRole !== 'admin' && conversation?.myRole !== 'moderator' ? (
          <div className="h-[68px] px-4 md:px-6 bg-white/80 backdrop-blur-[20px] border-t border-[#ECECEC]/40 flex items-center justify-center shrink-0 pb-1 z-20">
            <p className="text-[13px] text-[#9CA3AF] font-medium">Only admins can send messages</p>
          </div>
        ) : (
        <div className="h-[68px] px-4 md:px-6 bg-white/80 backdrop-blur-[20px] border-t border-[#ECECEC]/40 flex items-center gap-3 shrink-0 pb-1 z-20 relative">
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                ref={emojiPickerRef}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute bottom-full mb-2 left-4 md:left-6 z-50 shadow-2xl rounded-[18px] overflow-hidden bg-white border border-[#ECECEC]"
              >
                <EmojiPicker 
                  emojiStyle={"apple" as any}
                  onEmojiClick={handleEmojiClick}
                  width={320}
                  height={400}
                  lazyLoadEmojis={true}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleMediaUpload} 
            accept="image/*,video/*" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingMedia}
            className={`transition-colors p-2 rounded-full ${isUploadingMedia ? 'text-brand animate-pulse' : 'text-[#6B7280] hover:text-brand hover:bg-black/5'}`}
          >
            <Plus className={`w-6 h-6 ${isUploadingMedia ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
          
          <div className="flex-1 h-11 bg-black/[0.03] rounded-[24px] flex items-center px-4 focus-within:ring-2 focus-within:ring-brand/20 transition-all border border-black/[0.02]">
            <input
              ref={inputRef}
              type="text" 
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isRecording || isProcessingVoice}
              placeholder={isProcessingVoice ? "Processing voice note..." : isRecording ? "Recording..." : replyTo ? `Reply to ${replyTo.senderName}...` : `Message ${conversation?.name || '...'}...`}
              className="flex-1 bg-transparent border-none outline-none text-[#0F0F14] text-[15px] placeholder:text-[#9CA3AF] disabled:opacity-50"
            />
            {isRecording && (
              <div className="flex items-center gap-2 mr-2">
                <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm font-medium text-red-500">{recordingDuration}s</span>
              </div>
            )}
            <button type="button" onClick={() => setShowEmojiPicker(prev => !prev)} className="emoji-toggle-btn text-[#9CA3AF] hover:text-[#6B7280] transition-colors ml-2" disabled={isRecording}>
              <Smile className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
            <AnimatePresence mode="wait">
              {inputValue.trim().length === 0 ? (
                <motion.button
                  key="mic"
                  onMouseDown={handleMicMouseDown}
                  onMouseUp={handleMicMouseUp}
                  onMouseLeave={handleMicMouseUp}
                  onTouchStart={handleMicMouseDown}
                  onTouchEnd={handleMicMouseUp}
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`absolute p-2 rounded-full transition-all ${isRecording ? 'bg-red-50 text-red-500 scale-125' : 'text-brand hover:bg-brand/10'}`}
                >
                  <Mic className="w-[22px] h-[22px]" strokeWidth={1.5} />
                </motion.button>
              ) : (
                <motion.button
                  key="send"
                  onClick={handleSend}
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center shadow-md shadow-brand/20 hover:scale-105 transition-transform"
                >
                  <Send className="w-4 h-4 ml-0.5" strokeWidth={2} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
        )}
      </div>

      {/* Group Info Panel */}
      <AnimatePresence>
        {isGroup && showGroupPanel && (
          <GroupInfoPanel 
            chat={conversation} 
            currentUserId={currentUserId}
            onClose={() => setShowGroupPanel(false)} 
            onLeaveGroup={onLeaveGroup}
            onDeleteGroup={onDeleteGroup}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function IconButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="w-10 h-10 rounded-full flex items-center justify-center text-[#6B7280] hover:text-brand hover:bg-[#F6F8F7] transition-all">
      <div className="w-5 h-5 [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-[1.5px]">
        {icon}
      </div>
    </button>
  );
}
