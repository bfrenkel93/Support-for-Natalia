"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { claimSlot, type ClaimState } from "@/app/actions";

const initialState: ClaimState = { ok: false, message: "" };

function SubmitButton({ accent }: { accent: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-full px-5 py-2 font-semibold text-cream-soft shadow-soft transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${accent}`}
    >
      {pending ? "Saving…" : "Confirm my visit"}
    </button>
  );
}

export default function SignupForm({
  slotId,
  category,
  accentBg,
}: {
  slotId: string;
  category: "kids" | "support";
  accentBg: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(claimSlot, initialState);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && firstFieldRef.current) firstFieldRef.current.focus();
  }, [open]);

  // On a successful claim the page revalidates and this card re-renders as
  // "claimed", so we don't need to manage success UI here — but if it lingers,
  // show the thank-you message.
  if (state.ok && state.slotId === slotId) {
    return (
      <p className="mt-1 whitespace-pre-line rounded-xl bg-sage-light/70 px-4 py-3 text-sm leading-relaxed text-sage-dark">
        {state.message}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-full px-5 py-2 font-semibold text-cream-soft shadow-soft transition-transform hover:-translate-y-0.5 ${accentBg}`}
      >
        Sign up
      </button>
    );
  }

  const showError = !state.ok && state.message && state.slotId === slotId;

  return (
    <form action={formAction} className="mt-1 w-full space-y-3">
      <input type="hidden" name="slotId" value={slotId} />

      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">
          Your name
          <span className="text-clay"> *</span>
        </label>
        <input
          ref={firstFieldRef}
          name="name"
          required
          maxLength={120}
          autoComplete="name"
          className="w-full rounded-xl border border-cream-deep bg-cream-soft px-3 py-2 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
          placeholder="First and last name"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">
          Email <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <input
          name="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-xl border border-cream-deep bg-cream-soft px-3 py-2 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
          placeholder="you@example.com"
        />
        <p className="mt-1 text-xs text-ink-soft">
          Only used if we need to reach you about your date. Never shown
          publicly.
        </p>
      </div>

      {category === "support" && (
        <p className="rounded-xl bg-clay/10 px-3 py-2 text-xs text-clay-dark">
          ⚠️ If you&apos;re bringing food, please note Alexander is allergic to
          cashews &amp; pistachios.
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">
          {category === "support"
            ? "What are you bringing / planning? "
            : "A note "}
          <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <input
          name="note"
          maxLength={200}
          className="w-full rounded-xl border border-cream-deep bg-cream-soft px-3 py-2 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
          placeholder={
            category === "support"
              ? "e.g. Bringing dinner around 6pm"
              : "e.g. Planning a trip to the park"
          }
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          name="private"
          className="h-4 w-4 rounded border-cream-deep text-sage focus:ring-sage/40"
        />
        Keep my name private — just show “Claimed”
      </label>

      {showError && (
        <p className="rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay-dark">
          {state.message}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <SubmitButton accent={accentBg} />
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
