'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getInitials, getColor, formatTime } from '@/lib/supabase/chat';

export type ConversationItem = {
  id: string;
  name: string;
  initials: string;
  color: string;
  message: string;
  time: string;
  unread: number;
  online: boolean;
  isGroup: boolean;
  memberCount?: number;
  otherUserId?: string;
  isAnnouncementOnly?: boolean;
  myRole?: string;
  mutedUntil?: string;
  avatarUrl?: string | null;
};

export function useConversations(currentUserId: string | null) {
  const [conversations, setConversations] = useState<ConversationItem[]>(() => {
    if (typeof window !== 'undefined') {
      const uid = currentUserId || localStorage.getItem('bol_last_user_id');
      if (uid) {
        const cached = localStorage.getItem(`bol_conversations_cache_${uid}`);
        if (cached) {
          try { return JSON.parse(cached); } catch(e) {}
        }
      }
    }
    return [];
  });
  // isLoaded: true once first fetch or cache hit is done
  const hasCachedData = typeof window !== 'undefined' && !!localStorage.getItem(`bol_conversations_cache_${currentUserId || localStorage.getItem('bol_last_user_id') || ''}`);
  const [isLoaded, setIsLoaded] = useState(hasCachedData);
  const supabase = createClient();

  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return;

    // Step 1: get memberships (includes last_read_at, role)
    const { data: memberships } = await supabase
      .from('conversation_members')
      .select('conversation_id, last_read_at, role')
      .eq('user_id', currentUserId);

    if (!memberships?.length) { setConversations([]); return; }
    const convIds = memberships.map(m => m.conversation_id);

    // Step 2: get conversations ordered by latest
    const { data: convs } = await supabase
      .from('conversations')
      .select('id, type, name, updated_at, member_count, is_announcement_only')
      .in('id', convIds)
      .order('updated_at', { ascending: false });

    if (!convs?.length) { setConversations([]); return; }

    // Step 3: get other members for direct chats
    const { data: otherMembers } = await supabase
      .from('conversation_members')
      .select('conversation_id, user_id')
      .in('conversation_id', convIds)
      .neq('user_id', currentUserId);

    const otherUserIds = Array.from(new Set((otherMembers || []).map(m => m.user_id)));
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', otherUserIds);

    const profileMap: Record<string, { name: string; avatarUrl: string | null }> = {};
    profiles?.forEach(p => { profileMap[p.id] = { name: p.full_name, avatarUrl: p.avatar_url }; });

    // Step 3.5: get muted status
    const { data: muted } = await supabase
      .from('muted_members')
      .select('conversation_id, muted_until')
      .eq('user_id', currentUserId);
    const mutedMap: Record<string, string> = {};
    muted?.forEach(m => {
      // only store if not expired
      if (!m.muted_until || new Date(m.muted_until) > new Date()) {
        mutedMap[m.conversation_id] = m.muted_until || 'forever';
      }
    });

    // Step 4: get last message per conversation
    const { data: lastMsgs } = await supabase
      .from('messages')
      .select('conversation_id, content, type, created_at, sender_id')
      .in('conversation_id', convIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Step 5: unread counts
    const membershipMap: Record<string, string> = {};
    memberships.forEach(m => { membershipMap[m.conversation_id] = m.last_read_at; });

    const lastMsgMap: Record<string, any> = {};
    lastMsgs?.forEach(msg => { if (!lastMsgMap[msg.conversation_id]) lastMsgMap[msg.conversation_id] = msg; });

    const otherMemberMap: Record<string, any[]> = {};
    otherMembers?.forEach(m => {
      if (!otherMemberMap[m.conversation_id]) otherMemberMap[m.conversation_id] = [];
      otherMemberMap[m.conversation_id].push(m);
    });

    // Unread: messages after last_read_at per conversation
    const unreadMap: Record<string, number> = {};
    lastMsgs?.forEach(msg => {
      const lastRead = membershipMap[msg.conversation_id];
      // Do not count your own messages as unread!
      if (msg.sender_id !== currentUserId && lastRead && new Date(msg.created_at) > new Date(lastRead)) {
        unreadMap[msg.conversation_id] = (unreadMap[msg.conversation_id] || 0) + 1;
      }
    });

    const formatted: ConversationItem[] = convs.map(conv => {
      const lastMsg = lastMsgMap[conv.id];
      const others = otherMemberMap[conv.id] || [];
      const isGroup = conv.type === 'group';
      const otherUser = profileMap[others[0]?.user_id];
      const name = !isGroup
        ? (otherUser?.name || 'Unknown')
        : (conv.name || 'Group');

      // For groups: "SenderName: message content" prefix
      let messagePreview = 'Start chatting!';
      if (lastMsg) {
        if (lastMsg.type === 'text') {
          if (isGroup) {
            const senderName = profileMap[lastMsg.sender_id]?.name || 'Someone';
            messagePreview = `${senderName}: ${lastMsg.content}`;
          } else {
            messagePreview = lastMsg.content;
          }
        } else {
          messagePreview = `📎 ${lastMsg.type}`;
        }
      }

      return {
        id: conv.id,
        name,
        initials: getInitials(name),
        // Groups always purple, direct chats use name-based color
        color: isGroup ? 'bg-[#8B5CF6] text-white' : getColor(name),
        message: messagePreview,
        time: lastMsg ? formatTime(lastMsg.created_at) : '',
        unread: unreadMap[conv.id] || 0,
        online: false,
        isGroup,
        memberCount: isGroup ? (conv.member_count || others.length + 1) : undefined,
        otherUserId: !isGroup ? others[0]?.user_id : undefined,
        isAnnouncementOnly: conv.is_announcement_only,
        myRole: memberships.find(m => m.conversation_id === conv.id)?.role,
        mutedUntil: mutedMap[conv.id],
        avatarUrl: !isGroup ? otherUser?.avatarUrl : null,
      };
    });

    setConversations(prev => {
      const prevOnlineMap = new Map(prev.map(p => [p.id, p.online]));
      const next = formatted.map(f => ({
        ...f,
        online: prevOnlineMap.get(f.id) || false
      }));
      if (currentUserId) {
        localStorage.setItem(`bol_conversations_cache_${currentUserId}`, JSON.stringify(next));
      }
      return next;
    });
    setIsLoaded(true);
  }, [currentUserId, supabase]);

  const markAsRead = useCallback((id: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  }, []);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem('bol_last_user_id', currentUserId);
    }
    fetchConversations(); 
  }, [fetchConversations, currentUserId]);

  // Realtime: refresh list when any message is sent
  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel('chat-list-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchConversations)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, supabase, fetchConversations]);

  const updateOnlineStatus = useCallback((onlineIds: Set<string>) => {
    setConversations(prev => prev.map(c => ({
      ...c,
      online: c.otherUserId ? onlineIds.has(c.otherUserId) : false,
    })));
  }, []);

  return { conversations, isLoaded, refresh: fetchConversations, updateOnlineStatus, markAsRead };
}
