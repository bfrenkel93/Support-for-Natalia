-- ==================================================================
-- Memorial RSVP: attending or regrets  (Migration 009)
-- Run once in the Supabase SQL Editor.
--
-- Lets a memorial/funeral RSVP say "I'll be there" or "I can't make it".
-- Existing RSVPs are treated as attending. SAFE / NON-BREAKING.
-- ==================================================================

alter table public.gathering_rsvps
  add column if not exists attending boolean not null default true;
