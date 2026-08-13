"use client";

import { useState } from "react";

export type PendingRequest = {
  id: string;
  kind: string;
  name: string;
  event_date: string;
  email: string | null;
  note: string | null;
};

const KIND_LABEL: Record<string, string> = {
  visit: "A visit",
  kids: "Time with the kids",
  meal: "A meal",
  errand: "An errand",
};

function fmt(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Lets a family approve or decline the visit / kids requests waiting on them.
 * Meals and errands never appear here — they're instant.
 */
export default function RequestApprovals({
  requests,
  token,
}: {
  requests: PendingRequest[];
  token: string;
}) {
  const [done, setDone] = useState<Record<string, "confirmed" | "declined">>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  if (!requests || requests.length === 0) return null;

  async function act(id: string, action: "confirm" | "decline") {
    setBusy(id);
    try {
      const res = await fetch("/api/manage/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, id, action, note: notes[id] || "" }),
      });
      const out = await res.json().catch(() => ({}));
      if (out.ok) {
        setDone((s) => ({ ...s, [id]: action === "confirm" ? "confirmed" : "declined" }));
      }
    } finally {
      setBusy(null);
    }
  }

  const open = requests.filter((r) => !done[r.id]);

  return (
    <section className="mt-8 rounded-lg border border-bronze/40 bg-bronze/[0.06] p-6 sm:p-7">
      <p className="eyebrow text-bronze">Requests to approve</p>
      <p className="mt-1 max-w-md text-sm text-ink-soft">
        Visits and time with the kids wait for your okay before they&apos;re
        confirmed. Meals and errands don&apos;t need approval.
      </p>

      {open.length === 0 ? (
        <p className="mt-5 text-sm text-ink-faint">All caught up — nothing waiting.</p>
      ) : (
        <ul className="mt-5 space-y-5">
          {open.map((r) => (
            <li key={r.id} className="border-t border-line/60 pt-5 first:border-0 first:pt-0">
              <p className="font-serif text-lg font-light text-ink">
                {r.name}
                <span className="ml-2 text-sm font-normal text-ink-soft">
                  {KIND_LABEL[r.kind] || r.kind} · {fmt(r.event_date)}
                </span>
              </p>
              {r.email && <p className="text-sm text-ink-faint">{r.email}</p>}
              {r.note && <p className="mt-1 text-sm italic text-ink-soft">&ldquo;{r.note}&rdquo;</p>}

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => act(r.id, "confirm")}
                  className="rounded-sm bg-charcoal px-4 py-2 text-xs font-semibold uppercase tracking-wide text-parchment hover:opacity-90 disabled:opacity-50"
                >
                  {busy === r.id ? "…" : "Approve"}
                </button>
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => act(r.id, "decline")}
                  className="rounded-sm border border-line-strong px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-soft hover:bg-bone disabled:opacity-50"
                >
                  Decline
                </button>
                <input
                  value={notes[r.id] || ""}
                  onChange={(e) => setNotes((s) => ({ ...s, [r.id]: e.target.value }))}
                  placeholder="Note if declining (optional)"
                  aria-label="Note if declining (optional)"
                  maxLength={400}
                  className="field flex-1 min-w-[12rem] text-sm"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {Object.keys(done).length > 0 && (
        <p className="mt-5 text-sm text-ink-faint">
          {Object.values(done).filter((v) => v === "confirmed").length} approved ·{" "}
          {Object.values(done).filter((v) => v === "declined").length} declined. They&apos;ve been emailed.
        </p>
      )}
    </section>
  );
}
