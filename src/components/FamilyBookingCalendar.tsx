"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { Booking, BookingKind } from "@/lib/supabase";
import { getBookingCalendarInfo } from "@/lib/calendar";
import CalendarButtons from "@/components/CalendarButtons";

type KindDef = {
  key: BookingKind;
  label: string;
  dot: string;
  ring: string;
  soft: string;
};

const ALL_KINDS: KindDef[] = [
  { key: "kids", label: "Time with the kids", dot: "bg-kind-kids", ring: "border-kind-kids", soft: "bg-kind-kids/10" },
  { key: "meal", label: "Bring a meal", dot: "bg-kind-meal", ring: "border-kind-meal", soft: "bg-kind-meal/10" },
  { key: "visit", label: "Visit / company", dot: "bg-kind-visit", ring: "border-kind-visit", soft: "bg-kind-visit/10" },
  { key: "errand", label: "Errand / help", dot: "bg-kind-errand", ring: "border-kind-errand", soft: "bg-kind-errand/10" },
];
const KIND_DOT: Record<BookingKind, string> = {
  kids: "bg-kind-kids",
  meal: "bg-kind-meal",
  visit: "bg-kind-visit",
  errand: "bg-kind-errand",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function prettyDate(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", timeZone: "UTC",
  });
}

export default function FamilyBookingCalendar({
  slug,
  hasKids,
  bookings: initialBookings,
  forName,
}: {
  slug: string;
  hasKids: boolean;
  bookings: Booking[];
  forName?: string;
}) {
  const kinds = hasKids ? ALL_KINDS : ALL_KINDS.filter((k) => k.key !== "kids");

  const now = new Date();
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);
  const [kind, setKind] = useState<BookingKind>("meal");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const byDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const list = map.get(b.event_date) || [];
      list.push(b);
      map.set(b.event_date, list);
    }
    return map;
  }, [bookings]);

  const mealDates = useMemo(
    () => new Set(bookings.filter((b) => b.kind === "meal").map((b) => b.event_date)),
    [bookings]
  );

  const todayStr = ymd(now.getFullYear(), now.getMonth(), now.getDate());
  const firstWeekday = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const atCurrentMonth = view.y === now.getFullYear() && view.m === now.getMonth();
  const step = (delta: number) => {
    setView((v) => {
      const total = v.y * 12 + v.m + delta;
      return { y: Math.floor(total / 12), m: ((total % 12) + 12) % 12 };
    });
  };

  const selectDay = (dateStr: string) => {
    setSelected(dateStr);
    setStatus("idle");
    setMessage("");
    setKind(mealDates.has(dateStr) ? "visit" : "meal");
  };

  const selectedHasMeal = selected ? mealDates.has(selected) : false;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const form = e.currentTarget;
    const g = (n: string) =>
      (form.elements.namedItem(n) as HTMLInputElement | null)?.value?.trim() ?? "";
    const name = g("name");
    const email = g("email");
    const note = g("note");
    const isPrivate =
      (form.elements.namedItem("private") as HTMLInputElement | null)?.checked ?? false;

    if (!name) {
      setStatus("error");
      setMessage("Please add your name.");
      return;
    }

    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          event_date: selected,
          kind,
          name,
          email,
          note,
          private: isPrivate,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out?.error || "bad");

      // Only show it on the calendar right away if it's instantly confirmed.
      // Requests (visits, time with the kids) wait for the family's approval.
      if (!out.pending) {
        setBookings((prev) => [
          ...prev,
          {
            id: `local-${prev.length}-${selected}`,
            event_date: selected,
            kind,
            status: "confirmed",
            name,
            email: email || null,
            note: note || null,
            private: isPrivate,
            created_at: new Date().toISOString(),
          } as Booking,
        ]);
      }
      setStatus("done");
      setMessage(out.message || "Thank you for showing up for them. 💛");
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      setStatus("error");
      setMessage(m && m !== "bad" ? m : "Something went wrong. Please try again.");
    }
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {kinds.map((k) => (
          <span key={k.key} className="flex items-center gap-2 text-[0.72rem] uppercase tracking-wide text-ink-soft">
            <span className={`h-2.5 w-2.5 rounded-full ${k.dot}`} />
            {k.label}
          </span>
        ))}
      </div>

      {/* Month nav */}
      <div className="mt-8 flex items-center justify-between">
        <h3 className="font-serif text-2xl font-light text-ink">
          {MONTHS[view.m]} <span className="text-ink-faint">{view.y}</span>
        </h3>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => step(-1)} disabled={atCurrentMonth}
            aria-label="Previous month"
            className="px-3 py-2 text-ink-soft transition-colors hover:text-bronze disabled:opacity-30">←</button>
          <button type="button" onClick={() => step(1)} aria-label="Next month"
            className="px-3 py-2 text-ink-soft transition-colors hover:text-bronze">→</button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="mt-4 grid grid-cols-7 border-t border-line/70 pt-3 text-center text-[0.6rem] uppercase tracking-wide text-ink-faint">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-2">{w.slice(0, 1)}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="min-h-[4.5rem]" />;
          const dateStr = ymd(view.y, view.m, d);
          const items = byDate.get(dateStr) || [];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selected;
          const isPast = dateStr < todayStr;
          return (
            <button key={i} type="button" onClick={() => !isPast && selectDay(dateStr)} disabled={isPast}
              className={`min-h-[4.5rem] rounded-sm border p-1.5 text-left align-top transition-colors ${
                isSelected ? "border-bronze bg-bone" : "border-transparent hover:border-line"
              } ${isPast ? "cursor-default opacity-40" : "cursor-pointer"}`}>
              <span className={`text-[0.72rem] tabular-nums ${isToday ? "font-semibold text-bronze" : "text-ink-faint"}`}>{d}</span>
              <span className="mt-1 block space-y-0.5">
                {items.slice(0, 3).map((b) => (
                  <span key={b.id} className="flex items-center gap-1 text-[0.6rem] leading-tight text-ink-soft">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${KIND_DOT[b.kind]}`} />
                    <span className="truncate">{b.private ? "Someone" : b.name}</span>
                  </span>
                ))}
                {items.length > 3 && (
                  <span className="block text-[0.58rem] text-ink-faint">+{items.length - 3}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sign-up panel */}
      {selected && (
        <div className="mt-8 border-t border-line pt-8">
          {status === "done" ? (
            <div className="max-w-md">
              <p className="whitespace-pre-line border-l-2 border-bronze/40 pl-4 leading-relaxed text-bronze">{message}</p>
              {(() => {
                const cal = getBookingCalendarInfo({ date: selected, kind, forName });
                return cal ? (
                  <div className="mt-5">
                    <CalendarButtons googleUrl={cal.googleUrl} icsPath={cal.icsPath} />
                  </div>
                ) : null;
              })()}
              <button type="button" onClick={() => { setSelected(null); setStatus("idle"); }} className="btn-link mt-5">Done</button>
            </div>
          ) : (
            <form onSubmit={submit} className="max-w-xl">
              <p className="eyebrow mb-1">Signing up for</p>
              <p className="font-serif text-2xl font-light text-ink">{prettyDate(selected)}</p>

              <div className="mt-6">
                <span className="field-label">What would you like to do?</span>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {kinds.map((k) => {
                    const disabled = k.key === "meal" && selectedHasMeal;
                    const active = kind === k.key;
                    return (
                      <button type="button" key={k.key} onClick={() => !disabled && setKind(k.key)} disabled={disabled}
                        className={`flex items-center gap-2.5 rounded-sm border px-3 py-2.5 text-left text-sm transition-colors ${
                          active ? `${k.ring} ${k.soft}` : "border-line hover:border-line-strong"
                        } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${k.dot}`} />
                        <span className="text-ink">{k.label}</span>
                        {disabled && <span className="ml-auto text-[0.62rem] uppercase tracking-wide text-ink-faint">taken</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="field-label">Your name<span className="text-bronze"> *</span></label>
                  <input name="name" required maxLength={120} autoComplete="name" className="field" placeholder="First and last name" />
                </div>
                <div>
                  <label className="field-label">Email — optional</label>
                  <input name="email" type="email" autoComplete="email" className="field" placeholder="you@example.com" />
                </div>
              </div>

              <div className="mt-6">
                <label className="field-label">A note — optional</label>
                <input name="note" maxLength={200} className="field" placeholder="e.g. Bringing dinner around 6pm" />
              </div>

              <label className="mt-5 flex items-center gap-2.5 text-sm text-ink-soft">
                <input type="checkbox" name="private" className="h-4 w-4 rounded-none border-line-strong text-bronze focus:ring-bronze/40" />
                Keep my name private — just show “Someone”
              </label>

              {status === "error" && message && <p className="mt-4 text-sm text-bronze">{message}</p>}

              <div className="mt-6 flex items-center gap-5">
                <button type="submit" disabled={status === "sending"} className="btn disabled:opacity-50">
                  {status === "sending" ? "Saving…" : "Confirm sign-up"}
                </button>
                <button type="button" onClick={() => setSelected(null)}
                  className="text-xs uppercase tracking-wide text-ink-faint underline underline-offset-4 hover:text-ink">Cancel</button>
              </div>
              <p className="mt-4 text-xs text-ink-faint">The family will be notified when you sign up.</p>
            </form>
          )}
        </div>
      )}

      {!selected && (
        <p className="mt-6 text-sm text-ink-faint">
          {bookings.length === 0
            ? "No one has signed up yet — pick any open day to be the first."
            : "Select any open day above to sign up."}
        </p>
      )}
    </div>
  );
}
