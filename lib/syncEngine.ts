import { db, LocalMessage, LocalConversation, LocalProfile, SyncState } from './db';
import md5 from 'md5';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export class SyncEngine {
  
  static async syncProfile(userId: string): Promise<LocalProfile | null> {
    const cached = await db.profiles.get(userId);
    const now = Date.now();
    // Re-fetch if older than 1 minute (60000ms) instead of 1 hour
    if (cached && (now - new Date(cached.updated_at).getTime() < 60000)) {
      return cached;
    }
    
    const { data } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', userId).single();
    if (data) {
      const profile: LocalProfile = { ...data, updated_at: new Date().toISOString() };
      await db.profiles.put(profile);
      return profile;
    }
    return null;
  }

  static async getProfileMap(userIds: string[]): Promise<Record<string, string>> {
    const map: Record<string, string> = {};
    const uncachedIds: string[] = [];
    
    for (const id of userIds) {
      const cached = await db.profiles.get(id);
      // Re-fetch if older than 1 minute (60000ms)
      if (cached && (Date.now() - new Date(cached.updated_at).getTime() < 60000)) {
        map[id] = cached.full_name;
      } else {
        uncachedIds.push(id);
      }
    }
    
    if (uncachedIds.length > 0) {
      const { data } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', uncachedIds);
      if (data) {
        for (const p of data) {
          map[p.id] = p.full_name;
          await db.profiles.put({ ...p, updated_at: new Date().toISOString() });
        }
      }
    }
    return map;
  }

  static async syncConversations(currentUserId: string) {
    const syncState = await db.syncState.get('conversations');
    const lastSyncAt = syncState?.last_sync_at || new Date(0).toISOString();

    const { data: userMembers } = await supabase
      .from('conversation_members')
      .select('conversation_id, last_read_at')
      .eq('user_id', currentUserId);

    if (!userMembers || userMembers.length === 0) return;
    
    const convIds = userMembers.map(m => m.conversation_id);
    
    // Fetch only conversations updated since last sync (or all if first sync to handle null updated_at)
    let query = supabase
      .from('conversations')
      .select('id, name, type, avatar_url, created_at, updated_at, last_message_at, last_message_preview')
      .in('id', convIds);
      
    if (lastSyncAt !== '1970-01-01T00:00:00.000Z') {
      query = query.gt('updated_at', lastSyncAt);
    }
    
    const { data: rawConvs } = await query;

    if (rawConvs && rawConvs.length > 0) {
      const localConvs: LocalConversation[] = [];
      for (const conv of rawConvs) {
        let otherUserId, otherUserName, otherUserAvatar, otherLastReadAt;
        
        const isGroup = conv.type === 'group';

        if (!isGroup) {
          const { data: otherMembers } = await supabase
            .from('conversation_members')
            .select('user_id, last_read_at')
            .eq('conversation_id', conv.id)
            .neq('user_id', currentUserId)
            .limit(1);
            
          if (otherMembers && otherMembers.length > 0) {
            otherUserId = otherMembers[0].user_id;
            otherLastReadAt = otherMembers[0].last_read_at;
            const profile = await this.syncProfile(otherUserId);
            if (profile) {
              otherUserName = profile.full_name;
              otherUserAvatar = profile.avatar_url;
            }
          }
        }
        
        const memberData = userMembers.find(m => m.conversation_id === conv.id);
        const lastRead = memberData?.last_read_at ? new Date(memberData.last_read_at).toISOString() : new Date(0).toISOString();
        
        // Calculate unread from Supabase for fresh ones
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', currentUserId)
          .gt('created_at', lastRead);

        // Fetch the absolute latest message to guarantee our local cache can render the sidebar preview correctly
        const { data: latestMsgData } = await supabase
          .from('messages')
          .select('id, conversation_id, sender_id, content, type, created_at, reply_to_id, reply_to_content, reply_to_sender, media_url, duration_seconds, waveform_data, transcript, transcript_status, message_reactions(emoji, user_id), deleted_for, deleted_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestMsgData) {
          const profileMap = await this.getProfileMap([latestMsgData.sender_id]);
          const existing = await db.messages.get(latestMsgData.id);
          await db.messages.put({
            ...latestMsgData,
            sender_name: profileMap[latestMsgData.sender_id] || 'Unknown',
            delivery_status: existing?.delivery_status,
            read_status: existing?.read_status
          } as LocalMessage);
        }

        localConvs.push({
          ...conv,
          is_group: isGroup,
          last_message_at: conv.last_message_at || conv.updated_at || conv.created_at,
          other_user_id: otherUserId,
          other_user_name: otherUserName,
          other_user_avatar: otherUserAvatar,
          other_last_read_at: otherLastReadAt,
          unread_count: count || 0
        });
      }
      
      await db.conversations.bulkPut(localConvs);
    }
    
    await db.syncState.put({ id: 'conversations', last_sync_at: new Date().toISOString() });
  }

  static async syncMessages(conversationId: string, currentUserId: string) {
    const syncState = await db.syncState.get(`messages:${conversationId}`);
    
    // Determine last sync time
    let lastSyncAt = syncState?.last_sync_at;
    
    if (!lastSyncAt) {
      // Check if IDB has any messages for this conversation
      const lastMsg = await db.messages.where('conversation_id').equals(conversationId).reverse().sortBy('created_at');
      if (lastMsg && lastMsg.length > 0) {
        lastSyncAt = lastMsg[0].created_at;
      } else {
        lastSyncAt = new Date(0).toISOString();
      }
    }

    const { data: newMessages } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, type, created_at, reply_to_id, reply_to_content, reply_to_sender, media_url, duration_seconds, waveform_data, transcript, transcript_status, message_reactions(emoji, user_id), deleted_for, deleted_at')
      .eq('conversation_id', conversationId)
      .gt('created_at', lastSyncAt)
      .order('created_at', { ascending: true });

    if (newMessages && newMessages.length > 0) {
      const senderIds = Array.from(new Set(newMessages.map(m => m.sender_id)));
      const profileMap = await this.getProfileMap(senderIds);

      const localMessages: LocalMessage[] = [];
      const existingMsgs = await db.messages.where('id').anyOf(newMessages.map(m => m.id)).toArray();
      const existingMap = new Map(existingMsgs.map(m => [m.id, m]));

      for (const m of newMessages) {
        const existing = existingMap.get(m.id);
        localMessages.push({
          ...m,
          sender_name: profileMap[m.sender_id] || 'Unknown',
          delivery_status: existing?.delivery_status,
          read_status: existing?.read_status
        });
      }

      await db.messages.bulkPut(localMessages);
      
      // Update last sync time to the newest message created_at
      const newestDate = newMessages[newMessages.length - 1].created_at;
      await db.syncState.put({ id: `messages:${conversationId}`, last_sync_at: newestDate });
      
      // Force conversation update so sidebar UI live query re-runs
      await db.conversations.update(conversationId, { updated_at: newestDate });
    }
    
    // Fetch updates for deleted messages
    const { data: deletedUpdates } = await supabase
       .from('messages')
       .select('id, deleted_for, content, media_url, type')
       .eq('conversation_id', conversationId)
       .gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Look back 7 days for deletions/updates
       
    if (deletedUpdates) {
       for (const update of deletedUpdates) {
          if (update.deleted_for?.includes(currentUserId) || (update.content === '' && !update.media_url && update.type === 'text')) {
             const existing = await db.messages.get(update.id);
             if (existing) {
                 if (update.deleted_for?.includes(currentUserId)) {
                     await db.messages.delete(update.id);
                 } else {
                     await db.messages.put({ ...existing, content: '', media_url: null, deleted_at: new Date().toISOString() });
                 }
             }
          }
       }
    }
  }

  static async seedFromSupabase(currentUserId: string) {
    const state = await db.syncState.get('global_seed');
    if (state) return; // Already seeded

    await this.syncConversations(currentUserId);
    const convs = await db.conversations.toArray();
    
    for (const conv of convs) {
      const { data: msgs } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, type, created_at, reply_to_id, reply_to_content, reply_to_sender, media_url, duration_seconds, waveform_data, transcript, transcript_status, message_reactions(emoji, user_id), deleted_for, deleted_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (msgs && msgs.length > 0) {
        const senderIds = Array.from(new Set(msgs.map(m => m.sender_id)));
        const profileMap = await this.getProfileMap(senderIds);

        const localMsgs: LocalMessage[] = msgs.map(m => ({
          ...m,
          sender_name: profileMap[m.sender_id] || 'Unknown',
        }));
        
        await db.messages.bulkPut(localMsgs);
        await db.syncState.put({ id: `messages:${conv.id}`, last_sync_at: msgs[0].created_at });
      }
    }
    
    await db.syncState.put({ id: 'global_seed', last_sync_at: new Date().toISOString() });
  }

  static async pruneOldMessages() {
    const syncState = await db.syncState.get('last_prune');
    const now = Date.now();
    
    // Only run once a day
    if (syncState && (now - new Date(syncState.last_sync_at).getTime() < 86400000)) {
      return;
    }
    
    const cutoffDate = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString();
    
    await db.messages.where('created_at').below(cutoffDate).delete();
    
    await db.syncState.put({ id: 'last_prune', last_sync_at: new Date().toISOString() });
  }

  static async validateStateHash(conversationId: string, currentUserId: string) {
    const syncState = await db.syncState.get(`messages:${conversationId}`);
    const now = Date.now();
    
    // Only check hash once per hour to avoid spam
    if (syncState?.last_hash_check_at && (now - new Date(syncState.last_hash_check_at).getTime() < 3600000)) {
      return;
    }

    // Get last 20 messages locally
    const localMsgs = await db.messages
      .where('conversation_id')
      .equals(conversationId)
      .reverse()
      .sortBy('created_at');
      
    // We reverse the result of sortBy to get descending order like the SQL function
    const newest20 = localMsgs.slice().reverse().slice(0, 20);
    const localIds = newest20.map(m => m.id).join(',');
    const localHash = localIds ? md5(localIds) : '';

    const { data: serverHash, error } = await supabase.rpc('get_conversation_hash', { p_conversation_id: conversationId });
    
    if (!error && serverHash !== localHash) {
      console.warn(`Hash mismatch for ${conversationId}. Resyncing...`);
      // Delete all local messages for this conversation to force clean fetch
      await db.messages.where('conversation_id').equals(conversationId).delete();
      await db.syncState.update(`messages:${conversationId}`, { last_sync_at: new Date(0).toISOString() });
      await this.syncMessages(conversationId, currentUserId);
    }
    
    // Update check timestamp
    if (syncState) {
      await db.syncState.update(`messages:${conversationId}`, { last_hash_check_at: new Date().toISOString(), last_known_hash: localHash });
    }
  }

  static async runBackfill(currentUserId: string) {
    console.log("Running background backfill...");
    const conversations = await db.conversations.toArray();
    for (const conv of conversations) {
      await this.syncMessages(conv.id, currentUserId);
    }
  }

  static workersStarted = false;

  static startBackgroundWorkers(currentUserId: string) {
    if (this.workersStarted) return;
    this.workersStarted = true;

    // 45-second backfill poller
    setInterval(() => {
      if (!document.hidden) {
        this.runBackfill(currentUserId).catch(console.error);
      }
    }, 45000);

    // Hourly hash validation
    setInterval(async () => {
      const conversations = await db.conversations.toArray();
      for (const conv of conversations) {
        await this.validateStateHash(conv.id, currentUserId).catch(console.error);
      }
    }, 3600000);
  }
}
