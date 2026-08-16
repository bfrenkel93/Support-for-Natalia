import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Insert an RSVP and return its cancel_token — but never let a missing column
 * break the save. If the cancel_token column doesn't exist yet (migration 015
 * not run), the token-returning insert fails; we then insert plainly so the
 * RSVP is still recorded, just without a self-service cancel link. Fail-safe by
 * design: saving the RSVP always takes priority over the cancel feature.
 */
export async function insertRsvpWithToken(
  sb: SupabaseClient,
  table: "gathering_rsvps" | "event_rsvps",
  row: Record<string, unknown>
): Promise<{ cancelToken: string | null; error: unknown }> {
  const withToken = await sb
    .from(table)
    .insert(row)
    .select("cancel_token")
    .single();

  if (!withToken.error) {
    const token = (withToken.data as { cancel_token?: string } | null)?.cancel_token;
    return { cancelToken: token ?? null, error: null };
  }

  console.warn(
    `[rsvp] "${table}" cancel_token unavailable (run migration 015?):`,
    withToken.error.message
  );
  const plain = await sb.from(table).insert(row);
  return { cancelToken: null, error: plain.error };
}
