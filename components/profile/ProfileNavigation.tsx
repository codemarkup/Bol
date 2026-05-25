import { User, Copy, Share2, AtSign, Phone, Edit2 } from "lucide-react";

interface ProfileNavigationProps {
  onEditProfile: () => void;
}

export function ProfileNavigation({ onEditProfile }: ProfileNavigationProps) {
  return (
    <div className="w-[320px] lg:w-[380px] h-full border-r border-[#ECECEC] flex flex-col p-4 bg-white overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 bg-[#0D9488] text-white rounded-full flex items-center justify-center text-4xl font-bold shadow-md">
            S
          </div>
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-4 border-white rounded-full"></div>
        </div>
        <h2 className="mt-4 text-xl font-bold text-[#0F0F14]">Satoshi</h2>
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
            <div className="text-xs text-[#6B7280]">@satoshi</div>
          </div>
        </button>

        <button className="w-full flex items-center gap-3 p-3 hover:bg-[#F6F8F7] rounded-xl text-left transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#F6F8F7] flex items-center justify-center">
            <Phone className="w-4 h-4 text-[#6B7280]" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[#0F0F14]">Phone Number</div>
            <div className="text-xs text-[#6B7280]">+1 234 567 8900</div>
          </div>
        </button>
      </div>

      <div className="mt-auto pt-4">
        <div className="bg-[#F6F8F7] p-4 rounded-2xl border border-[#ECECEC]">
          <h3 className="font-bold text-[#0F0F14] mb-1">My Bol Link</h3>
          <p className="text-sm text-[#6B7280] mb-4">Share this link to let others find you easily.</p>
          
          <div className="flex gap-2">
            <button className="flex-1 bg-white border border-[#ECECEC] text-[#0F0F14] font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
              <Copy className="w-4 h-4" />
              <span className="text-sm">Copy</span>
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
