import { ingestEvents } from "@/lib/weekend/ingest";
import { runFamilyDigests } from "@/lib/digest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Combined weekly Vercel Cron. Runs both Monday jobs in one endpoint so the
 * project stays within the platform's cron-job limit:
 *   1. Refresh the automated "weekend ideas" events cache.
 *   2. Send any family digests that are due (~every 8 weeks per family).
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

  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const baseUrl = process.env.SITE_URL || (host ? `${proto}://${host}` : "");

  // Refresh events first, then send due digests. Each is isolated so one
  // failing never blocks the other.
  let events: unknown = null;
  try {
    events = await ingestEvents();
  } catch (err) {
    console.error("[cron/weekly] event refresh failed", err);
    events = { error: "event refresh failed" };
  }

  let digests: unknown = null;
  try {
    digests = await runFamilyDigests(baseUrl, false);
  } catch (err) {
    console.error("[cron/weekly] digests failed", err);
    digests = { error: "digests failed" };
  }

  return Response.json({ ok: true, events, digests, ranAt: new Date().toISOString() });
}
