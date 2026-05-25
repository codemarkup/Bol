"use client";

import { motion } from "framer-motion";
import { SquarePen, SlidersHorizontal, Search, Sparkles } from "lucide-react";
import { useState } from "react";

import { mockChats } from "./mockData";

const filters = ["All", "Unread", "Groups", "Archived"];

export function ChatList({ 
  activeChatId, 
  onSelectChat,
  onContextMenu,
  onOpenNewChat
}: { 
  activeChatId?: number | null;
  onSelectChat: (id: number) => void;
  onContextMenu?: (e: React.MouseEvent, type: 'chat') => void;
  onOpenNewChat?: () => void;
}) {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div className="w-full md:w-[300px] h-full bg-white border-r border-[#ECECEC] flex flex-col shrink-0 relative z-10">
      
      {/* Top Bar */}
      <div className="h-16 px-5 flex items-center justify-between shrink-0">
        <h2 className="text-lg font-bold text-[#0F0F14]">Messages</h2>
        <div className="flex items-center gap-3">
          <button onClick={onOpenNewChat} className="text-[#6B7280] hover:text-brand transition-colors">
            <SquarePen className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <button className="text-[#6B7280] hover:text-brand transition-colors">
            <SlidersHorizontal className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 shrink-0">
        <div className="relative flex items-center w-full h-10 bg-[#F6F8F7] rounded-xl focus-within:ring-2 focus-within:ring-brand/20 transition-shadow">
          <Search className="absolute left-3 w-4 h-4 text-[#9CA3AF]" strokeWidth={2} />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            className="w-full h-full bg-transparent pl-9 pr-4 text-sm text-[#0F0F14] placeholder:text-[#9CA3AF] outline-none"
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="mt-3 px-5 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-hide">
        {filters.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`relative px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors z-10 shrink-0 ${
                isActive ? "text-white" : "text-[#6B7280] bg-[#F6F8F7] hover:bg-gray-100"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="filter-active"
                  className="absolute inset-0 bg-brand rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {filter}
            </button>
          );
        })}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto mt-1 custom-scrollbar pb-20 md:pb-0">
        {mockChats.map((chat, i) => {
          const isActive = activeChatId === chat.id;
          return (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              onClick={() => onSelectChat(chat.id)}
              onContextMenu={(e) => onContextMenu?.(e, 'chat')}
              className={`relative w-full px-5 py-3.5 flex items-center gap-3 cursor-pointer transition-colors duration-150 border-b border-[#F6F8F7] last:border-none ${
                isActive ? "bg-[#EEF4F3]" : "hover:bg-[#F6F8F7]"
              }`}
            >
              {/* Active Left Border */}
              {isActive && (
                <motion.div 
                  layoutId="chat-active-border"
                  className="absolute left-0 top-0 bottom-0 w-[2px] bg-brand"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              {/* Avatar */}
              <div className="relative shrink-0">
                <div className={`w-[46px] h-[46px] rounded-full flex items-center justify-center font-bold text-[15px] ${chat.color}`}>
                  {chat.initials}
                </div>
                {chat.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22C55E] rounded-full border-2 border-white z-10"></div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[14px] font-semibold text-[#0F0F14] truncate">{chat.name}</span>
                  <span className="text-[12px] text-[#9CA3AF] shrink-0 ml-2">{chat.time}</span>
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 min-w-0 truncate">
                    {chat.type === "ai" ? (
                      <div className="bg-brand/10 px-1.5 py-0.5 rounded text-[10px] font-bold text-brand flex items-center gap-1 shrink-0">
                        <Sparkles className="w-2.5 h-2.5" /> AI
                      </div>
                    ) : null}
                    
                    <span className={`text-[13px] truncate ${chat.unread > 0 ? "text-[#0F0F14] font-medium" : "text-[#6B7280]"}`}>
                      {chat.message}
                    </span>
                  </div>

                  {chat.unread > 0 && (
                    <div className="min-w-[20px] h-[20px] rounded-full bg-brand flex items-center justify-center text-white text-[10px] font-bold px-1 shrink-0">
                      {chat.unread}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <button onClick={onOpenNewChat} className="absolute bottom-6 right-5 w-11 h-11 bg-brand text-white rounded-full flex items-center justify-center shadow-lg shadow-brand/30 hover:scale-105 transition-transform hidden md:flex">
        <SquarePen className="w-5 h-5" strokeWidth={2} />
      </button>

    </div>
  );
}
