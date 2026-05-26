-- ============================================================
-- contacts table
-- ============================================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contacts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'accepted'
                CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, contact_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS contacts_owner_id_idx  ON public.contacts (owner_id);
CREATE INDEX IF NOT EXISTS contacts_contact_id_idx ON public.contacts (contact_id);

-- Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Users can only read their own contacts
CREATE POLICY "contacts_select_own"
  ON public.contacts FOR SELECT
  USING (auth.uid() = owner_id);

-- Users can add contacts
CREATE POLICY "contacts_insert_own"
  ON public.contacts FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Users can delete their own contacts
CREATE POLICY "contacts_delete_own"
  ON public.contacts FOR DELETE
  USING (auth.uid() = owner_id);

-- Users can update their own contacts (e.g. block)
CREATE POLICY "contacts_update_own"
  ON public.contacts FOR UPDATE
  USING (auth.uid() = owner_id);
