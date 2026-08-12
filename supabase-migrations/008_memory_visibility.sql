-- ==================================================================
-- Per-memory visibility  (Migration 008)
-- Run once in the Supabase SQL Editor.
--
-- Lets each shared story choose to be public (shown on the page) or private
-- (only the family sees it). Default private, so nothing already shared
-- becomes public. SAFE / NON-BREAKING.
-- ==================================================================

alter table public.memories
  add column if not exists is_public boolean not null default false;
