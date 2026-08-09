import type { FamilyEvent } from "@/lib/supabase";
import { getEventCalendarInfo } from "@/lib/calendar";
import CalendarButtons from "./CalendarButtons";
import RsvpForm from "./RsvpForm";

function formatDate(value: string | null): { weekday: string; main: string } | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }),
    main: date.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" }),
  };
}

export default function EventCard({
  event,
  familyAddress,
}: {
  event: FamilyEvent;
  familyAddress: string;
}) {
  const cal = getEventCalendarInfo(event, familyAddress);
  const when = formatDate(event.event_date);
  const count = event.rsvps.length;

  return (
    <article className="border-t border-line/70 py-8 first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {when && (
            <p className="text-[0.68rem] uppercase tracking-wide text-ink-faint">
              {when.weekday}
              {event.event_time ? ` · ${event.event_time}` : ""}
            </p>
          )}
          <h3 className="mt-1 font-serif text-2xl font-light text-ink">
            {event.title}
          </h3>
          <p className="mt-1 text-sm text-ink-soft">
            {when?.main}
            {event.location ? `${when ? " · " : ""}${event.location}` : ""}
          </p>
          {event.description && (
            <p className="mt-1.5 text-sm text-ink-soft">{event.description}</p>
          )}

          <div className="mt-4">
            <p className="text-[0.66rem] uppercase tracking-wide text-bronze">
              {count === 0 ? "Be the first to come" : `Coming · ${count}`}
            </p>
            {count > 0 && (
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {event.rsvps.map((r, i) => (
                  <span key={r.id}>
                    {i > 0 && <span className="text-line-strong"> · </span>}
                    <span title={r.note || undefined}>{r.name}</span>
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <RsvpForm eventId={event.id} />
          <CalendarButtons
            googleUrl={cal?.googleUrl ?? null}
            icsPath={cal?.icsPath ?? null}
            compact
          />
        </div>
      </div>
    </article>
  );
}
