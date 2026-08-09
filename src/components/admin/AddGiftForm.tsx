"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addGift, type AdminState } from "@/app/admin/actions";

const initial: AdminState = { ok: false, message: "" };

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-clay px-6 py-2.5 font-semibold text-cream-soft shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-clay-dark disabled:opacity-60"
    >
      {pending ? "Adding…" : "Add gift"}
    </button>
  );
}

const inputClass =
  "w-full rounded-xl border border-line-strong bg-cream px-3 py-2 text-ink outline-none focus:border-clay focus:ring-2 focus:ring-clay/25";

export default function AddGiftForm() {
  const [state, action] = useFormState(addGift, initial);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-semibold text-ink">
          Gift name
        </label>
        <input
          name="title"
          required
          placeholder="e.g. A week of private-chef meal prep"
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">
          Goal amount{" "}
          <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <input name="cost" inputMode="decimal" placeholder="e.g. 500" className={inputClass} />
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
          Direct link for this gift{" "}
          <span className="font-normal text-ink-soft">
            (optional — e.g. a specific GoFundMe)
          </span>
        </label>
        <input
          name="link"
          placeholder="Venmo / PayPal / GoFundMe / Stripe link"
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-semibold text-ink">
          Description{" "}
          <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <input
          name="description"
          placeholder="A short description of the gift"
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
