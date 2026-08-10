import {
  getActiveSubscribers,
  getDigestLastSent,
  setDigestLastSent,
} from "@/lib/subscribers";
import { buildHighlights } from "@/lib/digest";
import { sendSubscriberDigest } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MIN_DAYS_BETWEEN = 56; // ~8 weeks — genuinely every couple of months

/**
 * Weekly Vercel Cron hit; actually sends only when it's been ~8+ weeks since the
 * last digest, so subscribers hear from us every couple of months, never more.
 * Secured with CRON_SECRET.
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

  const last = await getDigestLastSent();
  const daysSince = last
    ? (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;
  if (daysSince < MIN_DAYS_BETWEEN) {
    return Response.json({ ok: true, skipped: true, daysSince: Math.round(daysSince) });
  }

  const subs = await getActiveSubscribers();
  if (subs.length === 0) {
    return Response.json({ ok: true, sent: 0, note: "no subscribers" });
  }

  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const baseUrl = process.env.SITE_URL || (host ? `${proto}://${host}` : "");

  const highlights = await buildHighlights();
  const sent = await sendSubscriberDigest(
    subs.map((s) => ({ email: s.email, token: s.token })),
    baseUrl,
    highlights
  );
  await setDigestLastSent(new Date());

  return Response.json({ ok: true, sent, ranAt: new Date().toISOString() });
}
