import "server-only";
import { getSupabase, type ActivityIdea } from "./supabase";
import { NATALIA_FAMILY_ID } from "./families";

/** Admin-curated ideas for things to do with the kids. */
export async function getActivityIdeas(): Promise<ActivityIdea[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("activity_ideas")
    .select("*")
    .eq("family_id", NATALIA_FAMILY_ID)
    .order("sort_order", { ascending: true })
    .order("event_date", { ascending: true });
  if (error || !data) {
    if (error) console.error("[getActivityIdeas]", error);
    return [];
  }
  return data as ActivityIdea[];
}
