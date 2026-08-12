"use client";

import { useState, type FormEvent } from "react";

type GiftRow = {
  id: string;
  title: string;
  description: string | null;
  cost: number | null;
};

export default function GiftManager({
  token,
  initialGifts,
}: {
  token: string;
  initialGifts: GiftRow[];
}) {
  const [gifts, setGifts] = useState<GiftRow[]>(initialGifts);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState("");

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (n: string) =>
      (form.elements.namedItem(n) as HTMLInputElement | null)?.value?.trim() ?? "";
    const title = get("title");
    if (!title) {
      setErr("Please add a title.");
      return;
    }
    setAdding(true);
    setErr("");
    try {
      const res = await fetch("/api/manage/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          title,
          description: get("description"),
          cost: get("cost"),
          link: get("link"),
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out?.error || "bad");
      setGifts((g) => [...g, out.gift]);
      form.reset();
    } catch (e2) {
      const m = e2 instanceof Error ? e2.message : "";
      setErr(m && m !== "bad" ? m : "Couldn't add that. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    if (typeof window !== "undefined" && !window.confirm("Remove this gift?")) return;
    const res = await fetch("/api/manage/gift", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, id }),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.ok) setGifts((g) => g.filter((x) => x.id !== id));
  }

  return (
    <section className="mt-14 border-t border-line/60 pt-10">
      <p className="eyebrow">Gift ideas — optional</p>
      <p className="mt-1 text-sm text-ink-faint">
        Add gifts people can chip in toward. They appear in a “Give a gift”
        section on your page.
      </p>

      {gifts.length > 0 && (
        <ul className="mt-4 space-y-2">
          {gifts.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 rounded-sm border border-line px-4 py-3 text-sm">
              <span className="text-ink">
                <span className="font-medium">{g.title}</span>
                {g.cost ? ` · $${g.cost}` : ""}
              </span>
              <button type="button" onClick={() => remove(g.id)} className="text-xs uppercase tracking-wide text-ink-faint hover:text-bronze">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="mt-4 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="title" placeholder="Gift title (e.g. A week of meals)" className="field" />
          <input name="cost" placeholder="Rough cost (optional)" className="field" inputMode="decimal" />
        </div>
        <input name="description" placeholder="A short description (optional)" className="field" />
        <input name="link" placeholder="Link (optional)" className="field" />
        {err && <p className="text-sm text-bronze">{err}</p>}
        <div>
          <button type="submit" disabled={adding} className="btn-ghost disabled:opacity-50">
            {adding ? "Adding…" : "Add gift"}
          </button>
        </div>
      </form>
    </section>
  );
}
