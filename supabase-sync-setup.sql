-- Step 1: Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Create Scheduled Job (Delete messages > 90 days)
SELECT cron.schedule(
  'delete-old-messages',
  '0 3 * * *', -- Every day at 3am UTC
  $$
  DELETE FROM messages WHERE created_at < NOW() - INTERVAL '90 days' AND deleted_at IS NULL;
  $$
);

-- Step 3: Add conversation columns
ALTER TABLE conversations
ADD COLUMN last_message_at TIMESTAMPTZ,
ADD COLUMN last_message_preview TEXT;

-- Step 4: Create Trigger for conversations updates
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
DECLARE
  preview_text TEXT;
BEGIN
  IF NEW.type = 'text' THEN
    preview_text := NEW.content;
  ELSIF NEW.type = 'voice' THEN
    preview_text := '🎤 Voice Note';
  ELSIF NEW.type = 'image' THEN
    preview_text := '📷 Image';
  ELSIF NEW.type = 'video' THEN
    preview_text := '🎥 Video';
  ELSE
    preview_text := '📎 File';
  END IF;

  UPDATE conversations
  SET last_message_at = NEW.created_at,
      last_message_preview = preview_text,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- Step 5: Sync State Table (Optional, for server side tracking if needed, but we use IndexedDB for local tracking)
CREATE TABLE IF NOT EXISTS sync_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  device_id TEXT,
  last_sync_at TIMESTAMPTZ DEFAULT NOW()
);
