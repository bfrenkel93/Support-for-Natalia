import "server-only";
import { Resend } from "resend";
import type { Slot } from "./supabase";

type NotifyArgs = {
  slot: Slot;
  name: string;
  email?: string | null;
  note?: string | null;
  isPrivate: boolean;
};

const SECTION_NAME: Record<Slot["category"], string> = {
  kids: "Visits for the Kids",
  support: "Support for Natalia",
};

/**
 * Emails the family a heads-up when someone claims a slot.
 * Fails silently (logs only) so a missing/incorrect email config can never
 * block a real sign-up from being saved.
 */
export async function sendClaimNotification(args: NotifyArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  const from =
    process.env.RESEND_FROM || "Support for Natalia <onboarding@resend.dev>";

  if (!apiKey || !to) {
    // Not configured — quietly skip.
    return;
  }

  const { slot, name, email, note, isPrivate } = args;
  const when = slot.label || slot.event_date || "a slot";
  const section = SECTION_NAME[slot.category];

  const lines = [
    `${name} just signed up in "${section}".`,
    ``,
    `Slot: ${when}`,
    slot.description ? `Details: ${slot.description}` : ``,
    email ? `Email: ${email}` : `Email: (not provided)`,
    note ? `Note: ${note}` : ``,
    isPrivate ? `(They asked to show as "Claimed" publicly.)` : ``,
  ].filter(Boolean);

  const html = `
    <div style="font-family: Georgia, serif; color: #3E3A33; line-height: 1.6;">
      <h2 style="color:#5F7359; margin-bottom: 4px;">New sign-up 💛</h2>
      <p><strong>${escapeHtml(name)}</strong> just signed up in <strong>${escapeHtml(
        section
      )}</strong>.</p>
      <table style="border-collapse: collapse; margin-top: 8px;">
        <tr><td style="padding:4px 12px 4px 0;"><strong>Slot</strong></td><td>${escapeHtml(
          String(when)
        )}</td></tr>
        ${
          slot.description
            ? `<tr><td style="padding:4px 12px 4px 0;"><strong>Details</strong></td><td>${escapeHtml(
                slot.description
              )}</td></tr>`
            : ""
        }
        <tr><td style="padding:4px 12px 4px 0;"><strong>Email</strong></td><td>${
          email ? escapeHtml(email) : "(not provided)"
        }</td></tr>
        ${
          note
            ? `<tr><td style="padding:4px 12px 4px 0;"><strong>Note</strong></td><td>${escapeHtml(
                note
              )}</td></tr>`
            : ""
        }
      </table>
      ${
        isPrivate
          ? `<p style="color:#6E6858; font-size: 14px;">They asked to appear publicly as “Claimed”.</p>`
          : ""
      }
    </div>
  `;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject: `New sign-up: ${name} — ${section}`,
      text: lines.join("\n"),
      html,
    });
  } catch (err) {
    console.error("[email] Failed to send claim notification:", err);
  }
}

/**
 * Notifies the family of a calendar sign-up. When `requested` is true (a kids
 * weekend awaiting Natalia's confirmation), the email asks her to confirm or
 * suggest another weekend in the dashboard. Sent to NOTIFY_EMAIL + NATALIA_EMAIL.
 */
export async function sendBookingNotification(args: {
  kindLabel: string;
  dateLabel: string;
  name: string;
  email?: string | null;
  note?: string | null;
  requested?: boolean;
  baseUrl?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM || "Support for Natalia <onboarding@resend.dev>";
  const recipients = Array.from(
    new Set(
      [process.env.NOTIFY_EMAIL, process.env.NATALIA_EMAIL].filter(
        Boolean
      ) as string[]
    )
  );
  if (!apiKey || recipients.length === 0) return;

  const { kindLabel, dateLabel, name, email, note, requested, baseUrl } = args;
  const link = baseUrl ? `${baseUrl.replace(/\/$/, "")}/admin` : "";

  const subject = requested
    ? `Weekend request: ${name} — ${dateLabel}`
    : `Calendar sign-up: ${name} — ${kindLabel}`;

  const lead = requested
    ? `${name} would love to spend the weekend of ${dateLabel} with the kids. Confirm it, or suggest another weekend, in your dashboard.`
    : `${name} signed up for ${kindLabel} on ${dateLabel}.`;

  const text = [
    lead,
    email ? `Email: ${email}` : "",
    note ? `Note: ${note}` : "",
    link ? `\nOpen your dashboard: ${link}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: Georgia, serif; color: #3E3A33; line-height: 1.6;">
      <h2 style="color:#8B6A43; margin-bottom: 4px;">${
        requested ? "A weekend request 💛" : "New calendar sign-up 💛"
      }</h2>
      <p>${escapeHtml(lead)}</p>
      ${note ? `<p>Note: ${escapeHtml(note)}</p>` : ""}
      ${email ? `<p style="color:#6E6858;font-size:14px;">${escapeHtml(email)}</p>` : ""}
      ${
        link
          ? `<p><a href="${escapeHtml(link)}" style="display:inline-block;background:#2A2620;color:#F7F4ED;text-decoration:none;padding:10px 18px;border-radius:2px;font-weight:600;">Open the dashboard</a></p>`
          : ""
      }
    </div>`;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({ from, to: recipients, subject, text, html });
  } catch (err) {
    console.error("[email] Failed to send booking notification:", err);
  }
}

/**
 * Emails a friend back after Natalia confirms or declines their weekend
 * request. No-op if they didn't leave an email.
 */
export async function sendRequestDecision(args: {
  to: string;
  confirmed: boolean;
  dateLabel: string;
  note?: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM || "Support for Natalia <onboarding@resend.dev>";
  if (!apiKey || !args.to) return;

  const { to, confirmed, dateLabel, note } = args;
  const subject = confirmed
    ? `Your weekend with the kids is confirmed — ${dateLabel}`
    : `About the weekend of ${dateLabel}`;
  const body = confirmed
    ? `Wonderful — you're confirmed to spend the weekend of ${dateLabel} with the kids. Thank you for showing up for them.${note ? `\n\nA note from Natalia: ${note}` : ""}`
    : `Thank you so much for offering to spend the weekend of ${dateLabel} with the kids. That particular weekend doesn't work, but please pick another — it would mean the world.${note ? `\n\nA note from Natalia: ${note}` : ""}`;

  const html = `<div style="font-family: Georgia, serif; color:#3E3A33; line-height:1.6;"><p>${escapeHtml(
    body
  ).replace(/\n/g, "<br>")}</p></div>`;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({ from, to, subject, text: body, html });
  } catch (err) {
    console.error("[email] Failed to send request decision:", err);
  }
}

/** Notifies the family when someone chips in toward a gift. Fails silently. */
export async function sendGiftNotification(args: {
  giftTitle: string;
  name: string;
  email?: string | null;
  amount?: number | null;
  note?: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  const from =
    process.env.RESEND_FROM || "Support for Natalia <onboarding@resend.dev>";
  if (!apiKey || !to) return;

  const { giftTitle, name, email, amount, note } = args;
  const amountStr =
    amount != null ? `$${amount.toLocaleString("en-US")}` : "(amount not noted)";
  const text = [
    `${name} chipped in toward "${giftTitle}".`,
    `Amount: ${amountStr}`,
    email ? `Email: ${email}` : "",
    note ? `Note: ${note}` : "",
    ``,
    `Remember to confirm the money actually arrived via your payment app.`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: Georgia, serif; color: #3E3A33; line-height: 1.6;">
      <h2 style="color:#A56A4F; margin-bottom: 4px;">Someone chipped in 💛</h2>
      <p><strong>${escapeHtml(name)}</strong> pledged toward
      <strong>${escapeHtml(giftTitle)}</strong> — ${escapeHtml(amountStr)}.</p>
      ${note ? `<p>Note: ${escapeHtml(note)}</p>` : ""}
      ${email ? `<p style="color:#6E6858;font-size:14px;">${escapeHtml(email)}</p>` : ""}
      <p style="color:#6E6858;font-size:14px;">Confirm the money arrived in your payment app.</p>
    </div>`;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject: `Gift pledge: ${name} — ${giftTitle}`,
      text,
      html,
    });
  } catch (err) {
    console.error("[email] Failed to send gift notification:", err);
  }
}

/** Notifies the family when someone RSVPs to an event. Fails silently. */
export async function sendRsvpNotification(args: {
  eventTitle: string;
  name: string;
  email?: string | null;
  note?: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  const from =
    process.env.RESEND_FROM || "Support for Natalia <onboarding@resend.dev>";
  if (!apiKey || !to) return;

  const { eventTitle, name, email, note } = args;
  const text = [
    `${name} is coming to "${eventTitle}".`,
    email ? `Email: ${email}` : "",
    note ? `Note: ${note}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: Georgia, serif; color: #3E3A33; line-height: 1.6;">
      <h2 style="color:#A56A4F; margin-bottom: 4px;">New RSVP 💛</h2>
      <p><strong>${escapeHtml(name)}</strong> is coming to
      <strong>${escapeHtml(eventTitle)}</strong>.</p>
      ${note ? `<p>Note: ${escapeHtml(note)}</p>` : ""}
      ${email ? `<p style="color:#6E6858;font-size:14px;">${escapeHtml(email)}</p>` : ""}
    </div>`;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject: `RSVP: ${name} — ${eventTitle}`,
      text,
      html,
    });
  } catch (err) {
    console.error("[email] Failed to send RSVP notification:", err);
  }
}

/**
 * Notifies the family that a new memory was shared. For privacy, the email
 * contains ONLY a heads-up and a secure link to the dashboard — never the
 * story text or any photo. Goes to NOTIFY_EMAIL and, if set, NATALIA_EMAIL.
 */
export async function sendMemoryNotification(args: {
  baseUrl: string;
  authorName?: string | null;
  hasStory: boolean;
  photoCount: number;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM || "Support for Natalia <onboarding@resend.dev>";

  const recipients = Array.from(
    new Set(
      [process.env.NOTIFY_EMAIL, process.env.NATALIA_EMAIL].filter(
        Boolean
      ) as string[]
    )
  );

  if (!apiKey || recipients.length === 0) return;

  const { baseUrl, authorName, hasStory, photoCount } = args;
  const who = authorName ? authorName : "Someone";
  const parts: string[] = [];
  if (hasStory) parts.push("a story");
  if (photoCount > 0)
    parts.push(`${photoCount} photo${photoCount === 1 ? "" : "s"}`);
  const what = parts.length ? parts.join(" and ") : "a memory";

  const link = `${baseUrl.replace(/\/$/, "")}/admin`;

  const text = [
    `${who} just shared ${what} of Joe for the kids.`,
    ``,
    `View it privately in the dashboard: ${link}`,
    ``,
    `For privacy, the memory itself isn't included in this email.`,
  ].join("\n");

  const html = `
    <div style="font-family: Georgia, serif; color: #3E3A33; line-height: 1.6;">
      <h2 style="color:#5F7359; margin-bottom: 4px;">A new memory was shared 💛</h2>
      <p><strong>${escapeHtml(who)}</strong> just shared ${escapeHtml(
        what
      )} of Joe for the kids.</p>
      <p>
        <a href="${escapeHtml(link)}"
           style="display:inline-block; background:#8FA98A; color:#FBF8F1; text-decoration:none; padding:10px 18px; border-radius:999px; font-weight:600;">
          View it privately in the dashboard
        </a>
      </p>
      <p style="color:#6E6858; font-size: 14px;">For privacy, the memory itself isn't included in this email.</p>
    </div>
  `;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: recipients,
      subject: "A new memory of Joe was shared",
      text,
      html,
    });
  } catch (err) {
    console.error("[email] Failed to send memory notification:", err);
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
