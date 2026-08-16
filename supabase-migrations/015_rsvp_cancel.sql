-- Self-service RSVP cancellation. Each RSVP gets an unguessable token; the
-- confirmation email links to a page that cancels it. Covers the memorial
-- gathering RSVPs and event RSVPs.

alter table gathering_rsvps
  add column if not exists cancel_token uuid default gen_random_uuid();
update gathering_rsvps set cancel_token = gen_random_uuid() where cancel_token is null;

alter table event_rsvps
  add column if not exists cancel_token uuid default gen_random_uuid();
update event_rsvps set cancel_token = gen_random_uuid() where cancel_token is null;

create index if not exists gathering_rsvps_cancel_token_idx
  on gathering_rsvps (cancel_token);
create index if not exists event_rsvps_cancel_token_idx
  on event_rsvps (cancel_token);
