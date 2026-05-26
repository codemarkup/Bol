-- ============================================================
-- Advanced Group Features Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add group settings columns to conversations table
alter table public.conversations
  add column if not exists is_announcement_only boolean default false,
  add column if not exists require_join_approval boolean default false,
  add column if not exists is_locked boolean default false,
  add column if not exists group_rules text,
  add column if not exists invite_link_expires_at timestamp with time zone,
  add column if not exists muted_until timestamp with time zone;

-- Group join requests table (for approval mode)
create table if not exists public.group_join_requests (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamp with time zone default timezone('utc', now()),
  reviewed_by uuid references auth.users on delete set null,
  reviewed_at timestamp with time zone,
  unique(conversation_id, user_id)
);
alter table public.group_join_requests enable row level security;

create policy "Admins can view join requests" on group_join_requests
  for select using (
    exists (
      select 1 from conversation_members
      where conversation_id = group_join_requests.conversation_id
      and user_id = auth.uid()
      and role in ('admin', 'moderator')
    )
  );

create policy "Users can request to join" on group_join_requests
  for insert with check (auth.uid() = user_id);

create policy "Admins can update join requests" on group_join_requests
  for update using (
    exists (
      select 1 from conversation_members
      where conversation_id = group_join_requests.conversation_id
      and user_id = auth.uid()
      and role in ('admin', 'moderator')
    )
  );

-- Muted members table
create table if not exists public.muted_members (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  muted_by uuid references auth.users on delete set null not null,
  muted_until timestamp with time zone,
  reason text,
  created_at timestamp with time zone default timezone('utc', now()),
  unique(conversation_id, user_id)
);
alter table public.muted_members enable row level security;

create policy "Members can view mutes" on muted_members
  for select using (
    exists (
      select 1 from conversation_members
      where conversation_id = muted_members.conversation_id
      and user_id = auth.uid()
    )
  );

create policy "Admins can mute members" on muted_members
  for insert with check (
    exists (
      select 1 from conversation_members
      where conversation_id = muted_members.conversation_id
      and user_id = auth.uid()
      and role in ('admin', 'moderator')
    )
  );

create policy "Admins can unmute members" on muted_members
  for delete using (
    exists (
      select 1 from conversation_members
      where conversation_id = muted_members.conversation_id
      and user_id = auth.uid()
      and role in ('admin', 'moderator')
    )
  );

-- Pinned messages table
create table if not exists public.pinned_messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  message_id uuid references public.messages on delete cascade not null,
  pinned_by uuid references auth.users on delete set null not null,
  pinned_at timestamp with time zone default timezone('utc', now()),
  unique(conversation_id, message_id)
);
alter table public.pinned_messages enable row level security;

create policy "Members can view pinned messages" on pinned_messages
  for select using (
    exists (
      select 1 from conversation_members
      where conversation_id = pinned_messages.conversation_id
      and user_id = auth.uid()
    )
  );

create policy "Admins can pin messages" on pinned_messages
  for insert with check (
    exists (
      select 1 from conversation_members
      where conversation_id = pinned_messages.conversation_id
      and user_id = auth.uid()
      and role in ('admin', 'moderator')
    )
  );

create policy "Admins can unpin messages" on pinned_messages
  for delete using (
    exists (
      select 1 from conversation_members
      where conversation_id = pinned_messages.conversation_id
      and user_id = auth.uid()
      and role in ('admin', 'moderator')
    )
  );
