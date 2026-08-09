"use client";

import { useFormState, useFormStatus } from "react-dom";
import { saveSettings, type AdminState } from "@/app/admin/actions";
import { SETTING_LABELS, MULTILINE_SETTINGS } from "@/lib/content";

const initial: AdminState = { ok: false, message: "" };

// Long-form fields render as textareas; the rest as single-line inputs.
const MULTILINE = MULTILINE_SETTINGS;

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-sage px-6 py-2.5 font-semibold text-cream-soft shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-sage-dark disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save text changes"}
    </button>
  );
}

export default function SettingsForm({
  settings,
}: {
  settings: Record<string, string>;
}) {
  const [state, action] = useFormState(saveSettings, initial);
  const keys = Object.keys(SETTING_LABELS);

  return (
    <form action={action} className="space-y-5">
      {keys.map((key) => (
        <div key={key}>
          <label className="mb-1 block text-sm font-semibold text-ink">
            {SETTING_LABELS[key]}
          </label>
          {MULTILINE.has(key) ? (
            <textarea
              name={`setting__${key}`}
              defaultValue={settings[key] ?? ""}
              rows={5}
              className="w-full rounded-xl border border-cream-deep bg-cream px-3 py-2 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
            />
          ) : (
            <input
              name={`setting__${key}`}
              defaultValue={settings[key] ?? ""}
              className="w-full rounded-xl border border-cream-deep bg-cream px-3 py-2 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
            />
          )}
        </div>
      ))}

      <div className="flex items-center gap-4">
        <SaveButton />
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
