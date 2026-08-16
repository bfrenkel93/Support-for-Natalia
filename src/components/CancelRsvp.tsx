"use client";

import { useState } from "react";

export default function CancelRsvp({
  token,
  type,
  name,
}: {
  token: string;
  type: string;
  name: string;
}) {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");

  async function cancel() {
    if (status === "working") return;
    setStatus("working");
    try {
      const res = await fetch("/api/rsvp-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, type }),
      });
      const out = await res.json().catch(() => ({}));
      setStatus(out.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="mt-6 rounded-lg border border-bronze/40 bg-bone/50 px-5 py-4 text-sm leading-relaxed text-ink-soft">
        Your RSVP has been canceled. Thank you for letting them know — it truly
        helps. 💛
      </p>
    );
  }

  return (
    <div className="mt-6">
      <button
        onClick={cancel}
        disabled={status === "working"}
        className="rounded-sm bg-charcoal px-6 py-3 text-xs font-semibold uppercase tracking-wide text-parchment disabled:opacity-50"
      >
        {status === "working" ? "Canceling…" : "Yes, cancel my RSVP"}
      </button>
      {status === "error" && (
        <p className="mt-3 text-sm text-red-700">
          Something went wrong. Please try again in a moment.
        </p>
      )}
      {name && (
        <p className="mt-3 text-xs text-ink-faint">
          This cancels the RSVP for {name}.
        </p>
      )}
    </div>
  );
}
