import { motion } from "framer-motion";
import { ArrowLeft, Camera, Shield, LogOut, Trash2 } from "lucide-react";

interface ProfileEditProps {
  onBack: () => void;
}

export function ProfileEdit({ onBack }: ProfileEditProps) {
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
              <div className="relative group cursor-pointer">
                <div className="w-24 h-24 bg-[#0D9488] text-white rounded-full flex items-center justify-center text-4xl font-bold shadow-sm">
                  S
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex flex-col items-center sm:items-start gap-2 pt-2">
                <button className="text-[#0D9488] font-semibold text-sm hover:underline">
                  Upload new photo
                </button>
                <button className="text-red-500 font-semibold text-sm hover:underline">
                  Remove photo
                </button>
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
                  defaultValue="Satoshi"
                  className="w-full bg-[#F6F8F7] border border-[#ECECEC] rounded-xl px-4 py-3 text-[#0F0F14] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F0F14] mb-1.5">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] font-medium">@</span>
                  <input 
                    type="text" 
                    defaultValue="satoshi"
                    className="w-full bg-[#F6F8F7] border border-[#ECECEC] rounded-xl pl-9 pr-4 py-3 text-[#0F0F14] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F0F14] mb-1.5">About</label>
                <textarea 
                  defaultValue="Building the future of communication."
                  rows={3}
                  className="w-full bg-[#F6F8F7] border border-[#ECECEC] rounded-xl px-4 py-3 text-[#0F0F14] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F0F14] mb-1.5">Phone Number</label>
                <input 
                  type="tel" 
                  defaultValue="+1 234 567 8900"
                  className="w-full bg-[#F6F8F7] border border-[#ECECEC] rounded-xl px-4 py-3 text-[#0F0F14] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F0F14] mb-1.5 flex justify-between items-center">
                  Email
                  <span className="text-xs font-medium text-[#6B7280] flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-[#ECECEC]"><Shield className="w-3 h-3 text-green-500"/> Verified</span>
                </label>
                <input 
                  type="email" 
                  defaultValue="satoshi@bol.com"
                  readOnly
                  className="w-full bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-3 text-[#6B7280] cursor-not-allowed"
                />
              </div>
            </motion.div>

            {/* Save Button */}
            <motion.div variants={itemVars} className="pt-4 border-t border-[#ECECEC]">
              <button className="bg-[#0D9488] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#0D9488]/90 transition-colors shadow-sm w-full sm:w-auto">
                Save Changes
              </button>
            </motion.div>

            {/* Danger Zone */}
            <motion.div variants={itemVars} className="pt-8 pb-12">
              <h3 className="text-red-500 font-bold mb-4 uppercase text-sm tracking-wider">Danger Zone</h3>
              <div className="border border-red-100 bg-red-50/30 rounded-2xl p-4 space-y-2">
                <button className="w-full flex items-center justify-between p-3 hover:bg-red-50 rounded-xl transition-colors text-left group">
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

                <button className="w-full flex items-center justify-between p-3 hover:bg-red-50 rounded-xl transition-colors text-left group">
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
    </div>
  );
}
