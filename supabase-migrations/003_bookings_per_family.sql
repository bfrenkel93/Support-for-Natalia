-- ==================================================================
-- Per-family meal rule  (Migration 003)
-- Run once in the Supabase SQL Editor.
--
-- The original "one meal per day" rule was global. With many families, each
-- family should be able to have a meal on any day — so the rule becomes
-- one meal per family per day. SAFE / NON-BREAKING for the existing data.
-- ==================================================================

do $$
begin
  if to_regclass('public.bookings') is null then
    raise notice 'Skipping — bookings table not found';
    return;
  end if;

  drop index if exists public.bookings_one_meal_per_day;

  create unique index if not exists bookings_one_meal_per_day
    on public.bookings (family_id, event_date)
    where kind = 'meal';
end $$;
