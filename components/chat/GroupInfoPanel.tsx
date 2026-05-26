"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { X, Search, Bell, Shield, LogOut, Trash2, Image as ImageIcon, Link2, ChevronRight, Crown, MoreVertical, RefreshCcw, Lock, FileText, CheckCircle2, XCircle, ArrowLeft, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getInitials, getColor } from "@/lib/supabase/chat";
import { ContactProfile } from "../contacts/ContactProfile";

interface GroupInfoPanelProps {
  chat: any;
  currentUserId?: string;
  onClose: () => void;
  onLeaveGroup?: () => void;
  onDeleteGroup?: () => void;
}

export function GroupInfoPanel({ chat, currentUserId, onClose, onLeaveGroup, onDeleteGroup }: GroupInfoPanelProps) {
  const supabase = createClient();
  const [groupData, setGroupData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  
  // Settings state
  const [anonymousJoin, setAnonymousJoin] = useState(false);
  const [announcementMode, setAnnouncementMode] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [groupRules, setGroupRules] = useState('');
  const [isEditingRules, setIsEditingRules] = useState(false);

  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  
  const [memberMenuId, setMemberMenuId] = useState<string | null>(null);
  const [showMuteOptions, setShowMuteOptions] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState('');

  const fetchGroupData = useCallback(async () => {
    if (!chat?.id) return;
    const { data: convData } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', chat.id)
      .single();

    if (convData) {
      setGroupData(convData);
      setAnonymousJoin(convData.allow_anonymous_join || false);
      setAnnouncementMode(convData.is_announcement_only || false);
      setRequireApproval(convData.require_join_approval || false);
      setIsLocked(convData.is_locked || false);
      setGroupRules(convData.group_rules || '');

      // Fetch members separately to avoid join errors
      const { data: mems } = await supabase
        .from('conversation_members')
        .select('role, user_id')
        .eq('conversation_id', chat.id);
        
      if (mems) {
        const userIds = mems.map((m: any) => m.user_id);
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds);
        
        const fullMembers = mems.map((m: any) => ({
          ...m,
          profiles: profiles?.find(p => p.id === m.user_id)
        }));
        
        setMembers(fullMembers);
        const myRole = fullMembers.find(m => m.user_id === currentUserId)?.role;
        setIsAdmin(myRole === 'admin');
        setIsModerator(myRole === 'moderator');
      }

      // Fetch join requests if admin
      const myRole = mems?.find((m: any) => m.user_id === currentUserId)?.role;
      if (myRole === 'admin' || myRole === 'moderator') {
        const { data: reqs } = await supabase
          .from('group_join_requests')
          .select('id, user_id, status, requested_at')
          .eq('conversation_id', chat.id)
          .eq('status', 'pending');
        
        if (reqs && reqs.length > 0) {
          const rIds = reqs.map((r: any) => r.user_id);
          const { data: rProfs } = await supabase.from('profiles').select('id, full_name').in('id', rIds);
          setJoinRequests(reqs.map((r: any) => ({ ...r, profiles: rProfs?.find(p => p.id === r.user_id) })));
        } else {
          setJoinRequests([]);
        }
      }
    }
  }, [chat?.id, currentUserId, supabase]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  // Real-time: refresh when members or requests change
  useEffect(() => {
    if (!chat?.id) return;
    const channel = supabase.channel(`group_info:${chat.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_members', filter: `conversation_id=eq.${chat.id}` }, fetchGroupData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `id=eq.${chat.id}` }, fetchGroupData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_join_requests', filter: `conversation_id=eq.${chat.id}` }, fetchGroupData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [chat?.id, supabase, fetchGroupData]);

  useEffect(() => {
    if (isAddingMember && currentUserId) {
      const loadContacts = async () => {
        const { data: contactRows } = await supabase
          .from('contacts')
          .select('contact_id')
          .eq('owner_id', currentUserId)
          .eq('status', 'accepted');

        if (contactRows && contactRows.length > 0) {
          const ids = contactRows.map((r: any) => r.contact_id);
          const { data } = await supabase.from('profiles').select('id, full_name').in('id', ids).order('full_name', { ascending: true });
          
          // Filter out existing members
          const existingIds = new Set(members.map(m => m.user_id));
          setContacts((data || []).filter(c => !existingIds.has(c.id)));
        } else {
          // Fallback to all users (for testing)
          const { data } = await supabase.from('profiles').select('id, full_name').neq('id', currentUserId);
          const existingIds = new Set(members.map(m => m.user_id));
          setContacts((data || []).filter(c => !existingIds.has(c.id)));
        }
      };
      loadContacts();
    }
  }, [isAddingMember, currentUserId, supabase, members]);

  const updateSetting = async (field: string, value: any) => {
    if (!isAdmin) return;
    await supabase.from('conversations').update({ [field]: value }).eq('id', chat.id);
    fetchGroupData();
  };

  const copyInviteLink = () => {
    if (isLocked) {
      alert("This group is not accepting new members.");
      return;
    }
    if (groupData?.invite_link_expires_at && new Date(groupData.invite_link_expires_at) < new Date()) {
      alert("This invite link has expired. Please regenerate it.");
      return;
    }
    const link = `${window.location.origin}/join/${groupData?.invite_link}`;
    navigator.clipboard.writeText(link);
  };

  const regenerateLink = async () => {
    if (!isAdmin) return;
    await supabase.from('conversations').update({
      invite_link: Math.random().toString(36).substring(2, 18),
      invite_link_expires_at: null
    }).eq('id', chat.id);
    fetchGroupData();
  };

  const handleRemoveMember = async (userId: string) => {
    setMemberMenuId(null);
    await supabase.from('conversation_members').delete().eq('conversation_id', chat.id).eq('user_id', userId);
    // System message
    const p = members.find(m => m.user_id === userId)?.profiles?.full_name;
    await supabase.from('messages').insert({ conversation_id: chat.id, sender_id: null, content: `${p} was removed`, type: 'system' });
    fetchGroupData();
  };

  const handlePromoteAdmin = async (userId: string) => {
    setMemberMenuId(null);
    await supabase.from('conversation_members').update({ role: 'admin' }).eq('conversation_id', chat.id).eq('user_id', userId);
    const p = members.find(m => m.user_id === userId)?.profiles?.full_name;
    await supabase.from('messages').insert({ conversation_id: chat.id, sender_id: null, content: `${p} is now an admin`, type: 'system' });
    fetchGroupData();
  };

  const handlePromoteModerator = async (userId: string) => {
    setMemberMenuId(null);
    await supabase.from('conversation_members').update({ role: 'moderator' }).eq('conversation_id', chat.id).eq('user_id', userId);
    const p = members.find(m => m.user_id === userId)?.profiles?.full_name;
    await supabase.from('messages').insert({ conversation_id: chat.id, sender_id: null, content: `${p} is now a moderator`, type: 'system' });
    fetchGroupData();
  };

  const handleMuteMember = async (userId: string, hours: number | null) => {
    setShowMuteOptions(null);
    setMemberMenuId(null);
    const mutedUntil = hours ? new Date(Date.now() + hours * 3600000).toISOString() : null;
    await supabase.from('muted_members').insert({
      conversation_id: chat.id,
      user_id: userId,
      muted_by: currentUserId,
      muted_until: mutedUntil
    });
  };

  const saveRules = async () => {
    await updateSetting('group_rules', groupRules);
    setIsEditingRules(false);
  };

  const handleJoinRequest = async (reqId: string, status: 'approved' | 'rejected') => {
    if (!isAdmin && !isModerator) return;
    await supabase.from('group_join_requests').update({ status, reviewed_by: currentUserId, reviewed_at: new Date().toISOString() }).eq('id', reqId);
    
    if (status === 'approved') {
      const req = joinRequests.find(r => r.id === reqId);
      if (req) {
        await supabase.from('conversation_members').insert({ conversation_id: chat.id, user_id: req.user_id, role: 'member' });
      }
    }
    fetchGroupData();
  };

  const handleAddMember = async (userId: string, fullName: string) => {
    await supabase.from('conversation_members').insert({ conversation_id: chat.id, user_id: userId, role: 'member' });
    const { data: currentProfile } = await supabase.from('profiles').select('full_name').eq('id', currentUserId).single();
    await supabase.from('messages').insert({ 
      conversation_id: chat.id, sender_id: null, 
      content: `${currentProfile?.full_name || 'Someone'} added ${fullName}`, 
      type: 'system' 
    });
    setIsAddingMember(false);
    fetchGroupData();
  };

  const filteredMembers = members.filter((m: any) =>
    !memberSearch || m.profiles?.full_name?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const hasExpired = groupData?.invite_link_expires_at && new Date(groupData.invite_link_expires_at) < new Date();

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-x-0 bottom-0 top-[10%] rounded-t-3xl md:relative md:top-0 md:rounded-none w-full md:w-[320px] lg:w-[380px] bg-white border-t md:border-t-0 md:border-l border-[#ECECEC] flex flex-col z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none shrink-0"
    >
      <div className="w-full flex justify-center pt-3 pb-1 md:hidden absolute top-0 z-40">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
      </div>

      <div className="h-16 px-4 flex items-center justify-between border-b border-[#ECECEC] shrink-0 mt-4 md:mt-0">
        <h3 className="font-bold text-[#0F0F14]">Group Info</h3>
        <button onClick={onClose} className="p-2 text-[#6B7280] hover:text-[#0F0F14] hover:bg-[#F6F8F7] rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar" onClick={() => {setMemberMenuId(null); setShowMuteOptions(null);}}>
        {/* Header */}
        <div className="flex flex-col items-center justify-center py-8 border-b border-[#ECECEC]">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold mb-4 shadow-sm ${chat?.color || 'bg-[#8B5CF6] text-white'}`}>
            {chat?.initials || 'G'}
          </div>
          <h2 className="text-xl font-bold text-[#0F0F14] flex items-center gap-2">
            {groupData?.name || chat?.name || "Group"}
            {isLocked && <Lock className="w-4 h-4 text-[#9CA3AF]" />}
          </h2>
          <p className="text-[#6B7280] mt-1 text-sm font-medium">Group · {groupData?.member_count || members.length} members</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-around py-6 border-b border-[#ECECEC] px-6">
          <ActionButton icon={<Bell />} label="Mute" onClick={() => {}} />
          <ActionButton icon={<Search />} label="Search" onClick={() => {}} />
          <ActionButton icon={<Link2 />} label="Copy Link" onClick={copyInviteLink} />
        </div>

        {/* Join Requests */}
        {joinRequests.length > 0 && (
          <div className="p-4 border-b border-[#ECECEC] bg-brand/5">
            <h4 className="font-semibold text-brand mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Pending Requests ({joinRequests.length})
            </h4>
            <div className="space-y-2">
              {joinRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between bg-white p-2 rounded-xl border border-brand/20">
                  <span className="text-[13px] font-semibold">{req.profiles?.full_name || 'Someone'}</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleJoinRequest(req.id, 'approved')} className="p-1 text-green-600 hover:bg-green-50 rounded-full">
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleJoinRequest(req.id, 'rejected')} className="p-1 text-red-600 hover:bg-red-50 rounded-full">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Group Rules */}
        <div className="p-4 border-b border-[#ECECEC]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-[#0F0F14] flex items-center gap-1.5"><FileText className="w-4 h-4" /> Group Rules</h4>
            {isAdmin && !isEditingRules && (
              <button onClick={() => setIsEditingRules(true)} className="text-brand text-xs font-semibold hover:underline">Edit</button>
            )}
          </div>
          {isEditingRules ? (
            <div className="space-y-2">
              <textarea
                value={groupRules}
                onChange={e => setGroupRules(e.target.value)}
                className="w-full h-24 bg-[#F6F8F7] border-none rounded-xl p-3 text-[13px] resize-none outline-none focus:ring-2 focus:ring-brand/20"
                placeholder="Type group rules here..."
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditingRules(false)} className="text-xs text-[#6B7280] font-semibold px-3 py-1.5 hover:bg-[#F6F8F7] rounded-lg">Cancel</button>
                <button onClick={saveRules} className="text-xs text-white bg-brand font-semibold px-3 py-1.5 rounded-lg hover:bg-brand/90">Save</button>
              </div>
            </div>
          ) : (
            <div className="text-[13px] text-[#6B7280] whitespace-pre-wrap">
              {groupRules || 'No rules defined.'}
            </div>
          )}
        </div>

        {/* Settings (Admin Only) */}
        <div className="p-4 border-b border-[#ECECEC] space-y-4">
          <div className={`flex items-center justify-between ${isAdmin ? 'cursor-pointer' : 'opacity-50'}`} onClick={() => updateSetting('is_announcement_only', !announcementMode)}>
            <div>
              <div className="font-semibold text-[#0F0F14]">Announcement mode</div>
              <div className="text-xs text-[#6B7280] mt-0.5">Only admins can send messages</div>
            </div>
            <Toggle active={announcementMode} />
          </div>
          
          <div className={`flex items-center justify-between ${isAdmin ? 'cursor-pointer' : 'opacity-50'}`} onClick={() => updateSetting('require_join_approval', !requireApproval)}>
            <div>
              <div className="font-semibold text-[#0F0F14]">Require approval</div>
              <div className="text-xs text-[#6B7280] mt-0.5">New members must be approved</div>
            </div>
            <Toggle active={requireApproval} />
          </div>
          
          <div className={`flex items-center justify-between ${isAdmin ? 'cursor-pointer' : 'opacity-50'}`} onClick={() => updateSetting('is_locked', !isLocked)}>
            <div>
              <div className="font-semibold text-[#0F0F14]">Lock group</div>
              <div className="text-xs text-[#6B7280] mt-0.5">Prevent new members from joining</div>
            </div>
            <Toggle active={isLocked} />
          </div>

          <div className={`flex items-center justify-between ${isAdmin ? 'cursor-pointer' : 'opacity-50'}`} onClick={() => updateSetting('allow_anonymous_join', !anonymousJoin)}>
            <div>
              <div className="font-semibold text-[#0F0F14]">Anonymous joining</div>
              <div className="text-xs text-[#6B7280] mt-0.5">Hide phone numbers of members</div>
            </div>
            <Toggle active={anonymousJoin} />
          </div>
        </div>

        {/* Invite Link Mgmt */}
        {groupData?.invite_link && (
          <div className="p-4 border-b border-[#ECECEC]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[#9CA3AF] font-medium">Invite Link</p>
              {isAdmin && (
                <button onClick={regenerateLink} className="text-brand text-xs font-semibold flex items-center gap-1 hover:underline">
                  <RefreshCcw className="w-3 h-3" /> Reset Link
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <p className={`text-[13px] truncate flex-1 px-3 py-2 rounded-lg ${isLocked ? 'bg-gray-100 text-gray-400' : hasExpired ? 'bg-red-50 text-red-500' : 'bg-brand/5 text-brand'}`}>
                {isLocked ? 'Group is locked' : hasExpired ? 'Link expired' : `bol.chat/join/${groupData.invite_link}`}
              </p>
            </div>
            {isAdmin && !isLocked && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#6B7280] font-medium">Expires:</span>
                <input 
                  type="date" 
                  className="text-[11px] outline-none border border-[#ECECEC] rounded px-1 text-[#0F0F14]"
                  value={groupData.invite_link_expires_at ? groupData.invite_link_expires_at.split('T')[0] : ''}
                  onChange={(e) => {
                    const val = e.target.value ? new Date(e.target.value).toISOString() : null;
                    updateSetting('invite_link_expires_at', val);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Members List */}
        <div className="p-4 border-b border-[#ECECEC]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-[#0F0F14]">{groupData?.member_count || members.length} Members</h4>
            {(isAdmin || isModerator) && !isLocked && (
              <button onClick={() => setIsAddingMember(true)} className="text-brand flex items-center gap-1 text-[13px] font-semibold hover:underline">
                <UserPlus className="w-4 h-4" /> Add
              </button>
            )}
          </div>

          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search members..."
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              className="w-full bg-[#F6F8F7] rounded-xl pl-9 pr-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="space-y-2">
            {filteredMembers.map((m: any) => {
              const profile = m.profiles;
              const name = profile?.full_name || 'Unknown';
              const isMe = m.user_id === currentUserId;
              const isThisAdmin = m.role === 'admin';
              const isThisMod = m.role === 'moderator';

              return (
                <div key={m.user_id} className="flex items-center gap-3 relative cursor-pointer hover:bg-gray-50 p-2 rounded-xl -mx-2" onClick={() => setSelectedMember(m)}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${getColor(name)}`}>
                    {getInitials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-[#0F0F14] truncate">
                      {isMe ? 'You' : name}
                    </div>
                    <div className="text-[12px] text-[#6B7280] flex items-center gap-1">
                      {isThisAdmin && <Crown className="w-3 h-3 text-[#F59E0B]" />}
                      {isThisMod && <Shield className="w-3 h-3 text-blue-500" />}
                      {m.role}
                    </div>
                  </div>
                  
                  {(isAdmin || isModerator) && !isMe && !isThisAdmin && (
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => { setMemberMenuId(memberMenuId === m.user_id ? null : m.user_id); setShowMuteOptions(null); }}
                        className="p-1.5 rounded-full hover:bg-[#F6F8F7] text-[#9CA3AF] transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {memberMenuId === m.user_id && !showMuteOptions && (
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ duration: 0.1 }}
                            className="absolute right-0 top-8 w-48 bg-white border border-[#ECECEC] rounded-xl shadow-xl z-50 overflow-hidden"
                          >
                            {isAdmin && !isThisMod && (
                              <button onClick={() => handlePromoteModerator(m.user_id)} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#0F0F14] hover:bg-[#F6F8F7] flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-500" /> Promote to Mod
                              </button>
                            )}
                            {isAdmin && (
                              <button onClick={() => handlePromoteAdmin(m.user_id)} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#0F0F14] hover:bg-[#F6F8F7] flex items-center gap-2">
                                <Crown className="w-4 h-4 text-[#F59E0B]" /> Promote to Admin
                              </button>
                            )}
                            <button onClick={() => setShowMuteOptions(m.user_id)} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#0F0F14] hover:bg-[#F6F8F7] flex items-center gap-2">
                              <Bell className="w-4 h-4" /> Mute Member
                            </button>
                            <button onClick={() => handleRemoveMember(m.user_id)} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 flex items-center gap-2 border-t border-[#ECECEC]">
                              <X className="w-4 h-4" /> Remove
                            </button>
                          </motion.div>
                        )}

                        {memberMenuId === m.user_id && showMuteOptions === m.user_id && (
                          <motion.div
                            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} transition={{ duration: 0.1 }}
                            className="absolute right-0 top-8 w-44 bg-white border border-[#ECECEC] rounded-xl shadow-xl z-50 overflow-hidden py-1"
                          >
                            <div className="px-3 py-2 border-b border-[#ECECEC] text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Mute Duration</div>
                            <button onClick={() => handleMuteMember(m.user_id, 1)} className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-[#F6F8F7]">1 Hour</button>
                            <button onClick={() => handleMuteMember(m.user_id, 8)} className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-[#F6F8F7]">8 Hours</button>
                            <button onClick={() => handleMuteMember(m.user_id, 24)} className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-[#F6F8F7]">24 Hours</button>
                            <button onClick={() => handleMuteMember(m.user_id, 168)} className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-[#F6F8F7]">1 Week</button>
                            <button onClick={() => handleMuteMember(m.user_id, null)} className="w-full text-left px-4 py-2 text-[13px] font-medium text-red-500 hover:bg-red-50 border-t border-[#ECECEC]">Forever</button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-4 space-y-2 mb-8">
          <button onClick={onLeaveGroup} className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-semibold">
            <LogOut className="w-5 h-5" /> Leave Group
          </button>
          {isAdmin && (
            <button onClick={onDeleteGroup} className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-semibold">
              <Trash2 className="w-5 h-5" /> Delete Group
            </button>
          )}
        </div>
      </div>
      
      {/* Contact Profile Overlay */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 bg-white z-50 flex flex-col"
          >
            <div className="h-16 px-4 flex items-center border-b border-[#ECECEC] shrink-0">
              <button onClick={() => setSelectedMember(null)} className="p-2 -ml-2 text-[#6B7280] hover:text-[#0F0F14] hover:bg-[#F6F8F7] rounded-full transition-colors mr-3">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-[#0F0F14]">Contact Info</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ContactProfile 
                contact={selectedMember.profiles} 
                isOnline={false} 
                onBack={() => setSelectedMember(null)} 
                currentUser={{id: currentUserId}} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Member Overlay */}
      <AnimatePresence>
        {isAddingMember && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 bg-white z-50 flex flex-col rounded-t-3xl md:rounded-none"
          >
            <div className="h-16 px-4 flex items-center justify-between border-b border-[#ECECEC] shrink-0 mt-4 md:mt-0">
              <h3 className="font-bold text-[#0F0F14]">Add Member</h3>
              <button onClick={() => setIsAddingMember(false)} className="p-2 text-[#6B7280] hover:text-[#0F0F14] hover:bg-[#F6F8F7] rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-[#ECECEC]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  className="w-full bg-[#F6F8F7] rounded-xl pl-9 pr-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {contacts.filter(c => !contactSearch || c.full_name?.toLowerCase().includes(contactSearch.toLowerCase())).length === 0 && (
                <div className="text-center text-[#9CA3AF] text-[13px] py-4">No available contacts to add</div>
              )}
              {contacts.filter(c => !contactSearch || c.full_name?.toLowerCase().includes(contactSearch.toLowerCase())).map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 p-2 hover:bg-[#F6F8F7] rounded-xl transition-colors cursor-pointer" onClick={() => handleAddMember(contact.id, contact.full_name)}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${getColor(contact.full_name || 'U')}`}>
                    {getInitials(contact.full_name || 'U')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-[#0F0F14] truncate">{contact.full_name || 'Unknown'}</div>
                  </div>
                  <button className="text-brand font-semibold text-[13px] px-3 py-1 bg-brand/10 rounded-lg hover:bg-brand hover:text-white transition-colors">
                    Add
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <div onClick={onClick} className="flex flex-col items-center gap-2 cursor-pointer group">
      <div className="w-10 h-10 rounded-full bg-[#F6F8F7] flex items-center justify-center text-[#0F0F14] group-hover:bg-[#ECECEC] transition-colors">
        {icon}
      </div>
      <span className="text-[12px] font-medium text-[#6B7280] group-hover:text-[#0F0F14]">{label}</span>
    </div>
  );
}

function Toggle({ active }: { active: boolean }) {
  return (
    <div className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors ${active ? 'bg-brand' : 'bg-gray-300'}`}>
      <motion.div initial={false} animate={{ x: active ? 20 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
    </div>
  );
}
