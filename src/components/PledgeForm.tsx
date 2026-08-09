"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { pledgeGift, type PledgeState } from "@/app/actions";

const initial: PledgeState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn disabled:opacity-50">
      {pending ? "Saving…" : "Log my contribution"}
    </button>
  );
}

export default function PledgeForm({ giftId }: { giftId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(pledgeGift, initial);

  if (state.ok && state.giftId === giftId) {
    return <p className="text-sm leading-relaxed text-bronze">{state.message}</p>;
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-link">
        Already gave? Note it here
      </button>
    );
  }

  const showError = !state.ok && state.message && state.giftId === giftId;

  return (
    <form action={formAction} className="w-full max-w-md space-y-5 border-t border-line/70 pt-6">
      <input type="hidden" name="giftId" value={giftId} />
      <p className="text-sm text-ink-soft">
        Letting us know just helps track the goal — it doesn&apos;t collect any
        money.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label">Your name</label>
          <input name="name" required maxLength={120} autoComplete="name" className="field" placeholder="First and last name" />
        </div>
        <div>
          <label className="field-label">Amount — optional</label>
          <input name="amount" inputMode="decimal" className="field" placeholder="$" />
        </div>
      </div>
      <div>
        <label className="field-label">Note — optional</label>
        <input name="note" maxLength={200} className="field" placeholder="A word to Natalia" />
      </div>
      <div>
        <label className="field-label">Email — optional</label>
        <input name="email" type="email" autoComplete="email" className="field" placeholder="you@example.com" />
      </div>
      {showError && <p className="text-sm text-bronze">{state.message}</p>}
      <div className="flex items-center gap-5">
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
