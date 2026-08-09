import { getSupabase, type Slot } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import { buildIcs, getCalendarInfo } from "@/lib/calendar";

export const dynamic = "force-dynamic";

/**
 * Returns a downloadable .ics file for a single slot. Opening it adds the
 * event to Apple Calendar / iCloud, Outlook, or any other calendar app.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabase();
  if (!supabase) {
    return new Response("Calendar isn't available yet.", { status: 503 });
  }

  const { data, error } = await supabase
    .from("slots")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return new Response("Event not found.", { status: 404 });
  }

  const slot = data as Slot;
  const settings = await getSettings();
  const info = getCalendarInfo(
    slot,
    settings.family_address || "",
    settings.allergy_note || ""
  );

  if (!info) {
    return new Response("This event has no date to add.", { status: 400 });
  }

  const ics = buildIcs(info, slot.id, new Date().toISOString());

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="support-for-natalia-${slot.id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
