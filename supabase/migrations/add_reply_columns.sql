-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS reply_to_id     uuid        REFERENCES messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reply_to_content text,
  ADD COLUMN IF NOT EXISTS reply_to_sender  text;
