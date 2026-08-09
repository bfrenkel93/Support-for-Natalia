import "server-only";
import { getSupabase } from "../supabase";
import { isHistoryText } from "./scoring";
import type { Category, FilterTag, Recommendation } from "./types";
import { dateInWeekend, type Weekend } from "./weekends";

export type FamilyEventRow = {
  id: string;
  source: string;
  source_url: string | null;
  official_url: string | null;
  title: string;
  short_description: string | null;
  description: string | null;
  venue: string | null;
  city: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  category: string | null;
  age_label: string | null;
  family_score: number;
  quality_score: number;
  image_url: string | null;
  is_featured: boolean;
  is_hidden: boolean;
};

const MIN_FAMILY_SCORE = 52;

function tagsFor(category: string | null, isHistory: boolean): FilterTag[] {
  const tags = new Set<FilterTag>();
  if (isHistory) tags.add("history");
  if (category === "sports") tags.add("sports");
  if (category === "performances") tags.add("performances");
  if (category === "outdoors") tags.add("outdoors");
  if (category === "museums" || category === "science" || category === "animals")
    tags.add("museums");
  if (category === "seasonal") tags.add("seasonal");
  return Array.from(tags);
}

function toRecommendation(row: FamilyEventRow): Recommendation {
  const isHistory =
    row.category === "history" ||
    isHistoryText(`${row.title} ${row.description ?? ""}`);
  return {
    id: row.id,
    title: row.title,
    venue: row.venue,
    blurb: row.short_description || row.description,
    category: (row.category as Category) || "performances",
    ageLabel: row.age_label,
    bestFor: null,
    url: row.source_url || row.official_url,
    isHistory,
    special: true,
    joeNote: false,
    tags: tagsFor(row.category, isHistory),
  };
}

/** Cached special events grouped by weekend (public: non-hidden, future, suitable). */
export async function getSpecialByWeekend(
  weekends: Weekend[]
): Promise<Map<string, Recommendation[]>> {
  const map = new Map<string, Recommendation[]>();
  const supabase = getSupabase();
  if (!supabase) return map;

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("family_events")
    .select("*")
    .eq("is_hidden", false)
    .gte("end_date", today)
    .gte("family_score", MIN_FAMILY_SCORE)
    .order("is_featured", { ascending: false })
    .order("quality_score", { ascending: false });

  if (error || !data) return map;

  for (const row of data as FamilyEventRow[]) {
    const date = row.start_date;
    if (!date) continue;
    for (const w of weekends) {
      if (dateInWeekend(date, w)) {
        const list = map.get(w.key) ?? [];
        list.push(toRecommendation(row));
        map.set(w.key, list);
      }
    }
  }
  return map;
}

export type EventsStatus = {
  upcomingCount: number;
  sources: {
    source: string;
    status: string;
    last_success_at: string | null;
    last_attempted_at: string | null;
    events_imported: number;
    error_message: string | null;
  }[];
};

/** Admin: source health + upcoming count. */
export async function getEventsStatus(): Promise<EventsStatus> {
  const supabase = getSupabase();
  if (!supabase) return { upcomingCount: 0, sources: [] };
  const today = new Date().toISOString().slice(0, 10);

  const [{ count }, { data: sources }] = await Promise.all([
    supabase
      .from("family_events")
      .select("id", { count: "exact", head: true })
      .eq("is_hidden", false)
      .gte("end_date", today),
    supabase.from("event_sources").select("*"),
  ]);

  return {
    upcomingCount: count ?? 0,
    sources: (sources as EventsStatus["sources"]) ?? [],
  };
}

/** Admin: all future cached events (including hidden) for the hide/pin list. */
export async function getAdminEvents(): Promise<FamilyEventRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("family_events")
    .select("*")
    .gte("end_date", today)
    .order("start_date", { ascending: true });
  return (data as FamilyEventRow[]) ?? [];
}
