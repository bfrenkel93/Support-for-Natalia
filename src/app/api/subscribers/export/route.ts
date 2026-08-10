import { isAdmin } from "@/lib/auth";
import { getAllSubscribers } from "@/lib/subscribers";

export const dynamic = "force-dynamic";

function cell(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

/** Admin-only CSV of subscribers. */
export async function GET() {
  if (!isAdmin()) return new Response("Not authorized.", { status: 401 });
  const rows = await getAllSubscribers();
  const header = ["Email", "Status", "Joined"].map(cell).join(",");
  const body = rows
    .map((r) =>
      [
        r.email,
        r.unsubscribed_at ? "unsubscribed" : "active",
        new Date(r.created_at).toLocaleString("en-US"),
      ]
        .map(cell)
        .join(",")
    )
    .join("\n");
  return new Response(`${header}\n${body}\n`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="subscribers.csv"',
      "Cache-Control": "no-store",
    },
  });
}
