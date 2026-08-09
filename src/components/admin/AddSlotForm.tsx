"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addSlot, type AdminState } from "@/app/admin/actions";

const initial: AdminState = { ok: false, message: "" };

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-softblue px-6 py-2.5 font-semibold text-cream-soft shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-softblue-dark disabled:opacity-60"
    >
      {pending ? "Adding…" : "Add slot"}
    </button>
  );
}

export default function AddSlotForm() {
  const [state, action] = useFormState(addSlot, initial);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">
          Section
        </label>
        <select
          name="category"
          defaultValue="kids"
          className="w-full rounded-xl border border-cream-deep bg-cream px-3 py-2 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
        >
          <option value="kids">Visits for the Kids</option>
          <option value="support">Support for Natalia</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">
          Date <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <input
          type="date"
          name="event_date"
          className="w-full rounded-xl border border-cream-deep bg-cream px-3 py-2 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">
          Label{" "}
          <span className="font-normal text-ink-soft">
            (shown instead of / with the date)
          </span>
        </label>
        <input
          name="label"
          placeholder="e.g. Weekend of Sept 12–13"
          className="w-full rounded-xl border border-cream-deep bg-cream px-3 py-2 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">
          Sort order{" "}
          <span className="font-normal text-ink-soft">(low = first)</span>
        </label>
        <input
          type="number"
          name="sort_order"
          defaultValue={0}
          className="w-full rounded-xl border border-cream-deep bg-cream px-3 py-2 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-semibold text-ink">
          Description{" "}
          <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <input
          name="description"
          placeholder="e.g. Afternoon activity with the kids"
          className="w-full rounded-xl border border-cream-deep bg-cream px-3 py-2 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
        />
      </div>

      <div className="flex items-center gap-4 sm:col-span-2">
        <AddButton />
        {state.message && (
          <span
            className={`text-sm ${
              state.ok ? "text-sage-dark" : "text-clay-dark"
            }`}
          >
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
