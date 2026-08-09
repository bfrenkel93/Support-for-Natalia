import type { Slot, FamilyEvent } from "@/lib/supabase";

type DayItem = {
  type: "kids" | "support" | "event";
  label: string;
  covered: boolean;
  href: string;
};

const TYPE_STYLE: Record<DayItem["type"], string> = {
  kids: "bg-sage-light text-sage-dark",
  support: "bg-softblue-light text-softblue-dark",
  event: "bg-clay/15 text-clay-dark",
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CalendarView({
  slots,
  events,
}: {
  slots: Slot[];
  events: FamilyEvent[];
}) {
  // Bucket every dated item by its YYYY-MM-DD date.
  const byDate = new Map<string, DayItem[]>();
  const add = (date: string | null, item: DayItem) => {
    if (!date) return;
    const list = byDate.get(date) || [];
    list.push(item);
    byDate.set(date, list);
  };

  for (const s of slots) {
    if (s.category === "support") {
      add(s.event_date, {
        type: "support",
        label: s.claimed
          ? `Meal · ${s.claimed_private || !s.claimed_name ? "covered" : s.claimed_name}`
          : "Meal open",
        covered: s.claimed,
        href: "#support",
      });
    } else {
      add(s.event_date, {
        type: "kids",
        label: s.claimed ? "Kids visit · covered" : "Kids visit open",
        covered: s.claimed,
        href: "#kids",
      });
    }
  }
  for (const e of events) {
    add(e.event_date, {
      type: "event",
      label: e.title,
      covered: e.rsvps.length > 0,
      href: "#events",
    });
  }

  if (byDate.size === 0) return null;

  // Which months to show: current month through the last month that has an
  // item (capped at 6 months so the page never runs away).
  const now = new Date();
  const startY = now.getFullYear();
  const startM = now.getMonth();
  const startKey = startY * 12 + startM;

  const monthKeys = new Set<number>();
  for (const date of byDate.keys()) {
    const [y, m] = date.split("-").map(Number);
    const key = y * 12 + (m - 1);
    if (key >= startKey) monthKeys.add(key);
  }
  monthKeys.add(startKey); // always show the current month

  const months = Array.from(monthKeys)
    .sort((a, b) => a - b)
    .slice(0, 6)
    .map((key) => ({ year: Math.floor(key / 12), month: key % 12 }));

  const todayStr = ymd(now.getFullYear(), now.getMonth(), now.getDate());

  return (
    <section id="calendar" className="section-anchor bg-cream py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        <p className="eyebrow mb-3">At a glance</p>
        <h2 className="font-serif text-3xl text-ink sm:text-[2.6rem]">
          The Calendar
        </h2>
        <p className="mt-4 max-w-measure text-lg leading-relaxed text-ink-soft">
          Everything in one place, so you can see what&apos;s already covered
          before you sign up. Tap any day to jump to that section.
        </p>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-softblue" /> Meals &amp; visits
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-sage" /> Kids weekends
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-clay" /> Events
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true">✓</span> already covered
          </span>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {months.map(({ year, month }) => (
            <Month
              key={`${year}-${month}`}
              year={year}
              month={month}
              byDate={byDate}
              todayStr={todayStr}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Month({
  year,
  month,
  byDate,
  todayStr,
}: {
  year: number;
  month: number;
  byDate: Map<string, DayItem[]>;
  todayStr: string;
}) {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="rounded-xl2 border border-line bg-cream-soft p-4 shadow-card">
      <h3 className="mb-3 font-serif text-lg text-ink">
        {MONTH_NAMES[month]} {year}
      </h3>
      <div className="grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold uppercase text-ink-soft">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const dateStr = ymd(year, month, d);
          const items = byDate.get(dateStr) || [];
          const isToday = dateStr === todayStr;
          return (
            <div
              key={i}
              className={`min-h-[3.2rem] rounded-lg border p-1 text-left ${
                items.length
                  ? "border-line bg-cream"
                  : "border-transparent"
              } ${isToday ? "ring-2 ring-clay/40" : ""}`}
            >
              <div
                className={`text-[0.7rem] ${
                  isToday ? "font-bold text-clay-dark" : "text-ink-soft"
                }`}
              >
                {d}
              </div>
              <div className="mt-0.5 space-y-0.5">
                {items.slice(0, 3).map((it, j) => (
                  <a
                    key={j}
                    href={it.href}
                    title={it.label}
                    className={`block truncate rounded px-1 py-0.5 text-[0.6rem] font-medium leading-tight ${TYPE_STYLE[it.type]}`}
                  >
                    {it.covered ? "✓ " : ""}
                    {it.label}
                  </a>
                ))}
                {items.length > 3 && (
                  <span className="block px-1 text-[0.6rem] text-ink-soft">
                    +{items.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
