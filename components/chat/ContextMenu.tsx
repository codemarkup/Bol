"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Emoji, EmojiStyle } from 'emoji-picker-react';
import { 
  Reply, Copy, Forward, Trash2, 
  Pin, Archive, Settings, 
  Sparkles, SmilePlus, Bookmark, Timer, Globe, 
  BellOff, Lock, SquarePen, Users, X,
  MessageSquare, Phone, Video, Ban
} from "lucide-react";

type ContextMenuType = 'message' | 'chat' | 'background' | 'contact';

interface ContextMenuProps {
  contextMenu: { type: ContextMenuType; x: number; y: number };
  onClose: () => void;
  onAction?: (action: string, payload?: any) => void;
}

const COMMON_EMOJIS = ["❤️", "😂", "😮", "😢", "🙏", "👍"];
const toUnified = (emoji: string) => [...emoji].map(c => c.codePointAt(0)?.toString(16)).join('-');

export function ContextMenu({ contextMenu, onClose, onAction }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: contextMenu.x, y: contextMenu.y });

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const x = contextMenu.x + rect.width > window.innerWidth ? contextMenu.x - rect.width : contextMenu.x;
      const y = contextMenu.y + rect.height > window.innerHeight ? contextMenu.y - rect.height : contextMenu.y;
      setPosition({ x, y });
    }
  }, [contextMenu.x, contextMenu.y]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const allItems = {
    message: [
      { icon: Reply, label: 'Reply', action: 'reply' },
      { icon: Pin, label: 'Pin Message', action: 'pin_message' },
      { icon: Sparkles, label: 'Summarize with AI', teal: true },
      { icon: Copy, label: 'Copy Text' },
      { icon: Bookmark, label: 'Bookmark Message' },
      { icon: Timer, label: 'Set Disappear Timer' },
      { icon: Globe, label: 'Translate Message' },
      { divider: true },
      { icon: Trash2, label: 'Delete Message', danger: true },
    ],
    chat: [
      { icon: Pin, label: 'Pin Chat' },
      { icon: BellOff, label: 'Mute Notifications' },
      { icon: Sparkles, label: 'AI Summary', teal: true },
      { icon: Archive, label: 'Archive Chat' },
      { icon: Lock, label: 'Lock Chat' },
      { divider: true },
      { icon: Trash2, label: 'Delete Chat', danger: true, action: 'delete_chat' },
    ],
    background: [
      { icon: SquarePen, label: 'New Conversation', action: 'new_conversation' },
      { icon: Users, label: 'New Group', action: 'new_group' },
      { icon: Bookmark, label: 'Saved Messages', action: 'saved_messages' },
      { divider: true },
      { icon: X, label: 'Close Chat', action: 'close_chat' },
      { icon: Settings, label: 'Settings', action: 'settings' },
    ],
    contact: [
      { icon: MessageSquare, label: 'Chat', action: 'chat' },
      { icon: Phone, label: 'Audio Call', action: 'call' },
      { icon: Video, label: 'Video Call', action: 'video_call' },
      { divider: true },
      { icon: Ban, label: 'Block Contact', action: 'block_contact', danger: true },
      { icon: Trash2, label: 'Delete Contact', action: 'delete_contact', danger: true },
    ],
  } as Record<string, any[]>;

  const items = (allItems[contextMenu.type] ?? []) as any[];

  return (
    <motion.div
      ref={menuRef}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{ top: position.y, left: position.x }}
      className="fixed z-50 w-56 bg-white border border-[#ECECEC] rounded-xl shadow-xl py-1 overflow-hidden"
    >
      {contextMenu.type === 'message' && (
        <>
          <div className="flex items-center justify-between px-3 py-2 bg-[#F9FAFB] border-b border-[#ECECEC]">
            {COMMON_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  if (onAction) onAction('react', emoji);
                  onClose();
                }}
                className="flex items-center justify-center hover:scale-125 transition-transform origin-bottom"
              >
                <Emoji unified={toUnified(emoji)} emojiStyle={EmojiStyle.APPLE} size={24} />
              </button>
            ))}
          </div>
        </>
      )}

      {items.map((item, index) => {
        if (item.divider) {
          return <div key={index} className="h-[1px] bg-[#ECECEC] my-1 mx-2" />;
        }
        
        const Icon = item.icon!;
        return (
          <button
            key={index}
            onClick={() => {
              if (item.action && onAction) onAction(item.action);
              onClose();
            }}
            className={`w-full px-3 py-2 flex items-center gap-3 text-[14px] transition-colors ${
              item.danger 
                ? 'text-red-500 hover:bg-red-50' 
                : item.teal
                  ? 'text-brand hover:bg-[#F6F8F7]'
                  : 'text-[#0F0F14] hover:bg-[#F6F8F7] hover:text-brand'
            }`}
          >
            <Icon className="w-4 h-4" strokeWidth={2} />
            <span className="font-medium">{item.label}</span>
          </button>
        );
      })}
    </motion.div>
  );
}
