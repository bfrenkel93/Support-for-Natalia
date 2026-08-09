import "server-only";
import { getSupabase } from "../supabase";
import { fetchTicketmaster, type EventCandidate } from "./ticketmaster";

export type SourceResult = {
  source: string;
  status: "ok" | "error" | "skipped";
  found: number;
  imported: number;
  error?: string;
};

function isoNoMs(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function recordSource(
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
  r: SourceResult,
  attemptedAt: string
) {
  await supabase.from("event_sources").upsert(
    {
      source: r.source,
      last_attempted_at: attemptedAt,
      ...(r.status === "ok" ? { last_success_at: attemptedAt } : {}),
      events_found: r.found,
      events_imported: r.imported,
      error_message: r.error ?? null,
      status: r.status,
    },
    { onConflict: "source" }
  );
}

async function upsertCandidates(
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
  candidates: EventCandidate[],
  now: string
): Promise<number> {
  if (candidates.length === 0) return 0;
  // Note: we deliberately omit is_hidden / is_featured so admin choices survive refreshes.
  const rows = candidates.map((c) => ({ ...c, last_verified_at: now, updated_at: now }));
  const { error } = await supabase
    .from("family_events")
    .upsert(rows, { onConflict: "source,external_id" });
  if (error) throw new Error(error.message);
  return rows.length;
}

/**
 * The weekly refresh. Each source is processed independently — one failing
 * source never wipes the cache or breaks the others. Past events are pruned.
 */
export async function ingestEvents(): Promise<{ results: SourceResult[]; prunedPast: boolean }> {
  const supabase = getSupabase();
  if (!supabase) return { results: [], prunedPast: false };

  const now = new Date();
  const attemptedAt = now.toISOString();
  const startISO = isoNoMs(now);
  const endISO = isoNoMs(new Date(now.getTime() + 84 * 24 * 60 * 60 * 1000)); // +12 weeks
  const results: SourceResult[] = [];

  // --- Ticketmaster ---
  const tmKey = process.env.TICKETMASTER_API_KEY;
  if (!tmKey) {
    const r: SourceResult = {
      source: "ticketmaster",
      status: "skipped",
      found: 0,
      imported: 0,
      error: "TICKETMASTER_API_KEY not set",
    };
    results.push(r);
    await recordSource(supabase, r, attemptedAt);
  } else {
    const r: SourceResult = { source: "ticketmaster", status: "ok", found: 0, imported: 0 };
    try {
      const candidates = await fetchTicketmaster(tmKey, startISO, endISO);
      r.found = candidates.length;
      r.imported = await upsertCandidates(supabase, candidates, attemptedAt);
    } catch (err) {
      r.status = "error";
      r.error = err instanceof Error ? err.message : String(err);
      // Keep previously cached events — do NOT delete on failure.
    }
    results.push(r);
    await recordSource(supabase, r, attemptedAt);
  }

  // Prune events whose end date has passed (never show expired events).
  let prunedPast = false;
  try {
    await supabase.from("family_events").delete().lt("end_date", ymd(now));
    prunedPast = true;
  } catch (err) {
    console.error("[ingest] prune failed:", err);
  }

  return { results, prunedPast };
}
