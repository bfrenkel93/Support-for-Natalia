import "server-only";
import { Resend } from "resend";
import { getSupabase } from "./supabase";
import { parseRecipients } from "./families";

/**
 * Day-before reminders. A daily cron calls sendDueReminders(), which finds
 * every sign-up happening "tomorrow" that hasn't been reminded yet, emails
 * each volunteer a gentle nudge (and the family a short heads-up of what's
 * coming), then stamps those rows so nobody is reminded twice.
 *
 * Everything fails soft: a missing email config or a single bad address can
 * never throw — the worst case is a reminder simply isn't sent.
 */

// How each kind reads inside a friendly sentence ("tomorrow you're …").
const DOING: Record<string, string> = {
  meal: "bringing a meal",
  visit: "visiting",
  kids: "spending time with the kids",
  errand: "helping with an errand",
};
const NOUN: Record<string, string> = {
  meal: "A meal",
  visit: "A visit",
  kids: "Time with the kids",
  errand: "An errand / help",
};

type BookingRow = {
  id: string;
  family_id: string;
  event_date: string;
  kind: string;
  status: string;
  name: string;
  email: string | null;
  note: string | null;
  private: boolean;
};

type FamilyRow = {
  id: string;
  slug: string;
  display_name: string | null;
  honoring: string | null;
  contact_email: string | null;
  content: { is_demo?: boolean } | null;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function prettyDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function familyLabel(f: FamilyRow): string {
  return f.display_name || (f.honoring ? `${f.honoring}'s family` : "the family");
}

/**
 * Find and send all reminders due for `targetDate` (YYYY-MM-DD). Returns a
 * small summary. Safe to call more than once a day — already-reminded rows
 * are skipped via reminder_sent_at.
 */
export async function sendDueReminders(
  targetDate: string,
  baseUrl: string
): Promise<{ volunteers: number; families: number; skipped: boolean }> {
  const sb = getSupabase();
  if (!sb) return { volunteers: 0, families: 0, skipped: true };

  const { data: bookingsData } = await sb
    .from("bookings")
    .select("id, family_id, event_date, kind, status, name, email, note, private")
    .eq("event_date", targetDate)
    .neq("status", "declined")
    .is("reminder_sent_at", null);

  let bookings = (bookingsData || []) as BookingRow[];
  if (bookings.length === 0) return { volunteers: 0, families: 0, skipped: false };

  // Pull the families these sign-ups belong to.
  const familyIds = Array.from(new Set(bookings.map((b) => b.family_id)));
  const { data: familiesData } = await sb
    .from("families")
    .select("id, slug, display_name, honoring, contact_email, content")
    .in("id", familyIds);
  const families = new Map(
    ((familiesData || []) as FamilyRow[])
      .filter((f) => !f.content?.is_demo)
      .map((f) => [f.id, f])
  );

  // Never remind (or stamp) the demo/sample family's bookings.
  bookings = bookings.filter((b) => families.has(b.family_id));
  if (bookings.length === 0) return { volunteers: 0, families: 0, skipped: false };

  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM || "Family Grief Support <onboarding@resend.dev>";
  const resend = apiKey ? new Resend(apiKey) : null;
  const base = baseUrl.replace(/\/+$/, "");

  let volunteers = 0;
  const familyBuckets = new Map<string, BookingRow[]>();

  for (const b of bookings) {
    const fam = families.get(b.family_id);
    if (!fam) continue;

    // Group by family for the heads-up email.
    const bucket = familyBuckets.get(b.family_id) || [];
    bucket.push(b);
    familyBuckets.set(b.family_id, bucket);

    // Reminder to the volunteer (only if they left an email).
    const to = parseRecipients(b.email);
    if (resend && to.length) {
      const label = familyLabel(fam);
      const doing = DOING[b.kind] || "helping out";
      const pageUrl = `${base}/${fam.slug}`;
      const subject = `A gentle reminder for tomorrow — ${label}`;
      const text =
        `Hi ${b.name || "there"},\n\n` +
        `Just a warm reminder that tomorrow (${prettyDate(b.event_date)}) ` +
        `you're ${doing} for ${label}.\n\n` +
        `Thank you for showing up — it matters more than you know.\n\n` +
        `The page, if you need it: ${pageUrl}\n`;
      const html =
        `<div style="font-family:Georgia,serif;color:#332F28;font-size:16px;line-height:1.6;">` +
        `<p>Hi ${esc(b.name || "there")},</p>` +
        `<p>Just a warm reminder that <strong>tomorrow</strong> ` +
        `(${esc(prettyDate(b.event_date))}) you're ${esc(doing)} for ` +
        `${esc(label)}.</p>` +
        `<p>Thank you for showing up — it matters more than you know.</p>` +
        `<p style="color:#6B6356;font-size:14px;">` +
        `<a href="${esc(pageUrl)}" style="color:#8B6A43;">View the page →</a></p>` +
        `</div>`;
      try {
        await resend.emails.send({ from, to, subject, text, html });
        volunteers += 1;
      } catch (err) {
        console.error("[reminders] volunteer email failed", err);
      }
    }
  }

  // One heads-up email per family, to whoever gets their notifications.
  let familyCount = 0;
  for (const [familyId, bucket] of familyBuckets) {
    const fam = families.get(familyId);
    if (!resend || !fam) continue;
    const to = parseRecipients(fam.contact_email);
    if (!to.length) continue;

    const label = familyLabel(fam);
    const lines = bucket.map((b) => {
      const who = b.private ? "Someone" : b.name || "Someone";
      return `${NOUN[b.kind] || "Help"} — ${who}${b.note ? ` (“${b.note}”)` : ""}`;
    });
    const subject = `Coming tomorrow for ${label}`;
    const text =
      `Here's the care coming your way tomorrow ` +
      `(${prettyDate(bucket[0].event_date)}):\n\n` +
      lines.map((l) => `• ${l}`).join("\n") +
      `\n\nWith you,\nFamily Grief Support\n`;
    const html =
      `<div style="font-family:Georgia,serif;color:#332F28;font-size:16px;line-height:1.6;">` +
      `<p>Here's the care coming your way <strong>tomorrow</strong> ` +
      `(${esc(prettyDate(bucket[0].event_date))}):</p>` +
      `<ul>` +
      bucket
        .map((b) => {
          const who = b.private ? "Someone" : esc(b.name || "Someone");
          return (
            `<li style="margin-bottom:6px;">` +
            `<strong>${esc(NOUN[b.kind] || "Help")}</strong> — ${who}` +
            `${b.note ? ` <span style="color:#6B6356;">“${esc(b.note)}”</span>` : ""}` +
            `</li>`
          );
        })
        .join("") +
      `</ul></div>`;
    try {
      await resend.emails.send({ from, to, subject, text, html });
      familyCount += 1;
    } catch (err) {
      console.error("[reminders] family email failed", err);
    }
  }

  // Stamp everything we processed so it never fires again.
  const ids = bookings.map((b) => b.id);
  await sb
    .from("bookings")
    .update({ reminder_sent_at: new Date().toISOString() })
    .in("id", ids);

  return { volunteers, families: familyCount, skipped: false };
}
