-- ==================================================================
-- Support for Natalia — database schema
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL -> New query).
-- ==================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------
-- SLOTS: an open weekend (for the kids) or a support day (for Natalia)
-- ------------------------------------------------------------------
create table if not exists public.slots (
  id             uuid primary key default gen_random_uuid(),
  -- 'kids'    = once-a-month weekend activity visits with the kids
  -- 'support' = ongoing visits / meals / company for Natalia
  category       text not null check (category in ('kids', 'support')),
  event_date     date,                      -- the date of the visit (optional)
  label          text,                      -- e.g. "Weekend of Sept 13–14"
  description     text,                      -- e.g. "Afternoon activity with the kids"
  sort_order     integer not null default 0,

  -- claim state
  claimed        boolean not null default false,
  claimed_name   text,
  claimed_email  text,
  claimed_note   text,
  claimed_private boolean not null default false,  -- show "Claimed" instead of the name
  claimed_at     timestamptz,

  created_at     timestamptz not null default now()
);

create index if not exists slots_category_idx on public.slots (category);
create index if not exists slots_order_idx on public.slots (category, sort_order, event_date);

-- ------------------------------------------------------------------
-- SETTINGS: editable text (intro message, section copy, etc.)
-- ------------------------------------------------------------------
create table if not exists public.settings (
  key   text primary key,
  value text not null default ''
);

-- Seed default copy (safe to re-run — existing rows are left untouched).
insert into public.settings (key, value) values
  ('site_title',        'For Natalia & the Kids'),
  ('hero_kicker',       'For the people who love them'),
  ('hero_image_url',    ''),
  ('intro_title',       'For Natalia & the Kids'),
  ('memorial_title',    E'A Celebration of Joe''s Life'),
  ('memorial_intro',    E'We''ll gather to remember Joe and to hold his family close. All who loved him are welcome.'),
  ('memorial_when',     'To be announced'),
  ('memorial_where',    'To be announced'),
  ('memorial_note',     E'Details will be shared here as soon as they''re set — please check back.'),
  ('intro_message',     E'In the wake of Joe''s passing, so many people have asked how they can show up for Natalia and the kids.\n\nThere is no way to fill the space Joe leaves behind. But there are ways to surround the people he loved most with presence, friendship, consistency, and care.\n\nThis page is simply a way to help us do that together.\n\nRather than everyone reaching out at once, or Natalia having to coordinate what she needs, we''re creating a gentle rhythm of support around the family for the months ahead.\n\nChoose whatever feels natural to you. A weekend with the kids. Dinner with Natalia. A visit, an errand, or simply some company.\n\nThank you for loving them.'),
  ('kids_subtitle',     'Showing up for them, month after month'),
  ('kids_intro',        E'One thing we would especially love to create is a consistent connection between the kids and the people who knew and loved their dad.\n\nOnce a month, we would love for one of Joe''s friends to take a weekend to spend some time with the kids. It does not need to be anything elaborate. Take them to lunch, a game, a museum, an activity, or simply spend time together.\n\nThe purpose is less about what you do and more about continuing to show up.\n\nWe hope these visits give the kids another way to remain connected to Joe''s world, his friendships, his stories, and the people who loved him.'),
  ('kids_choose_note',  E'Select any open weekend below that works for you. Once a weekend is chosen, it will be marked as claimed so we can keep the visits spread throughout the year.'),
  ('support_subtitle',  'Being there after everything gets quiet'),
  ('support_intro',     E'In the first days and weeks after a loss, people gather quickly. Over time, life inevitably begins moving again for everyone around the person who is grieving.\n\nGrief does not move quite that fast.\n\nWe want to make sure Natalia continues to feel surrounded in the weeks and months ahead, without ever having to be the one asking people to come.\n\nThis can look however you want it to look.\n\nBring dinner. Sit with her for an hour. Take her out for coffee or a walk. Come watch a show. Help with something around the house. Stop by with no agenda at all.\n\nYou do not need to fix anything or find the right words.\n\nJust come.'),
  ('support_choose_note', E'Choose an open date below. You can leave a note letting Natalia know what you''re thinking, or simply sign up and decide later.'),
  ('events_subtitle',   'Show up for the little big moments'),
  ('events_intro',      E'The kids have games, recitals, and everyday milestones that mean the world when familiar faces are in the crowd. And because Natalia travels for work, this is also where we coordinate hands-on help — watching the kids while she''s away, rides to practice, or a little help with homework.\n\nWhenever she posts something here, add your name so she knows it''s covered and the kids look up to see they''re surrounded. Everyone is welcome — the more the better.'),
  ('events_empty',      E'Nothing posted right now. When there''s a game, a milestone, or a hand needed with the kids, it''ll appear here.'),
  ('events_confirmation', E'You''re on the list — thank you for showing up for them. 💛'),
  ('allergy_note',      E'One important note for anyone bringing food: Alexander is allergic to cashews and pistachios. Please avoid both, and check labels for “may contain” warnings. Thank you for keeping him safe. 💛'),
  ('family_address',    '10 Mechanic Street, Newton, MA'),
  ('other_ways',        E'There are many ways to support a family after a loss, and sometimes the smallest practical things make the biggest difference.\n\nIf a scheduled visit is not right for you, you can still help by:\n\n• Sending a meal or restaurant gift card\n• Helping with groceries or errands\n• Offering rides or help with the kids\n• Dropping off something you know the family loves\n• Checking in months from now, not only today\n• Sharing stories, photos, or memories of Joe\n• Remembering important dates and milestones\n• Simply continuing to include Natalia and the kids in your life\n\nThere is no perfect way to support someone through grief.\nPresence matters most.'),
  ('confirmation_message', E'Thank you for showing up for Natalia and the kids. Your date is reserved.\n\nSometimes love looks like something enormous. And sometimes it simply looks like being there.'),
  ('stories_title',     'Tell Them About Their Dad'),
  ('stories_body',      E'There are parts of Joe''s life that only you knew.\n\nStories from before the kids were born. Trips you took. Things he said. The way he showed up when someone needed him. The ridiculous things he did that still make you laugh.\n\nHis kids deserve to know those versions of their dad, too.\n\nWe would love to collect the stories, photos, and little memories that might otherwise disappear with time.\n\nIt does not have to be profound. In fact, it probably shouldn''t be.\n\nTell them about the time he made everyone laugh until they cried. The trouble you got into together. Something he was weirdly obsessed with. A trip you will never forget. Something he did for you that you never forgot. What he was like at 25. What made him Joe.\n\nWrite it as though you are telling the story directly to his kids.\n\nSomeday, they will get to know another piece of their dad through you.'),
  ('stories_privacy',   E'Everything you share here is completely private. It goes only to Natalia and the family through a secure, password-protected page — it is never shown publicly on this site.'),
  ('stories_confirmation', E'Thank you for sharing this with the kids. It''s safe with the family, and one day it will help them know their dad a little more. 💛'),
  ('gifts_title',       'Give a Gift of Rest'),
  ('gifts_intro',       E'Grief is exhausting, and the everyday things — cooking, errands, a moment to breathe — get so heavy. If you''d like to give something a little bigger, you can chip in toward a gift that lets Natalia rest and be cared for.\n\nSome of the things we hope to give her: a week of prepared meals from a private chef, a massage, a manicure, or a cleaning service — small comforts that lighten the load.\n\nContribute whatever you''re comfortable with using any of the options below. When enough is gathered, we''ll arrange it.'),
  ('pay_venmo',         'natalia-digiovanni'),
  ('pay_cashapp',       'nataliab85'),
  ('pay_zelle',         '904 866 6753'),
  ('gifts_confirmation', E'Thank you for your generosity — it means more than you know. 💛'),
  ('contact_email',     'brookefrenkel@gmail.com'),
  ('footer_note',       E'For Natalia and the kids, with love.\nThis page is private and intended only for friends and family.')
on conflict (key) do nothing;

-- ------------------------------------------------------------------
-- Row Level Security
-- All access happens on the server using the SERVICE ROLE key, which
-- bypasses RLS. We enable RLS with NO public policies so that even if
-- the public (anon) key were ever exposed, it could read/write nothing.
-- ------------------------------------------------------------------
alter table public.slots enable row level security;
alter table public.settings enable row level security;

-- ==================================================================
-- GIFTS — "Give a Gift". People chip in toward a gift (private chef,
-- massage, manicure...). Money moves off-site via a payment link; pledges
-- here are coordination only. Managed from /admin.
-- ==================================================================
create table if not exists public.gifts (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  cost         numeric,
  link         text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.gift_pledges (
  id          uuid primary key default gen_random_uuid(),
  gift_id     uuid not null references public.gifts(id) on delete cascade,
  name        text not null,
  email       text,
  amount      numeric,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists gift_pledges_gift_idx on public.gift_pledges (gift_id);

alter table public.gifts enable row level security;
alter table public.gift_pledges enable row level security;

insert into public.gifts (title, description, cost, sort_order) values
  ('A week of private-chef meal prep', 'A chef comes to cook and stock the fridge for a week — no cooking, no thinking about dinner.', 500, 1),
  ('A massage', 'An hour to release some of the weight she''s carrying.', 120, 2),
  ('A manicure', 'A small, restorative hour just for her.', 60, 3),
  ('House cleaning', 'A deep clean so home feels a little lighter.', 200, 4)
on conflict do nothing;

-- ==================================================================
-- MEMORIES — private "Tell the Kids a Story About Their Dad"
-- Stories + photos. Everything here is private: rows are only ever read
-- with the service-role key on the server, and photos live in a PRIVATE
-- storage bucket (below) reachable only via short-lived signed URLs.
-- ==================================================================
create table if not exists public.memories (
  id            uuid primary key default gen_random_uuid(),
  author_name   text,
  author_email  text,
  story         text,
  created_at    timestamptz not null default now()
);

create table if not exists public.memory_media (
  id            uuid primary key default gen_random_uuid(),
  memory_id     uuid not null references public.memories(id) on delete cascade,
  storage_path  text not null,          -- path inside the private 'memories' bucket
  file_name     text,
  content_type  text,
  size_bytes    bigint,
  created_at    timestamptz not null default now()
);

create index if not exists memory_media_memory_idx on public.memory_media (memory_id);

-- RLS on, no public policies -> the anon key can read/write nothing.
alter table public.memories enable row level security;
alter table public.memory_media enable row level security;

-- ==================================================================
-- BOOKINGS — the open, shared sign-up calendar.
-- Anyone can add themselves to any day, choosing a kind:
--   kids   = time with the children
--   meal   = a meal for Natalia
--   visit  = a visit / company
--   errand = an errand or practical help
-- Attendee names show on the (private) calendar, colour-coded by kind.
-- ==================================================================
create table if not exists public.bookings (
  id          uuid primary key default gen_random_uuid(),
  event_date  date not null,
  kind        text not null check (kind in ('kids', 'meal', 'visit', 'errand')),
  -- 'confirmed' = instant (meals/visits/errands). Kids weekends start as
  -- 'requested' until Natalia confirms; she can also 'declined' them.
  status      text not null default 'confirmed' check (status in ('requested', 'confirmed', 'declined')),
  name        text not null,
  email       text,
  note        text,
  private     boolean not null default false,  -- show "Someone" instead of the name
  created_at  timestamptz not null default now()
);
-- If the table already existed, make sure the status column is present:
alter table public.bookings add column if not exists status text not null default 'confirmed';

create index if not exists bookings_date_idx on public.bookings (event_date);

-- Enforce "one meal per day" at the database level: at most one 'meal' booking
-- can exist for any given date (visits, kids-time and errands stay unlimited).
create unique index if not exists bookings_one_meal_per_day
  on public.bookings (event_date)
  where kind = 'meal';

alter table public.bookings enable row level security;

-- A few example bookings so the calendar isn't empty on first load.
-- Delete these from /admin once real sign-ups come in.
insert into public.bookings (event_date, kind, name, note) values
  ('2026-09-12', 'kids',  'Marcus', 'Taking them to the game'),
  ('2026-09-16', 'meal',  'Dana',   'Bringing lasagna around 6'),
  ('2026-09-18', 'visit', 'Aunt Kim', 'Afternoon coffee')
on conflict do nothing;

-- ==================================================================
-- FAMILY_EVENTS — an AUTOMATED cache of dated Boston-area special events
-- (Ticketmaster, etc.). Refreshed weekly by a Vercel Cron job — you never
-- edit this table by hand. Public queries read only future, non-hidden,
-- family-suitable rows. `is_featured` = admin "pin"; `is_hidden` = admin hide.
-- ==================================================================
create table if not exists public.family_events (
  id                uuid primary key default gen_random_uuid(),
  source            text not null,
  external_id       text not null,
  source_url        text,
  official_url      text,
  title             text not null,
  short_description text,
  description       text,
  venue             text,
  city              text,
  state             text,
  start_date        date,
  end_date          date,
  start_time        text,
  category          text,
  age_label         text,
  family_score      integer not null default 0,
  quality_score     integer not null default 0,
  image_url         text,
  is_special_event  boolean not null default true,
  is_featured       boolean not null default false,
  is_hidden         boolean not null default false,
  last_verified_at  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (source, external_id)
);

create index if not exists family_events_dates_idx on public.family_events (start_date, end_date);
alter table public.family_events enable row level security;

-- Per-source health for the admin panel and failure isolation.
create table if not exists public.event_sources (
  source           text primary key,
  last_attempted_at timestamptz,
  last_success_at  timestamptz,
  events_found     integer not null default 0,
  events_imported  integer not null default 0,
  error_message    text,
  status           text not null default 'unknown'
);
alter table public.event_sources enable row level security;

-- ==================================================================
-- ACTIVITY IDEAS — inspiration for time with the kids (Disney on Ice, a
-- ball game, the zoo…). Admin-managed; shown in the "For the Kids" section.
-- ==================================================================
create table if not exists public.activity_ideas (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  event_date  date,
  location    text,
  url         text,
  note        text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.activity_ideas enable row level security;

-- Example ideas (Boston area) — edit the dates, places and links in /admin.
insert into public.activity_ideas (title, event_date, location, note, sort_order) values
  ('Disney on Ice', '2026-11-14', 'TD Garden, Boston', 'Example idea — update the date & add a ticket link.', 1),
  ('Red Sox game', '2026-06-20', 'Fenway Park', 'Example idea — check the schedule for a good date.', 2),
  ('Franklin Park Zoo', null, 'Boston', 'Any weekend — a relaxed, easy outing.', 3),
  ('Boston Children''s Museum', null, 'Seaport, Boston', 'Great on a rainy day.', 4)
on conflict do nothing;

-- ==================================================================
-- GATHERING RSVPs — for the memorial. Guests say how many are coming;
-- the admin sees a running headcount and can email the list to the organizer.
-- ==================================================================
create table if not exists public.gathering_rsvps (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  party_size  integer not null default 1,
  note        text,
  created_at  timestamptz not null default now()
);
alter table public.gathering_rsvps enable row level security;

-- ==================================================================
-- EVENTS — "Come Cheer Them On". Many people can RSVP to one event;
-- attendee names are shown on the (private) page. Managed from /admin.
-- ==================================================================
create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  event_date   date,
  event_time   text,
  location     text,
  description  text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.event_rsvps (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  name        text not null,
  email       text,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists event_rsvps_event_idx on public.event_rsvps (event_id);

alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;

insert into public.events (title, event_date, event_time, location, description, sort_order) values
  ('Sophia''s soccer game', '2026-09-19', '10:00 AM', 'Newton South field', 'Come cheer her on — the more familiar faces, the better!', 1),
  ('School fall concert', '2026-10-02', '6:30 PM', 'Newton Elementary auditorium', 'The kids are performing — let''s pack the room.', 2)
on conflict do nothing;

-- ------------------------------------------------------------------
-- PRIVATE storage bucket for memory photos.
-- `public = false` means files are NOT reachable by URL guessing; the app
-- serves them only through short-lived signed URLs generated server-side
-- after admin authentication. No storage policies are added, so the anon
-- key cannot list or download anything.
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('memories', 'memories', false)
on conflict (id) do nothing;

-- ------------------------------------------------------------------
-- OPTIONAL: a few example slots to see the page working right away.
-- Delete these from the /admin dashboard once you add your real dates.
-- ------------------------------------------------------------------
insert into public.slots (category, event_date, label, description, sort_order) values
  ('kids',    '2026-09-12', 'Weekend of Sept 12–13', 'A day out with the kids', 1),
  ('kids',    '2026-10-10', 'Weekend of Oct 10–11',  'A day out with the kids', 2),
  ('kids',    '2026-11-14', 'Weekend of Nov 14–15',  'A day out with the kids', 3),
  ('support', '2026-08-18', 'Monday, Aug 18', 'Dinner drop-off or a visit', 1),
  ('support', '2026-08-21', 'Thursday, Aug 21', 'Dinner drop-off or a visit', 2),
  ('support', '2026-08-25', 'Monday, Aug 25', 'Dinner drop-off or a visit', 3);
