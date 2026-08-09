"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addEvent, type AdminState } from "@/app/admin/actions";

const initial: AdminState = { ok: false, message: "" };

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-clay px-6 py-2.5 font-semibold text-cream-soft shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-clay-dark disabled:opacity-60"
    >
      {pending ? "Adding…" : "Add event"}
    </button>
  );
}

const inputClass =
  "w-full rounded-xl border border-line-strong bg-cream px-3 py-2 text-ink outline-none focus:border-clay focus:ring-2 focus:ring-clay/25";

export default function AddEventForm() {
  const [state, action] = useFormState(addEvent, initial);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-semibold text-ink">
          Event name
        </label>
        <input
          name="title"
          required
          placeholder="e.g. Sophia's soccer game"
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">
          Date <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <input type="date" name="event_date" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">
          Time <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <input
          name="event_time"
          placeholder="e.g. 10:00 AM"
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">
          Place <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <input
          name="location"
          placeholder="e.g. Newton South field"
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">
          Sort order{" "}
          <span className="font-normal text-ink-soft">(low = first)</span>
        </label>
        <input type="number" name="sort_order" defaultValue={0} className={inputClass} />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-semibold text-ink">
          Description{" "}
          <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <input
          name="description"
          placeholder="Anything helpful — parking, what to bring, etc."
          className={inputClass}
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
