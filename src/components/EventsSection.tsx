import type { FamilyEvent } from "@/lib/supabase";
import SectionHeader from "./SectionHeader";
import EventCard from "./EventCard";

export default function EventsSection({
  events,
  settings,
  familyAddress,
}: {
  events: FamilyEvent[];
  settings: Record<string, string>;
  familyAddress: string;
}) {
  return (
    <section id="events" className="section-anchor bg-cream-soft py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        <SectionHeader
          eyebrow="Everyone's welcome"
          title="Come Cheer Them On"
          subtitle={settings.events_subtitle}
          intro={settings.events_intro}
        />

        <div className="mt-12">
          {events.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  familyAddress={familyAddress}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-xl2 border border-dashed border-line-strong bg-cream px-5 py-10 text-center text-ink-soft">
              {settings.events_empty}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
