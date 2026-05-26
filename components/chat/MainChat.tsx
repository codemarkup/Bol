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
import { formatLastSeen } from "@/lib/supabase/chat";

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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherUserTyping]);

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
    <div className="flex-1 h-full bg-white flex relative z-0 overflow-hidden">
      <div className="flex-1 h-full flex flex-col min-w-0 transition-all">
        {/* Header */}
        <div className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-[#ECECEC] bg-white z-20 shrink-0">
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
              className="h-10 px-4 md:px-5 bg-gradient-to-r from-[#EEF4F3] to-white flex items-center justify-between shrink-0 border-b border-[#ECECEC]/50 z-10"
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
          
          {/* Date Separator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#ECECEC] to-[#ECECEC]"></div>
            <span className="px-4 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">Today</span>
            <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-[#ECECEC] to-[#ECECEC]"></div>
          </div>

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-[#9CA3AF] text-sm">
              No messages yet. Say hello! 👋
            </div>
          )}

          {/* Real Messages */}
          {messages.map((msg) => {
            if (msg.type === 'system') {
              return (
                <motion.div key={msg.id} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center my-4">
                  <div className="bg-[#F6F8F7] px-4 py-1.5 rounded-full text-[12px] font-medium text-[#6B7280]">
                    {msg.content}
                  </div>
                </motion.div>
              );
            }

            // Deterministic per-user color for group sender names
            // Deterministic per-user color for group sender names
            const GROUP_COLORS = ['#0D9488', '#8B5CF6', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];
            const senderColor = isGroup && !msg.isSent
              ? GROUP_COLORS[msg.sender_id.charCodeAt(0) % GROUP_COLORS.length]
              : undefined;

            return (
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
                  text={msg.content}
                  time={msg.time}
                  sender={!msg.isSent ? msg.senderName : undefined}
                  senderColor={senderColor ? `text-[${senderColor}]` : undefined}
                  showSenderName={isGroup && !msg.isSent}
                  reactions={msg.reactions}
                read={msg.read}
                replyTo={msg.replyTo}
                onContextMenu={(e) => onContextMenu?.(e, 'message', msg)}
                onReact={(emoji) => onReact?.(msg.id, emoji)}
              />
            </motion.div>
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
              className="overflow-hidden"
            >
              <div className="px-4 md:px-6 py-2 bg-[#F6F8F7] border-t border-[#ECECEC] flex items-center gap-3">
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
          <div className="h-[68px] px-4 md:px-6 bg-[#F6F8F7] border-t border-[#ECECEC] flex items-center justify-center shrink-0 pb-1">
            <p className="text-[13px] text-red-500 font-medium">You have been muted by an admin {conversation.mutedUntil !== 'forever' ? `until ${new Date(conversation.mutedUntil).toLocaleString()}` : 'forever'}</p>
          </div>
        ) : conversation?.isAnnouncementOnly && conversation?.myRole !== 'admin' && conversation?.myRole !== 'moderator' ? (
          <div className="h-[68px] px-4 md:px-6 bg-[#F6F8F7] border-t border-[#ECECEC] flex items-center justify-center shrink-0 pb-1">
            <p className="text-[13px] text-[#9CA3AF] font-medium">Only admins can send messages</p>
          </div>
        ) : (
        <div className="h-[68px] px-4 md:px-6 bg-white border-t border-[#ECECEC] flex items-center gap-3 shrink-0 pb-1">
          <button className="text-[#6B7280] hover:text-brand transition-colors p-2 rounded-full hover:bg-[#F6F8F7]">
            <Plus className="w-6 h-6" strokeWidth={1.5} />
          </button>
          
          <div className="flex-1 h-11 bg-[#F6F8F7] rounded-[24px] flex items-center px-4 focus-within:ring-2 focus-within:ring-brand/20 transition-all">
            <input
              ref={inputRef}
              type="text" 
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={replyTo ? `Reply to ${replyTo.senderName}...` : `Message ${conversation?.name || '...'}...`}
              className="flex-1 bg-transparent border-none outline-none text-[#0F0F14] text-[15px] placeholder:text-[#9CA3AF]"
            />
            <button className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors ml-2">
              <Smile className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
            <AnimatePresence mode="wait">
              {inputValue.trim().length === 0 ? (
                <motion.button
                  key="mic"
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute text-brand hover:bg-brand/10 p-2 rounded-full transition-colors"
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
