"use client";

import { useState } from "react";

export type AiContext = {
  displayName: string;
  honoring: string;
  town: string;
  hasKids: boolean;
};

// A textarea with two gentle helpers above it:
//  • "Write it for me" — drafts the message with AI from a few optional notes
//  • "Use a standard message" — drops in an editable ready-made version
export default function MessageAssist({
  label,
  value,
  onChange,
  token,
  kind,
  context,
  template,
  notesHelp,
  notesPlaceholder,
  maxLength = 3000,
  minHeightClass = "min-h-[9rem]",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  token: string;
  kind: "intro" | "memorial" | "gift";
  context: AiContext;
  template: string;
  notesHelp?: string;
  notesPlaceholder?: string;
  maxLength?: number;
  minHeightClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onDraft() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/ai-intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, kind, notes, ...context }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out?.error || "bad");
      onChange(out.text);
      setOpen(false);
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setErr(m && m !== "bad" ? m : "Couldn't draft a message. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <label className="field-label">{label}</label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-xs font-medium text-bronze hover:underline"
          >
            ✨ Write it for me
          </button>
          <button
            type="button"
            onClick={() => onChange(template)}
            className="text-xs font-medium text-ink-faint hover:text-ink hover:underline"
          >
            Use a standard message
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-2 rounded-sm border border-line bg-bone/40 p-4">
          <p className="text-sm leading-relaxed text-ink-soft">
            {notesHelp ||
              "Share a few words to guide the draft — or leave it blank and we’ll start from the basics."}
          </p>
          <textarea
            className="field mt-3 min-h-[5rem]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={600}
            placeholder={notesPlaceholder}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={onDraft} disabled={busy} className="btn disabled:opacity-60">
              {busy ? "Writing…" : "Draft my message"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-ink-faint hover:underline"
            >
              Cancel
            </button>
          </div>
          {err && <p className="mt-2 text-sm text-bronze">{err}</p>}
          <p className="mt-3 text-xs text-ink-faint">
            A draft is just a starting point — read it over and make it yours before you save.
          </p>
        </div>
      )}

      <textarea
        className={`field mt-2 ${minHeightClass}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
      />
    </div>
  );
}
