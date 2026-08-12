"use client";

import { useState, type FormEvent } from "react";

export default function FamilyMemoryForm({ slug }: { slug: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.append("slug", slug);

    const story = String(fd.get("story") || "").trim();
    const files = fd.getAll("media").filter((f) => f instanceof File && (f as File).size > 0);
    if (!story && files.length === 0) {
      setStatus("error");
      setMessage("Please write something or add at least one photo.");
      return;
    }

    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/memory", { method: "POST", body: fd });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out?.error || "bad");
      setStatus("done");
      setMessage(out.message || "Thank you for sharing this. 💛");
      form.reset();
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      setStatus("error");
      setMessage(m && m !== "bad" ? m : "Something went wrong. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <p className="mx-auto max-w-md whitespace-pre-line border-l-2 border-bronze/40 pl-4 text-left leading-relaxed text-bronze">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl text-left">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="field-label">Your name — optional</label>
          <input name="name" maxLength={200} autoComplete="name" className="field" placeholder="Your name" />
        </div>
        <div>
          <label className="field-label">Email — optional</label>
          <input name="email" type="email" autoComplete="email" className="field" placeholder="you@example.com" />
        </div>
      </div>

      <div className="mt-6">
        <label className="field-label">Your story or memory</label>
        <textarea
          name="story"
          rows={5}
          maxLength={8000}
          className="field min-h-[7rem]"
          placeholder="A moment, a story, something that made them them…"
        />
      </div>

      <div className="mt-6">
        <label className="field-label">Add photos — optional</label>
        <input
          type="file"
          name="media"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
          className="block w-full text-sm text-ink-soft file:mr-3 file:cursor-pointer file:rounded-sm file:border file:border-line-strong file:bg-transparent file:px-4 file:py-2 file:text-[0.72rem] file:font-medium file:uppercase file:tracking-wide file:text-ink hover:file:bg-bone"
        />
      </div>

      {status === "error" && message && (
        <p className="mt-4 text-sm text-bronze">{message}</p>
      )}

      <div className="mt-6">
        <button type="submit" disabled={status === "sending"} className="btn disabled:opacity-50">
          {status === "sending" ? "Sharing…" : "Share this"}
        </button>
      </div>
    </form>
  );
}
