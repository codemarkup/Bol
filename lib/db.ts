import Dexie, { Table } from 'dexie';

export interface LocalMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: string;
  created_at: string;
  reply_to_id?: string | null;
  reply_to_content?: string | null;
  reply_to_sender?: string | null;
  media_url?: string | null;
  duration_seconds?: number | null;
  waveform_data?: number[] | null;
  transcript?: string | null;
  transcript_status?: string | null;
  message_reactions?: any[];
  deleted_for?: string[];
  deleted_at?: string | null;
  
  // Joined fields
  sender_name?: string;
  sender_avatar?: string | null;
  temp_id?: string; // used for optimistic updates
  client_operation_id?: string; // used for idempotency
  status?: 'pending' | 'sent'; // base status
  delivery_status?: boolean; // cached receipt status
  read_status?: boolean; // cached receipt status
}

export interface LocalConversation {
  id: string;
  name: string | null;
  is_group: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  last_message_at?: string | null;
  last_message_preview?: string | null;
  last_message_sender_id?: string | null;
  
  // Joined fields for 1on1
  other_user_id?: string;
  other_user_name?: string;
  other_user_avatar?: string | null;
  other_last_read_at?: string | null;
  other_last_delivered_at?: string | null;
  
  // Local states
  unread_count: number;
}

export interface LocalProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  updated_at: string;
}

export interface SyncState {
  id: string; // 'conversations', 'messages:conv_id', 'global'
  last_sync_at: string;
  last_backfill_at?: string;
  last_hash_check_at?: string;
  last_known_hash?: string;
}

export class BolDatabase extends Dexie {
  messages!: Table<LocalMessage, string>;
  conversations!: Table<LocalConversation, string>;
  profiles!: Table<LocalProfile, string>;
  syncState!: Table<SyncState, string>;

  constructor() {
    super('BolDatabase');
    this.version(1).stores({
      messages: 'id, conversation_id, created_at, temp_id',
      conversations: 'id, updated_at, last_message_at',
      profiles: 'id',
      syncState: 'id'
    });
    this.version(2).stores({
      messages: 'id, conversation_id, created_at, temp_id, client_operation_id',
      conversations: 'id, updated_at, last_message_at',
      profiles: 'id',
      syncState: 'id'
    });
  }
}

export const db = new BolDatabase();

export async function clearAllCachedData() {
  await db.delete();
  await db.open();
}
