"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addBooking, type BookingState } from "@/app/actions";
import type { Booking, BookingKind } from "@/lib/supabase";
import { getBookingCalendarInfo } from "@/lib/calendar";
import CalendarButtons from "@/components/CalendarButtons";

type EventMarker = { id: string; title: string; event_date: string | null };

const KINDS: {
  key: BookingKind;
  label: string;
  dot: string;
  ring: string;
  soft: string;
}[] = [
  { key: "kids", label: "Time with the kids", dot: "bg-kind-kids", ring: "border-kind-kids", soft: "bg-kind-kids/10" },
  { key: "meal", label: "Meal for Natalia", dot: "bg-kind-meal", ring: "border-kind-meal", soft: "bg-kind-meal/10" },
  { key: "visit", label: "Visit / company", dot: "bg-kind-visit", ring: "border-kind-visit", soft: "bg-kind-visit/10" },
  { key: "errand", label: "Errand / help", dot: "bg-kind-errand", ring: "border-kind-errand", soft: "bg-kind-errand/10" },
];
const KIND_DOT: Record<BookingKind, string> = {
  kids: "bg-kind-kids",
  meal: "bg-kind-meal",
  visit: "bg-kind-visit",
  errand: "bg-kind-errand",
};
const KIND_RING: Record<BookingKind, string> = {
  kids: "border-kind-kids",
  meal: "border-kind-meal",
  visit: "border-kind-visit",
  errand: "border-kind-errand",
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

const initial: BookingState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn disabled:opacity-50">
      {pending ? "Saving…" : "Confirm sign-up"}
    </button>
  );
}

export default function BookingCalendar({
  bookings,
  events,
}: {
  bookings: Booking[];
  events: EventMarker[];
}) {
  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);
  const [kind, setKind] = useState<BookingKind>("meal");
  const [state, formAction] = useFormState(addBooking, initial);

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

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventMarker[]>();
    for (const e of events) {
      if (!e.event_date) continue;
      const list = map.get(e.event_date) || [];
      list.push(e);
      map.set(e.event_date, list);
    }
    return map;
  }, [events]);

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
    // Default to a sensible kind: if a meal is taken, pre-pick "visit".
    setKind(mealDates.has(dateStr) ? "visit" : "meal");
  };

  const selectedHasMeal = selected ? mealDates.has(selected) : false;

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {KINDS.map((k) => (
          <span key={k.key} className="flex items-center gap-2 text-[0.72rem] uppercase tracking-wide text-ink-soft">
            <span className={`h-2.5 w-2.5 rounded-full ${k.dot}`} />
            {k.label}
          </span>
        ))}
        <span className="flex items-center gap-2 text-[0.72rem] uppercase tracking-wide text-ink-soft">
          <span className="h-2.5 w-2.5 rounded-full bg-bronze" />
          Events (games, recitals)
        </span>
      </div>

      {/* Month nav */}
      <div className="mt-8 flex items-center justify-between">
        <h3 className="font-serif text-2xl font-light text-ink">
          {MONTHS[view.m]} <span className="text-ink-faint">{view.y}</span>
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={atCurrentMonth}
            aria-label="Previous month"
            className="px-3 py-2 text-ink-soft transition-colors hover:text-bronze disabled:opacity-30"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next month"
            className="px-3 py-2 text-ink-soft transition-colors hover:text-bronze"
          >
            →
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-4 grid grid-cols-7 border-t border-line/70 pt-3 text-center text-[0.6rem] uppercase tracking-wide text-ink-faint">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-2">{w.slice(0, 1)}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="min-h-[4.5rem]" />;
          const dateStr = ymd(view.y, view.m, d);
          const items = byDate.get(dateStr) || [];
          const evs = eventsByDate.get(dateStr) || [];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selected;
          const isPast = dateStr < todayStr;
          return (
            <button
              key={i}
              type="button"
              onClick={() => !isPast && selectDay(dateStr)}
              disabled={isPast}
              className={`min-h-[4.5rem] rounded-sm border p-1.5 text-left align-top transition-colors ${
                isSelected
                  ? "border-bronze bg-bone"
                  : "border-transparent hover:border-line"
              } ${isPast ? "cursor-default opacity-40" : "cursor-pointer"}`}
            >
              <span className={`text-[0.72rem] tabular-nums ${isToday ? "font-semibold text-bronze" : "text-ink-faint"}`}>
                {d}
              </span>
              <span className="mt-1 block space-y-0.5">
                {items.slice(0, 3).map((b) => (
                  <span key={b.id} className="flex items-center gap-1 text-[0.6rem] leading-tight text-ink-soft">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        b.status === "requested"
                          ? `border ${KIND_RING[b.kind]} bg-transparent`
                          : KIND_DOT[b.kind]
                      }`}
                    />
                    <span className={`truncate ${b.status === "requested" ? "italic" : ""}`}>
                      {b.private ? "Someone" : b.name}
                      {b.status === "requested" ? " ·?" : ""}
                    </span>
                  </span>
                ))}
                {evs.slice(0, 1).map((e) => (
                  <span key={e.id} className="flex items-center gap-1 text-[0.6rem] leading-tight text-bronze">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-bronze" />
                    <span className="truncate">{e.title}</span>
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
          {state.ok ? (
            <div className="max-w-md">
              <p className="whitespace-pre-line border-l-2 border-bronze/40 pl-4 leading-relaxed text-bronze">
                {state.message}
              </p>
              {selected && (() => {
                const cal = getBookingCalendarInfo({ date: selected, kind, forName: "Natalia" });
                return cal ? (
                  <div className="mt-5">
                    <CalendarButtons googleUrl={cal.googleUrl} icsPath={cal.icsPath} />
                  </div>
                ) : null;
              })()}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="btn-link mt-5"
              >
                Done
              </button>
            </div>
          ) : (
            <form action={formAction} className="max-w-xl">
              <input type="hidden" name="event_date" value={selected} />
              <input type="hidden" name="kind" value={kind} />

              <p className="eyebrow mb-1">Signing up for</p>
              <p className="font-serif text-2xl font-light text-ink">{prettyDate(selected)}</p>

              <div className="mt-6">
                <span className="field-label">What would you like to do?</span>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {KINDS.map((k) => {
                    const disabled = k.key === "meal" && selectedHasMeal;
                    const active = kind === k.key;
                    return (
                      <button
                        type="button"
                        key={k.key}
                        onClick={() => !disabled && setKind(k.key)}
                        disabled={disabled}
                        className={`flex items-center gap-2.5 rounded-sm border px-3 py-2.5 text-left text-sm transition-colors ${
                          active ? `${k.ring} ${k.soft}` : "border-line hover:border-line-strong"
                        } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${k.dot}`} />
                        <span className="text-ink">{k.label}</span>
                        {disabled && <span className="ml-auto text-[0.62rem] uppercase tracking-wide text-ink-faint">taken</span>}
                      </button>
                    );
                  })}
                </div>
                {kind === "meal" && (
                  <p className="mt-2 border-l-2 border-bronze/40 pl-3 text-xs leading-relaxed text-ink-soft">
                    A reminder for meals: Alexander is allergic to cashews &amp; pistachios — please avoid both.
                  </p>
                )}
                {kind === "kids" && (
                  <p className="mt-2 border-l-2 border-bronze/40 pl-3 text-xs leading-relaxed text-ink-soft">
                    Weekends with the kids are sent to Natalia as a request — she&apos;ll confirm this
                    date or suggest another. Leave your email so she can reach you.
                  </p>
                )}
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

              <label className="flex items-center gap-2.5 text-sm text-ink-soft">
                <input type="checkbox" name="subscribe" className="h-4 w-4 rounded-none border-line-strong text-bronze focus:ring-bronze/40" />
                Also send me occasional updates
              </label>

              {!state.ok && state.message && (
                <p className="mt-4 text-sm text-bronze">{state.message}</p>
              )}

              <div className="mt-6 flex items-center gap-5">
                <SubmitButton />
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-xs uppercase tracking-wide text-ink-faint underline underline-offset-4 hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {!selected && (
        <p className="mt-6 text-sm text-ink-faint">
          Select any open day above to sign up.
        </p>
      )}
    </div>
  );
}
