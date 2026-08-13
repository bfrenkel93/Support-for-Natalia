"use client";

import { useFormState, useFormStatus } from "react-dom";
import { sendTestEmail, type AdminState } from "@/app/admin/actions";

const initial: AdminState = { ok: false, message: "" };

function Button() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm border border-line-strong px-3 py-1.5 text-[0.68rem] uppercase tracking-wide text-ink-soft hover:bg-bone disabled:opacity-50"
    >
      {pending ? "Sending…" : "Send test email"}
    </button>
  );
}

export default function SendTestEmailButton() {
  const [state, action] = useFormState(sendTestEmail, initial);
  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-3">
      <Button />
      {state.message && (
        <span
          className={`text-xs ${state.ok ? "text-bronze" : "text-red-700"}`}
        >
          {state.message}
        </span>
      )}
    </form>
  );
}
