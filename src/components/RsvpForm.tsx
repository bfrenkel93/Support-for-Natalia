"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { rsvpEvent, type RsvpState } from "@/app/actions";

const initial: RsvpState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-clay px-5 py-2 font-semibold text-cream-soft shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Adding you…" : "Yes, I'll be there"}
    </button>
  );
}

export default function RsvpForm({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(rsvpEvent, initial);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && firstRef.current) firstRef.current.focus();
  }, [open]);

  if (state.ok && state.eventId === eventId) {
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
        className="rounded-full bg-clay px-5 py-2 font-semibold text-cream-soft shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-clay-dark"
      >
        Count me in
      </button>
    );
  }

  const showError = !state.ok && state.message && state.eventId === eventId;

  return (
    <form action={formAction} className="w-full space-y-3">
      <input type="hidden" name="eventId" value={eventId} />
      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">
          Your name<span className="text-clay"> *</span>
        </label>
        <input
          ref={firstRef}
          name="name"
          required
          maxLength={120}
          autoComplete="name"
          className="w-full rounded-xl border border-line-strong bg-cream px-3 py-2 text-ink outline-none focus:border-clay focus:ring-2 focus:ring-clay/25"
          placeholder="First and last name"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">
          Note <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <input
          name="note"
          maxLength={200}
          className="w-full rounded-xl border border-line-strong bg-cream px-3 py-2 text-ink outline-none focus:border-clay focus:ring-2 focus:ring-clay/25"
          placeholder="e.g. Bringing orange slices for the team!"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="email"
          name="email"
          className="w-full rounded-xl border border-line-strong bg-cream px-3 py-2 text-ink outline-none focus:border-clay focus:ring-2 focus:ring-clay/25"
          placeholder="Email (optional)"
          autoComplete="email"
        />
      </label>

      {showError && (
        <p className="rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay-dark">
          {state.message}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
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
