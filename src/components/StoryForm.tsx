"use client";

import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitMemory, type MemoryState } from "@/app/actions";

const initial: MemoryState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-clay px-6 py-3 font-semibold text-cream-soft shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Sharing…" : "Share this memory"}
    </button>
  );
}

export default function StoryForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(submitMemory, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);

  if (state.ok) {
    return (
      <div className="mt-6 whitespace-pre-line rounded-xl2 border border-sage/40 bg-sage-light/50 px-5 py-4 leading-relaxed text-sage-dark">
        {state.message}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              formRef.current?.reset();
              setFileNames([]);
              // Reload to reset the form action state for another submission.
              window.location.hash = "#stories";
              window.location.reload();
            }}
            className="text-sm font-semibold underline underline-offset-2"
          >
            Share another memory
          </button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-clay px-6 py-3 font-semibold text-cream-soft shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-clay-dark"
        >
          Write a story
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-clay/50 px-6 py-3 font-semibold text-clay-dark transition-colors hover:bg-clay/10"
        >
          Add photos
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-6 space-y-4 rounded-xl2 border border-cream-deep bg-cream-soft p-5 sm:p-6"
    >
      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">
          Your story{" "}
          <span className="font-normal text-ink-soft">
            (write it to the kids)
          </span>
        </label>
        <textarea
          name="story"
          rows={7}
          maxLength={8000}
          className="w-full rounded-xl border border-cream-deep bg-cream px-3 py-2 text-ink outline-none focus:border-clay focus:ring-2 focus:ring-clay/25"
          placeholder="Your dad once…"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">
          Photos{" "}
          <span className="font-normal text-ink-soft">
            (optional — up to 10, 25MB each)
          </span>
        </label>
        <input
          type="file"
          name="media"
          multiple
          accept="image/*"
          onChange={(e) =>
            setFileNames(Array.from(e.target.files || []).map((f) => f.name))
          }
          className="block w-full text-sm text-ink-soft file:mr-4 file:rounded-full file:border-0 file:bg-clay/15 file:px-4 file:py-2 file:font-semibold file:text-clay-dark hover:file:bg-clay/25"
        />
        {fileNames.length > 0 && (
          <ul className="mt-2 space-y-0.5 text-xs text-ink-soft">
            {fileNames.map((n, i) => (
              <li key={i}>📷 {n}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">
            Your name{" "}
            <span className="font-normal text-ink-soft">(optional)</span>
          </label>
          <input
            name="name"
            maxLength={120}
            autoComplete="name"
            className="w-full rounded-xl border border-cream-deep bg-cream px-3 py-2 text-ink outline-none focus:border-clay focus:ring-2 focus:ring-clay/25"
            placeholder="So the kids know who this is from"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">
            Email{" "}
            <span className="font-normal text-ink-soft">(optional)</span>
          </label>
          <input
            name="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-cream-deep bg-cream px-3 py-2 text-ink outline-none focus:border-clay focus:ring-2 focus:ring-clay/25"
            placeholder="you@example.com"
          />
        </div>
      </div>

      {!state.ok && state.message && (
        <p className="rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay-dark">
          {state.message}
        </p>
      )}

      <div className="flex items-center gap-4 pt-1">
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
