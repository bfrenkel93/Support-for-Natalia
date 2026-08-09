import Nav from "@/components/Nav";
import WeekendIdeasExplorer from "@/components/WeekendIdeasExplorer";
import { getBookings } from "@/lib/bookings";
import { upcomingWeekends, dateInWeekend } from "@/lib/weekend/weekends";
import { buildWeekendGroups } from "@/lib/weekend/recommend";

export const dynamic = "force-dynamic";

export default async function WeekendIdeasPage() {
  const bookings = await getBookings();
  const weekends = upcomingWeekends(10);

  const confirmedKids = bookings.filter(
    (b) => b.kind === "kids" && b.status === "confirmed"
  );
  const covered = new Set<string>();
  for (const w of weekends) {
    if (confirmedKids.some((b) => dateInWeekend(b.event_date, w))) covered.add(w.key);
  }

  const groups = buildWeekendGroups({ weekends, coveredWeekendKeys: covered });

  return (
    <>
      <Nav />
      <main className="bg-parchment">
        <div className="mx-auto max-w-content px-6 py-20 sm:px-10 sm:py-28">
          <a href="/" className="btn-link">← Back home</a>
          <p className="eyebrow mt-8">Things to Do Together</p>
          <h1 className="mt-4 max-w-3xl font-serif text-[2.4rem] font-light leading-[1.08] text-ink sm:text-[3.2rem]">
            Weekend ideas with the kids
          </h1>
          <p className="mt-5 max-w-measure text-[1.05rem] leading-[1.85] text-ink-soft">
            A few thoughtfully chosen ideas for the weeks ahead. Some are special
            things happening around Boston, others are places worth returning to
            again and again.
          </p>

          <div className="mt-12">
            <WeekendIdeasExplorer groups={groups} />
          </div>
        </div>
      </main>
    </>
  );
}
