"use client";

import { useState, type FormEvent } from "react";

type EventRow = {
  id: string;
  title: string;
  event_date: string | null;
  event_time: string | null;
};

export default function EventManager({
  token,
  initialEvents,
}: {
  token: string;
  initialEvents: EventRow[];
}) {
  const [events, setEvents] = useState<EventRow[]>(initialEvents);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState("");

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (n: string) =>
      (form.elements.namedItem(n) as HTMLInputElement | null)?.value?.trim() ?? "";
    const title = get("title");
    if (!title) {
      setErr("Please add a title.");
      return;
    }
    setAdding(true);
    setErr("");
    try {
      const res = await fetch("/api/manage/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          title,
          eventDate: get("eventDate"),
          eventTime: get("eventTime"),
          location: get("location"),
          description: get("description"),
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out?.error || "bad");
      setEvents((g) => [...g, out.event]);
      form.reset();
    } catch (e2) {
      const m = e2 instanceof Error ? e2.message : "";
      setErr(m && m !== "bad" ? m : "Couldn't add that. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    if (typeof window !== "undefined" && !window.confirm("Remove this event?")) return;
    const res = await fetch("/api/manage/event", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, id }),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.ok) setEvents((g) => g.filter((x) => x.id !== id));
  }

  return (
    <section className="mt-14 border-t border-line/60 pt-10">
      <p className="eyebrow">Events — optional</p>
      <p className="mt-1 text-sm text-ink-faint">
        Games, recitals, milestones — anything people can show up for. They
        appear in a “Come cheer them on” section on your page.
      </p>

      {events.length > 0 && (
        <ul className="mt-4 space-y-2">
          {events.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 rounded-sm border border-line px-4 py-3 text-sm">
              <span className="text-ink">
                <span className="font-medium">{g.title}</span>
                {g.event_date ? ` · ${g.event_date}` : ""}
                {g.event_time ? ` ${g.event_time}` : ""}
              </span>
              <button type="button" onClick={() => remove(g.id)} className="text-xs uppercase tracking-wide text-ink-faint hover:text-bronze">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="mt-4 grid gap-3">
        <input name="title" placeholder="Event title (e.g. Sophia’s soccer game)" className="field" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="eventDate" type="date" className="field" />
          <input name="eventTime" placeholder="Time (e.g. 10:00 AM)" className="field" />
        </div>
        <input name="location" placeholder="Location (optional)" className="field" />
        <input name="description" placeholder="A short note (optional)" className="field" />
        {err && <p className="text-sm text-bronze">{err}</p>}
        <div>
          <button type="submit" disabled={adding} className="btn-ghost disabled:opacity-50">
            {adding ? "Adding…" : "Add event"}
          </button>
        </div>
      </form>
    </section>
  );
}
