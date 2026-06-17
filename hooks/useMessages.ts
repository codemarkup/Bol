'use client';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { aggregateReactions, formatTime } from '@/lib/supabase/chat';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, LocalMessage } from '@/lib/db';
import { SyncEngine } from '@/lib/syncEngine';

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
  media_url?: string;
  duration_seconds?: number;
  waveform_data?: number[];
  transcript?: string;
  transcript_status?: string;
  isDeleted?: boolean;
  status?: 'pending' | 'sent' | 'delivered' | 'read';
};

export function useMessages(conversationId: string | null, currentUserId: string | null) {
  const channelRef = useRef<any>(null);
  const supabase = useMemo(() => createClient(), []);


  const localMessages = useLiveQuery(
    () => {
      if (!conversationId) return [];
      return db.messages
        .where('conversation_id')
        .equals(conversationId)
        .sortBy('created_at');
    },
    [conversationId],
    []
  );

  const messages: MessageItem[] = (localMessages || [])
    .filter(m => !m.deleted_for?.includes(currentUserId || ''))
    .map(raw => {
      return {
        id: raw.id,
        sender_id: raw.sender_id,
        content: raw.content || '',
        type: raw.type || 'text',
        time: formatTime(raw.created_at),
        isSent: raw.sender_id === currentUserId,
        senderName: raw.sender_name || 'Unknown',
        reactions: aggregateReactions(raw.message_reactions || []),
        read: raw.read_status || false,
        rawTime: raw.created_at,
        replyTo: raw.reply_to_id ? {
          id: raw.reply_to_id,
          content: raw.reply_to_content || '',
          senderName: raw.reply_to_sender || 'Unknown'
        } : null,
        media_url: raw.media_url || undefined,
        duration_seconds: raw.duration_seconds || undefined,
        waveform_data: raw.waveform_data || undefined,
        transcript: raw.transcript || undefined,
        transcript_status: raw.transcript_status || undefined,
        isDeleted: raw.deleted_at !== null || raw.content === '' && !raw.media_url && raw.type === 'text',
        status: raw.read_status ? 'read' : 
                raw.delivery_status ? 'delivered' : 
                (raw.status === 'pending' ? 'pending' : 'sent')
      };
    });

  const fetchReceiptStatus = useCallback(async () => {
    if (!conversationId || !currentUserId) return;
    
    // We only need to check messages we sent
    const msgs = await db.messages.where('conversation_id').equals(conversationId).toArray();
    const myMsgIds = msgs.filter(m => m.sender_id === currentUserId).map(m => m.id);
    if (myMsgIds.length === 0) return;

    const { data: deliveredData } = await supabase
      .from('message_delivery_receipts')
      .select('message_id')
      .in('message_id', myMsgIds)
      .neq('user_id', currentUserId);

    const { data: readData } = await supabase
      .from('message_read_receipts')
      .select('message_id')
      .in('message_id', myMsgIds)
      .neq('user_id', currentUserId);

    const deliveredIds = new Set(deliveredData?.map(d => d.message_id) || []);
    const readIds = new Set(readData?.map(d => d.message_id) || []);

    // RE-FETCH msgs inside a transaction to prevent race conditions with syncEngine
    await db.transaction('rw', db.messages, async () => {
      const currentMsgs = await db.messages.where('conversation_id').equals(conversationId).toArray();
      const updates = [];
      for (const m of currentMsgs) {
        if (m.sender_id === currentUserId) {
          const isDelivered = deliveredIds.has(m.id) || !!m.delivery_status;
          const isRead = readIds.has(m.id) || !!m.read_status;
          if (m.delivery_status !== isDelivered || m.read_status !== isRead) {
            updates.push({ ...m, delivery_status: isDelivered, read_status: isRead });
          }
        }
      }
      if (updates.length > 0) {
        await db.messages.bulkPut(updates);
      }
    });
  }, [conversationId, currentUserId, supabase]);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    // Fetch initial receipt statuses
    fetchReceiptStatus();

    // Mark all as read when opening chat
    supabase.rpc('mark_messages_read', { p_user_id: currentUserId, p_conversation_id: conversationId }).then(() => {
      // Broadcast check_status to the OTHER user
      db.conversations.get(conversationId).then(conv => {
        if (conv?.other_user_id) {
          const pingCh = supabase.channel(`call:${conv.other_user_id}`, { config: { broadcast: { ack: true } } });
          pingCh.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              pingCh.send({ type: 'broadcast', event: 'check_status', payload: {} }).catch(() => {});
              setTimeout(() => supabase.removeChannel(pingCh), 1000);
            }
          });
        }
      });
    });

    // 10 second interval for fetching receipts as safety net
    const intervalId = setInterval(fetchReceiptStatus, 10000);

    // Listen to personal channel for instant ping updates while chat is open
    const pingChannel = supabase.channel(`call:${currentUserId}`)
      .on('broadcast', { event: 'check_status' }, () => {
        fetchReceiptStatus();
      })
      .subscribe();

    // Trigger sync engine in background
    SyncEngine.syncMessages(conversationId, currentUserId).catch(console.error);
    
    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(pingChannel);
    };
  }, [conversationId, currentUserId, supabase, fetchReceiptStatus]);

  const [otherUserTyping, setOtherUserTyping] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Realtime subscription for new messages + typing + read receipts (Adaptive + Signal-Pull)
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const setupChannel = () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);

      const channel = supabase.channel(`messages:${conversationId}`)
        .on('broadcast', { event: 'new_message_signal' }, () => {
          // New message arrived while we have the chat open, mark as read and tell sender to check status
          supabase.rpc('mark_messages_read', { p_user_id: currentUserId, p_conversation_id: conversationId }).then(() => {
            db.conversations.get(conversationId).then(conv => {
              if (conv?.other_user_id) {
                const pingCh = supabase.channel(`call:${conv.other_user_id}`, { config: { broadcast: { ack: true } } });
                pingCh.subscribe((status) => {
                  if (status === 'SUBSCRIBED') {
                    pingCh.send({ type: 'broadcast', event: 'check_status', payload: {} }).catch(() => {});
                    setTimeout(() => supabase.removeChannel(pingCh), 1000);
                  }
                });
              }
            });
          });
          SyncEngine.syncMessages(conversationId, currentUserId).catch(console.error);
        })
        .on('broadcast', { event: 'typing' }, (eventData) => {
          const rawPayload = eventData.payload || eventData;
          const actualPayload = rawPayload.payload ? rawPayload.payload : rawPayload;
          
          if (actualPayload && actualPayload.user_id && actualPayload.user_id !== currentUserId) {
            setOtherUserTyping(actualPayload.display_name || 'Someone');
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setOtherUserTyping(null), 3000);
          }
        })
        .on('broadcast', { event: 'reaction' }, async (eventData) => {
          const payload = eventData.payload || eventData;
          if (!payload) return;
          
          const m = await db.messages.get(payload.message_id);
          if (m) {
            let newReactions = [...(m.message_reactions || [])];
            const rIndex = newReactions.findIndex(r => r.emoji === payload.emoji && r.user_id === payload.user_id);
            
            if (payload.is_adding && rIndex === -1) {
              newReactions.push({ emoji: payload.emoji, user_id: payload.user_id });
            } else if (!payload.is_adding && rIndex > -1) {
              newReactions.splice(rIndex, 1);
            }
            await db.messages.update(m.id, { message_reactions: newReactions });
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            channelRef.current = channel;
            // Trigger backfill immediately on successful connect/reconnect
            SyncEngine.syncMessages(conversationId, currentUserId).catch(console.error);
          } else if (status === 'CHANNEL_ERROR') {
            console.error("CHANNEL_ERROR: Reconnecting...");
            setTimeout(() => {
              if (!document.hidden) setupChannel();
            }, 3000);
          }
        });

      channelRef.current = channel;
    };

    let timeoutId = setTimeout(() => {
      setupChannel();
    }, 250);

    return () => { 
      clearTimeout(timeoutId);
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; } 
    };
  }, [conversationId, currentUserId, supabase]);

  const sendMessage = useCallback(async (content: string, replyTo?: { id: string; content: string; senderName: string }): Promise<boolean> => {
    if (!conversationId || !currentUserId || !content.trim()) return false;
    
    // Generate UUID locally so we don't have duplicate keys when Realtime fires
    const messageId = crypto.randomUUID();
    const clientOpId = crypto.randomUUID();
    const nowISO = new Date().toISOString();
    
    // OPTIMISTIC UPDATE: Instantly show message like WhatsApp
    const newMsg: LocalMessage = {
      id: messageId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content.trim(),
      type: 'text',
      created_at: nowISO,
      sender_name: 'Me', // Will be correct on UI side via isSent check
      reply_to_id: replyTo?.id ?? null,
      reply_to_content: replyTo?.content ?? null,
      reply_to_sender: replyTo?.senderName ?? null,
      message_reactions: [],
      client_operation_id: clientOpId,
      status: 'pending',
    };
    
    await db.messages.put(newMsg);
    await db.conversations.update(conversationId, { updated_at: nowISO });

    const { data, error } = await supabase.from('messages').insert({
      id: messageId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content.trim(),
      type: 'text',
      created_at: nowISO,
      reply_to_id: replyTo?.id ?? null,
      reply_to_content: replyTo?.content ?? null,
      reply_to_sender: replyTo?.senderName ?? null,
      client_operation_id: clientOpId,
    }).select('created_at').single();
    
    if (data?.created_at) {
      await db.messages.update(messageId, { created_at: data.created_at });
    }
    
    // Broadcast lightweight signal to trigger pull on receivers
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast', event: 'new_message_signal',
        payload: { conversation_id: conversationId, new_event: true, message_time: nowISO }
      });
    }
    
    if (error) {
      console.error("Failed to send:", error);
      // Revert if failed
      await db.messages.delete(messageId);
      return false;
    }

    // Mark as sent in local DB
    await db.messages.update(messageId, { status: 'sent' });

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
    const m = await db.messages.get(messageId);
    if (m) {
      let newReactions = [...(m.message_reactions || [])];
      const rIndex = newReactions.findIndex(r => r.emoji === emoji && r.user_id === currentUserId);
      
      if (isAdding && rIndex === -1) {
        newReactions.push({ emoji, user_id: currentUserId });
      } else if (!isAdding && rIndex > -1) {
        newReactions.splice(rIndex, 1);
      }
      await db.messages.update(messageId, { message_reactions: newReactions });
    }

    // Broadcast
    channelRef.current?.send({
      type: 'broadcast', event: 'reaction',
      payload: { message_id: messageId, emoji, is_adding: isAdding, user_id: currentUserId }
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
