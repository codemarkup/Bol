-- Supabase Call Logs Setup
CREATE TYPE call_status AS ENUM ('initiated', 'ringing', 'ongoing', 'ended', 'missed', 'rejected', 'failed');
CREATE TYPE call_type AS ENUM ('voice', 'video');

CREATE TABLE IF NOT EXISTS public.call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    caller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type call_type NOT NULL,
    status call_status NOT NULL DEFAULT 'initiated',
    agora_channel VARCHAR NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answered_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    CONSTRAINT call_status_transition CHECK (
      -- Basic sanity checks on timestamps
      (answered_at IS NULL OR answered_at >= started_at) AND
      (ended_at IS NULL OR ended_at >= started_at) AND
      (ended_at IS NULL OR answered_at IS NULL OR ended_at >= answered_at)
    )
);

-- Ensure we don't accidentally revert to earlier states
-- (Note: A true strict state machine in Postgres requires triggers, but for this setup we rely on the application code to not update `status` backwards. We will use a fast trigger if strict enforcement is needed, but the application code design will ensure single-writers)

-- Indexes for fast call history queries
CREATE INDEX IF NOT EXISTS call_logs_caller_id_idx ON public.call_logs(caller_id);
CREATE INDEX IF NOT EXISTS call_logs_receiver_id_idx ON public.call_logs(receiver_id);
CREATE INDEX IF NOT EXISTS call_logs_conversation_id_idx ON public.call_logs(conversation_id);

-- Enable RLS
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own calls" 
ON public.call_logs FOR INSERT 
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can read calls they are part of" 
ON public.call_logs FOR SELECT 
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can update calls they are part of" 
ON public.call_logs FOR UPDATE 
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE call_logs;
