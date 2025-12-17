-- Realtime table for Human Handoff chat messages (Zoho agent -> website user)
-- Run this in Supabase SQL Editor (same project as your DATABASE_URL).

create table if not exists public.handoff_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  ticket_id text,
  author_type text not null check (author_type in ('agent', 'system')),
  content text not null,
  raw_payload jsonb,
  created_at timestamp with time zone not null default now()
);

create index if not exists handoff_messages_session_id_created_at_idx
  on public.handoff_messages (session_id, created_at desc);

-- Enable Realtime for this table (required for postgres_changes subscriptions)
alter publication supabase_realtime add table public.handoff_messages;


