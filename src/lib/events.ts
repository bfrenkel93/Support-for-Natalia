import "server-only";
import { getSupabase, type FamilyEvent } from "./supabase";

/**
 * Family events ("Come cheer them on") — games, recitals, milestones that
 * Natalia adds from the dashboard. Unlike slots, an event allows MANY people
 * to RSVP; attendee names are shown on the (private) page so the kids see a
 * crowd. All access is server-side via the service-role key.
 */
export async function getEvents(): Promise<FamilyEvent[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("events")
    .select("*, rsvps:event_rsvps(*)")
    .order("sort_order", { ascending: true })
    .order("event_date", { ascending: true });

  if (error || !data) {
    if (error) console.error("[getEvents]", error);
    return [];
  }

  return (data as FamilyEvent[]).map((e) => ({
    ...e,
    rsvps: (e.rsvps || []).sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    ),
  }));
}

/** Events + RSVPs for one family. */
export async function getFamilyEvents(familyId: string): Promise<FamilyEvent[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("events")
    .select("*, rsvps:event_rsvps(*)")
    .eq("family_id", familyId)
    .order("sort_order", { ascending: true })
    .order("event_date", { ascending: true });

  if (error || !data) {
    if (error) console.error("[getFamilyEvents]", error);
    return [];
  }

  return (data as FamilyEvent[]).map((e) => ({
    ...e,
    rsvps: (e.rsvps || []).sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    ),
  }));
}

export async function getEvent(id: string): Promise<FamilyEvent | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("events")
    .select("*, rsvps:event_rsvps(*)")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as FamilyEvent;
}
