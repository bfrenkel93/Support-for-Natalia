"use client";

import { useState, type FormEvent } from "react";

// A quiet passcode screen shown before a code-protected family page.
export default function AccessGate({
  slug,
  displayName,
}: {
  slug: string;
  displayName: string;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, code }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out?.error || "bad");
      window.location.reload();
    } catch (e2) {
      const m = e2 instanceof Error ? e2.message : "";
      setErr(m && m !== "bad" ? m : "Couldn’t check that code. Please try again.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-20 text-center">
      <p className="eyebrow">Private page</p>
      <h1 className="mt-3 font-serif text-3xl font-light text-ink">{displayName}</h1>
      <p className="mx-auto mt-4 max-w-sm leading-relaxed text-ink-soft">
        This page is private. Please enter the access code the family shared with you.
      </p>
      <form onSubmit={onSubmit} className="mx-auto mt-8 w-full max-w-xs">
        <input
          className="field text-center"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Access code"
          autoComplete="off"
          autoFocus
          maxLength={100}
        />
        <button type="submit" disabled={busy} className="btn mt-5 w-full justify-center disabled:opacity-50">
          {busy ? "Checking…" : "Enter"}
        </button>
        {err && <p className="mt-3 text-sm text-bronze">{err}</p>}
      </form>
    </main>
  );
}
