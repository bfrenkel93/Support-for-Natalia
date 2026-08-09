import { getEvent } from "@/lib/events";
import { getSettings } from "@/lib/settings";
import { buildIcs, getEventCalendarInfo } from "@/lib/calendar";

export const dynamic = "force-dynamic";

/** Downloadable .ics for a family event (Apple/iCloud, Outlook, etc.). */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const event = await getEvent(params.id);
  if (!event) {
    return new Response("Event not found.", { status: 404 });
  }

  const settings = await getSettings();
  const info = getEventCalendarInfo(event, settings.family_address || "");
  if (!info) {
    return new Response("This event has no date to add.", { status: 400 });
  }

  const ics = buildIcs(info, event.id, new Date().toISOString());

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="event-${event.id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
