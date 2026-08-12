import "server-only";
import { getSupabase, type Booking } from "./supabase";

export const KIND_LABEL: Record<Booking["kind"], string> = {
  kids: "Time with the kids",
  meal: "Meal for Natalia",
  visit: "Visit / company",
  errand: "Errand / help",
};

/** All bookings from today onward, ordered by date. */
export async function getBookings(): Promise<Booking[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("event_date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data) {
    if (error) console.error("[getBookings]", error);
    return [];
  }
  return data as Booking[];
}

// Family-neutral labels for the multi-tenant family pages.
export const FAMILY_KIND_LABEL: Record<Booking["kind"], string> = {
  kids: "Time with the kids",
  meal: "A meal",
  visit: "A visit",
  errand: "An errand / help",
};

/** Upcoming (today onward), non-declined bookings for one family. */
export async function getFamilyBookings(familyId: string): Promise<Booking[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("family_id", familyId)
    .gte("event_date", today)
    .neq("status", "declined")
    .order("event_date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data) {
    if (error) console.error("[getFamilyBookings]", error);
    return [];
  }
  return data as Booking[];
}
