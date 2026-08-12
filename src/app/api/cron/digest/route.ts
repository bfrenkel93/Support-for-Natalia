import { runFamilyDigests } from "@/lib/digest";
import { resolveBaseUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Manual/standalone digest trigger (kept for testing). The scheduled run now
 * lives in /api/cron/weekly so we stay within the platform's cron-job limit.
 * Secured with CRON_SECRET. Pass ?force=1 to ignore the ~8-week gate.
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

  const baseUrl = resolveBaseUrl(req);
  const force = url.searchParams.get("force") === "1";

  const result = await runFamilyDigests(baseUrl, force);
  return Response.json({ ok: true, ...result, ranAt: new Date().toISOString() });
}
