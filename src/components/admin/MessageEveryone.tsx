"use client";

import { useFormState, useFormStatus } from "react-dom";
import { messageEveryone, type AdminState } from "@/app/admin/actions";

const initial: AdminState = { ok: false, message: "" };

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm bg-charcoal px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-parchment disabled:opacity-50"
    >
      {pending ? "Sending…" : "Send to everyone"}
    </button>
  );
}

export default function MessageEveryone() {
  const [state, action] = useFormState(messageEveryone, initial);
  return (
    <form action={action} className="mt-4 max-w-xl">
      <label className="field-label">Subject</label>
      <input
        name="subject"
        defaultValue="Joe’s memorial — changes to the event, please read"
        maxLength={200}
        className="field mb-4"
      />
      <label className="field-label">Message</label>
      <textarea
        name="message"
        rows={5}
        required
        maxLength={8000}
        placeholder="e.g. Joe's memorial start time has changed — it's now 3:00pm on Saturday, same place. Everything else is the same. See you there. 💛"
        className="field mb-4"
      />
      <div className="flex flex-wrap items-center gap-4">
        <SendButton />
        {state.message && (
          <span className={`text-sm ${state.ok ? "text-bronze" : "text-red-700"}`}>
            {state.message}
          </span>
        )}
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Goes to everyone who RSVP&apos;d (and left an email) plus your followers —
        merged, no duplicates. Sent privately (BCC); replies come to you.
      </p>
    </form>
  );
}
