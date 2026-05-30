"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Phone, Users, Sparkles, Clock, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const topIcons = [
  { id: "chat", path: "/chat", icon: MessageSquare, label: "Chats" },
  { id: "calls", path: "/calls", icon: Phone, label: "Calls" },
  { id: "contacts", path: "/contacts", icon: Users, label: "Contacts" },
  { id: "ai", path: "/ai", icon: Sparkles, label: "AI Features" },
];

const bottomIcons = [
  { id: "scheduled", path: "/scheduled", icon: Clock, label: "Scheduled" },
  { id: "settings", path: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ displayName?: string; avatarUrl?: string | null }>({});

  useEffect(() => {
    const loadProfile = () => {
      try {
        const cached = localStorage.getItem('bol_profile_cache');
        if (cached) {
          setProfile(JSON.parse(cached));
        }
      } catch (e) {}
    };
    
    loadProfile();
    
    // Listen for cross-tab or same-tab updates
    window.addEventListener('storage', loadProfile);
    window.addEventListener('bol_profile_updated', loadProfile);
    return () => {
      window.removeEventListener('storage', loadProfile);
      window.removeEventListener('bol_profile_updated', loadProfile);
    };
  }, []);

  const renderIcon = (item: { id: string; path: string; icon: any; label: string }) => {
    // If the pathname starts with the item's path, or it's the exact path
    const isActive = pathname?.startsWith(item.path);
    const Icon = item.icon;
    const isSparkles = item.id === "ai";

    return (
      <div 
        key={item.id} 
        className="relative group flex items-center justify-center"
        onMouseEnter={() => setHoveredId(item.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        <button
          onClick={() => router.push(item.path)}
          className="relative w-11 h-11 flex items-center justify-center rounded-xl transition-all"
        >
          {isActive && (
            <motion.div 
              layoutId="sidebar-active"
              className="absolute -left-[12px] w-[3px] h-6 bg-[#0D9488] rounded-r-full"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          {isActive && (
            <div className="absolute inset-0 bg-[#0D9488]/10 rounded-xl blur-md" />
          )}
          <Icon 
            strokeWidth={1.5} 
            className={`w-5 h-5 transition-colors duration-150 relative z-10 ${
              isActive 
                ? "text-white" 
                : isSparkles 
                  ? "text-[#0D9488] group-hover:text-[#0D9488]/80" 
                  : "text-[#6B7280] group-hover:text-gray-400"
            }`} 
          />
        </button>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredId === item.id && (
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-14 bg-[#0F0F14] text-white text-xs px-2.5 py-1.5 rounded-md whitespace-nowrap z-50 font-medium"
            >
              {item.label}
              {/* Tooltip arrow */}
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-r-4 border-y-transparent border-r-[#0F0F14]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="w-[68px] h-full bg-[#0a0a0a] flex flex-col items-center justify-center shrink-0 relative z-40 overflow-visible">
      
      {/* Top icons group */}
      <div className="flex flex-col gap-5 w-full items-center z-40">
        {topIcons.map(renderIcon)}
      </div>

      {/* Spacer between groups */}
      <div className="h-10"></div>

      {/* Bottom icons group */}
      <div className="flex flex-col gap-5 w-full items-center z-40">
        {bottomIcons.map(renderIcon)}

        {/* User Avatar */}
        <button 
          onClick={() => router.push('/profile')}
          className="relative w-11 h-11 flex items-center justify-center rounded-xl group transition-all mt-2"
        >
          {pathname?.startsWith('/profile') && (
            <motion.div 
              layoutId="sidebar-active"
              className="absolute -left-[12px] w-[3px] h-6 bg-[#0D9488] rounded-r-full"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <div className={`w-8 h-8 rounded-full bg-[#0D9488] flex items-center justify-center text-white text-xs font-semibold shadow-sm overflow-hidden ${pathname?.startsWith('/profile') ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a]' : ''}`}>
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              profile.displayName ? profile.displayName.charAt(0).toUpperCase() : 'S'
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
