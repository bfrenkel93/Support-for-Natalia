-- ==================================================================
-- Example / demo page  (Migration 010)
-- Run once in the Supabase SQL Editor.
--
-- Seeds a polished, fictional example family ("the Bennett Family") at
-- /example so the landing page can link to a real "See an example" page.
-- Idempotent: safe to re-run (it resets the example's sample content).
-- ==================================================================

insert into public.families (id, slug, display_name, honoring, town, has_kids, is_public, contact_email, content)
values (
  '22222222-2222-2222-2222-222222222222',
  'example',
  'For the Bennett Family',
  'Michael',
  'Ridgewood, NJ',
  true, false, '',
  jsonb_build_object(
    'is_demo', true,
    'intro_title', 'For the Bennett Family',
    'eyebrow', 'For the people who love Michael',
    'relationship', 'father, husband',
    'intro_message', E'In the wake of losing Michael, so many people have wanted to know how to show up for Sarah and the kids — and haven''t always known how.\n\nThere is no way to fill the space he left behind. But there are ways to surround this family with presence, consistency, and care.\n\nThis page is simply a way to do that together — meals, visits, a hand with everyday life, and memories worth keeping.',
    'memorial_title', 'A Celebration of Michael''s Life',
    'memorial_when', to_char(current_date + 20, 'FMDay, FMMonth FMDD') || ' · 11am',
    'memorial_where', 'Ridgewood Community Church, 200 E Ridgewood Ave',
    'memorial_intro', 'We''ll gather to remember Michael and to hold one another close. If he touched your life, you are warmly welcome — come just as you are.',
    'gifts_intro', 'If you''d like to help in a more tangible way, anything shared here goes directly to the family — for meals, everyday costs, or a little breathing room.',
    'pay_venmo', '@bennett-family',
    'support_name', 'the Bennett family',
    'support_address', 'Ridgewood, NJ',
    'memories_public', true
  )
)
on conflict (id) do update set
  slug = excluded.slug, display_name = excluded.display_name, honoring = excluded.honoring,
  town = excluded.town, has_kids = excluded.has_kids, content = excluded.content;

-- Sample calendar coverage (relative to today so the demo looks alive).
delete from public.bookings where family_id = '22222222-2222-2222-2222-222222222222';
insert into public.bookings (family_id, event_date, kind, status, name, private) values
  ('22222222-2222-2222-2222-222222222222', to_char(current_date + 2, 'YYYY-MM-DD'), 'meal',  'confirmed', 'The Alvarez family', false),
  ('22222222-2222-2222-2222-222222222222', to_char(current_date + 4, 'YYYY-MM-DD'), 'kids',  'confirmed', 'Coach Dan',          false),
  ('22222222-2222-2222-2222-222222222222', to_char(current_date + 6, 'YYYY-MM-DD'), 'visit', 'confirmed', 'Priya',              false),
  ('22222222-2222-2222-2222-222222222222', to_char(current_date + 9, 'YYYY-MM-DD'), 'meal',  'confirmed', 'The Kims',           false);

-- A couple of gift ideas.
delete from public.gifts where family_id = '22222222-2222-2222-2222-222222222222';
insert into public.gifts (family_id, title, description, cost) values
  ('22222222-2222-2222-2222-222222222222', 'A week of dinners', 'A gift card so the family doesn''t have to think about cooking.', 150),
  ('22222222-2222-2222-2222-222222222222', 'A house cleaning',  'One less thing to manage during a hard month.',                  120),
  ('22222222-2222-2222-2222-222222222222', 'The kids'' fall soccer', 'Keeping their season normal and joyful.',                   90);

-- A couple of shared memories (public, so the wall shows).
delete from public.memory_media where family_id = '22222222-2222-2222-2222-222222222222';
delete from public.memories where family_id = '22222222-2222-2222-2222-222222222222';
insert into public.memories (family_id, author_name, story, is_public) values
  ('22222222-2222-2222-2222-222222222222', 'Tom R.', E'Michael coached our boys'' little league for six years. He knew every kid''s name and made sure the ones who never got picked first always felt like stars.', true),
  ('22222222-2222-2222-2222-222222222222', 'Dana',   E'He made the best pancakes on Sunday mornings — always in the shape of whatever animal the kids asked for. The kitchen was a disaster and nobody cared.', true);
