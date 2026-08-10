"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { subscribe, type SubscribeState } from "@/app/actions";

const initial: SubscribeState = { ok: false, message: "" };
const STORAGE_KEY = "sfn_subscribe_prompt";

function Button() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn shrink-0 disabled:opacity-50">
      {pending ? "…" : "Keep me posted"}
    </button>
  );
}

export default function SubscribeModal() {
  const [visible, setVisible] = useState(false);
  const [state, action] = useFormState(subscribe, initial);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (state.ok) {
      try {
        localStorage.setItem(STORAGE_KEY, "done");
      } catch {
        /* ignore */
      }
      const t = setTimeout(() => setVisible(false), 2600);
      return () => clearTimeout(t);
    }
  }, [state.ok]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Stay involved"
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={dismiss}
        className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px]"
      />
      <div className="animate-fade-up relative w-full max-w-md rounded-sm border border-line bg-parchment p-8 shadow-quiet">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-4 top-3 text-2xl leading-none text-ink-faint hover:text-ink"
        >
          ×
        </button>

        {state.ok ? (
          <p className="whitespace-pre-line py-4 leading-relaxed text-bronze">
            {state.message}
          </p>
        ) : (
          <>
            <p className="eyebrow mb-3">Stay close</p>
            <h2 className="font-serif text-2xl font-light leading-snug text-ink">
              Keep showing up for Natalia &amp; the kids
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Add your email for the occasional gentle update — a new way to
              help, or simply a reminder that they still need us. No noise;
              unsubscribe anytime.
            </p>
            <form action={action} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
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
            </form>
            {!state.ok && state.message && (
              <p className="mt-2 text-sm text-bronze">{state.message}</p>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="mt-4 text-xs uppercase tracking-wide text-ink-faint underline underline-offset-4 hover:text-ink"
            >
              Maybe later
            </button>
          </>
        )}
      </div>
    </div>
  );
}
