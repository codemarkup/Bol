import { User, Copy, Share2, AtSign, Phone, Edit2, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface ProfileNavigationProps {
  onEditProfile: () => void;
}

const CACHE_KEY = 'bol_profile_cache';

export function ProfileNavigation({ onEditProfile }: ProfileNavigationProps) {
  const supabase = createClient();

  // Load from cache instantly (no delay)
  const cached = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') : null;
  const [displayName, setDisplayName] = useState(cached?.displayName || "");
  const [username, setUsername] = useState(cached?.username || "");
  const [phone, setPhone] = useState(cached?.phone || "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: usernameData } = await supabase.from('usernames').select('username').eq('id', user.id).single();
      
      const fresh = {
        displayName: profile?.full_name || "",
        phone: profile?.phone_number || "",
        username: usernameData?.username || "",
      };

      // Update UI with fresh data
      setDisplayName(fresh.displayName);
      setPhone(fresh.phone);
      setUsername(fresh.username);

      // Save to cache for next page load
      localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
    }
    loadData();
  }, [supabase]);

  const handleCopy = () => {
    if (!username) return;
    navigator.clipboard.writeText(`bol.chat/${username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-[320px] lg:w-[380px] h-full border-r border-[#ECECEC] flex flex-col p-4 bg-white overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 bg-[#0D9488] text-white rounded-full flex items-center justify-center text-4xl font-bold shadow-md uppercase">
            {displayName ? displayName.charAt(0) : 'S'}
          </div>
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-4 border-white rounded-full"></div>
        </div>
        <h2 className="mt-4 text-xl font-bold text-[#0F0F14]">{displayName || "Set your name"}</h2>
        <p className="text-[#6B7280] font-medium mt-1">Online</p>
      </div>

      <div className="space-y-1 mb-6">
        <button 
          onClick={onEditProfile} 
          className="w-full flex items-center gap-3 p-3 hover:bg-[#F6F8F7] rounded-xl text-left transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[#0D9488]/10 flex items-center justify-center">
            <Edit2 className="w-4 h-4 text-[#0D9488]" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[#0F0F14]">Edit Profile</div>
            <div className="text-xs text-[#6B7280]">Name, Bio, Email</div>
          </div>
        </button>

        <button className="w-full flex items-center gap-3 p-3 hover:bg-[#F6F8F7] rounded-xl text-left transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#F6F8F7] flex items-center justify-center">
            <AtSign className="w-4 h-4 text-[#6B7280]" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[#0F0F14]">Username</div>
            <div className="text-xs text-[#6B7280]">@{username || "set_username"}</div>
          </div>
        </button>

        <button className="w-full flex items-center gap-3 p-3 hover:bg-[#F6F8F7] rounded-xl text-left transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#F6F8F7] flex items-center justify-center">
            <Phone className="w-4 h-4 text-[#6B7280]" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[#0F0F14]">Phone Number</div>
            <div className="text-xs text-[#6B7280]">{phone || "Not set"}</div>
          </div>
        </button>
      </div>

      <div className="mt-auto pt-4">
        <div className="bg-[#F6F8F7] p-4 rounded-2xl border border-[#ECECEC]">
          <h3 className="font-bold text-[#0F0F14] mb-1">My Bol Link</h3>
          <p className="text-sm text-[#6B7280] mb-4">Share this link to let others find you easily.</p>
          
          <div className="flex gap-2">
            <button onClick={handleCopy} className="flex-1 bg-white border border-[#ECECEC] text-[#0F0F14] font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              <span className="text-sm">{copied ? "Copied!" : "Copy"}</span>
            </button>
            <button className="flex-1 bg-[#0D9488] text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#0D9488]/90 transition-colors shadow-sm">
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
