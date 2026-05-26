'use client';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function usePresence(currentUserId: string | null) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const supabase = createClient();
  const channelRef = useRef<any>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Write last_seen to profiles table
  const updateLastSeen = async () => {
    if (!currentUserId) return;
    await supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', currentUserId);
  };

  useEffect(() => {
    if (!currentUserId) return;

    // Write last_seen immediately on mount
    updateLastSeen();

    // Heartbeat: update every 30 seconds while tab is open
    heartbeatRef.current = setInterval(updateLastSeen, 30000);

    // Update last_seen when tab is closed / navigated away
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') updateLastSeen();
    };
    const handleBeforeUnload = () => updateLastSeen();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    const channel = supabase.channel('global_presence');
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => { if (p.user_id) online.add(p.user_id); });
        });
        setOnlineUsers(online);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUserId, online_at: new Date().toISOString() });
        }
      });

    return () => {
      updateLastSeen();
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      supabase.removeChannel(channel);
    };
  }, [currentUserId]); // eslint-disable-line

  return { onlineUsers };
}
