-- ============================================================
-- Group chat schema additions
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- Add group-specific columns to conversations table
alter table public.conversations
  add column if not exists description text,
  add column if not exists invite_link text unique default encode(gen_random_bytes(16), 'hex'),
  add column if not exists allow_anonymous_join boolean default false,
  add column if not exists max_members integer default 1000,
  add column if not exists member_count integer default 0;

-- Function to update member count automatically
create or replace function public.update_member_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.conversations
    set member_count = member_count + 1
    where id = new.conversation_id;
  elsif TG_OP = 'DELETE' then
    update public.conversations
    set member_count = member_count - 1
    where id = old.conversation_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_member_change
  after insert or delete on public.conversation_members
  for each row execute procedure public.update_member_count();

-- Policy for group admins to update conversation
create policy "Admins can update group info" on conversations
  for update using (
    exists (
      select 1 from conversation_members
      where conversation_id = conversations.id
      and user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Policy to allow members to add other members
create policy "Admins can add members" on conversation_members
  for insert with check (
    auth.uid() = user_id or
    exists (
      select 1 from conversation_members cm
      where cm.conversation_id = conversation_members.conversation_id
      and cm.user_id = auth.uid()
      and cm.role in ('admin', 'moderator')
    )
  );

-- Policy for admins to remove members
create policy "Admins can remove members" on conversation_members
  for delete using (
    auth.uid() = user_id or
    exists (
      select 1 from conversation_members cm
      where cm.conversation_id = conversation_members.conversation_id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
    )
  );

-- Policy to allow admins to update member roles
create policy "Admins can update member roles" on conversation_members
  for update using (
    exists (
      select 1 from conversation_members cm
      where cm.conversation_id = conversation_members.conversation_id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
    )
  );
