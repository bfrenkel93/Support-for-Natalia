import { getSupabase } from "@/lib/supabase";
import {
  getFamilyActiveSubscribers,
  setFamilyDigestLastSent,
} from "@/lib/subscribers";
import { buildFamilyHighlights } from "@/lib/digest";
import { sendFamilySubscriberDigest } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MIN_DAYS_BETWEEN = 56; // ~8 weeks — genuinely every couple of months
const SAMPLE_FAMILY_ID = "22222222-2222-2222-2222-222222222222";

type FamilyLite = {
  id: string;
  slug: string;
  display_name: string | null;
  honoring: string | null;
  content: { is_demo?: boolean } | null;
  digest_last_sent_at: string | null;
};

/**
 * Weekly Vercel Cron hit. Walks every family and, for any whose followers
 * haven't heard from them in ~8+ weeks, sends that family's subscribers a
 * gentle "still here, still needed" note about their family only. Each family
 * is on its own independent clock. Secured with CRON_SECRET.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: "CRON_SECRET not set" }, { status: 500 });
  }
  const auth = req.headers.get("authorization");
  const url = new URL(req.url);
  const provided = auth?.replace(/^Bearer\s+/i, "") || url.searchParams.get("secret");
  if (provided !== secret) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) {
    return Response.json({ ok: false, error: "Not connected" }, { status: 503 });
  }

  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const origin = process.env.SITE_URL || (host ? `${proto}://${host}` : "");
  const originClean = origin.replace(/\/+$/, "");

  // Optional ?force=1 ignores the 8-week gate (manual testing).
  const force = url.searchParams.get("force") === "1";

  const { data } = await sb
    .from("families")
    .select("id, slug, display_name, honoring, content, digest_last_sent_at");
  const families = ((data || []) as FamilyLite[]).filter(
    (f) => f.id !== SAMPLE_FAMILY_ID && !f.content?.is_demo
  );

  const now = Date.now();
  const results: Array<{ slug: string; sent: number }> = [];
  let totalSent = 0;

  for (const f of families) {
    const last = f.digest_last_sent_at ? Date.parse(f.digest_last_sent_at) : NaN;
    const daysSince = Number.isFinite(last)
      ? (now - last) / (1000 * 60 * 60 * 24)
      : Infinity;
    if (!force && daysSince < MIN_DAYS_BETWEEN) continue;

    const subs = await getFamilyActiveSubscribers(f.id);
    if (subs.length === 0) continue;

    const name = f.display_name || (f.honoring ? `${f.honoring}'s family` : "this family");
    const pageUrl = `${originClean}/${f.slug}`;
    const highlights = await buildFamilyHighlights(f.id);

    const sent = await sendFamilySubscriberDigest(
      subs.map((s) => ({ email: s.email, token: s.token })),
      pageUrl,
      name,
      highlights
    );
    await setFamilyDigestLastSent(f.id, new Date());
    totalSent += sent;
    results.push({ slug: f.slug, sent });
  }

  return Response.json({
    ok: true,
    families: results.length,
    sent: totalSent,
    detail: results,
    ranAt: new Date().toISOString(),
  });
}
