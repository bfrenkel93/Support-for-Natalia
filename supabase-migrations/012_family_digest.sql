-- ==================================================================
-- Per-family digest cadence  (Migration 012)
-- Run once in the Supabase SQL Editor.
--
-- Lets the weekly digest cron send each family's followers their own
-- gentle "still here, still needed" note on an independent ~8-week clock,
-- instead of one global schedule.
-- ==================================================================

alter table public.families
  add column if not exists digest_last_sent_at timestamptz;
