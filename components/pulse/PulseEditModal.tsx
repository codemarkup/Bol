"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Eye, Image as ImageIcon, Video, Mic, Type } from "lucide-react";
import { Pulse } from "./PulseFeed";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

// Use custom formatTimeAgo just in case date-fns is not installed
function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface PulseEditModalProps {
  pulses: Pulse[];
  onClose: () => void;
  onDeleted: (pulseId: string) => void;
}

export function PulseEditModal({ pulses, onClose, onDeleted }: PulseEditModalProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from('pulses').delete().eq('id', id);
    if (!error) {
      onDeleted(id);
    } else {
      console.error(error);
      alert("Failed to delete status.");
    }
    setDeletingId(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECECEC] shrink-0">
          <h2 className="text-[16px] font-semibold text-[#0F0F14]">Edit My Status</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F6F8F7] rounded-full transition-colors text-[#6B7280]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F6F8F7]">
          {pulses.length === 0 ? (
            <div className="py-10 text-center text-[#6B7280] text-[14px]">
              No active status.
            </div>
          ) : (
            pulses.map((pulse) => (
              <div key={pulse.id} className="bg-white border border-[#ECECEC] rounded-2xl p-3 flex gap-4 items-center shadow-sm">
                
                {/* Thumbnail */}
                <div 
                  className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center relative"
                  style={pulse.media_type === 'text' ? { backgroundColor: pulse.background_color || '#0D9488' } : { backgroundColor: '#111827' }}
                >
                  {pulse.media_type === 'photo' && pulse.media_url ? (
                    <img src={pulse.media_url} className="w-full h-full object-cover" />
                  ) : pulse.media_type === 'video' && pulse.media_url ? (
                    <video src={pulse.media_url} className="w-full h-full object-cover" />
                  ) : pulse.media_type === 'voice' ? (
                    <Mic className="w-6 h-6 text-[#0D9488]" />
                  ) : pulse.media_type === 'text' ? (
                    <div className="w-full h-full flex items-center justify-center p-1">
                      <span className="text-white text-[9px] font-bold leading-tight text-center truncate whitespace-normal line-clamp-3" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                        {pulse.caption}
                      </span>
                    </div>
                  ) : (
                    <ImageIcon className="w-6 h-6 text-[#6B7280]" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-[14px] font-semibold text-[#0F0F14] capitalize">
                      {pulse.media_type} Status
                    </span>
                    <span className="text-[11px] text-[#9CA3AF]">
                      {formatTimeAgo(pulse.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[12px] text-[#6B7280]">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{pulse.view_count} views</span>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={() => handleDelete(pulse.id)}
                  disabled={deletingId === pulse.id}
                  className="p-2.5 bg-[#FFF0F0] text-red-500 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                >
                  {deletingId === pulse.id ? (
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
