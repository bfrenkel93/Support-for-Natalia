import "server-only";
import { getSupabase } from "./supabase";
import { DEFAULT_SETTINGS, type Settings } from "./content";

// Re-export the client-safe constants so existing imports keep working.
export {
  DEFAULT_SETTINGS,
  SETTING_LABELS,
  MULTILINE_SETTINGS,
} from "./content";
export type { Settings } from "./content";

/**
 * Loads editable text from the `settings` table, falling back to the built-in
 * defaults for any key that's missing or if the database isn't reachable.
 * Server-only — safe to read the service-role Supabase client here.
 */
export async function getSettings(): Promise<Settings> {
  const supabase = getSupabase();
  const merged: Settings = { ...DEFAULT_SETTINGS };

  if (!supabase) return merged;

  const { data, error } = await supabase.from("settings").select("key, value");
  if (error || !data) return merged;

  for (const row of data as { key: string; value: string }[]) {
    if (row.value != null) merged[row.key] = row.value;
  }
  return merged;
}
