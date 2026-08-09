"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addSlot, type AdminState } from "@/app/admin/actions";

const initial: AdminState = { ok: false, message: "" };

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn disabled:opacity-50">
      {pending ? "Adding…" : "Add slot"}
    </button>
  );
}

export default function AddSlotForm() {
  const [state, action] = useFormState(addSlot, initial);

  return (
    <form action={action} className="grid gap-6 sm:grid-cols-2">
      <div>
        <label className="field-label">Section</label>
        <select name="category" defaultValue="kids" className="field">
          <option value="kids">Visits for the Kids</option>
          <option value="support">Support for Natalia</option>
        </select>
      </div>

      <div>
        <label className="field-label">Date — optional</label>
        <input type="date" name="event_date" className="field" />
      </div>

      <div>
        <label className="field-label">Label — shown with / instead of the date</label>
        <input name="label" placeholder="e.g. Weekend of Sept 12–13" className="field" />
      </div>

      <div>
        <label className="field-label">Sort order — low = first</label>
        <input type="number" name="sort_order" defaultValue={0} className="field" />
      </div>

      <div className="sm:col-span-2">
        <label className="field-label">Description — optional</label>
        <input name="description" placeholder="e.g. Afternoon activity with the kids" className="field" />
      </div>

      <div className="flex items-center gap-5 sm:col-span-2">
        <AddButton />
        {state.message && <span className="text-sm text-bronze">{state.message}</span>}
      </div>
    </form>
  );
}
