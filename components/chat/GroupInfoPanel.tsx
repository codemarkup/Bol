"use client";

import { motion } from "framer-motion";
import { X, Search, Bell, Shield, LogOut, Trash2, Image as ImageIcon, Link2, File, ChevronRight } from "lucide-react";

interface GroupInfoPanelProps {
  chat: any;
  onClose: () => void;
}

export function GroupInfoPanel({ chat, onClose }: GroupInfoPanelProps) {
  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-x-0 bottom-0 top-[10%] rounded-t-3xl md:relative md:top-0 md:rounded-none w-full md:w-[320px] lg:w-[380px] bg-white border-t md:border-t-0 md:border-l border-[#ECECEC] flex flex-col z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none shrink-0"
    >
      {/* Mobile drag handle */}
      <div className="w-full flex justify-center pt-3 pb-1 md:hidden absolute top-0 z-40">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
      </div>
      
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#ECECEC] shrink-0 mt-4 md:mt-0">
        <h3 className="font-bold text-[#0F0F14]">Group Info</h3>
        <button onClick={onClose} className="p-2 text-[#6B7280] hover:text-[#0F0F14] hover:bg-[#F6F8F7] rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center py-8 border-b border-[#ECECEC]">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold mb-4 shadow-sm ${chat?.color || 'bg-[#8B5CF6] text-white'}`}>
            {chat?.initials || 'G'}
          </div>
          <h2 className="text-xl font-bold text-[#0F0F14]">{chat?.name || "Group"}</h2>
          <p className="text-[#6B7280] mt-1 text-sm font-medium">Group · {chat?.memberCount || 0} members</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-around py-6 border-b border-[#ECECEC] px-6">
          <ActionButton icon={<Bell />} label="Mute" />
          <ActionButton icon={<Search />} label="Search" />
          <ActionButton icon={<Link2 />} label="Copy Link" />
        </div>

        {/* Media */}
        <div className="p-4 border-b border-[#ECECEC]">
          <div className="flex items-center justify-between mb-4 cursor-pointer hover:opacity-80">
            <h4 className="font-semibold text-[#0F0F14]">Media, Links & Docs</h4>
            <div className="flex items-center text-[#6B7280] text-sm font-medium">
              42 <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-gray-400" />
              </div>
            ))}
            <div className="aspect-square bg-[#F6F8F7] rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="text-sm font-medium text-[#6B7280]">39+</span>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="p-4 border-b border-[#ECECEC] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-[#0F0F14]">Anonymous joining</div>
              <div className="text-xs text-[#6B7280] mt-0.5">Allow users to join without revealing phone numbers</div>
            </div>
            <Toggle active={true} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-[#0F0F14] flex items-center gap-1">
                Encrypted group <Shield className="w-3.5 h-3.5 text-green-500" />
              </div>
              <div className="text-xs text-[#6B7280] mt-0.5">End-to-end encrypted</div>
            </div>
            <Toggle active={true} />
          </div>
        </div>

        {/* Members */}
        <div className="p-4 border-b border-[#ECECEC]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-[#0F0F14]">{chat?.memberCount || 0} Members</h4>
            <Search className="w-4 h-4 text-[#6B7280] cursor-pointer" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0D9488] text-white flex items-center justify-center font-bold text-sm">S</div>
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-[#0F0F14]">You</div>
                <div className="text-[12px] text-[#6B7280]">Admin</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">AK</div>
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-[#0F0F14]">Ahmed Khan</div>
                <div className="text-[12px] text-[#6B7280]">online</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm">SA</div>
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-[#0F0F14]">Sara Ali</div>
                <div className="text-[12px] text-[#6B7280]">last seen recently</div>
              </div>
            </div>
            <button className="text-brand text-sm font-semibold hover:underline w-full text-left py-2">
              View all members
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-4 space-y-2 mb-8">
          <button className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-semibold">
            <LogOut className="w-5 h-5" />
            Leave Group
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-semibold">
            <Trash2 className="w-5 h-5" />
            Delete Group
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ActionButton({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer group">
      <div className="w-10 h-10 rounded-full bg-[#F6F8F7] flex items-center justify-center text-[#0F0F14] group-hover:bg-[#ECECEC] transition-colors">
        {icon}
      </div>
      <span className="text-[12px] font-medium text-[#6B7280] group-hover:text-[#0F0F14]">{label}</span>
    </div>
  );
}

function Toggle({ active }: { active: boolean }) {
  return (
    <div className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors ${active ? 'bg-brand' : 'bg-gray-300'}`}>
      <motion.div 
        initial={false}
        animate={{ x: active ? 20 : 0 }}
        className="w-4 h-4 bg-white rounded-full shadow-sm"
      />
    </div>
  );
}
