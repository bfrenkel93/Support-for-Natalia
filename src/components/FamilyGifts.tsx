"use client";

import { useState, type FormEvent } from "react";

type GiftLite = {
  id: string;
  title: string;
  description: string | null;
  cost: number | null;
  pledgeCount: number;
  pledgedTotal: number;
};
type Pay = { venmo?: string; cashapp?: string; zelle?: string };

function GiftCard({ slug, gift }: { slug: string; gift: GiftLite }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
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
      const res = await fetch("/api/pledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          giftId: gift.id,
          name,
          amount: get("amount"),
          note: get("note"),
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out?.error || "bad");
      setStatus("done");
      setMessage(out.message || "Thank you. 💛");
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      setStatus("error");
      setMessage(m && m !== "bad" ? m : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="rounded-sm border border-line p-5 text-left">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-lg font-light text-ink">{gift.title}</h3>
        {gift.cost ? <span className="shrink-0 text-sm text-ink-faint">${gift.cost}</span> : null}
      </div>
      {gift.description && <p className="mt-1 text-sm leading-relaxed text-ink-soft">{gift.description}</p>}
      {gift.pledgeCount > 0 && (
        <p className="mt-2 text-xs text-ink-faint">
          {gift.pledgeCount} chipping in
          {gift.pledgedTotal > 0 ? ` · $${gift.pledgedTotal} so far` : ""}
        </p>
      )}

      {status === "done" ? (
        <p className="mt-3 text-sm text-bronze">{message}</p>
      ) : open ? (
        <form onSubmit={submit} className="mt-4 grid gap-3">
          <input name="name" required placeholder="Your name" className="field" />
          <div className="grid grid-cols-2 gap-3">
            <input name="amount" placeholder="Amount (optional)" className="field" inputMode="decimal" />
            <input name="note" placeholder="Note (optional)" className="field" />
          </div>
          {status === "error" && <p className="text-sm text-bronze">{message}</p>}
          <div className="flex items-center gap-4">
            <button type="submit" disabled={status === "sending"} className="btn disabled:opacity-50">
              {status === "sending" ? "…" : "I’ll chip in"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-link">Cancel</button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="btn-ghost mt-4">
          Chip in
        </button>
      )}
    </div>
  );
}

export default function FamilyGifts({
  slug,
  gifts,
  pay,
  intro,
}: {
  slug: string;
  gifts: GiftLite[];
  pay: Pay;
  intro?: string;
}) {
  const hasPay = pay.venmo || pay.cashapp || pay.zelle;
  return (
    <div>
      {intro && <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-ink-soft">{intro}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {gifts.map((g) => (
          <GiftCard key={g.id} slug={slug} gift={g} />
        ))}
      </div>
      {hasPay && (
        <div className="mt-8">
          <p className="eyebrow mb-2">Ways to send it</p>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-ink-soft">
            {pay.venmo && <li>Venmo · {pay.venmo}</li>}
            {pay.cashapp && <li>Cash App · {pay.cashapp}</li>}
            {pay.zelle && <li>Zelle · {pay.zelle}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
