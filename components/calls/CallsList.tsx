import { useEffect, useState } from "react";
import { Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function CallsList({ currentUserId, activeId, onSelect }: any) {
  const [calls, setCalls] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'missed'>('all');
  const supabase = createClient();

  useEffect(() => {
    if (!currentUserId) return;
    
    const fetchCalls = async () => {
      // Fetch calls
      const { data: callLogs } = await supabase
        .from('call_logs')
        .select('*')
        .or(`caller_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('started_at', { ascending: false })
        .limit(50);
        
      if (!callLogs) return;

      // Extract unique user ids
      const userIds = new Set(callLogs.map(c => c.caller_id === currentUserId ? c.receiver_id : c.caller_id));
      
      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      // Merge data
      const merged = callLogs.map(call => {
        const otherId = call.caller_id === currentUserId ? call.receiver_id : call.caller_id;
        const isIncoming = call.receiver_id === currentUserId;
        return {
          ...call,
          otherProfile: profileMap.get(otherId) || { full_name: 'Unknown User' },
          isIncoming
        };
      });

      setCalls(merged);
    };

    fetchCalls();

    // Subscribe to new calls
    const channel = supabase.channel('call_logs_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_logs' }, () => {
        fetchCalls();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, supabase]);

  const filteredCalls = filter === 'all' 
    ? calls 
    : calls.filter(c => c.status === 'missed');

  const formatDuration = (seconds: number) => {
    if (!seconds) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getStatusLabel = (call: any) => {
    if (call.status === 'missed') {
      return call.isIncoming ? 'Missed' : 'Cancelled';
    }
    return call.status.charAt(0).toUpperCase() + call.status.slice(1);
  };

  return (
    <div className="w-[320px] lg:w-[380px] h-full border-r border-[#ECECEC] flex flex-col p-4 bg-white">
      <h1 className="text-2xl font-bold text-[#0F0F14] mb-4">Calls</h1>
      
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full font-medium transition-colors ${filter === 'all' ? 'bg-[#0D9488]/10 text-[#0D9488]' : 'bg-[#F6F8F7] text-[#6B7280]'}`}
        >
          All
        </button>
        <button 
          onClick={() => setFilter('missed')}
          className={`px-4 py-1.5 rounded-full font-medium transition-colors ${filter === 'missed' ? 'bg-[#0D9488]/10 text-[#0D9488]' : 'bg-[#F6F8F7] text-[#6B7280]'}`}
        >
          Missed
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {filteredCalls.map((call) => {
          const isMissed = call.status === 'missed' || call.status === 'rejected';
          
          let Icon = Phone;
          if (call.type === 'video') Icon = Video;
          if (isMissed && call.isIncoming) Icon = PhoneMissed;
          
          const time = new Date(call.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const statusLabel = getStatusLabel(call);
          const durationStr = call.status === 'ended' && call.duration_seconds ? ` • ${formatDuration(call.duration_seconds)}` : '';

          return (
            <button 
              key={call.id} 
              onClick={() => onSelect(call.id)} 
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeId === call.id ? 'bg-[#F6F8F7]' : 'hover:bg-[#F6F8F7]'}`}
            >
              <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                {call.otherProfile?.avatar_url ? (
                  <img src={call.otherProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className={`font-semibold truncate ${isMissed && call.isIncoming ? 'text-red-500' : 'text-[#0F0F14]'}`}>
                  {call.otherProfile?.full_name}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-[#6B7280] truncate">
                  {call.isIncoming ? (
                    <PhoneIncoming className="w-3.5 h-3.5" />
                  ) : (
                    <PhoneOutgoing className="w-3.5 h-3.5" />
                  )}
                  {statusLabel} • {time}{durationStr}
                </div>
              </div>
              <div className="flex-shrink-0 text-[#0D9488]">
                <Icon className={`w-5 h-5 ${isMissed && call.isIncoming ? 'text-red-500' : ''}`} />
              </div>
            </button>
          );
        })}
        {filteredCalls.length === 0 && (
          <div className="text-center text-gray-500 mt-10">No calls found</div>
        )}
      </div>
    </div>
  );
}
