import "server-only";
import { getSupabase, type GatheringRsvp } from "./supabase";
import { NATALIA_FAMILY_ID } from "./families";

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
    .eq("family_id", NATALIA_FAMILY_ID)
    .order("created_at", { ascending: true });
  if (error || !data) return { rows: [], total: 0, parties: 0 };
  const rows = data as GatheringRsvp[];
  const total = rows.reduce((n, r) => n + (r.party_size || 0), 0);
  return { rows, total, parties: rows.length };
}

/** Gathering RSVPs + headcount for one family (attending vs. regrets). */
export async function getFamilyGathering(familyId: string): Promise<{
  rows: GatheringRsvp[];
  total: number;
  parties: number;
  regrets: number;
}> {
  const supabase = getSupabase();
  if (!supabase) return { rows: [], total: 0, parties: 0, regrets: 0 };
  const { data, error } = await supabase
    .from("gathering_rsvps")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: true });
  if (error || !data) return { rows: [], total: 0, parties: 0, regrets: 0 };
  const rows = data as (GatheringRsvp & { attending?: boolean })[];
  // Older rows have no `attending` column value yet — treat them as attending.
  const coming = rows.filter((r) => r.attending !== false);
  const total = coming.reduce((n, r) => n + (r.party_size || 0), 0);
  return { rows, total, parties: coming.length, regrets: rows.length - coming.length };
}
