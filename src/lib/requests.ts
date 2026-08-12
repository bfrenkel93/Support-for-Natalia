import "server-only";
import { getSupabase } from "./supabase";

export type FamilyRequest = {
  id: string;
  title: string;
  details: string | null;
  needed_date: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
};

/** All of a family's posted needs, soonest-dated first, then newest. */
export async function getFamilyRequests(
  familyId: string
): Promise<FamilyRequest[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("requests")
    .select("id, title, details, needed_date, claimed_by, claimed_at, created_at")
    .eq("family_id", familyId)
    .order("needed_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as FamilyRequest[];
}
