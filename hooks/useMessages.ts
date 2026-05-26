'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { aggregateReactions, formatTime } from '@/lib/supabase/chat';

export type MessageItem = {
  id: string;
  sender_id: string;
  content: string;
  type: string;
  time: string;
  isSent: boolean;
  senderName: string;
  reactions: { emoji: string; count: number }[];
  read: boolean;
  rawTime?: string;
  replyTo?: { id: string; content: string; senderName: string } | null;
};

export function useMessages(conversationId: string | null, currentUserId: string | null) {
  const [messages, setMessages] = useState<MessageItem[]>(() => {
    if (typeof window !== 'undefined' && conversationId) {
      const cached = localStorage.getItem(`bol_messages_cache_${conversationId}`);
      if (cached) {
        try { return JSON.parse(cached); } catch(e) {}
      }
    }
    return [];
  });
  const [otherUserTyping, setOtherUserTyping] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<any>(null);
  const supabase = createClient();

  const formatMessage = useCallback((raw: any, profileMap: Record<string, string>, otherLastRead: number): MessageItem => ({
    id: raw.id,
    sender_id: raw.sender_id,
    content: raw.content || '',
    type: raw.type || 'text',
    time: formatTime(raw.created_at),
    isSent: raw.sender_id === currentUserId,
    senderName: profileMap[raw.sender_id] || 'Unknown',
    reactions: aggregateReactions(raw.message_reactions || []),
    read: new Date(raw.created_at).getTime() <= otherLastRead,
    rawTime: raw.created_at,
    replyTo: raw.reply_to_content ? { id: raw.reply_to_id || '', content: raw.reply_to_content, senderName: raw.reply_to_sender || 'Unknown' } : null,
  }), [currentUserId]);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    // 1. Fetch other user's last_read_at for initial read receipts
    const { data: members } = await supabase
      .from('conversation_members')
      .select('last_read_at')
      .eq('conversation_id', conversationId)
      .neq('user_id', currentUserId);
      
    let otherLastRead = 0;
    if (members && members.length > 0) {
      otherLastRead = Math.max(...members.map(m => new Date(m.last_read_at || 0).getTime()));
    }

    const { data: msgsData, error } = await supabase
      .from('messages')
      .select('id, sender_id, content, type, created_at, reply_to_id, reply_to_content, reply_to_sender, message_reactions(emoji, user_id)')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) console.error("Error fetching messages:", error);
    
    // Reverse the messages to display them chronologically (oldest at top, newest at bottom)
    const msgs = (msgsData || []).reverse();

    const senderIds = Array.from(new Set((msgs || []).map(m => m.sender_id)));
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', senderIds);
      
    const profileMap: Record<string, string> = {};
    profiles?.forEach(p => { profileMap[p.id] = p.full_name; });

    const formatted = (msgs || []).map(m => formatMessage(m, profileMap, otherLastRead));
    setMessages(formatted);
    if (conversationId) {
      localStorage.setItem(`bol_messages_cache_${conversationId}`, JSON.stringify(formatted));
    }

    // Mark as read
    if (currentUserId) {
      // Broadcast read receipt instantly to the sender
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast', event: 'read_receipt',
          payload: { user_id: currentUserId, time: Date.now() }
        });
      }

      supabase
        .from('conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId).then();
    }
  }, [conversationId, currentUserId, supabase, formatMessage]);

  useEffect(() => {
    if (conversationId) {
      // Show cached messages instantly while fetching fresh ones
      const cached = localStorage.getItem(`bol_messages_cache_${conversationId}`);
      if (cached) {
        try { setMessages(JSON.parse(cached)); } catch(e) { setMessages([]); }
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
    setOtherUserTyping(null);
    fetchMessages();
  }, [conversationId, fetchMessages]);

  // Realtime subscription for new messages + typing + read receipts
  useEffect(() => {
    if (!conversationId) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase.channel(`messages:${conversationId}`)
      .on('broadcast', { event: '*' }, (payload) => {
         console.log("DEBUG BROADCAST:", payload);
      })
      .on('broadcast', { event: 'new_message' }, async (eventData) => {
        const payload = eventData.payload || eventData;
        if (!payload || !payload.message) return;
        const msg = payload.message as MessageItem;
        if (msg.sender_id !== currentUserId) {
          // Instant WhatsApp-style P2P message delivery
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, { ...msg, isSent: false, read: true }]; // We just read it instantly
          });
          
          if (currentUserId) {
            // Broadcast instantly before DB
            channel.send({
              type: 'broadcast', event: 'read_receipt',
              payload: { user_id: currentUserId, time: Date.now() }
            });

            // Update read receipts
            supabase.from('conversation_members')
              .update({ last_read_at: new Date().toISOString() })
              .eq('conversation_id', conversationId)
              .eq('user_id', currentUserId).then();
          }
        }
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, async (payload) => {
        let data = null;
        for (let i = 0; i < 3; i++) {
          const res = await supabase.from('messages')
            .select('id, sender_id, content, type, created_at, reply_to_id, reply_to_content, reply_to_sender, message_reactions(emoji, user_id)')
            .eq('id', payload.new.id).single();
          if (res.data) { data = res.data; break; }
          await new Promise(r => setTimeout(r, 200)); 
        }

        // Bulletproof fallback: use raw payload if DB query completely failed due to lag
        if (!data && payload.new) {
          data = payload.new;
          data.message_reactions = [];
        }

        if (data) {
          const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', data.sender_id).single();
          const pMap = { [data.sender_id]: profile?.full_name || 'Unknown' };
          
          setMessages(prev => {
            if (prev.some(m => m.id === data.id)) return prev;
            return [...prev, formatMessage(data, pMap, Date.now())]; 
          });
          
          if (data.sender_id !== currentUserId && currentUserId) {
            // Broadcast instantly
            channel.send({
              type: 'broadcast', event: 'read_receipt',
              payload: { user_id: currentUserId, time: Date.now() }
            });

            supabase.from('conversation_members')
              .update({ last_read_at: new Date().toISOString() })
              .eq('conversation_id', conversationId)
              .eq('user_id', currentUserId).then();
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'conversation_members',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        if (payload.new.user_id !== currentUserId && payload.new.last_read_at) {
          // Add 5 minutes tolerance to account for client clock drift
          const newReadTime = new Date(payload.new.last_read_at).getTime() + 300000;
          setMessages(prev => prev.map(m => {
             if (m.isSent && !m.read && m.rawTime && new Date(m.rawTime).getTime() <= newReadTime) {
                return { ...m, read: true };
             }
             return m;
          }));
        }
      })
      .on('broadcast', { event: 'read_receipt' }, (eventData) => {
        const payload = eventData.payload || eventData;
        // WhatsApp-style instant P2P read receipt
        if (payload && payload.user_id !== currentUserId) {
          // If they sent a read receipt right now, they have read everything we sent up to now.
          // No time comparison needed, which completely bypasses clock drift issues.
          setMessages(prev => prev.map(m => {
             if (m.isSent && !m.read) {
                return { ...m, read: true };
             }
             return m;
          }));
        }
      })
      .on('broadcast', { event: 'typing' }, (eventData) => {
        const rawPayload = eventData.payload || eventData;
        // Handle potential nested payload from Flutter SDK
        const actualPayload = rawPayload.payload ? rawPayload.payload : rawPayload;
        
        if (actualPayload && actualPayload.user_id && actualPayload.user_id !== currentUserId) {
          setOtherUserTyping(actualPayload.display_name || 'Someone');
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherUserTyping(null), 3000);
        }
      })
      .on('broadcast', { event: 'reaction' }, (eventData) => {
        const payload = eventData.payload || eventData;
        if (!payload) return;
        setMessages(prev => prev.map(m => {
          if (m.id !== payload.message_id) return m;
          let newReactions = [...m.reactions];
          const rIndex = newReactions.findIndex(r => r.emoji === payload.emoji);
          
          if (payload.is_adding) {
            if (rIndex > -1) newReactions[rIndex].count += 1;
            else newReactions.push({ emoji: payload.emoji, count: 1 });
          } else {
            if (rIndex > -1) {
              newReactions[rIndex].count -= 1;
              if (newReactions[rIndex].count <= 0) newReactions.splice(rIndex, 1);
            }
          }
          return { ...m, reactions: newReactions };
        }));
      })
      .subscribe();

    channelRef.current = channel;
    return () => { if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; } };
  }, [conversationId, currentUserId, supabase, formatMessage]);

  const sendMessage = useCallback(async (content: string, replyTo?: { id: string; content: string; senderName: string }): Promise<boolean> => {
    if (!conversationId || !currentUserId || !content.trim()) return false;
    
    // Generate UUID locally so we don't have duplicate keys when Realtime fires
    const messageId = crypto.randomUUID();
    const nowISO = new Date().toISOString();
    
    // OPTIMISTIC UPDATE: Instantly show message like WhatsApp
    const newMsg: MessageItem = {
      id: messageId,
      sender_id: currentUserId,
      content: content.trim(),
      type: 'text',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSent: true,
      senderName: 'Me',
      reactions: [],
      read: false,
      rawTime: nowISO,
      replyTo: replyTo ?? null,
    };
    
    setMessages(prev => [...prev, newMsg]);

    const { error } = await supabase.from('messages').insert({
      id: messageId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content.trim(),
      type: 'text',
      created_at: nowISO,
      reply_to_id: replyTo?.id ?? null,
      reply_to_content: replyTo?.content ?? null,
      reply_to_sender: replyTo?.senderName ?? null,
    });
    
    // Broadcast the full message instantly to the receiver!
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast', event: 'new_message',
        payload: { message: newMsg }
      });
    }
    
    if (error) {
      console.error("Failed to send:", error);
      // Revert if failed
      setMessages(prev => prev.filter(m => m.id !== messageId));
      return false;
    }

    return true;
  }, [conversationId, currentUserId, supabase]);

  const sendTyping = useCallback((displayName: string) => {
    channelRef.current?.send({
      type: 'broadcast', event: 'typing',
      payload: { user_id: currentUserId, display_name: displayName, conversation_id: conversationId }
    });
  }, [currentUserId, conversationId]);

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!currentUserId || !conversationId) return;

    const { data: existing } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', currentUserId)
      .eq('emoji', emoji)
      .single();

    const isAdding = !existing;

    // Optimistic UI update
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      let newReactions = [...m.reactions];
      const rIndex = newReactions.findIndex(r => r.emoji === emoji);
      
      if (isAdding) {
        if (rIndex > -1) newReactions[rIndex].count += 1;
        else newReactions.push({ emoji, count: 1 });
      } else {
        if (rIndex > -1) {
          newReactions[rIndex].count -= 1;
          if (newReactions[rIndex].count <= 0) newReactions.splice(rIndex, 1);
        }
      }
      return { ...m, reactions: newReactions };
    }));

    // Broadcast
    channelRef.current?.send({
      type: 'broadcast', event: 'reaction',
      payload: { message_id: messageId, emoji, is_adding: isAdding }
    });

    // Database
    if (existing) {
      await supabase.from('message_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('message_reactions').insert({ message_id: messageId, user_id: currentUserId, emoji });
    }
  }, [currentUserId, conversationId, supabase]);

  return { messages, sendMessage, sendTyping, otherUserTyping, toggleReaction };
}
