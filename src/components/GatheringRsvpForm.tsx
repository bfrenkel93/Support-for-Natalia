"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { rsvpGathering, type GatheringState } from "@/app/actions";

const initial: GatheringState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn disabled:opacity-50">
      {pending ? "Sending…" : "Send RSVP"}
    </button>
  );
}

export default function GatheringRsvpForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(rsvpGathering, initial);

  if (state.ok) {
    return (
      <p className="mx-auto mt-8 max-w-md border-t border-line/70 pt-6 text-sm leading-relaxed text-bronze">
        {state.message}
      </p>
    );
  }

  if (!open) {
    return (
      <div className="mt-10">
        <button type="button" onClick={() => setOpen(true)} className="btn">
          RSVP
        </button>
        <p className="mt-3 text-sm text-ink-soft">
          Planning to come? Let us know how many so we can keep a headcount.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mx-auto mt-10 max-w-md space-y-5 border-t border-line/70 pt-8 text-left">
      <div>
        <label className="field-label">Your name<span className="text-bronze"> *</span></label>
        <input name="name" required maxLength={120} autoComplete="name" className="field" placeholder="First and last name" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label">How many in your party?</label>
          <select name="party_size" defaultValue="1" className="field">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Email — optional</label>
          <input name="email" type="email" autoComplete="email" className="field" placeholder="you@example.com" />
        </div>
      </div>
      <div>
        <label className="field-label">A note — optional</label>
        <input name="note" maxLength={200} className="field" placeholder="Anything you'd like us to know" />
      </div>
      <label className="flex items-center gap-2.5 text-sm text-ink-soft">
        <input type="checkbox" name="subscribe" className="h-4 w-4 rounded-none border-line-strong text-bronze focus:ring-bronze/40" />
        Also send me occasional updates
      </label>
      {!state.ok && state.message && (
        <p className="text-sm text-bronze">{state.message}</p>
      )}
      <div className="flex items-center gap-5 pt-1">
        <SubmitButton />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs uppercase tracking-wide text-ink-faint underline underline-offset-4 hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
