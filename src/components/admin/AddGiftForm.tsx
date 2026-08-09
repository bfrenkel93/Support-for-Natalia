"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addGift, type AdminState } from "@/app/admin/actions";

const initial: AdminState = { ok: false, message: "" };

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn disabled:opacity-50">
      {pending ? "Adding…" : "Add gift"}
    </button>
  );
}

export default function AddGiftForm() {
  const [state, action] = useFormState(addGift, initial);

  return (
    <form action={action} className="grid gap-6 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="field-label">Gift name</label>
        <input name="title" required placeholder="e.g. A week of private-chef meal prep" className="field" />
      </div>
      <div>
        <label className="field-label">Goal amount — optional</label>
        <input name="cost" inputMode="decimal" placeholder="e.g. 500" className="field" />
      </div>
      <div>
        <label className="field-label">Sort order — low = first</label>
        <input type="number" name="sort_order" defaultValue={0} className="field" />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label">Direct link for this gift — optional</label>
        <input name="link" placeholder="e.g. a specific GoFundMe" className="field" />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label">Description — optional</label>
        <input name="description" placeholder="A short description of the gift" className="field" />
      </div>
      <div className="flex items-center gap-5 sm:col-span-2">
        <AddButton />
        {state.message && <span className="text-sm text-bronze">{state.message}</span>}
      </div>
    </form>
  );
}
