"use client";

import { useFormState, useFormStatus } from "react-dom";
import { login, type AdminState } from "@/app/admin/actions";

const initial: AdminState = { ok: false, message: "" };

function Button() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn w-full disabled:opacity-50">
      {pending ? "Checking…" : "Enter"}
    </button>
  );
}

export default function LoginForm({ passwordSet }: { passwordSet: boolean }) {
  const [state, action] = useFormState(login, initial);

  return (
    <div className="mx-auto max-w-sm px-6 py-28">
      <p className="eyebrow mb-3">Private</p>
      <h1 className="font-serif text-3xl font-light text-ink">Family admin</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        Enter the password to manage sign-ups, events, gifts, memories, and the
        page text.
      </p>

      {!passwordSet && (
        <p className="mt-5 border-l-2 border-bronze/50 pl-3 text-sm text-ink-soft">
          No admin password is set yet. Add <code>ADMIN_PASSWORD</code> to your
          environment variables, then reload.
        </p>
      )}

      <form action={action} className="mt-8 space-y-6">
        <div>
          <label className="field-label">Password</label>
          <input
            name="password"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            className="field"
            placeholder="••••••••"
          />
        </div>
        {!state.ok && state.message && (
          <p className="text-sm text-bronze">{state.message}</p>
        )}
        <Button />
      </form>
    </div>
  );
}
