"use client";

import { useState, type FormEvent } from "react";

type Req = {
  id: string;
  title: string;
  details: string | null;
  needed_date: string | null;
  claimed_by: string | null;
};

function pretty(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", timeZone: "UTC",
  });
}

function Card({ slug, req }: { slug: string; req: Req }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [claimedBy, setClaimedBy] = useState<string | null>(req.claimed_by);

  async function onClaim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/request-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, requestId: req.id, name, email }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out?.error || "bad");
      setClaimedBy(name);
      setOpen(false);
    } catch (e2) {
      const m = e2 instanceof Error ? e2.message : "";
      setErr(m && m !== "bad" ? m : "Couldn’t save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-sm border border-line bg-bone/40 p-5 text-left">
      <p className="font-serif text-lg font-light text-ink">{req.title}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-ink-faint">
        {req.needed_date ? pretty(req.needed_date) : "Anytime"}
      </p>
      {req.details && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{req.details}</p>}

      {claimedBy ? (
        <p className="mt-4 text-sm text-bronze">Covered by {claimedBy} — thank you 💛</p>
      ) : open ? (
        <form onSubmit={onClaim} className="mt-4 space-y-3">
          <input className="field" aria-label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={200} autoFocus />
          <input className="field" aria-label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" maxLength={200} />
          <div className="flex items-center gap-3">
            <button type="submit" disabled={busy} className="btn disabled:opacity-50">
              {busy ? "Sending…" : "I’ve got this"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink-faint hover:underline">
              Cancel
            </button>
          </div>
          {err && <p className="text-sm text-bronze">{err}</p>}
        </form>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="btn-ghost mt-4">
          I’ll help
        </button>
      )}
    </div>
  );
}

export default function FamilyRequests({ slug, requests }: { slug: string; requests: Req[] }) {
  if (requests.length === 0) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {requests.map((r) => (
        <Card key={r.id} slug={slug} req={r} />
      ))}
    </div>
  );
}
