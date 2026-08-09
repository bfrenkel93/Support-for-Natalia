"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addIdea, type AdminState } from "@/app/admin/actions";

const initial: AdminState = { ok: false, message: "" };

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn disabled:opacity-50">
      {pending ? "Adding…" : "Add idea"}
    </button>
  );
}

export default function AddIdeaForm() {
  const [state, action] = useFormState(addIdea, initial);

  return (
    <form action={action} className="grid gap-6 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="field-label">Idea name</label>
        <input name="title" required placeholder="e.g. Disney on Ice" className="field" />
      </div>
      <div>
        <label className="field-label">Date — optional</label>
        <input type="date" name="event_date" className="field" />
      </div>
      <div>
        <label className="field-label">Place — optional</label>
        <input name="location" placeholder="e.g. TD Garden, Boston" className="field" />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label">Link — optional (tickets / info)</label>
        <input name="url" placeholder="https://…" className="field" />
      </div>
      <div>
        <label className="field-label">Sort order — low = first</label>
        <input type="number" name="sort_order" defaultValue={0} className="field" />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label">Note — optional</label>
        <input name="note" placeholder="Anything helpful" className="field" />
      </div>
      <div className="flex items-center gap-5 sm:col-span-2">
        <AddButton />
        {state.message && <span className="text-sm text-bronze">{state.message}</span>}
      </div>
    </form>
  );
}
