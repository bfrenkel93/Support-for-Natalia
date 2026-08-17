"use client";

import { useState } from "react";

/**
 * A gentle "take a breather" switch. When on, the page stops accepting new
 * visit / kids requests (meals and other help keep flowing). Reversible anytime.
 */
export default function PauseRequests({
  token,
  initialPaused,
}: {
  token: string;
  initialPaused: boolean;
}) {
  const [paused, setPaused] = useState(initialPaused);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !paused;
    try {
      const res = await fetch("/api/manage/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, paused: next }),
      });
      const out = await res.json().catch(() => ({}));
      if (out.ok) setPaused(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-bone/40 px-5 py-4">
      <p className="max-w-md text-sm text-ink-soft">
        {paused ? (
          <>
            <strong className="text-ink">New visit requests are paused.</strong>{" "}
            Meals and other help still come through. Turn this off whenever you’re
            ready for visitors again.
          </>
        ) : (
          <>
            Feeling like it’s a lot right now? You can pause new{" "}
            <strong className="text-ink">visit</strong> requests for a while —
            meals and other help keep flowing.
          </>
        )}
      </p>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className="shrink-0 rounded-sm border border-line-strong px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-soft hover:bg-bone disabled:opacity-50"
      >
        {busy ? "…" : paused ? "Resume visits" : "Pause visits"}
      </button>
    </div>
  );
}
