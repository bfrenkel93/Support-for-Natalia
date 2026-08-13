-- Rate limiting for public forms (sign-ups, RSVPs, memories, page creation).
-- A single tiny table keyed by (bucket, identifier=IP) plus an atomic
-- increment function. The app calls rate_limit_hit() on each submission and
-- fails OPEN if anything goes wrong, so real families are never blocked.

create table if not exists rate_limits (
  bucket        text not null,
  identifier    text not null,
  count         int  not null default 0,
  window_start  timestamptz not null default now(),
  primary key (bucket, identifier)
);

-- Atomically record one hit and report whether it's within the limit.
-- Resets the window when the current one has expired. Returns TRUE when the
-- request is allowed (count within p_max), FALSE when it should be blocked.
create or replace function rate_limit_hit(
  p_bucket         text,
  p_identifier     text,
  p_max            int,
  p_window_seconds int
) returns boolean
language plpgsql
as $$
declare
  v_count int;
begin
  insert into rate_limits (bucket, identifier, count, window_start)
    values (p_bucket, p_identifier, 1, now())
  on conflict (bucket, identifier) do update
    set
      count = case
        when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
          then 1
        else rate_limits.count + 1
      end,
      window_start = case
        when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
          then now()
        else rate_limits.window_start
      end
  returning count into v_count;

  return v_count <= p_max;
end;
$$;

-- Optional housekeeping: drop stale rows so the table stays small. Safe to run
-- anytime (a fresh hit just re-creates the row).
create or replace function rate_limits_cleanup(p_older_than_seconds int default 86400)
returns void
language sql
as $$
  delete from rate_limits
  where window_start < now() - make_interval(secs => p_older_than_seconds);
$$;
