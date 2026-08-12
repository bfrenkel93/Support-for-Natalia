-- ==================================================================
-- Family page content  (Migration 002)
-- Run once in the Supabase SQL Editor.
--
-- SAFE / NON-BREAKING: adds a JSON `content` field to families so each
-- family's page text (intro, titles) lives with the family. Nothing else
-- changes; the existing site is untouched.
-- ==================================================================

alter table public.families
  add column if not exists content jsonb not null default '{}'::jsonb;
