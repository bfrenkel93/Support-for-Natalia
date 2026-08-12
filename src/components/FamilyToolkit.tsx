"use client";

import { useState, type FormEvent } from "react";

type BookingLite = {
  event_date: string;
  kind: string;
  name: string;
  private: boolean;
};

const BASE_OPTIONS = [
  { value: "meal", label: "Bring a meal" },
  { value: "visit", label: "Visit / spend time" },
  { value: "errand", label: "Run an errand / help out" },
];
const KIDS_OPTION = { value: "kids", label: "Spend time with the kids" };

const KIND_SHORT: Record<string, string> = {
  meal: "Meal",
  visit: "Visit",
  errand: "Errand",
  kids: "With the kids",
};

function pretty(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function FamilyToolkit({
  slug,
  hasKids,
  bookings,
}: {
  slug: string;
  hasKids: boolean;
  bookings: BookingLite[];
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const options = hasKids ? [KIDS_OPTION, ...BASE_OPTIONS] : BASE_OPTIONS;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (n: string) =>
      (form.elements.namedItem(n) as HTMLInputElement | null)?.value?.trim() ?? "";

    const data = {
      slug,
      event_date: get("event_date"),
      kind: get("kind"),
      name: get("name"),
      email: get("email"),
      note: get("note"),
      private:
        (form.elements.namedItem("private") as HTMLInputElement | null)?.checked ?? false,
    };

    if (!data.event_date || !data.name) {
      setStatus("error");
      setMessage("Please choose a day and add your name.");
      return;
    }

    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out?.error || "bad");
      setStatus("done");
      setMessage(out.message || "Thank you. 💛");
      setTimeout(() => {
        if (typeof window !== "undefined") window.location.reload();
      }, 1600);
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      setStatus("error");
      setMessage(m && m !== "bad" ? m : "Something went wrong. Please try again.");
    }
  }

  return (
    <section className="ft">
      <p className="fp-eyebrow">Ways to show up</p>

      {bookings.length > 0 && (
        <ul className="ft-list">
          {bookings.map((b, i) => (
            <li key={i}>
              <span className="ft-date">{pretty(b.event_date)}</span>
              <span className="ft-kind">{KIND_SHORT[b.kind] || b.kind}</span>
              <span className="ft-name">{b.private ? "Someone" : b.name}</span>
            </li>
          ))}
        </ul>
      )}

      {status === "done" ? (
        <p className="ft-done">{message}</p>
      ) : (
        <form className="ft-form" onSubmit={onSubmit}>
          <div className="ft-row">
            <label>
              Day
              <input type="date" name="event_date" required />
            </label>
            <label>
              What you’ll do
              <select name="kind">
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Your name
            <input name="name" required autoComplete="name" />
          </label>
          <label>
            Your email <span className="ft-opt">(optional)</span>
            <input name="email" type="email" autoComplete="email" />
          </label>
          <label>
            A note <span className="ft-opt">(optional)</span>
            <input name="note" placeholder="e.g. bringing lasagna around 6" />
          </label>
          <label className="ft-check">
            <input type="checkbox" name="private" /> Show my sign-up as “Someone”
            instead of my name
          </label>
          <button type="submit" className="ft-btn" disabled={status === "sending"}>
            {status === "sending" ? "Saving…" : "Sign up"}
          </button>
          {status === "error" && <p className="ft-err">{message}</p>}
        </form>
      )}
    </section>
  );
}
