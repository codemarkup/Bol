"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Phone, Video, Search, MoreVertical, Plus, Smile, Mic, Send, Sparkles, X, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { GroupInfoPanel } from "./GroupInfoPanel";
import { Users, Shield } from "lucide-react";

export function MainChat({ 
  chat,
  onBack, 
  onClose,
  onContextMenu 
}: { 
  chat?: any;
  onBack?: () => void;
  onClose?: () => void;
  onContextMenu?: (e: React.MouseEvent, type: 'message') => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [showBanner, setShowBanner] = useState(true);
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  
  const isGroup = chat?.isGroup || false;

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
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${chat?.color || 'bg-blue-100 text-blue-700'}`}>
              {chat?.initials || 'AK'}
            </div>
            {!isGroup && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22C55E] rounded-full border-2 border-white"></div>
            )}
          </div>
          <div className="flex flex-col cursor-pointer" onClick={() => isGroup && setShowGroupPanel(!showGroupPanel)}>
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-semibold text-[#0F0F14]">{chat?.name || 'Ahmed Khan'}</span>
              {isGroup && <Shield className="w-3.5 h-3.5 text-brand" />}
            </div>
            <div className="flex items-center gap-1">
              {isGroup ? (
                <span className="text-[12px] text-[#6B7280] font-medium leading-none">{chat?.memberCount || 8} members</span>
              ) : (
                <span className="text-[12px] text-[#22C55E] font-medium leading-none">● online</span>
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
          
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9CA3AF] hover:text-[#0F0F14] hover:bg-[#F6F8F7] transition-all"
            aria-label="Close Chat"
          >
            <X className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* AI Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="h-10 px-4 md:px-5 bg-gradient-to-r from-[#EEF4F3] to-white flex items-center justify-between shrink-0 border-b border-[#ECECEC]/50 z-10"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              <span className="text-[13px] text-[#0F0F14]">
                You have 3 unread messages — <button className="text-brand font-medium hover:underline">Catch me up</button>
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

        {/* Chat History */}
        <div className="mb-5">
          <MessageBubble 
            type="text" 
            isSent={false} 
            text="Assalam o Alaikum! Kaise ho bhai?" 
            time="2:18 PM" 
            sender={isGroup ? "Ali Raza" : undefined}
            senderColor={isGroup ? "text-purple-600" : undefined}
            showSenderName={isGroup}
            onContextMenu={(e) => onContextMenu?.(e, 'message')}
          />
        </div>
        
        <div className="mb-5">
          <MessageBubble 
            type="text" 
            isSent={true} 
            text="Wa Alaikum Assalam! Alhamdulillah theek hoon. Aap sunao?" 
            time="2:18 PM" 
            read 
            onContextMenu={(e) => onContextMenu?.(e, 'message')}
          />
        </div>
        
        <MessageBubble 
          type="text" 
          isSent={false} 
          text="Kal ki meeting ke baare mein baat karni thi" 
          time="2:19 PM" 
          sender={isGroup ? "Ali Raza" : undefined}
          senderColor={isGroup ? "text-purple-600" : undefined}
          showSenderName={isGroup}
          onContextMenu={(e) => onContextMenu?.(e, 'message')}
        />
        
        <MessageBubble 
          type="ai_summary" 
          isSent={false}
          text={isGroup ? "Ali discussed plans for tomorrow's meeting and asked for the Figma link." : "Ahmed discussed plans for tomorrow's meeting and confirmed availability for 3 PM at the office."}
          onContextMenu={(e) => onContextMenu?.(e, 'message')}
        />
        
        <div className="mb-5">
          <MessageBubble 
            type="text" 
            isSent={true} 
            text="Haan bilkul, bolo kya plan hai?" 
            time="2:20 PM" 
            read
            reactions={[{ emoji: "👍", count: 2 }, { emoji: "❤️", count: 1 }]}
            onContextMenu={(e) => onContextMenu?.(e, 'message')}
          />
        </div>
        
        <MessageBubble 
          type="voice" 
          isSent={false} 
          text="Hey, I'm running 5 minutes late, go ahead and order!" 
          time="2:22 PM" 
          onContextMenu={(e) => onContextMenu?.(e, 'message')}
        />
        
        {/* Thread Preview Pill */}
        {isGroup && (
          <div className="flex justify-start mb-5 pl-12 mt-1">
            <div className="bg-white border border-[#ECECEC] rounded-full px-3 py-1 flex items-center gap-2 shadow-sm cursor-pointer hover:bg-gray-50">
              <div className="flex -space-x-1.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 border border-white"></div>
                <div className="w-5 h-5 rounded-full bg-pink-100 border border-white"></div>
              </div>
              <span className="text-[11px] font-semibold text-brand">3 replies</span>
            </div>
          </div>
        )}

        <div className="mb-5 mt-5">
          <MessageBubble 
            type="image" 
            isSent={true} 
            time="2:25 PM" 
            read 
            onContextMenu={(e) => onContextMenu?.(e, 'message')}
          />
        </div>

        <MessageBubble 
          type="text" 
          isSent={false} 
          text="Haan bhai, kal milte hain InshaAllah. 3 baje office pe?" 
          time="2:34 PM" 
          onContextMenu={(e) => onContextMenu?.(e, 'message')}
        />

        {/* Typing Indicator */}
        <div className="mt-3">
          <MessageBubble type="typing" isSent={false} sender="Ahmed Khan" />
        </div>

        {/* Invisible element to force scroll to bottom */}
        <div className="h-4"></div>
      </div>

      {/* Input Bar */}
      <div className="h-[68px] px-4 md:px-6 bg-white border-t border-[#ECECEC] flex items-center gap-3 shrink-0 pb-1">
        <button className="text-[#6B7280] hover:text-brand transition-colors p-2 rounded-full hover:bg-[#F6F8F7]">
          <Plus className="w-6 h-6" strokeWidth={1.5} />
        </button>
        
        <div className="flex-1 h-11 bg-[#F6F8F7] rounded-[24px] flex items-center px-4 focus-within:ring-2 focus-within:ring-brand/20 transition-all">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Message ${chat?.name || 'Ahmed'}...`} 
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
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="absolute text-brand hover:bg-brand/10 p-2 rounded-full transition-colors"
              >
                <Mic className="w-[22px] h-[22px]" strokeWidth={1.5} />
              </motion.button>
            ) : (
              <motion.button
                key="send"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="absolute w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center shadow-md shadow-brand/20 hover:scale-105 transition-transform"
              >
                <Send className="w-4 h-4 ml-0.5" strokeWidth={2} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>

      {/* Group Info Panel */}
      <AnimatePresence>
        {isGroup && showGroupPanel && (
          <GroupInfoPanel chat={chat} onClose={() => setShowGroupPanel(false)} />
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
