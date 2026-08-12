"use client";

import { useState, type FormEvent } from "react";

export default function FamilyGatheringForm({ slug }: { slug: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
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
      const res = await fetch("/api/gathering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name,
          email: get("email"),
          note: get("note"),
          party_size: Number(get("party_size") || 1),
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out?.error || "bad");
      setStatus("done");
      setMessage(out.message || "Thank you — your RSVP is in. 💛");
      form.reset();
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      setStatus("error");
      setMessage(m && m !== "bad" ? m : "Something went wrong. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <p className="mx-auto max-w-md border-l-2 border-bronze/40 pl-4 text-left leading-relaxed text-bronze">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl text-left">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="field-label">Your name<span className="text-bronze"> *</span></label>
          <input name="name" required maxLength={120} autoComplete="name" className="field" placeholder="First and last name" />
        </div>
        <div>
          <label className="field-label">How many coming?</label>
          <input name="party_size" type="number" min={1} max={30} defaultValue={1} className="field" />
        </div>
        <div>
          <label className="field-label">Email — optional</label>
          <input name="email" type="email" autoComplete="email" className="field" placeholder="you@example.com" />
        </div>
      </div>
      <div className="mt-6">
        <label className="field-label">A note — optional</label>
        <input name="note" maxLength={200} className="field" placeholder="Anything you'd like them to know" />
      </div>
      {status === "error" && message && <p className="mt-4 text-sm text-bronze">{message}</p>}
      <div className="mt-6">
        <button type="submit" disabled={status === "sending"} className="btn disabled:opacity-50">
          {status === "sending" ? "Sending…" : "RSVP"}
        </button>
      </div>
    </form>
  );
}
