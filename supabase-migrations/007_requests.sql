-- ==================================================================
-- Requests / Needs board  (Migration 007)
-- Run once in the Supabase SQL Editor.
--
-- A place for the family to post specific asks ("take Timmy to soccer
-- Saturday", "help with homework Tuesdays") that a supporter can claim.
-- SAFE / NON-BREAKING: new table only.
-- ==================================================================

create table if not exists public.requests (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null default '11111111-1111-1111-1111-111111111111',
  title         text not null,
  details       text,
  needed_date   date,                       -- optional
  claimed_by    text,                        -- helper's name, once claimed
  claimed_email text,
  claimed_at    timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.requests enable row level security;
create index if not exists requests_family_idx on public.requests (family_id);
