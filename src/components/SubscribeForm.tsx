"use client";

import { useFormState, useFormStatus } from "react-dom";
import { subscribe, type SubscribeState } from "@/app/actions";

const initial: SubscribeState = { ok: false, message: "" };

function Button() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn shrink-0 disabled:opacity-50">
      {pending ? "…" : "Keep me posted"}
    </button>
  );
}

export default function SubscribeForm() {
  const [state, action] = useFormState(subscribe, initial);

  if (state.ok) {
    return (
      <p className="text-sm leading-relaxed text-bronze">{state.message}</p>
    );
  }

  return (
    <form action={action} className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="field-label">Your email</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="field"
            placeholder="you@example.com"
          />
        </div>
        <Button />
      </div>
      {!state.ok && state.message && (
        <p className="mt-2 text-sm text-bronze">{state.message}</p>
      )}
    </form>
  );
}
