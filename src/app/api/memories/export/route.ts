import { isAdmin } from "@/lib/auth";
import { listMemories } from "@/lib/memories";

export const dynamic = "force-dynamic";

/**
 * Exports all written memories as a Markdown file for safekeeping.
 * Admin-only. Photos are referenced by name/count but not embedded — they can
 * be downloaded individually from the dashboard via signed URLs.
 */
export async function GET() {
  if (!isAdmin()) {
    return new Response("Not authorized.", { status: 401 });
  }

  const memories = await listMemories();

  const lines: string[] = [
    "# Memories of Joe — for the kids",
    "",
    `_Exported ${new Date().toLocaleString("en-US")} · ${memories.length} memories_`,
    "",
    "---",
    "",
  ];

  for (const m of memories) {
    const who = m.author_name || "Anonymous";
    const when = new Date(m.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    lines.push(`## From ${who} — ${when}`);
    if (m.author_email) lines.push(`*${m.author_email}*`, "");
    if (m.story) lines.push(m.story, "");
    if (m.media.length > 0) {
      lines.push(
        `_Photos (${m.media.length}): ${m.media
          .map((md) => md.file_name)
          .join(", ")}_`,
        ""
      );
    }
    lines.push("---", "");
  }

  const body = lines.join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="memories-of-joe.md"',
      "Cache-Control": "no-store",
    },
  });
}
