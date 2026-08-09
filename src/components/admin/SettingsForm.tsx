"use client";

import { useFormState, useFormStatus } from "react-dom";
import { saveSettings, type AdminState } from "@/app/admin/actions";
import { SETTING_LABELS, MULTILINE_SETTINGS } from "@/lib/content";

const initial: AdminState = { ok: false, message: "" };
const MULTILINE = MULTILINE_SETTINGS;

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn disabled:opacity-50">
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
    <form action={action} className="space-y-6">
      {keys.map((key) => (
        <div key={key}>
          <label className="field-label">{SETTING_LABELS[key]}</label>
          {MULTILINE.has(key) ? (
            <textarea name={`setting__${key}`} defaultValue={settings[key] ?? ""} rows={5} className="field" />
          ) : (
            <input name={`setting__${key}`} defaultValue={settings[key] ?? ""} className="field" />
          )}
        </div>
      ))}

      <div className="flex items-center gap-5">
        <SaveButton />
        {state.message && (
          <span className={`text-sm ${state.ok ? "text-bronze" : "text-bronze"}`}>
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
