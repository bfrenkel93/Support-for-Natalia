import type { FamilyEvent } from "@/lib/supabase";
import { getEventCalendarInfo } from "@/lib/calendar";
import CalendarButtons from "./CalendarButtons";
import RsvpForm from "./RsvpForm";

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
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
    <div className="card flex flex-col gap-4 p-6">
      <div>
        <h3 className="font-serif text-xl text-ink">{event.title}</h3>
        <div className="mt-1.5 space-y-0.5 text-sm text-ink-soft">
          {(when || event.event_time) && (
            <p>
              {when}
              {when && event.event_time ? " · " : ""}
              {event.event_time}
            </p>
          )}
          {event.location && <p>📍 {event.location}</p>}
        </div>
        {event.description && (
          <p className="mt-2 text-sm text-ink-soft">{event.description}</p>
        )}
      </div>

      {/* Who's coming */}
      <div>
        <p className="eyebrow mb-2">
          {count === 0
            ? "Be the first to say you'll come"
            : `Who's coming (${count})`}
        </p>
        {count > 0 && (
          <ul className="flex flex-wrap gap-2">
            {event.rsvps.map((r) => (
              <li
                key={r.id}
                className="rounded-full bg-clay/10 px-3 py-1 text-sm text-clay-dark"
                title={r.note || undefined}
              >
                {r.name}
                {r.note ? " ·" : ""}
                {r.note && (
                  <span className="text-ink-soft"> {r.note}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-auto space-y-3">
        <RsvpForm eventId={event.id} />
        <CalendarButtons
          googleUrl={cal?.googleUrl ?? null}
          icsPath={cal?.icsPath ?? null}
        />
      </div>
    </div>
  );
}
