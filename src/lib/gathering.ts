import "server-only";
import { getSupabase, type GatheringRsvp } from "./supabase";

/** All gathering RSVPs plus the running headcount (sum of party sizes). */
export async function getGatheringRsvps(): Promise<{
  rows: GatheringRsvp[];
  total: number;
  parties: number;
}> {
  const supabase = getSupabase();
  if (!supabase) return { rows: [], total: 0, parties: 0 };
  const { data, error } = await supabase
    .from("gathering_rsvps")
    .select("*")
    .order("created_at", { ascending: true });
  if (error || !data) return { rows: [], total: 0, parties: 0 };
  const rows = data as GatheringRsvp[];
  const total = rows.reduce((n, r) => n + (r.party_size || 0), 0);
  return { rows, total, parties: rows.length };
}
