"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { claimSlot, type ClaimState } from "@/app/actions";

const initialState: ClaimState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn disabled:opacity-50">
      {pending ? "Saving…" : "Confirm my visit"}
    </button>
  );
}

export default function SignupForm({
  slotId,
  category,
}: {
  slotId: string;
  category: "kids" | "support";
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(claimSlot, initialState);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && firstFieldRef.current) firstFieldRef.current.focus();
  }, [open]);

  if (state.ok && state.slotId === slotId) {
    return (
      <p className="max-w-sm whitespace-pre-line text-sm leading-relaxed text-bronze">
        {state.message}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-link"
      >
        Sign up →
      </button>
    );
  }

  const showError = !state.ok && state.message && state.slotId === slotId;

  return (
    <form action={formAction} className="w-full space-y-5 sm:w-80">
      <input type="hidden" name="slotId" value={slotId} />

      <div>
        <label className="field-label">
          Your name<span className="text-bronze"> *</span>
        </label>
        <input
          ref={firstFieldRef}
          name="name"
          required
          maxLength={120}
          autoComplete="name"
          className="field"
          placeholder="First and last name"
        />
      </div>

      <div>
        <label className="field-label">Email — optional</label>
        <input name="email" type="email" autoComplete="email" className="field" placeholder="you@example.com" />
        <p className="mt-1.5 text-xs text-ink-faint">
          Only used if we need to reach you. Never shown publicly.
        </p>
      </div>

      {category === "support" && (
        <p className="border-l-2 border-bronze/40 pl-3 text-xs leading-relaxed text-ink-soft">
          If you&apos;re bringing food, please note Alexander is allergic to
          cashews &amp; pistachios.
        </p>
      )}

      <div>
        <label className="field-label">
          {category === "support" ? "What you're bringing / planning" : "A note"} — optional
        </label>
        <input
          name="note"
          maxLength={200}
          className="field"
          placeholder={
            category === "support"
              ? "e.g. Bringing dinner around 6pm"
              : "e.g. Planning a trip to the park"
          }
        />
      </div>

      <label className="flex items-center gap-2.5 text-sm text-ink-soft">
        <input type="checkbox" name="private" className="h-4 w-4 rounded-none border-line-strong text-bronze focus:ring-bronze/40" />
        Keep my name private — just show “Claimed”
      </label>

      {showError && (
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
