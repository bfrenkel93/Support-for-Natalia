"use client";

import { useState } from "react";

export default function RecoverLink() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/manage/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const out = await res.json().catch(() => ({}));
      setMessage(
        out.message ||
          "If we have a page connected to that email, we’ve just sent the manage link there."
      );
    } catch {
      setMessage(
        "If we have a page connected to that email, we’ve just sent the manage link there."
      );
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <p className="mt-8 rounded-lg border border-bronze/40 bg-bone/50 px-5 py-4 text-sm leading-relaxed text-ink-soft">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 text-left">
      <label className="block text-sm font-medium text-ink">
        Lost your link? Enter the email on file for your page and we’ll send it
        again.
      </label>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded-sm border border-line-strong bg-transparent px-3 py-2.5 text-sm text-ink outline-none focus:border-bronze"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-sm bg-charcoal px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-parchment disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Email me the link"}
        </button>
      </div>
    </form>
  );
}
