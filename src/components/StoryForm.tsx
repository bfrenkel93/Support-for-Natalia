"use client";

import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitMemory, type MemoryState } from "@/app/actions";

const initial: MemoryState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn disabled:opacity-50">
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
      <div className="whitespace-pre-line border-l-2 border-bronze/40 pl-4 leading-relaxed text-bronze">
        {state.message}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              formRef.current?.reset();
              setFileNames([]);
              window.location.hash = "#stories";
              window.location.reload();
            }}
            className="btn-link"
          >
            Share another memory
          </button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex flex-wrap gap-4">
        <button type="button" onClick={() => setOpen(true)} className="btn">
          Write a story
        </button>
        <button type="button" onClick={() => setOpen(true)} className="btn-ghost">
          Add photos
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div>
        <label className="field-label">Your story — written to the kids</label>
        <textarea
          name="story"
          rows={7}
          maxLength={8000}
          className="field"
          placeholder="Your dad once…"
        />
      </div>

      <div>
        <label className="field-label">Photos — optional, up to 10 · 25MB each</label>
        <input
          type="file"
          name="media"
          multiple
          accept="image/*"
          onChange={(e) => setFileNames(Array.from(e.target.files || []).map((f) => f.name))}
          className="block w-full text-sm text-ink-soft file:mr-4 file:rounded-sm file:border file:border-line-strong file:bg-transparent file:px-4 file:py-2 file:text-[0.68rem] file:font-medium file:uppercase file:tracking-wide file:text-ink hover:file:bg-bone"
        />
        {fileNames.length > 0 && (
          <ul className="mt-2 space-y-0.5 text-xs text-ink-faint">
            {fileNames.map((n, i) => (
              <li key={i}>— {n}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="field-label">Your name — optional</label>
          <input name="name" maxLength={120} autoComplete="name" className="field" placeholder="So the kids know who this is from" />
        </div>
        <div>
          <label className="field-label">Email — optional</label>
          <input name="email" type="email" autoComplete="email" className="field" placeholder="you@example.com" />
        </div>
      </div>

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
