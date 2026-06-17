import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, Shield, LogOut, Trash2, Loader2, Check, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ImageCropperModal } from "./ImageCropperModal";
import { getPresignedUrl, uploadToR2 } from "@/lib/uploadToR2";
import { clearAllCachedData } from "@/lib/db";
import { getInitials, getColor } from "@/lib/supabase/chat";

interface ProfileEditProps {
  onBack: () => void;
}

export function ProfileEdit({ onBack }: ProfileEditProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const CACHE_KEY = 'bol_profile_cache';
  const cached = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') : null;

  const [displayName, setDisplayName] = useState(cached?.displayName || "");
  const [username, setUsername] = useState(cached?.username || "");
  const originalUsername = useRef(cached?.username || "");
  const [about, setAbout] = useState(cached?.about || "");
  const [phone, setPhone] = useState(cached?.phone || "");
  const [email, setEmail] = useState(cached?.email || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(cached?.avatarUrl || null);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute initials and color
  const initials = displayName ? getInitials(displayName) : 'S';
  const avatarColor = displayName ? getColor(displayName) : 'bg-[#0D9488] text-white';

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: usernameData } = await supabase.from('usernames').select('username').eq('id', user.id).single();

      const fresh = {
        displayName: profile?.full_name || "",
        about: profile?.bio || "",
        phone: profile?.phone_number || "",
        email: user.email || "",
        username: usernameData?.username || "",
        avatarUrl: profile?.avatar_url || null,
      };

      setDisplayName(fresh.displayName);
      setAbout(fresh.about);
      setPhone(fresh.phone);
      setEmail(fresh.email);
      setUsername(fresh.username);
      setAvatarUrl(fresh.avatarUrl);
      originalUsername.current = fresh.username;

      // Update cache with latest from server
      localStorage.setItem('bol_profile_cache', JSON.stringify(fresh));
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  useEffect(() => {
    if (loading || !username || username === originalUsername.current) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('usernames').select('username').eq('username', username).single();
      setUsernameStatus(data ? "taken" : "available");
    }, 500);
    return () => clearTimeout(timer);
  }, [username, loading, supabase]);

  const handleSave = async () => {
    if (usernameStatus === "taken") return;
    setSaving(true);
    await supabase.from('profiles').update({
      full_name: displayName,
      bio: about,
      phone_number: phone,
      updated_at: new Date().toISOString()
    }).eq('id', user.id);

    if (username !== originalUsername.current && usernameStatus === "available") {
      if (originalUsername.current) {
        await supabase.from('usernames').update({ username }).eq('id', user.id);
      } else {
        await supabase.from('usernames').insert({ id: user.id, username });
      }
      originalUsername.current = username;
      setUsernameStatus("idle");
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await clearAllCachedData();
    await supabase.auth.signOut({ scope: 'global' });
    router.push('/signin');
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      await fetch('/api/auth/delete', { method: 'POST' });
      await clearAllCachedData();
      await supabase.auth.signOut();
      router.push('/signin');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelectedImage(url);
    setCropModalOpen(true);
    e.target.value = ''; // reset
  };

  const handleCrop = async (blob: Blob) => {
    setCropModalOpen(false);
    setSelectedImage(null);
    if (!user) return;

    setUploadingAvatar(true);
    try {
      const file = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const { presignedUrl, publicUrl } = await getPresignedUrl('image/jpeg', 'jpg', 'avatar');
      await uploadToR2(file, presignedUrl, 'image/jpeg');
      
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      setAvatarUrl(publicUrl);
      
      // Update cache
      const newCache = { ...cached, avatarUrl: publicUrl };
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
      window.dispatchEvent(new Event('bol_profile_updated'));
    } catch (error) {
      console.error("Avatar upload failed:", error);
    }
    setUploadingAvatar(false);
  };

  const handleRemovePhoto = async () => {
    if (!user || !avatarUrl) return;
    setUploadingAvatar(true);
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
    setAvatarUrl(null);
    const newCache = { ...cached, avatarUrl: null };
    localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
    window.dispatchEvent(new Event('bol_profile_updated'));
    setUploadingAvatar(false);
  };

  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex-1 h-full bg-white flex flex-col relative overflow-hidden">
      <div className="h-16 border-b border-[#ECECEC] flex items-center px-4 shrink-0 lg:px-8">
        <button 
          onClick={onBack}
          className="lg:hidden p-2 -ml-2 mr-2 text-[#6B7280] hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-[#0F0F14]">Edit Profile</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 lg:p-8">
          <motion.div 
            variants={containerVars} 
            initial="hidden" 
            animate="show"
            className="space-y-8"
          >
            {/* Avatar Section */}
            <motion.div variants={itemVars} className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold shadow-sm uppercase overflow-hidden ${avatarColor}`}>
                  {uploadingAvatar ? (
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  ) : avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      className="w-full h-full object-cover" 
                      alt="Profile" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = initials;
                        e.currentTarget.parentElement!.className = `w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold shadow-sm uppercase overflow-hidden ${avatarColor}`;
                      }}
                    />
                  ) : (
                    initials
                  )}
                </div>
                {!uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center sm:items-start gap-2 pt-2">
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} className="text-[#0D9488] font-semibold text-sm hover:underline disabled:opacity-50">
                  Upload new photo
                </button>
                {avatarUrl && (
                  <button onClick={handleRemovePhoto} disabled={uploadingAvatar} className="text-red-500 font-semibold text-sm hover:underline disabled:opacity-50">
                    Remove photo
                  </button>
                )}
                <p className="text-xs text-[#6B7280] mt-1 text-center sm:text-left">
                  Recommended size: 512x512px. Maximum size: 5MB.
                </p>
              </div>
            </motion.div>

            {/* Form Fields */}
            <motion.div variants={itemVars} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#0F0F14] mb-1.5">Display Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#F6F8F7] border border-[#ECECEC] rounded-xl px-4 py-3 text-[#0F0F14] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F0F14] mb-1.5">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] font-medium">@</span>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                    disabled={loading}
                    className="w-full bg-[#F6F8F7] border border-[#ECECEC] rounded-xl pl-9 pr-4 py-3 text-[#0F0F14] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all disabled:opacity-50"
                  />
                </div>
                <div className="h-5 ml-1 mt-1">
                  <AnimatePresence mode="wait">
                    {usernameStatus === "checking" && (
                      <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                        <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
                      </motion.div>
                    )}
                    {usernameStatus === "available" && (
                      <motion.div key="available" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-[11px] text-[#0D9488] font-medium">
                        <Check className="w-3 h-3" /> @{username} is available
                      </motion.div>
                    )}
                    {usernameStatus === "taken" && (
                      <motion.div key="taken" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
                        <X className="w-3 h-3" /> @{username} is taken
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F0F14] mb-1.5">About</label>
                <textarea 
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  disabled={loading}
                  rows={3}
                  className="w-full bg-[#F6F8F7] border border-[#ECECEC] rounded-xl px-4 py-3 text-[#0F0F14] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all resize-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F0F14] mb-1.5">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#F6F8F7] border border-[#ECECEC] rounded-xl px-4 py-3 text-[#0F0F14] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F0F14] mb-1.5 flex justify-between items-center">
                  Email
                  <span className="text-xs font-medium text-[#6B7280] flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-[#ECECEC]"><Shield className="w-3 h-3 text-green-500"/> Verified</span>
                </label>
                <input 
                  type="email" 
                  value={email}
                  readOnly
                  disabled={loading}
                  className="w-full bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-3 text-[#6B7280] cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </motion.div>

            {/* Save Button */}
            <motion.div variants={itemVars} className="pt-4 border-t border-[#ECECEC]">
              <button 
                onClick={handleSave}
                disabled={loading || saving || usernameStatus === "taken"}
                className="bg-[#0D9488] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#0D9488]/90 transition-colors shadow-sm w-full sm:w-auto disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Changes"}
              </button>
            </motion.div>

            {/* Danger Zone */}
            <motion.div variants={itemVars} className="pt-8 pb-12">
              <h3 className="text-red-500 font-bold mb-4 uppercase text-sm tracking-wider">Danger Zone</h3>
              <div className="border border-red-100 bg-red-50/30 rounded-2xl p-4 space-y-2">
                <button onClick={handleSignOut} className="w-full flex items-center justify-between p-3 hover:bg-red-50 rounded-xl transition-colors text-left group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#0F0F14]">Log out from all devices</div>
                      <div className="text-xs text-[#6B7280]">Force logout on all active sessions</div>
                    </div>
                  </div>
                </button>

                <div className="h-px bg-red-100/50 w-full" />

                <button onClick={handleDelete} className="w-full flex items-center justify-between p-3 hover:bg-red-50 rounded-xl transition-colors text-left group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-red-600">Delete Account</div>
                      <div className="text-xs text-red-400">Permanently delete your account and data</div>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {cropModalOpen && selectedImage && (
          <ImageCropperModal
            imageUrl={selectedImage}
            onCrop={handleCrop}
            onCancel={() => {
              setCropModalOpen(false);
              setSelectedImage(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
