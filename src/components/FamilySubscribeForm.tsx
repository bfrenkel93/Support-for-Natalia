"use client";

import { useState, type FormEvent } from "react";

export default function FamilySubscribeForm({ slug }: { slug: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email =
      (form.elements.namedItem("email") as HTMLInputElement | null)?.value.trim() ?? "";
    if (!email) {
      setStatus("error");
      setMessage("Please enter your email.");
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out?.error || "bad");
      setStatus("done");
      setMessage(out.message || "You're on the list. 💛");
      form.reset();
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      setStatus("error");
      setMessage(m && m !== "bad" ? m : "Something went wrong. Please try again.");
    }
  }

  if (status === "done") {
    return <p className="text-bronze">{message}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        className="field flex-1"
      />
      <button type="submit" disabled={status === "sending"} className="btn shrink-0 disabled:opacity-50">
        {status === "sending" ? "…" : "Keep me posted"}
      </button>
      {status === "error" && message && (
        <p className="text-sm text-bronze sm:w-full">{message}</p>
      )}
    </form>
  );
}
