"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { rsvpEvent, type RsvpState } from "@/app/actions";

const initial: RsvpState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn disabled:opacity-50">
      {pending ? "Adding you…" : "I'll be there"}
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
    return <p className="max-w-sm text-sm leading-relaxed text-bronze">{state.message}</p>;
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-link">
        Count me in →
      </button>
    );
  }

  const showError = !state.ok && state.message && state.eventId === eventId;

  return (
    <form action={formAction} className="w-full space-y-5 sm:w-80">
      <input type="hidden" name="eventId" value={eventId} />
      <div>
        <label className="field-label">
          Your name<span className="text-bronze"> *</span>
        </label>
        <input ref={firstRef} name="name" required maxLength={120} autoComplete="name" className="field" placeholder="First and last name" />
      </div>
      <div>
        <label className="field-label">Note — optional</label>
        <input name="note" maxLength={200} className="field" placeholder="e.g. Bringing orange slices" />
      </div>
      <div>
        <label className="field-label">Email — optional</label>
        <input name="email" type="email" autoComplete="email" className="field" placeholder="you@example.com" />
      </div>
      {showError && <p className="text-sm text-bronze">{state.message}</p>}
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
