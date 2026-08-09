import type { FamilyEvent } from "@/lib/supabase";
import SectionShell from "./SectionShell";
import EventCard from "./EventCard";

export default function EventsSection({
  events,
  settings,
  familyAddress,
  number,
}: {
  events: FamilyEvent[];
  settings: Record<string, string>;
  familyAddress: string;
  number?: string;
}) {
  return (
    <SectionShell
      id="events"
      number={number}
      label="Events"
      title="Come Cheer Them On"
      subtitle={settings.events_subtitle}
      intro={settings.events_intro}
      tone="ivory"
    >
      {events.length > 0 ? (
        <div>
          {events.map((event) => (
            <EventCard key={event.id} event={event} familyAddress={familyAddress} />
          ))}
        </div>
      ) : (
        <p className="border-t border-line/70 py-10 text-sm text-ink-soft">
          {settings.events_empty}
        </p>
      )}
    </SectionShell>
  );
}
