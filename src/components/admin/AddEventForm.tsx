"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addEvent, type AdminState } from "@/app/admin/actions";

const initial: AdminState = { ok: false, message: "" };

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn disabled:opacity-50">
      {pending ? "Adding…" : "Add event"}
    </button>
  );
}

export default function AddEventForm() {
  const [state, action] = useFormState(addEvent, initial);

  return (
    <form action={action} className="grid gap-6 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="field-label">Event name</label>
        <input name="title" required placeholder="e.g. Sophia's soccer game" className="field" />
      </div>
      <div>
        <label className="field-label">Date — optional</label>
        <input type="date" name="event_date" className="field" />
      </div>
      <div>
        <label className="field-label">Time — optional</label>
        <input name="event_time" placeholder="e.g. 10:00 AM" className="field" />
      </div>
      <div>
        <label className="field-label">Place — optional</label>
        <input name="location" placeholder="e.g. Newton South field" className="field" />
      </div>
      <div>
        <label className="field-label">Sort order — low = first</label>
        <input type="number" name="sort_order" defaultValue={0} className="field" />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label">Description — optional</label>
        <input name="description" placeholder="Anything helpful — parking, what to bring, etc." className="field" />
      </div>
      <div className="flex items-center gap-5 sm:col-span-2">
        <AddButton />
        {state.message && <span className="text-sm text-bronze">{state.message}</span>}
      </div>
    </form>
  );
}
