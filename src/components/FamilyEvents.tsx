"use client";

import { useState, type FormEvent } from "react";

type EventLite = {
  id: string;
  title: string;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  description: string | null;
  attendees: string[];
};

function prettyDate(s: string | null): string {
  if (!s) return "";
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", timeZone: "UTC",
  });
}

function EventCard({ slug, event }: { slug: string; event: EventLite }) {
  const [attendees, setAttendees] = useState<string[]>(event.attendees);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (n: string) =>
      (form.elements.namedItem(n) as HTMLInputElement | null)?.value?.trim() ?? "";
    const name = get("name");
    if (!name) {
      setStatus("error");
      setMessage("Please add your name.");
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, eventId: event.id, name, email: get("email"), note: get("note") }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out?.error || "bad");
      setAttendees((a) => [...a, name]);
      setStatus("done");
      setMessage(out.message || "You're on the list. 💛");
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      setStatus("error");
      setMessage(m && m !== "bad" ? m : "Something went wrong. Please try again.");
    }
  }

  const meta = [prettyDate(event.event_date), event.event_time, event.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-sm border border-line p-5 text-left">
      <h3 className="font-serif text-lg font-light text-ink">{event.title}</h3>
      {meta && <p className="mt-1 text-sm text-ink-soft">{meta}</p>}
      {event.description && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{event.description}</p>}

      {attendees.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {attendees.map((n, i) => (
            <span key={i} className="rounded-full border border-line bg-bone/50 px-2.5 py-0.5 text-xs text-ink-soft">
              {n}
            </span>
          ))}
        </div>
      )}

      {status === "done" ? (
        <p className="mt-3 text-sm text-bronze">{message}</p>
      ) : open ? (
        <form onSubmit={submit} className="mt-4 grid gap-3">
          <input name="name" required placeholder="Your name" className="field" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="email" type="email" placeholder="Email (optional)" className="field" />
            <input name="note" placeholder="Note (optional)" className="field" />
          </div>
          {status === "error" && <p className="text-sm text-bronze">{message}</p>}
          <div className="flex items-center gap-4">
            <button type="submit" disabled={status === "sending"} className="btn disabled:opacity-50">
              {status === "sending" ? "…" : "Count me in"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-link">Cancel</button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="btn-ghost mt-4">
          I’ll be there
        </button>
      )}
    </div>
  );
}

export default function FamilyEvents({ slug, events }: { slug: string; events: EventLite[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {events.map((e) => (
        <EventCard key={e.id} slug={slug} event={e} />
      ))}
    </div>
  );
}
