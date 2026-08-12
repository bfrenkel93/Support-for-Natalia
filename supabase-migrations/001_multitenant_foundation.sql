-- ==================================================================
-- Multi-tenant foundation  (Migration 001)
-- Run once in the Supabase SQL Editor (Dashboard -> SQL -> New query).
--
-- SAFE / NON-BREAKING: this only ADDS a `families` table and a `family_id`
-- column to each content table. Every existing row is assigned to Natalia
-- (family #1), and each family_id column DEFAULTS to Natalia — so the current
-- site and all existing sign-up code keep working exactly as before.
-- ==================================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------
-- FAMILIES: one row per family / page (the "tenant").
-- ------------------------------------------------------------------
create table if not exists public.families (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,                 -- URL: /<slug>
  display_name  text not null,                        -- "For Natalia & the Kids"
  honoring      text,                                 -- who they're honoring (e.g. "Joe")
  town          text,
  has_kids      boolean not null default false,
  is_public     boolean not null default false,       -- family chooses; private by default
  contact_email text not null default '',             -- the creator/owner
  edit_token    uuid not null default gen_random_uuid(),  -- secret "manage my page" link
  status        text not null default 'active',
  created_at    timestamptz not null default now()
);
alter table public.families enable row level security;

-- Natalia = family #1, with a FIXED id so it can be used as a column default.
insert into public.families (id, slug, display_name, honoring, town, has_kids, is_public, contact_email)
values (
  '11111111-1111-1111-1111-111111111111',
  'natalia',
  'For Natalia & the Kids',
  'Joe',
  'Newton, MA',
  true,
  false,
  'brookefrenkel@gmail.com'
)
on conflict (id) do nothing;

-- ------------------------------------------------------------------
-- Attach every content row to a family. Each column DEFAULTS to Natalia,
-- so existing insert code (which doesn't set family_id) keeps working.
-- ------------------------------------------------------------------
do $$
declare
  natalia constant uuid := '11111111-1111-1111-1111-111111111111';
  t text;
  content_tables text[] := array[
    'slots','settings','gifts','gift_pledges','memories','memory_media',
    'bookings','activity_ideas','subscribers','gathering_rsvps',
    'events','event_rsvps'
  ];
begin
  foreach t in array content_tables loop
    -- Skip any table this database doesn't have (schemas vary over time).
    if to_regclass('public.' || t) is null then
      raise notice 'Skipping % (table not found)', t;
      continue;
    end if;
    execute format(
      'alter table public.%I add column if not exists family_id uuid
         references public.families(id) on delete cascade
         default ''11111111-1111-1111-1111-111111111111''', t);
    execute format(
      'update public.%I set family_id = %L where family_id is null', t, natalia);
    execute format(
      'create index if not exists %I on public.%I (family_id)', t || '_family_idx', t);
  end loop;
end $$;

-- NOTE: family_events and event_sources are a SHARED, automated cache of
-- public area events (Ticketmaster, etc.) — intentionally global, no family_id.

-- ------------------------------------------------------------------
-- Done. Nothing about the live site changes yet — this is the foundation
-- the self-serve "create your own page" flow will build on next.
-- ------------------------------------------------------------------
