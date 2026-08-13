"use client";

import { useState } from "react";

type Helper = { name: string; email: string };
type State = "idle" | "sending" | "done" | "error";

/**
 * A gentle one-tap thank-you: lists everyone who signed up and left an email,
 * and sends each a warm note from the family with a single button.
 */
export default function ThankHelpers({
  helpers,
  token,
}: {
  helpers: Helper[];
  token: string;
}) {
  const [state, setState] = useState<Record<string, State>>({});

  if (!helpers || helpers.length === 0) return null;

  async function thank(h: Helper) {
    setState((s) => ({ ...s, [h.email]: "sending" }));
    try {
      const res = await fetch("/api/manage/thank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: h.email, name: h.name }),
      });
      const out = await res.json().catch(() => ({}));
      setState((s) => ({ ...s, [h.email]: out.ok ? "done" : "error" }));
    } catch {
      setState((s) => ({ ...s, [h.email]: "error" }));
    }
  }

  return (
    <section className="mt-14 border-t border-line/60 pt-10">
      <p className="eyebrow">Thank your helpers</p>
      <p className="mt-1 max-w-md text-sm text-ink-faint">
        Everyone who signed up and left an email. One tap sends them a warm
        thank-you from you.
      </p>
      <ul className="mt-5 divide-y divide-line/60">
        {helpers.map((h) => {
          const st = state[h.email] || "idle";
          return (
            <li
              key={h.email}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-ink">{h.name || "A friend"}</p>
                <p className="truncate text-sm text-ink-faint">{h.email}</p>
              </div>
              <button
                type="button"
                disabled={st === "sending" || st === "done"}
                onClick={() => thank(h)}
                className="shrink-0 rounded-sm border border-line-strong px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-wide text-ink-soft hover:bg-bone disabled:opacity-60"
              >
                {st === "done"
                  ? "Sent ✓"
                  : st === "sending"
                    ? "Sending…"
                    : st === "error"
                      ? "Try again"
                      : "Send thanks"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
