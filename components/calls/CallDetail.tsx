import { useEffect, useState } from "react";
import { EmptyStateView } from "@/components/layout/EmptyStateView";
import { Phone, Video, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function CallDetail({ id, currentUserId, onBack }: any) {
  const [call, setCall] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!id || !currentUserId) {
      setCall(null);
      return;
    }

    const fetchCallDetail = async () => {
      const { data: callData } = await supabase
        .from('call_logs')
        .select('*')
        .eq('id', id)
        .single();

      if (!callData) return;

      const otherId = callData.caller_id === currentUserId ? callData.receiver_id : callData.caller_id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', otherId)
        .single();

      setCall({
        ...callData,
        otherProfile: profile || { full_name: 'Unknown User' },
        isIncoming: callData.receiver_id === currentUserId
      });
    };

    fetchCallDetail();
  }, [id, currentUserId, supabase]);

  if (!id) return <EmptyStateView icon={Phone} title="No Call Selected" description="Select a call from the history to view details." />;
  if (!call) return <div className="w-full h-full flex items-center justify-center">Loading...</div>;

  const durationStr = call.duration_seconds 
    ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` 
    : '0s';

  const timeStr = new Date(call.started_at).toLocaleString();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 relative bg-[#F6F8F7] lg:bg-white">
      <button onClick={onBack} className="absolute top-4 left-4 md:hidden text-[#0D9488] font-medium">Back</button>
      
      <div className="w-32 h-32 bg-gray-200 border-2 border-white shadow-xl rounded-full mb-6 overflow-hidden flex items-center justify-center">
        {call.otherProfile?.avatar_url ? (
          <img src={call.otherProfile.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <User className="w-12 h-12 text-gray-400" />
        )}
      </div>
      
      <h2 className="text-3xl font-bold mb-2 text-[#0F0F14]">{call.otherProfile?.full_name}</h2>
      
      <div className="flex flex-col items-center text-[#6B7280] mb-8 space-y-1">
        <p>{call.isIncoming ? 'Incoming' : 'Outgoing'} {call.type} call</p>
        <p>{timeStr}</p>
        <p className="font-medium text-[#0F0F14] mt-2">
          {call.status === 'missed' ? <span className="text-red-500">Missed Call</span> : `Duration: ${durationStr}`}
        </p>
      </div>

      <div className="flex gap-4">
        {/* These buttons could trigger a new call if we integrate useCalls here, but for now they are visual placeholders */}
        <button className="w-14 h-14 bg-[#0D9488] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#0b7a70] transition-colors">
          <Phone className="w-6 h-6" />
        </button>
        <button className="w-14 h-14 bg-[#0D9488] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#0b7a70] transition-colors">
          <Video className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
