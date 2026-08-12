"use client";

import { useState, type FormEvent } from "react";

export type RequestRow = {
  id: string;
  title: string;
  details: string | null;
  needed_date: string | null;
  claimed_by: string | null;
};

function pretty(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
  });
}

export default function RequestManager({
  token,
  initialRequests,
}: {
  token: string;
  initialRequests: RequestRow[];
}) {
  const [rows, setRows] = useState<RequestRow[]>(initialRequests);
  const [title, setTitle] = useState("");
  const [neededDate, setNeededDate] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/manage/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, title, neededDate, details }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out?.error || "bad");
      setRows((r) => [...r, out.request]);
      setTitle("");
      setNeededDate("");
      setDetails("");
    } catch (e2) {
      const m = e2 instanceof Error ? e2.message : "";
      setErr(m && m !== "bad" ? m : "Couldn’t add that. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(id: string) {
    setRows((r) => r.filter((x) => x.id !== id));
    try {
      await fetch("/api/manage/request", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, id }),
      });
    } catch {
      // best-effort; the row is already gone from the UI
    }
  }

  return (
    <section className="mt-14 border-t border-line/60 pt-10">
      <p className="eyebrow">Ways to help right now</p>
      <p className="mt-1 text-sm text-ink-faint">
        Post a specific need — a ride to soccer, homework help, a hand this week.
        People can claim it, and you’ll get an email when they do.
      </p>

      {rows.length > 0 && (
        <ul className="mt-5 space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 border-b border-line/60 pb-3 text-sm">
              <div>
                <p className="text-ink">{r.title}</p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {r.needed_date ? pretty(r.needed_date) : "Anytime"}
                  {r.claimed_by ? ` · Covered by ${r.claimed_by}` : " · Open"}
                </p>
              </div>
              <button type="button" onClick={() => onRemove(r.id)} className="shrink-0 text-xs text-ink-faint hover:text-bronze hover:underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onAdd} className="mt-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="field-label">What do you need?</label>
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="e.g. A ride to Timmy’s soccer game" />
          </div>
          <div>
            <label className="field-label">When — optional</label>
            <input type="date" className="field" value={neededDate} onChange={(e) => setNeededDate(e.target.value)} />
          </div>
        </div>
        <div className="mt-4">
          <label className="field-label">Any details — optional</label>
          <input className="field" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} placeholder="e.g. Pickup at 8:30, field is behind the school" />
        </div>
        <button type="submit" disabled={busy} className="btn mt-5 disabled:opacity-50">
          {busy ? "Adding…" : "Post this need"}
        </button>
        {err && <p className="mt-2 text-sm text-bronze">{err}</p>}
      </form>
    </section>
  );
}
