import "server-only";
import { getEvents } from "./events";
import { getFamilyRequests } from "./requests";

function fmtDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Live highlights for the digest: upcoming events/needs pulled from the site. */
export async function buildHighlights(): Promise<{
  html: string;
  text: string;
  count: number;
}> {
  const today = new Date().toISOString().slice(0, 10);
  const events = (await getEvents())
    .filter((e) => e.event_date && e.event_date >= today)
    .sort((a, b) => (a.event_date! < b.event_date! ? -1 : 1))
    .slice(0, 6);

  if (events.length === 0) {
    return { html: "", text: "", count: 0 };
  }

  const rowsHtml = events
    .map(
      (e) =>
        `<li style="margin-bottom:10px;">` +
        `<strong>${escape(e.title)}</strong><br/>` +
        `<span style="color:#6B6356;">${fmtDate(e.event_date!)}` +
        `${e.event_time ? ` · ${escape(e.event_time)}` : ""}` +
        `${e.location ? ` · ${escape(e.location)}` : ""}</span>` +
        `</li>`
    )
    .join("");
  const html = `<ul style="padding-left:18px;">${rowsHtml}</ul>`;

  const text = events
    .map(
      (e) =>
        `• ${e.title} — ${fmtDate(e.event_date!)}` +
        `${e.event_time ? ` · ${e.event_time}` : ""}` +
        `${e.location ? ` · ${e.location}` : ""}`
    )
    .join("\n");

  return { html, text, count: events.length };
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Per-family digest highlights: the open needs still waiting for a helper.
 * These are the clearest "here's a concrete way to show up" items, so the
 * gentle nudge always points at something real when there is something.
 */
export async function buildFamilyHighlights(familyId: string): Promise<{
  html: string;
  text: string;
  count: number;
}> {
  const open = (await getFamilyRequests(familyId))
    .filter((r) => !r.claimed_by)
    .slice(0, 6);

  if (open.length === 0) return { html: "", text: "", count: 0 };

  const rowsHtml = open
    .map(
      (r) =>
        `<li style="margin-bottom:10px;">` +
        `<strong>${escape(r.title)}</strong>` +
        `${r.needed_date ? `<br/><span style="color:#6B6356;">by ${fmtDate(r.needed_date)}</span>` : ""}` +
        `${r.details ? `<br/><span style="color:#6B6356;">${escape(r.details)}</span>` : ""}` +
        `</li>`
    )
    .join("");
  const html = `<ul style="padding-left:18px;">${rowsHtml}</ul>`;

  const text = open
    .map(
      (r) =>
        `• ${r.title}` +
        `${r.needed_date ? ` — by ${fmtDate(r.needed_date)}` : ""}` +
        `${r.details ? ` (${r.details})` : ""}`
    )
    .join("\n");

  return { html, text, count: open.length };
}
