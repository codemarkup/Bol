import { useEffect, useState } from "react";
import { EmptyStateView } from "@/components/layout/EmptyStateView";
import { Users, MessageSquare, Phone, Video, Ban, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ContactProfile({ contact, isOnline, onBack, onMessage, currentUser }: any) {
  const [sharedMedia, setSharedMedia] = useState<any[]>([]);

  useEffect(() => {
    async function loadSharedMedia() {
      if (!contact || !currentUser) {
        setSharedMedia([]);
        return;
      }
      
      const supabase = createClient();
      
      const { data: myMemberships } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', currentUser.id);
        
      const myConvIds = myMemberships?.map(m => m.conversation_id) || [];
      if (myConvIds.length === 0) {
        setSharedMedia([]);
        return;
      }

      const { data: shared } = await supabase
        .from('conversation_members')
        .select('conversation_id, conversations!inner(type)')
        .eq('user_id', contact.id)
        .in('conversation_id', myConvIds);
        
      const directConv = shared?.find((c: any) => c.conversations?.type === 'direct');
      if (!directConv) {
        setSharedMedia([]);
        return;
      }

      const { data: media } = await supabase
        .from('messages')
        .select('media_url, created_at')
        .eq('type', 'image')
        .eq('conversation_id', directConv.conversation_id)
        .not('media_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(9);
        
      setSharedMedia(media || []);
    }
    
    loadSharedMedia();
  }, [contact, currentUser]);

  if (!contact) return <EmptyStateView icon={Users} title="No Contact Selected" description="Select a contact to view their profile." />;

  const joinedDate = new Date(contact.updated_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const lastSeen = new Date(contact.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full h-full flex flex-col p-8 overflow-y-auto relative bg-white custom-scrollbar">
      <button onClick={onBack} className="absolute top-4 left-4 md:hidden text-brand font-medium">Back</button>
      
      <div className="flex flex-col items-center mb-8 mt-12 md:mt-0">
        <div className="w-32 h-32 bg-gradient-to-br from-brand/20 to-brand/40 text-brand rounded-full mb-4 flex items-center justify-center text-4xl font-bold relative shrink-0">
          {contact.avatar_url ? (
            <img src={contact.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            contact.full_name?.charAt(0).toUpperCase()
          )}
          {isOnline && (
            <div className="absolute bottom-2 right-2 w-5 h-5 bg-[#00E5FF] rounded-full border-4 border-white shadow-sm"></div>
          )}
        </div>
        <h2 className="text-3xl font-bold text-[#0F0F14]">{contact.full_name}</h2>
        <p className="text-[#6B7280]">@{contact.username || 'user'}</p>
        <p className={`text-sm mt-1 font-medium ${isOnline ? 'text-brand' : 'text-[#9CA3AF]'}`}>
          {isOnline ? 'Online' : `Last seen at ${lastSeen}`}
        </p>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <button onClick={onMessage} className="flex flex-col items-center text-brand hover:scale-105 transition-transform group">
          <div className="w-14 h-14 bg-brand/10 group-hover:bg-brand/20 rounded-full flex items-center justify-center mb-2 transition-colors">
            <MessageSquare className="w-6 h-6" />
          </div>
          <span className="font-medium text-sm">Message</span>
        </button>
        <button onClick={() => alert('Audio calling coming soon!')} className="flex flex-col items-center text-brand hover:scale-105 transition-transform group">
          <div className="w-14 h-14 bg-brand/10 group-hover:bg-brand/20 rounded-full flex items-center justify-center mb-2 transition-colors">
            <Phone className="w-6 h-6" />
          </div>
          <span className="font-medium text-sm">Audio</span>
        </button>
        <button onClick={() => alert('Video calling coming soon!')} className="flex flex-col items-center text-brand hover:scale-105 transition-transform group">
          <div className="w-14 h-14 bg-brand/10 group-hover:bg-brand/20 rounded-full flex items-center justify-center mb-2 transition-colors">
            <Video className="w-6 h-6" />
          </div>
          <span className="font-medium text-sm">Video</span>
        </button>
      </div>

      <div className="bg-[#F6F8F7] rounded-2xl p-5 mb-8">
        <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">Contact Info</h3>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Username</span>
            <span className="font-medium text-[#0F0F14]">@{contact.username || 'user'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Member since</span>
            <span className="font-medium text-[#0F0F14]">{joinedDate}</span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider">Shared Media</h3>
          <span className="text-xs font-semibold text-brand bg-brand/10 px-2 py-1 rounded-md">{sharedMedia.length}</span>
        </div>
        
        {sharedMedia.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {sharedMedia.map((media, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                <img src={media.media_url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 bg-[#F6F8F7] rounded-2xl border border-dashed border-[#D1D5DB]">
            <ImageIcon className="w-8 h-8 text-[#9CA3AF] mb-2" />
            <p className="text-sm text-[#6B7280] font-medium">No shared media yet</p>
          </div>
        )}
      </div>

      <div className="border-t border-[#ECECEC] pt-6 mt-auto">
        <button className="flex items-center gap-3 text-red-500 hover:bg-red-50 p-3 rounded-xl w-full font-medium transition-colors">
          <Ban className="w-5 h-5" /> Block Contact
        </button>
      </div>
    </div>
  );
}
