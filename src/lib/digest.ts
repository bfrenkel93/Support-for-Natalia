import "server-only";
import { getEvents } from "./events";
import { getFamilyRequests } from "./requests";
import { getSupabase } from "./supabase";
import {
  getFamilyActiveSubscribers,
  setFamilyDigestLastSent,
} from "./subscribers";
import { sendFamilySubscriberDigest } from "./email";

const DIGEST_MIN_DAYS_BETWEEN = 56; // ~8 weeks — every couple of months
const SAMPLE_FAMILY_ID = "22222222-2222-2222-2222-222222222222";

type DigestFamily = {
  id: string;
  slug: string;
  display_name: string | null;
  honoring: string | null;
  content: { is_demo?: boolean } | null;
  digest_last_sent_at: string | null;
};

/**
 * Send each family's followers their own gentle "still here, still needed"
 * note, but only for families past the ~8-week gate (unless `force`). Each
 * family runs on its own clock. Returns a small summary.
 */
export async function runFamilyDigests(
  baseUrl: string,
  force = false
): Promise<{ families: number; sent: number; detail: Array<{ slug: string; sent: number }> }> {
  const sb = getSupabase();
  if (!sb) return { families: 0, sent: 0, detail: [] };

  const originClean = baseUrl.replace(/\/+$/, "");
  const { data } = await sb
    .from("families")
    .select("id, slug, display_name, honoring, content, digest_last_sent_at");
  const families = ((data || []) as DigestFamily[]).filter(
    (f) => f.id !== SAMPLE_FAMILY_ID && !f.content?.is_demo
  );

  const now = Date.now();
  const detail: Array<{ slug: string; sent: number }> = [];
  let totalSent = 0;

  for (const f of families) {
    const last = f.digest_last_sent_at ? Date.parse(f.digest_last_sent_at) : NaN;
    const daysSince = Number.isFinite(last)
      ? (now - last) / (1000 * 60 * 60 * 24)
      : Infinity;
    if (!force && daysSince < DIGEST_MIN_DAYS_BETWEEN) continue;

    const subs = await getFamilyActiveSubscribers(f.id);
    if (subs.length === 0) continue;

    const name = f.display_name || (f.honoring ? `${f.honoring}'s family` : "this family");
    const pageUrl = `${originClean}/${f.slug}`;
    const highlights = await buildFamilyHighlights(f.id);

    const sent = await sendFamilySubscriberDigest(
      subs.map((s) => ({ email: s.email, token: s.token })),
      pageUrl,
      name,
      highlights
    );
    await setFamilyDigestLastSent(f.id, new Date());
    totalSent += sent;
    detail.push({ slug: f.slug, sent });
  }

  return { families: detail.length, sent: totalSent, detail };
}

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
