import type { Booking } from "@/lib/supabase";
import { upcomingWeekends, dateInWeekend } from "@/lib/weekend/weekends";
import { buildWeekendGroups } from "@/lib/weekend/recommend";
import WeekendIdeaGroup from "./WeekendIdeaGroup";
import Reveal from "./Reveal";

function coveredKeys(bookings: Booking[], weekends: ReturnType<typeof upcomingWeekends>) {
  const confirmedKids = bookings.filter(
    (b) => b.kind === "kids" && b.status === "confirmed"
  );
  const set = new Set<string>();
  for (const w of weekends) {
    if (confirmedKids.some((b) => dateInWeekend(b.event_date, w))) set.add(w.key);
  }
  return set;
}

function heading(index: number): string | undefined {
  if (index === 0) return "This weekend";
  if (index === 1) return "Next weekend";
  return undefined;
}

/**
 * Homepage "Things to Do Together" — a few thoughtfully chosen ideas for the
 * next handful of weekends, drawn from the curated Boston list (and, once the
 * Ticketmaster key is set, dated special events). Self-maintaining.
 */
export default function WeekendIdeas({
  bookings,
  number,
}: {
  bookings: Booking[];
  number?: string;
}) {
  const weekends = upcomingWeekends(3);
  const groups = buildWeekendGroups({
    weekends,
    coveredWeekendKeys: coveredKeys(bookings, weekends),
  });

  return (
    <section id="things-to-do" className="section-anchor bg-ivory py-24 sm:py-32">
      <div className="mx-auto grid max-w-content gap-x-12 gap-y-10 px-6 sm:px-10 lg:grid-cols-12">
        <Reveal as="header" className="lg:col-span-4">
          <div className="flex items-center gap-4">
            {number && <span className="section-num">{number}</span>}
            <span className="eyebrow">Things to Do Together</span>
          </div>
          <h2 className="mt-6 font-serif text-[2rem] font-light leading-[1.12] text-ink sm:text-[2.6rem]">
            A few ideas for weekends with the kids
          </h2>
          <p className="mt-6 max-w-measure text-[1.02rem] leading-[1.85] text-ink-soft">
            Some are special things happening around Boston, others are places
            worth returning to again and again.
          </p>
          <a href="/weekend-ideas" className="btn-link mt-8 inline-block">
            See all weekend ideas →
          </a>
        </Reveal>

        <div className="lg:col-span-7 lg:col-start-6">
          {groups.map((g) => (
            <WeekendIdeaGroup
              key={g.weekend.key}
              group={g}
              heading={heading(g.weekend.index)}
              signupHref="#calendar"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
