"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Sparkles, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PulseEditModal } from "./PulseEditModal";

export interface Pulse {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'photo' | 'video' | 'voice' | 'text';
  thumbnail_url: string | null;
  caption: string | null;
  mood: string | null;
  ai_title: string | null;
  duration_seconds: number | null;
  waveform_data: number[] | null;
  privacy: string;
  background_color: string | null;
  expires_at: string;
  created_at: string;
  view_count: number;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

interface PulseFeedProps {
  currentUserId: string | null;
  activeUserId: string | null;
  onSelectUser: (userId: string, startIndex?: number) => void;
  onCreatePulse: () => void;
  refreshTrigger?: number;
  pulseViewedTrigger?: { poster_id: string, ts: number } | null;
}

export interface RingState {
  poster_id: string;
  total_pulses: number;
  viewed_pulses: number;
  has_unseen: boolean;
  first_unseen_pulse_id: string;
  first_unseen_index: number;
}

function getMoodColor(mood: string | null) {
  switch (mood) {
    case 'chill': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'celebration': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'work': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'cricket': return 'bg-green-100 text-green-800 border-green-200';
    case 'travel': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'food': return 'bg-red-100 text-red-800 border-red-200';
    case 'music': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'love': return 'bg-pink-100 text-pink-800 border-pink-200';
    case 'random': return 'bg-teal-100 text-teal-800 border-teal-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getMoodEmoji(mood: string | null) {
  switch (mood) {
    case 'chill': return '😌';
    case 'celebration': return '🎉';
    case 'work': return '💻';
    case 'cricket': return '🏏';
    case 'travel': return '✈️';
    case 'food': return '🍕';
    case 'music': return '🎵';
    case 'love': return '❤️';
    case 'random': return '✨';
    default: return '';
  }
}

export function PulseFeed({ currentUserId, activeUserId, onSelectUser, onCreatePulse, refreshTrigger = 0, pulseViewedTrigger }: PulseFeedProps) {
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [ringStatesMap, setRingStatesMap] = useState<Map<string, RingState>>(new Map());
  const [currentUserProfile, setCurrentUserProfile] = useState<{ full_name: string, avatar_url: string } | null>(null);
  const [showViewed, setShowViewed] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();

    const loadData = async () => {
      // Fetch user profile
      const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', currentUserId).single();
      if (profile) setCurrentUserProfile(profile);

      // Fetch all visible pulses (RLS handles visibility: own + contacts)
      const { data: allPulses, error } = await supabase
        .from('pulses')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching pulses:", error);
      }

      if (allPulses && allPulses.length > 0) {
        // Fetch profiles for these pulses manually to avoid PostgREST foreign key join errors
        const userIds = [...new Set(allPulses.map(p => p.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
          
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        // Fetch accurate view counts for the current user's pulses
        const myPulseIds = allPulses.filter(p => p.user_id === currentUserId).map(p => p.id);
        const viewCounts = new Map<string, number>();
        if (myPulseIds.length > 0) {
          const { data: myViews } = await supabase.from('pulse_views').select('pulse_id').in('pulse_id', myPulseIds);
          myViews?.forEach(v => {
            viewCounts.set(v.pulse_id, (viewCounts.get(v.pulse_id) || 0) + 1);
          });
        }
        
        const pulsesWithProfiles = allPulses.map(p => ({
          ...p,
          view_count: p.user_id === currentUserId ? (viewCounts.get(p.id) || 0) : p.view_count,
          profiles: profileMap.get(p.user_id) || { full_name: 'Unknown', avatar_url: '' }
        }));
        
        setPulses(pulsesWithProfiles as any[]);
        
        // Fetch the powerful ring states for all posters
        const posterIds = Array.from(new Set(allPulses.filter(p => p.user_id !== currentUserId).map(p => p.user_id)));
        if (posterIds.length > 0) {
          const { data: ringStatesData, error: ringError } = await supabase.rpc('get_pulse_ring_states', {
            viewer_id_param: currentUserId,
            poster_ids: posterIds
          });
          if (ringError) {
            console.error("RPC Error:", ringError);
            alert("SQL ERROR: " + ringError.message + "\n\nPlease run the SQL I gave you!");
          }
          console.log("INITIAL RING STATES RPC RESULT:", ringStatesData);
          const map = new Map<string, RingState>();
          ringStatesData?.forEach((r: RingState) => map.set(r.poster_id, r));
          setRingStatesMap(map);
        }
      }
    };

    loadData();

    // Subscribe to new pulses from contacts
    const pulsesSub = supabase.channel('pulses_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pulses' }, async (payload) => {
        // We need to fetch the profile for the new pulse
        const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', payload.new.user_id).single();
        const newPulse = { ...payload.new, profiles: profile } as Pulse;
        setPulses(prev => [...prev, newPulse]);

        // Re-call get_pulse_ring_states for that specific poster_id only
        const { data: ringStatesData } = await supabase.rpc('get_pulse_ring_states', {
          viewer_id_param: currentUserId,
          poster_ids: [payload.new.user_id]
        });
        if (ringStatesData && ringStatesData.length > 0) {
          setRingStatesMap(prev => {
            const newMap = new Map(prev);
            newMap.set(payload.new.user_id, ringStatesData[0]);
            return newMap;
          });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pulses' }, (payload) => {
        setPulses(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
      })
      .subscribe();

    // Auto refresh every 15 seconds to ensure fast sync across devices
    const intervalId = setInterval(loadData, 15000);

    return () => {
      supabase.removeChannel(pulsesSub);
      clearInterval(intervalId);
    };
  }, [currentUserId, refreshTrigger]);

  // Handle instant ring state updates when a pulse is viewed
  useEffect(() => {
    if (!currentUserId || !pulseViewedTrigger) return;
    const fetchRingState = async () => {
      const supabase = createClient();
      const { data: ringStatesData, error } = await supabase.rpc('get_pulse_ring_states', {
        viewer_id_param: currentUserId,
        poster_ids: [pulseViewedTrigger.poster_id]
      });
      console.log("TRIGGERED RING STATE RPC:", { poster_id: pulseViewedTrigger.poster_id, data: ringStatesData, error });
      if (ringStatesData && ringStatesData.length > 0) {
        setRingStatesMap(prev => {
          const newMap = new Map(prev);
          newMap.set(pulseViewedTrigger.poster_id, ringStatesData[0]);
          return newMap;
        });
      }
    };
    fetchRingState();
  }, [pulseViewedTrigger, currentUserId]);

  const myPulses = useMemo(() => pulses.filter(p => p.user_id === currentUserId), [pulses, currentUserId]);
  
  // Group by user
  const contactPulsesByUser = useMemo(() => {
    const map = new Map<string, Pulse[]>();
    pulses.forEach(p => {
      if (p.user_id === currentUserId) return;
      if (!map.has(p.user_id)) map.set(p.user_id, []);
      map.get(p.user_id)!.push(p);
    });
    return Array.from(map.entries()).map(([userId, userPulses]) => {
      const sorted = [...userPulses].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const ringState = ringStatesMap.get(userId);
      // Determine if they have unseen pulses based purely on the ringState data
      const hasUnviewed = ringState ? ringState.has_unseen : true;
      const latestPulse = sorted[sorted.length - 1];
      return { userId, pulses: sorted, hasUnviewed, ringState, latestPulse };
    });
  }, [pulses, ringStatesMap, currentUserId]);

  const recentContactUsers = useMemo(() => contactPulsesByUser.filter(u => u.hasUnviewed).sort((a, b) => new Date(b.latestPulse.created_at).getTime() - new Date(a.latestPulse.created_at).getTime()), [contactPulsesByUser]);
  const viewedContactUsers = useMemo(() => contactPulsesByUser.filter(u => !u.hasUnviewed).sort((a, b) => new Date(b.latestPulse.created_at).getTime() - new Date(a.latestPulse.created_at).getTime()), [contactPulsesByUser]);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) {
      const mins = Math.floor(diff / (1000 * 60));
      return `${mins}m`;
    }
    return `${hours}h`;
  };

  return (
    <div className="w-[380px] h-full bg-white border-r border-[#ECECEC] flex flex-col shrink-0">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#ECECEC] shrink-0">
        <h1 className="text-xl font-bold text-[#0F0F14]">Status</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        
        {/* My Pulse Card */}
        <div 
          onClick={myPulses.length > 0 ? () => onSelectUser(currentUserId!) : onCreatePulse}
          className="flex items-center gap-4 p-3 rounded-[16px] hover:bg-[#F6F8F7] hover:-translate-y-[2px] transition-all cursor-pointer shadow-sm hover:shadow-md border border-transparent hover:border-[#ECECEC]"
        >
          <div className="relative shrink-0">
            {myPulses.length > 0 ? (
              <div className="w-16 h-16 rounded-full p-[3px] bg-[#0D9488]">
                <img src={currentUserProfile?.avatar_url || ''} className="w-full h-full rounded-full object-cover border-2 border-white" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#EEF4F3] flex items-center justify-center relative">
                {currentUserProfile?.avatar_url ? (
                  <img src={currentUserProfile.avatar_url} className="w-full h-full rounded-full object-cover opacity-60" />
                ) : (
                  <span className="text-xl font-bold text-[#0D9488]/40">{(currentUserProfile?.full_name || 'U').charAt(0)}</span>
                )}
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#0D9488] rounded-full flex items-center justify-center border-2 border-white">
                  <Plus className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-semibold text-[#0F0F14] truncate">My Status</h3>
            <p className="text-[13px] text-[#6B7280] truncate">
              {myPulses.length > 0 ? `Your Status · ${myPulses.reduce((acc, p) => acc + p.view_count, 0)} views` : 'Add to your Status'}
            </p>
          </div>
          {myPulses.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditModalOpen(true);
              }}
              className="px-3 py-1.5 text-[12px] font-medium text-[#0D9488] bg-[#EEF4F3] hover:bg-[#E0EDED] rounded-full transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {/* Recent Pulses */}
        {recentContactUsers.length > 0 && (
          <div>
            <h4 className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-3 px-3">Recent</h4>
            <div className="space-y-1">
              {recentContactUsers.map((user, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  key={user.userId}
                  onClick={() => onSelectUser(user.userId, user.ringState?.first_unseen_index || 0)}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors ${activeUserId === user.userId ? 'bg-[#EEF4F3]' : 'hover:bg-[#F6F8F7]'}`}
                >
                  <div className="relative shrink-0 w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-[#0D9488] to-[#5EEAD4] animate-[spin_4s_linear_infinite]">
                    <img src={user.latestPulse.profiles?.avatar_url} className="w-full h-full rounded-full object-cover border-2 border-white animate-[spin_4s_linear_infinite_reverse]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="text-[14px] font-semibold text-[#0F0F14] truncate">{user.latestPulse.profiles?.full_name}</h3>
                      <span className="text-[11px] text-[#9CA3AF] shrink-0 ml-2">{formatTimeAgo(user.latestPulse.created_at)}</span>
                    </div>
                    {user.latestPulse.mood ? (
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${getMoodColor(user.latestPulse.mood)}`}>
                        <span>{getMoodEmoji(user.latestPulse.mood)}</span>
                        <span className="capitalize">{user.latestPulse.mood}</span>
                      </div>
                    ) : (
                      <p className="text-[13px] text-[#6B7280] truncate">{user.latestPulse.caption || `${user.pulses.length} new`}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Viewed Pulses */}
        {viewedContactUsers.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-3 mb-2 cursor-pointer" onClick={() => setShowViewed(!showViewed)}>
              <h4 className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Viewed</h4>
              <span className="text-[11px] text-[#0D9488] font-medium">{showViewed ? 'Hide' : `Show ${viewedContactUsers.length} viewed`}</span>
            </div>
            
            {showViewed && (
              <div className="space-y-1">
                {viewedContactUsers.map(user => (
                  <div
                    key={user.userId}
                    onClick={() => onSelectUser(user.userId, 0)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors ${activeUserId === user.userId ? 'bg-[#EEF4F3]' : 'hover:bg-[#F6F8F7]'}`}
                  >
                    <div className="relative shrink-0 w-14 h-14 rounded-full p-[2px] bg-[#D1D5DB]">
                      <img src={user.latestPulse.profiles?.avatar_url} className="w-full h-full rounded-full object-cover border-2 border-white grayscale-[0.2] opacity-80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className="text-[14px] font-semibold text-[#0F0F14] truncate opacity-80">{user.latestPulse.profiles?.full_name}</h3>
                        <span className="text-[11px] text-[#9CA3AF] shrink-0 ml-2">{formatTimeAgo(user.latestPulse.created_at)}</span>
                      </div>
                      <p className="text-[13px] text-[#6B7280] truncate opacity-80">{user.latestPulse.caption || 'Viewed'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* AI Summary Card */}
      <div className="p-4 shrink-0 border-t border-[#ECECEC]">
        <div className="bg-[#EEF4F3] border-l-[3px] border-[#0D9488] rounded-r-xl p-3 cursor-pointer hover:bg-[#E0EDED] transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#0D9488]" />
            <h4 className="text-[13px] font-semibold text-[#0F0F14]">Today's Status</h4>
          </div>
          <ul className="text-[12px] text-[#6B7280] space-y-1.5 list-disc list-inside">
            <li>Sarah is traveling to Japan ✈️</li>
            <li>Mike shared a new track 🎵</li>
            <li>2 friends are celebrating today</li>
          </ul>
        </div>
      </div>

      <AnimatePresence>
        {isEditModalOpen && (
          <PulseEditModal 
            pulses={myPulses} 
            onClose={() => setIsEditModalOpen(false)}
            onDeleted={(id) => {
              setPulses(prev => prev.filter(p => p.id !== id));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
