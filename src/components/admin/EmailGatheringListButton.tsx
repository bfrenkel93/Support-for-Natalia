"use client";

import { useFormState, useFormStatus } from "react-dom";
import { emailGatheringList, type AdminState } from "@/app/admin/actions";

const initial: AdminState = { ok: false, message: "" };

function Button() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm border border-line-strong px-3 py-1.5 text-[0.68rem] uppercase tracking-wide text-ink-soft hover:bg-bone disabled:opacity-50"
    >
      {pending ? "Sending…" : "Email me the list"}
    </button>
  );
}

export default function EmailGatheringListButton() {
  const [state, action] = useFormState(emailGatheringList, initial);
  return (
    <form action={action} className="flex items-center gap-3">
      <Button />
      {state.message && (
        <span className="text-xs text-bronze">{state.message}</span>
      )}
    </form>
  );
}
