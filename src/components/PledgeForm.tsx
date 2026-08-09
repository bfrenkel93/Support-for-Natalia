"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { pledgeGift, type PledgeState } from "@/app/actions";

const initial: PledgeState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-sage px-5 py-2 font-semibold text-cream-soft shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-sage-dark disabled:opacity-60"
    >
      {pending ? "Saving…" : "Log my contribution"}
    </button>
  );
}

const inputClass =
  "w-full rounded-xl border border-line-strong bg-cream px-3 py-2 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/25";

export default function PledgeForm({ giftId }: { giftId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(pledgeGift, initial);

  if (state.ok && state.giftId === giftId) {
    return (
      <p className="rounded-xl bg-sage-light/60 px-4 py-3 text-sm text-sage-dark">
        {state.message}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-sage-dark underline underline-offset-2 hover:text-sage"
      >
        Already gave? Log it here
      </button>
    );
  }

  const showError = !state.ok && state.message && state.giftId === giftId;

  return (
    <form action={formAction} className="w-full space-y-3 rounded-xl border border-line bg-cream p-4">
      <input type="hidden" name="giftId" value={giftId} />
      <p className="text-sm text-ink-soft">
        Let everyone know you chipped in (this just helps us track the gift — it
        doesn&apos;t collect any money).
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="name"
          required
          maxLength={120}
          placeholder="Your name"
          autoComplete="name"
          className={inputClass}
        />
        <input
          name="amount"
          inputMode="decimal"
          placeholder="Amount (optional)"
          className={inputClass}
        />
      </div>
      <input
        name="note"
        maxLength={200}
        placeholder="Note (optional)"
        className={inputClass}
      />
      <input
        name="email"
        type="email"
        placeholder="Email (optional)"
        autoComplete="email"
        className={inputClass}
      />
      {showError && (
        <p className="rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay-dark">
          {state.message}
        </p>
      )}
      <div className="flex items-center gap-3">
        <SubmitButton />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-ink-soft underline underline-offset-2 hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
