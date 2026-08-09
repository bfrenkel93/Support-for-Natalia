"use client";

import { useFormState, useFormStatus } from "react-dom";
import { login, type AdminState } from "@/app/admin/actions";

const initial: AdminState = { ok: false, message: "" };

function Button() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-sage px-5 py-3 font-semibold text-cream-soft shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-sage-dark disabled:opacity-60"
    >
      {pending ? "Checking…" : "Enter"}
    </button>
  );
}

export default function LoginForm({ passwordSet }: { passwordSet: boolean }) {
  const [state, action] = useFormState(login, initial);

  return (
    <div className="mx-auto max-w-sm px-4 py-24">
      <div className="rounded-xl2 border border-cream-deep bg-cream-soft p-8 shadow-soft">
        <h1 className="font-serif text-2xl text-ink">Family admin</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Enter the password to manage sign-ups and edit the page.
        </p>

        {!passwordSet && (
          <p className="mt-4 rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay-dark">
            No admin password is set yet. Add <code>ADMIN_PASSWORD</code> to your
            environment variables, then reload.
          </p>
        )}

        <form action={action} className="mt-6 space-y-4">
          <input
            name="password"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            className="w-full rounded-xl border border-cream-deep bg-cream px-3 py-2 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
            placeholder="Password"
          />
          {!state.ok && state.message && (
            <p className="rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay-dark">
              {state.message}
            </p>
          )}
          <Button />
        </form>
      </div>
    </div>
  );
}
