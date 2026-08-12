-- ==================================================================
-- Family hero photos  (Migration 004)
-- Run once in the Supabase SQL Editor.
--
-- Creates a public storage bucket for family hero images. Uploads happen
-- server-side with the service-role key; the bucket is public-read so a
-- family's page can show the photo. SAFE / NON-BREAKING.
-- ==================================================================

insert into storage.buckets (id, name, public)
values ('family-heroes', 'family-heroes', true)
on conflict (id) do nothing;
