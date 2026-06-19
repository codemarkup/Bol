'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getInitials, getColor, formatTime, formatSidebarTime } from '@/lib/supabase/chat';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { SyncEngine } from '@/lib/syncEngine';

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
  lastMessageIsFromMe?: boolean;
  isReadByOther?: boolean;
  isDeliveredByOther?: boolean;
};

let globalConversationsCache: any[] | undefined = undefined;

export function useConversations(currentUserId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  // Subscribe to IndexedDB
  const localConvs = useLiveQuery(
    async () => {
      if (!currentUserId) return [];
      const all = await db.conversations.toArray();
      
      const enriched = await Promise.all(all.map(async (conv) => {
        const lastMsgs = await db.messages.where('conversation_id').equals(conv.id).sortBy('created_at');
        if (lastMsgs && lastMsgs.length > 0) {
          const lastMsg = lastMsgs[lastMsgs.length - 1];
          
          let isRead = !!lastMsg.read_status;
          if (conv.other_last_read_at && !isRead) {
            isRead = new Date(conv.other_last_read_at).getTime() >= new Date(lastMsg.created_at).getTime();
          }

          let isDelivered = !!lastMsg.delivery_status;
          if (conv.other_last_delivered_at && !isDelivered) {
            isDelivered = new Date(conv.other_last_delivered_at).getTime() >= new Date(lastMsg.created_at).getTime();
          }

          let preview = '';
          if (lastMsg.deleted_at) {
            preview = '🚫 This message was deleted';
          } else if (lastMsg.type === 'system') {
            preview = lastMsg.content || 'System update';
          } else if (lastMsg.type === 'voice' || lastMsg.type === 'audio') {
            preview = '🎙️ Voice message';
          } else if (lastMsg.type === 'image') {
            preview = '📷 Image';
          } else if (lastMsg.type === 'video') {
            preview = '🎥 Video';
          } else {
            preview = lastMsg.content || (lastMsg.media_url ? 'Media' : 'Start chatting!');
          }

          return {
            ...conv,
            last_message_at: lastMsg.created_at,
            last_message_preview: preview,
            last_message_sender_id: lastMsg.sender_id,
            isReadByOther: isRead,
            isDeliveredByOther: isDelivered
          };
        }
        return conv;
      }));

      const sorted = enriched.sort((a, b) => {
        const timeA = new Date(a.last_message_at || a.updated_at || a.created_at || 0).getTime();
        const timeB = new Date(b.last_message_at || b.updated_at || b.created_at || 0).getTime();
        return timeB - timeA;
      });
      globalConversationsCache = sorted;
      return sorted;
    },
    [currentUserId]
  );

  const activeConvs = localConvs || globalConversationsCache || [];
  const [networkLoaded, setNetworkLoaded] = useState(false);
  const isLoaded = activeConvs.length > 0 || networkLoaded;

  const conversations: ConversationItem[] = activeConvs.map(conv => {
    const name = !conv.is_group ? (conv.other_user_name || 'Unknown') : (conv.name || 'Group');
    return {
      id: conv.id,
      name,
      initials: getInitials(name),
      color: conv.is_group ? 'bg-[#8B5CF6] text-white' : getColor(name),
      message: conv.last_message_preview || 'Start chatting!',
      time: conv.last_message_at ? formatSidebarTime(conv.last_message_at) : '',
      unread: conv.unread_count || 0,
      online: conv.other_user_id ? onlineIds.has(conv.other_user_id) : false,
      isGroup: conv.is_group,
      otherUserId: conv.other_user_id,
      avatarUrl: !conv.is_group ? conv.other_user_avatar : conv.avatar_url,
      lastMessageIsFromMe: conv.last_message_sender_id === currentUserId,
      isReadByOther: (conv as any).isReadByOther,
      isDeliveredByOther: (conv as any).isDeliveredByOther,
    };
  });

  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return;
    try {
      await SyncEngine.seedFromSupabase(currentUserId);
      await SyncEngine.syncConversations(currentUserId);
      
      // Force refresh of all contact profiles to ensure avatars are up-to-date
      const localConvs = await db.conversations.toArray();
      const contactIds = Array.from(new Set(localConvs.filter(c => !c.is_group && c.other_user_id).map(c => c.other_user_id as string)));
      if (contactIds.length > 0) {
        await SyncEngine.getProfileMap(contactIds);
        // Sync any updated avatars back to conversations
        for (const c of localConvs) {
          if (!c.is_group && c.other_user_id) {
            const prof = await db.profiles.get(c.other_user_id);
            if (prof && prof.avatar_url !== c.other_user_avatar) {
              await db.conversations.update(c.id, { other_user_avatar: prof.avatar_url, other_user_name: prof.full_name });
            }
          }
        }
      }
      
      SyncEngine.startBackgroundWorkers(currentUserId);
      setNetworkLoaded(true);
    } catch (e) {
      console.error(e);
      setNetworkLoaded(true); // fall back to local
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchConversations();
    // Prune old messages on mount
    SyncEngine.pruneOldMessages().catch(console.error);

    if (!currentUserId) return;
    
    let channel: any = null;
    let pingChannel: any = null;

    const setupChannel = () => {
      if (channel) supabase.removeChannel(channel);
      if (pingChannel) supabase.removeChannel(pingChannel);
      channel = supabase
        .channel('global-chat-list')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
          fetchConversations();
          // Mark delivered immediately for any new message that arrived while app is open
          try {
            await supabase.rpc('mark_messages_delivered', { p_user_id: currentUserId });
            if (payload.new && payload.new.sender_id && payload.new.sender_id !== currentUserId) {
              const pingCh = supabase.channel(`call:${payload.new.sender_id}`, { config: { broadcast: { ack: true } } });
              pingCh.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                  pingCh.send({ type: 'broadcast', event: 'check_status', payload: {} });
                  setTimeout(() => supabase.removeChannel(pingCh), 1000);
                }
              });
            }
          } catch (err) {
            console.error(err);
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, fetchConversations)
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, fetchConversations)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, async (payload) => {
          const profile = payload.new;
          if (profile && profile.id) {
            await db.profiles.put({ ...profile, updated_at: new Date().toISOString() } as any);
            const convsToUpdate = await db.conversations.filter(c => c.other_user_id === profile.id).toArray();
            if (convsToUpdate.length > 0) {
              for (const c of convsToUpdate) {
                await db.conversations.update(c.id, {
                  other_user_name: profile.full_name,
                  other_user_avatar: profile.avatar_url
                });
              }
            }
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversation_members' }, (payload) => {
          if (payload.new && payload.new.user_id !== currentUserId) {
            db.conversations.update(payload.new.conversation_id, {
              other_last_read_at: payload.new.last_read_at
            });
          }
        })
        .subscribe();

      // Listen to personal ping channel for check_status
      pingChannel = supabase.channel(`call:${currentUserId}`)
        .on('broadcast', { event: 'check_status' }, () => {
          fetchConversations();
        })
        .subscribe();
    };

    let timeoutId = setTimeout(() => {
      setupChannel();
      // Mark all pending messages as delivered since app is online
      supabase.rpc('mark_messages_delivered', { p_user_id: currentUserId }).then(() => {
        db.conversations.toArray().then(convs => {
          convs.forEach(c => {
            if (c.other_user_id) {
              const pingCh = supabase.channel(`call:${c.other_user_id}`, { config: { broadcast: { ack: true } } });
              pingCh.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                  pingCh.send({ type: 'broadcast', event: 'check_status', payload: {} });
                  setTimeout(() => supabase.removeChannel(pingCh), 1000);
                }
              });
            }
          });
        });
      });
    }, 250);

    // Backfill read receipts
    supabase.from('conversation_members')
      .select('conversation_id, last_read_at')
      .neq('user_id', currentUserId)
      .then(({ data }) => {
        if (data) {
          data.forEach(m => {
            if (m.last_read_at) {
              db.conversations.update(m.conversation_id, { other_last_read_at: m.last_read_at });
            }
          });
        }
      });

    return () => { 
      clearTimeout(timeoutId);
      if (channel) supabase.removeChannel(channel); 
      if (pingChannel) supabase.removeChannel(pingChannel); 
    };
  }, [fetchConversations, currentUserId, supabase]);

  const markAsRead = useCallback((id: string) => {
    db.conversations.update(id, { unread_count: 0 });
  }, []);

  const updateOnlineStatus = useCallback((ids: Set<string>) => {
    setOnlineIds(ids);
  }, []);

  return { conversations, isLoaded, refresh: fetchConversations, updateOnlineStatus, markAsRead };
}
