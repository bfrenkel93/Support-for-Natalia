import "server-only";
import type { Category } from "./types";
import { familyScore, isHistoryText, qualityScore } from "./scoring";

export type EventCandidate = {
  source: string;
  external_id: string;
  source_url: string | null;
  official_url: string | null;
  title: string;
  short_description: string | null;
  description: string | null;
  venue: string | null;
  city: string | null;
  state: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  category: Category;
  age_label: string | null;
  family_score: number;
  quality_score: number;
  image_url: string | null;
  is_special_event: boolean;
};

// Boston City Hall, ~30mi radius covers Boston/Cambridge/Brookline + worthwhile drives.
const LATLONG = "42.3601,-71.0589";
const RADIUS = "30";
const SEGMENTS: { name: string; category: Category }[] = [
  { name: "Family", category: "performances" },
  { name: "Sports", category: "sports" },
  { name: "Arts & Theatre", category: "performances" },
];
const FAMILY_THRESHOLD = 52;

type TmImage = { url: string; width?: number; ratio?: string };
type TmEvent = {
  id: string;
  name: string;
  url?: string;
  info?: string;
  pleaseNote?: string;
  images?: TmImage[];
  dates?: { start?: { localDate?: string; localTime?: string } };
  classifications?: {
    segment?: { name?: string };
    genre?: { name?: string };
    subGenre?: { name?: string };
    family?: boolean;
  }[];
  _embedded?: {
    venues?: {
      name?: string;
      url?: string;
      city?: { name?: string };
      state?: { stateCode?: string };
    }[];
  };
};

function pickImage(images?: TmImage[]): string | null {
  if (!images || images.length === 0) return null;
  const wide = images
    .filter((i) => i.ratio === "16_9" && (i.width ?? 0) >= 640)
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  return (wide[0] ?? images[0]).url ?? null;
}

function normalize(ev: TmEvent, fallbackCategory: Category): EventCandidate | null {
  const cls = ev.classifications?.[0];
  const venue = ev._embedded?.venues?.[0];
  const segment = cls?.segment?.name ?? "";
  const text = [
    ev.name,
    segment,
    cls?.genre?.name,
    cls?.subGenre?.name,
    ev.info,
    ev.pleaseNote,
    venue?.name,
  ]
    .filter(Boolean)
    .join(" ");

  const family = familyScore(text);
  if (family < FAMILY_THRESHOLD) return null;

  const category: Category = segment === "Sports" ? "sports" : fallbackCategory;
  const isHistory = isHistoryText(text);
  const image = pickImage(ev.images);
  const startDate = ev.dates?.start?.localDate ?? null;

  return {
    source: "ticketmaster",
    external_id: ev.id,
    source_url: ev.url ?? null,
    official_url: venue?.url ?? null,
    title: ev.name,
    short_description: ev.info ? ev.info.slice(0, 240) : null,
    description: ev.pleaseNote ?? ev.info ?? null,
    venue: venue?.name ?? null,
    city: venue?.city?.name ?? null,
    state: venue?.state?.stateCode ?? null,
    start_date: startDate,
    end_date: startDate,
    start_time: ev.dates?.start?.localTime ?? null,
    category,
    age_label: cls?.family || segment === "Family" ? "All ages" : null,
    family_score: family,
    quality_score: qualityScore({
      family,
      category,
      isHistory,
      isSpecial: true,
      hasImage: Boolean(image),
    }),
    image_url: image,
    is_special_event: true,
  };
}

/**
 * Fetches family-appropriate events around Boston from the Ticketmaster
 * Discovery API for the given window. Throws on network/HTTP failure so the
 * ingester can mark the source unhealthy and keep the existing cache.
 */
export async function fetchTicketmaster(
  apiKey: string,
  startISO: string,
  endISO: string
): Promise<EventCandidate[]> {
  const byId = new Map<string, EventCandidate>();

  for (const seg of SEGMENTS) {
    const url =
      "https://app.ticketmaster.com/discovery/v2/events.json" +
      `?apikey=${encodeURIComponent(apiKey)}` +
      `&latlong=${LATLONG}&radius=${RADIUS}&unit=miles` +
      `&classificationName=${encodeURIComponent(seg.name)}` +
      `&startDateTime=${startISO}&endDateTime=${endISO}` +
      "&size=100&sort=date,asc";

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`Ticketmaster ${seg.name} returned ${res.status}`);
    }
    const json = (await res.json()) as { _embedded?: { events?: TmEvent[] } };
    const events = json._embedded?.events ?? [];
    for (const ev of events) {
      const cand = normalize(ev, seg.category);
      if (!cand) continue;
      // Keep the higher-quality version if the same event appears in two segments.
      const existing = byId.get(cand.external_id);
      if (!existing || cand.quality_score > existing.quality_score) {
        byId.set(cand.external_id, cand);
      }
    }
  }

  return Array.from(byId.values());
}
