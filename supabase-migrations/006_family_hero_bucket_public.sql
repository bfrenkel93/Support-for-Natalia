-- ==================================================================
-- Make the family hero bucket publicly readable  (Migration 006)
-- Run once in the Supabase SQL Editor.
--
-- Symptom this fixes: a hero photo uploads successfully ("uploaded") but
-- never displays on the page. Uploads use the service-role key and succeed
-- even when the bucket isn't public, but the page loads the photo over the
-- public URL — which only works if the bucket is marked public.
--
-- This guarantees the bucket exists AND is public. Idempotent and
-- non-breaking: safe to run even if migration 004 already ran.
-- ==================================================================

insert into storage.buckets (id, name, public)
values ('family-heroes', 'family-heroes', true)
on conflict (id) do update set public = true;

-- Confirm the result (should show public = true):
-- select id, public from storage.buckets where id = 'family-heroes';
