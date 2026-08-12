-- ==================================================================
-- Per-family subscribers  (Migration 005)
-- Run once in the Supabase SQL Editor.
--
-- The subscriber email uniqueness was global. With many families, the same
-- email should be able to follow more than one family — so uniqueness becomes
-- per family. SAFE / NON-BREAKING for existing data.
-- ==================================================================

do $$
begin
  if to_regclass('public.subscribers') is null then
    raise notice 'Skipping — subscribers table not found';
    return;
  end if;

  drop index if exists public.subscribers_email_unique;

  create unique index if not exists subscribers_email_unique
    on public.subscribers (family_id, lower(email));
end $$;
