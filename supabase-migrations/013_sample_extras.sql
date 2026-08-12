-- ==================================================================
-- Sample page extras  (Migration 013)
-- Run once in the Supabase SQL Editor.
--
-- Adds a few open "needs" and some memorial RSVPs to the sample family, so
-- /sample also shows off the requests board and a live RSVP headcount.
-- Idempotent: safe to re-run.
-- ==================================================================

delete from public.requests where family_id = '22222222-2222-2222-2222-222222222222';
insert into public.requests (family_id, title, details, needed_date) values
  ('22222222-2222-2222-2222-222222222222', 'A ride to Thursday appointments', 'Sarah has a standing appointment across town — a lift there and back would lift a real weight.', current_date + 3),
  ('22222222-2222-2222-2222-222222222222', 'Mow the lawn this month', 'Just keeping things from piling up while the family catches their breath.', null),
  ('22222222-2222-2222-2222-222222222222', 'Friday soccer pickup', 'The kids finish at 5pm at Ridgewood Fields — a familiar face would mean a lot.', current_date + 5);

delete from public.gathering_rsvps where family_id = '22222222-2222-2222-2222-222222222222';
insert into public.gathering_rsvps (family_id, name, email, party_size, note) values
  ('22222222-2222-2222-2222-222222222222', 'The Alvarez family', null, 4, null),
  ('22222222-2222-2222-2222-222222222222', 'Priya & Sam',        null, 2, 'We wouldn''t miss it.'),
  ('22222222-2222-2222-2222-222222222222', 'Coach Dan',          null, 1, null);
