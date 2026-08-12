import "server-only";
import { getSupabase } from "./supabase";

/**
 * Platform-wide "impact" statistics across every family page.
 *
 * This powers the private /admin/impact dashboard. It reads aggregate
 * activity from all families (meals coordinated, memories shared, gifts,
 * memorial RSVPs, subscribers) so the platform owner can see the whole
 * picture at a glance. The built-in demo/sample page is excluded so the
 * numbers reflect real families only.
 */

// The seeded demo page (see supabase-migrations/010_sample_page.sql).
const SAMPLE_FAMILY_ID = "22222222-2222-2222-2222-222222222222";

export type FamilyImpact = {
  id: string;
  slug: string;
  name: string;
  isPublic: boolean;
  createdAt: string;
  meals: number; // calendar sign-ups (meals, visits, kid time)
  memories: number; // stories shared
  rsvps: number; // memorial headcount
  gifts: number; // pledges logged
  subscribers: number; // active followers
};

export type ImpactStats = {
  connected: boolean;
  pages: number;
  publicPages: number;
  privatePages: number;
  activePages: number; // pages with at least one bit of activity
  newPages30d: number;
  meals: number;
  mealsByKind: Record<string, number>;
  memories: number;
  photos: number;
  rsvpHeadcount: number;
  rsvpParties: number;
  giftCount: number;
  giftTotal: number;
  requests: number;
  requestsOpen: number;
  subscribers: number;
  families: FamilyImpact[];
  generatedAt: string;
};

function emptyStats(connected: boolean): ImpactStats {
  return {
    connected,
    pages: 0,
    publicPages: 0,
    privatePages: 0,
    activePages: 0,
    newPages30d: 0,
    meals: 0,
    mealsByKind: {},
    memories: 0,
    photos: 0,
    rsvpHeadcount: 0,
    rsvpParties: 0,
    giftCount: 0,
    giftTotal: 0,
    requests: 0,
    requestsOpen: 0,
    subscribers: 0,
    families: [],
    generatedAt: new Date().toISOString(),
  };
}

/** Gather every headline number for the impact dashboard in one pass. */
export async function getImpactStats(): Promise<ImpactStats> {
  const sb = getSupabase();
  if (!sb) return emptyStats(false);

  const [
    familiesRes,
    bookingsRes,
    memoriesRes,
    mediaRes,
    rsvpsRes,
    giftsRes,
    pledgesRes,
    requestsRes,
    subsRes,
  ] = await Promise.all([
    sb.from("families").select("id, slug, display_name, honoring, is_public, content, created_at"),
    sb.from("bookings").select("family_id, kind, status"),
    sb.from("memories").select("family_id"),
    sb.from("memory_media").select("family_id"),
    sb.from("gathering_rsvps").select("family_id, party_size"),
    sb.from("gifts").select("id, family_id"),
    sb.from("gift_pledges").select("gift_id, amount"),
    sb.from("requests").select("family_id, claimed_by"),
    sb.from("subscribers").select("family_id, unsubscribed_at"),
  ]);

  const stats = emptyStats(true);

  const allFamilies = (familiesRes.data || []) as Array<{
    id: string;
    slug: string;
    display_name: string | null;
    honoring: string | null;
    is_public: boolean;
    content: { is_demo?: boolean } | null;
    created_at: string;
  }>;

  // Ignore the built-in sample page everywhere.
  const demoIds = new Set(
    allFamilies.filter((f) => f.id === SAMPLE_FAMILY_ID || f.content?.is_demo).map((f) => f.id)
  );
  const isReal = (familyId: string | null | undefined) =>
    !!familyId && !demoIds.has(familyId);

  const families = allFamilies.filter((f) => !demoIds.has(f.id));

  // Per-family activity tallies, keyed by family id.
  const per = new Map<string, FamilyImpact>();
  for (const f of families) {
    per.set(f.id, {
      id: f.id,
      slug: f.slug,
      name: f.display_name || f.honoring || f.slug,
      isPublic: f.is_public,
      createdAt: f.created_at,
      meals: 0,
      memories: 0,
      rsvps: 0,
      gifts: 0,
      subscribers: 0,
    });
  }

  // Bookings → meals/visits/kid time.
  for (const b of (bookingsRes.data || []) as Array<{ family_id: string; kind: string; status: string }>) {
    if (!isReal(b.family_id)) continue;
    if (b.status === "declined") continue;
    stats.meals += 1;
    stats.mealsByKind[b.kind] = (stats.mealsByKind[b.kind] || 0) + 1;
    const row = per.get(b.family_id);
    if (row) row.meals += 1;
  }

  // Memories shared.
  for (const m of (memoriesRes.data || []) as Array<{ family_id: string }>) {
    if (!isReal(m.family_id)) continue;
    stats.memories += 1;
    const row = per.get(m.family_id);
    if (row) row.memories += 1;
  }
  for (const md of (mediaRes.data || []) as Array<{ family_id: string }>) {
    if (!isReal(md.family_id)) continue;
    stats.photos += 1;
  }

  // Memorial RSVPs (headcount + number of parties).
  for (const r of (rsvpsRes.data || []) as Array<{ family_id: string; party_size: number | null }>) {
    if (!isReal(r.family_id)) continue;
    const size = Math.max(0, Number(r.party_size) || 0);
    stats.rsvpHeadcount += size;
    if (size > 0) stats.rsvpParties += 1;
    const row = per.get(r.family_id);
    if (row) row.rsvps += size;
  }

  // Gifts: map each pledge to its gift's family, then tally.
  const giftFamily = new Map<string, string>();
  for (const g of (giftsRes.data || []) as Array<{ id: string; family_id: string }>) {
    giftFamily.set(g.id, g.family_id);
  }
  for (const p of (pledgesRes.data || []) as Array<{ gift_id: string; amount: number | null }>) {
    const familyId = giftFamily.get(p.gift_id);
    if (!isReal(familyId)) continue;
    stats.giftCount += 1;
    stats.giftTotal += Math.max(0, Number(p.amount) || 0);
    const row = familyId ? per.get(familyId) : undefined;
    if (row) row.gifts += 1;
  }

  // Requests (needs board).
  for (const q of (requestsRes.data || []) as Array<{ family_id: string; claimed_by: string | null }>) {
    if (!isReal(q.family_id)) continue;
    stats.requests += 1;
    if (!q.claimed_by) stats.requestsOpen += 1;
  }

  // Subscribers (active only).
  for (const s of (subsRes.data || []) as Array<{ family_id: string; unsubscribed_at: string | null }>) {
    if (!isReal(s.family_id)) continue;
    if (s.unsubscribed_at) continue;
    stats.subscribers += 1;
    const row = per.get(s.family_id);
    if (row) row.subscribers += 1;
  }

  // Page-level rollups.
  stats.pages = families.length;
  stats.publicPages = families.filter((f) => f.is_public).length;
  stats.privatePages = stats.pages - stats.publicPages;

  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  stats.newPages30d = families.filter((f) => {
    const t = Date.parse(f.created_at);
    return Number.isFinite(t) && t >= cutoff;
  }).length;

  const familyRows = Array.from(per.values());
  stats.activePages = familyRows.filter(
    (r) => r.meals || r.memories || r.rsvps || r.gifts || r.subscribers
  ).length;

  // Most recently created first.
  familyRows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  stats.families = familyRows;

  return stats;
}
