"use client";

import { useState } from "react";

export default function ApproveRequest({
  token,
  id,
  preselect,
}: {
  token: string;
  id: string;
  preselect: "confirm" | "decline" | null;
}) {
  const [status, setStatus] = useState<"idle" | "working" | "confirmed" | "declined" | "error">("idle");
  const [note, setNote] = useState("");

  async function decide(action: "confirm" | "decline") {
    if (status === "working") return;
    setStatus("working");
    try {
      const res = await fetch("/api/manage/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, id, action, note: action === "decline" ? note : "" }),
      });
      const out = await res.json().catch(() => ({}));
      setStatus(out.ok ? (action === "confirm" ? "confirmed" : "declined") : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "confirmed") {
    return (
      <p className="mt-8 rounded-lg border border-bronze/40 bg-bone/50 px-5 py-4 leading-relaxed text-ink-soft">
        Approved. We’ve let them know they’re confirmed — thank you. 💛
      </p>
    );
  }
  if (status === "declined") {
    return (
      <p className="mt-8 rounded-lg border border-line bg-bone/40 px-5 py-4 leading-relaxed text-ink-soft">
        Declined. We’ve sent them a gentle note{note ? " with your message" : ""}. No further action needed.
      </p>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => decide("confirm")}
          disabled={status === "working"}
          className={`rounded-sm px-6 py-3 text-xs font-semibold uppercase tracking-wide disabled:opacity-50 ${
            preselect === "decline"
              ? "border border-line-strong text-ink"
              : "bg-charcoal text-parchment"
          }`}
        >
          {status === "working" ? "…" : "Approve"}
        </button>
        <button
          onClick={() => decide("decline")}
          disabled={status === "working"}
          className={`rounded-sm px-6 py-3 text-xs font-semibold uppercase tracking-wide disabled:opacity-50 ${
            preselect === "decline"
              ? "bg-charcoal text-parchment"
              : "border border-line-strong text-ink"
          }`}
        >
          Decline
        </button>
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note if you decline (e.g. suggest another day)"
        className="mt-4 w-full rounded-sm border border-line bg-transparent px-3 py-2.5 text-sm text-ink outline-none focus:border-bronze"
      />
      {status === "error" && (
        <p className="mt-3 text-sm text-red-700">
          Something went wrong — this may already have been handled. You can also
          use your full dashboard link.
        </p>
      )}
    </div>
  );
}
