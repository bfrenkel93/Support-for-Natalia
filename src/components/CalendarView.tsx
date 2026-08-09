import type { Slot, FamilyEvent } from "@/lib/supabase";
import Reveal from "./Reveal";

type DayItem = {
  type: "kids" | "support" | "event";
  label: string;
  covered: boolean;
  href: string;
};

const DOT: Record<DayItem["type"], string> = {
  support: "bg-taupe",
  kids: "bg-olive",
  event: "bg-bronze",
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
        label: s.claimed ? "Kids visit · covered" : "Kids visit",
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

  const now = new Date();
  const startKey = now.getFullYear() * 12 + now.getMonth();
  const monthKeys = new Set<number>([startKey]);
  for (const date of byDate.keys()) {
    const [y, m] = date.split("-").map(Number);
    const key = y * 12 + (m - 1);
    if (key >= startKey) monthKeys.add(key);
  }
  const months = Array.from(monthKeys)
    .sort((a, b) => a - b)
    .slice(0, 4)
    .map((key) => ({ year: Math.floor(key / 12), month: key % 12 }));

  const todayStr = ymd(now.getFullYear(), now.getMonth(), now.getDate());

  return (
    <section id="calendar" className="section-anchor bg-parchment py-24 sm:py-28">
      <div className="mx-auto max-w-content px-6 sm:px-10">
        <Reveal>
          <p className="eyebrow mb-4">At a glance</p>
          <h2 className="max-w-measure font-serif text-[2rem] font-light leading-tight text-ink sm:text-[2.4rem]">
            Everything, in one quiet view
          </h2>
          <p className="mt-4 max-w-measure text-[1.02rem] leading-[1.85] text-ink-soft">
            So you can see what&apos;s already been taken care of before you sign
            up. Select any day to jump to that section.
          </p>

          <div className="mt-7 flex flex-wrap gap-x-7 gap-y-2 text-[0.7rem] uppercase tracking-wide text-ink-faint">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-taupe" /> Meals &amp; visits
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-olive" /> Kids weekends
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-bronze" /> Events
            </span>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-x-14 gap-y-12 sm:grid-cols-2">
          {months.map(({ year, month }) => (
            <Reveal key={`${year}-${month}`}>
              <Month year={year} month={month} byDate={byDate} todayStr={todayStr} />
            </Reveal>
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
    <div>
      <h3 className="mb-4 font-serif text-lg font-normal text-ink">
        {MONTH_NAMES[month]}{" "}
        <span className="text-ink-faint">{year}</span>
      </h3>
      <div className="grid grid-cols-7 border-t border-line/70 pt-3 text-center text-[0.6rem] uppercase tracking-wide text-ink-faint">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="pb-2">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="min-h-[3.4rem]" />;
          const dateStr = ymd(year, month, d);
          const items = byDate.get(dateStr) || [];
          const isToday = dateStr === todayStr;
          return (
            <div key={i} className="min-h-[3.4rem] py-1.5">
              <div
                className={`text-[0.68rem] tabular-nums ${
                  isToday ? "font-semibold text-bronze" : "text-ink-faint"
                }`}
              >
                {d}
              </div>
              <div className="mt-1 space-y-1">
                {items.slice(0, 2).map((it, j) => (
                  <a
                    key={j}
                    href={it.href}
                    title={it.label}
                    className="flex items-center gap-1 text-[0.58rem] leading-tight text-ink-soft transition-colors hover:text-bronze"
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[it.type]}`} />
                    <span className="truncate">{it.label}</span>
                  </a>
                ))}
                {items.length > 2 && (
                  <span className="block text-[0.58rem] text-ink-faint">
                    +{items.length - 2}
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
