import { getBookingCalendarInfo, buildIcs } from "@/lib/calendar";

// Returns a downloadable .ics for a single sign-up (meal / visit / kids /
// errand). Built entirely from query params — no data lookup — so it works for
// Apple Calendar, Outlook, and anything that imports iCalendar files.
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const kind = url.searchParams.get("k") || "";
  const info = getBookingCalendarInfo({
    date: url.searchParams.get("d") || "",
    kind,
    forName: url.searchParams.get("f") || undefined,
    note: url.searchParams.get("n") || undefined,
  });
  if (!info) return new Response("Not found", { status: 404 });

  const ics = buildIcs(
    info,
    `booking-${info.startYmd}-${kind || "x"}`,
    new Date().toISOString()
  );

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="event.ics"',
      "Cache-Control": "no-store",
    },
  });
}
