import { sendDueReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily Vercel Cron hit. Emails a gentle day-before reminder to everyone who
 * signed up to bring a meal / visit / help tomorrow, across every family, and
 * a short "coming tomorrow" heads-up to each family. Secured with CRON_SECRET.
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

  // "Tomorrow" in UTC. The cron runs mid-day UTC (~morning US), so tomorrow-UTC
  // lines up with the evening-before for US families.
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  // Allow ?date=YYYY-MM-DD for manual testing.
  const target = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("date") || "")
    ? (url.searchParams.get("date") as string)
    : tomorrow;

  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const baseUrl = process.env.SITE_URL || (host ? `${proto}://${host}` : "");

  const result = await sendDueReminders(target, baseUrl);
  return Response.json({ ok: true, date: target, ...result, ranAt: new Date().toISOString() });
}
