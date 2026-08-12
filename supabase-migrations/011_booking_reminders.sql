-- ==================================================================
-- Day-before reminders  (Migration 011)
-- Run once in the Supabase SQL Editor.
--
-- Adds a marker so the daily reminder cron can email each volunteer the
-- day before their meal/visit/help — and never remind the same sign-up
-- twice.
-- ==================================================================

alter table public.bookings
  add column if not exists reminder_sent_at timestamptz;

-- Fast lookup of "what's happening on a given day that still needs a reminder".
create index if not exists bookings_reminder_idx
  on public.bookings (event_date)
  where reminder_sent_at is null;
