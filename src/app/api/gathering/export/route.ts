import { isAdmin } from "@/lib/auth";
import { getGatheringRsvps } from "@/lib/gathering";

export const dynamic = "force-dynamic";

function csvCell(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

/** Admin-only CSV of the gathering guest list. */
export async function GET() {
  if (!isAdmin()) return new Response("Not authorized.", { status: 401 });

  const { rows, total } = await getGatheringRsvps();
  const header = ["Name", "Party size", "Email", "Note", "RSVP'd"].map(csvCell).join(",");
  const body = rows
    .map((r) =>
      [
        r.name,
        String(r.party_size),
        r.email || "",
        r.note || "",
        new Date(r.created_at).toLocaleString("en-US"),
      ]
        .map(csvCell)
        .join(",")
    )
    .join("\n");
  const csv = `${header}\n${body}\n\n"Total attending",${total}\n`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="gathering-rsvps.csv"',
      "Cache-Control": "no-store",
    },
  });
}
