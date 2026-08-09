import { ingestEvents } from "@/lib/weekend/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Weekly Vercel Cron endpoint. Secured with CRON_SECRET — Vercel Cron sends it
 * as `Authorization: Bearer <CRON_SECRET>`. Random public requests are rejected.
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

  const summary = await ingestEvents();
  return Response.json({ ok: true, ...summary, ranAt: new Date().toISOString() });
}
