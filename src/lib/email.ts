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
  kind?: string; // "kids" | "meal" | "visit" | "errand"
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
  const { kind, kindLabel, dateLabel, name, email, note, requested, baseUrl } = args;

  // Natalia + the organizer both get a note. Weekend-with-the-kids is a request
  // she confirms; everything else is a warm, no-action "it's handled" heads-up.
  const recipients = Array.from(
    new Set(
      [process.env.NOTIFY_EMAIL, process.env.NATALIA_EMAIL].filter(
        Boolean
      ) as string[]
    )
  );
  if (!apiKey || recipients.length === 0) return;
  const link = baseUrl ? `${baseUrl.replace(/\/$/, "")}/admin` : "";
  const noteStr = note ? ` — “${note}”` : "";

  let subject: string;
  let lead: string;
  let heading: string;

  if (requested) {
    heading = "A weekend request 💛";
    subject = `Weekend request: ${name} — ${dateLabel}`;
    lead = `${name} would love to spend the weekend of ${dateLabel} with the kids. Confirm it, or suggest another weekend, in your dashboard.`;
  } else if (kind === "meal") {
    heading = "Dinner is taken care of 💛";
    subject = `A meal is covered — ${dateLabel}`;
    lead = `Good news: ${name} is taking care of a meal on ${dateLabel}${noteStr}. Nothing to do — it's handled.`;
  } else if (kind === "visit") {
    heading = "Someone's coming by 💛";
    subject = `${name} is visiting — ${dateLabel}`;
    lead = `${name} is coming by on ${dateLabel}${noteStr}. Nothing to do — just company on the way.`;
  } else if (kind === "errand") {
    heading = "A hand with something 💛";
    subject = `${name} is helping — ${dateLabel}`;
    lead = `${name} is helping with something on ${dateLabel}${noteStr}. Nothing to do — it's covered.`;
  } else {
    heading = "A little help is on the way 💛";
    subject = `${name} signed up — ${dateLabel}`;
    lead = `${name} signed up for ${kindLabel} on ${dateLabel}${noteStr}.`;
  }

  const text = [
    lead,
    email ? `From: ${email}` : "",
    requested && link ? `\nOpen your dashboard: ${link}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: Georgia, serif; color: #3E3A33; line-height: 1.6;">
      <h2 style="color:#8B6A43; margin-bottom: 4px;">${heading}</h2>
      <p>${escapeHtml(lead)}</p>
      ${email ? `<p style="color:#6E6858;font-size:14px;">${escapeHtml(email)}</p>` : ""}
      ${
        requested && link
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

/** Notifies the organizer when someone RSVPs to the gathering. */
export async function sendGatheringRsvpNotification(args: {
  name: string;
  partySize: number;
  email?: string | null;
  note?: string | null;
  total: number;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  const from =
    process.env.RESEND_FROM || "Support for Natalia <onboarding@resend.dev>";
  if (!apiKey || !to) return;

  const { name, partySize, email, note, total } = args;
  const guests = partySize === 1 ? "1 guest" : `${partySize} guests`;
  const text = [
    `${name} RSVP'd — ${guests}.`,
    email ? `Email: ${email}` : "",
    note ? `Note: ${note}` : "",
    ``,
    `Running headcount: ${total} attending.`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: Georgia, serif; color: #3E3A33; line-height: 1.6;">
      <h2 style="color:#8B6A43; margin-bottom: 4px;">New RSVP to the gathering 💛</h2>
      <p><strong>${escapeHtml(name)}</strong> RSVP'd — <strong>${escapeHtml(guests)}</strong>.</p>
      ${note ? `<p>Note: ${escapeHtml(note)}</p>` : ""}
      ${email ? `<p style="color:#6E6858;font-size:14px;">${escapeHtml(email)}</p>` : ""}
      <p style="margin-top:10px;"><strong>Running headcount: ${total} attending.</strong></p>
    </div>`;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject: `RSVP: ${name} (+${partySize}) — ${total} total`,
      text,
      html,
    });
  } catch (err) {
    console.error("[email] Failed to send gathering RSVP notification:", err);
  }
}

/** Emails the full gathering guest list + headcount to the organizer on demand. */
export async function sendGatheringList(args: {
  rows: { name: string; email: string | null; party_size: number; note: string | null }[];
  total: number;
}): Promise<{ ok: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  const from =
    process.env.RESEND_FROM || "Support for Natalia <onboarding@resend.dev>";
  if (!apiKey) return { ok: false, reason: "Email isn't set up (RESEND_API_KEY)." };
  if (!to) return { ok: false, reason: "No NOTIFY_EMAIL is set." };

  const { rows, total } = args;
  const lines = rows.map(
    (r) =>
      `${r.name} — ${r.party_size} ${r.party_size === 1 ? "guest" : "guests"}` +
      (r.email ? ` · ${r.email}` : "") +
      (r.note ? ` · “${r.note}”` : "")
  );
  const text = [
    `Gathering guest list — ${total} attending across ${rows.length} RSVPs.`,
    ``,
    ...lines,
  ].join("\n");

  const htmlRows = rows
    .map(
      (r) =>
        `<tr><td style="padding:4px 12px 4px 0;">${escapeHtml(r.name)}</td>` +
        `<td style="padding:4px 12px 4px 0;">${r.party_size}</td>` +
        `<td style="padding:4px 12px 4px 0;color:#6E6858;">${escapeHtml(r.email || "")}</td>` +
        `<td style="color:#6E6858;">${escapeHtml(r.note || "")}</td></tr>`
    )
    .join("");
  const html = `
    <div style="font-family: Georgia, serif; color: #3E3A33; line-height: 1.6;">
      <h2 style="color:#8B6A43;">Gathering guest list</h2>
      <p><strong>${total} attending</strong> across ${rows.length} RSVPs.</p>
      <table style="border-collapse:collapse;font-size:14px;">${htmlRows}</table>
    </div>`;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject: `Gathering guest list — ${total} attending`,
      text,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email] Failed to send gathering list:", err);
    return { ok: false, reason: "Something went wrong sending the email." };
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

// -------------------------------------------------------------------
// Subscriber emails ("stay involved" updates). Each carries an unsubscribe.
// -------------------------------------------------------------------

function resendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}
function fromAddr(): string {
  return process.env.RESEND_FROM || "Support for Natalia <onboarding@resend.dev>";
}
function unsubLink(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, "")}/unsubscribe?token=${token}`;
}
function subFooterHtml(unsubUrl: string): string {
  return `<hr style="border:none;border-top:1px solid #E4DAC7;margin:22px 0"/><p style="font-size:12px;color:#9A9082;">You're receiving this because you asked to stay involved with Natalia &amp; the kids. <a href="${escapeHtml(unsubUrl)}" style="color:#8B6A43;">Unsubscribe</a>.</p>`;
}
function wrapHtml(inner: string, unsubUrl: string): string {
  return `<div style="font-family: Georgia, serif; color:#3E3A33; line-height:1.7; max-width:560px;">${inner}${subFooterHtml(unsubUrl)}</div>`;
}

/** Confirms a new subscription. */
export async function sendSubscribeConfirmation(
  email: string,
  token: string,
  baseUrl: string
): Promise<void> {
  const resend = resendClient();
  if (!resend) return;
  const unsub = unsubLink(baseUrl, token);
  const html = wrapHtml(
    `<h2 style="color:#8B6A43;font-weight:400;">You're on the list 💛</h2>
     <p>Thank you for choosing to stay close to Natalia and the kids. Every so often — and whenever there's a new way to show up — we'll send a gentle note so you never have to wonder how to help.</p>
     <p><a href="${escapeHtml(baseUrl)}" style="color:#8B6A43;">Visit the page &rarr;</a></p>`,
    unsub
  );
  try {
    await resend.emails.send({
      from: fromAddr(),
      to: email,
      subject: "You're on the list — for Natalia & the kids",
      text: `Thank you for choosing to stay close to Natalia and the kids. We'll send a gentle note now and then, and whenever there's a new way to show up.\n\nVisit: ${baseUrl}\n\nUnsubscribe: ${unsub}`,
      html,
    });
  } catch (err) {
    console.error("[email] subscribe confirmation failed:", err);
  }
}

type SubLite = { email: string; token: string };

/** The periodic "stay involved" digest — warm nudge + live highlights. */
export async function sendSubscriberDigest(
  subs: SubLite[],
  baseUrl: string,
  highlights: { html: string; text: string; count: number }
): Promise<number> {
  const resend = resendClient();
  if (!resend || subs.length === 0) return 0;

  const highlightBlock = highlights.count
    ? `<p style="margin-top:18px;"><strong>What's happening right now:</strong></p>${highlights.html}`
    : "";
  const highlightText = highlights.count
    ? `\n\nWhat's happening right now:\n${highlights.text}`
    : "";

  let sent = 0;
  for (const s of subs) {
    const unsub = unsubLink(baseUrl, s.token);
    const html = wrapHtml(
      `<h2 style="color:#8B6A43;font-weight:400;">Still here, still needed 💛</h2>
       <p>It's been a little while, and Natalia and the kids are still held up by people like you. Grief doesn't move fast — the quiet weeks and months are when showing up matters most.</p>
       <p>If you have a moment, sign up to bring a meal, spend time with the kids, or simply stop by.</p>
       ${highlightBlock}
       <p style="margin-top:18px;"><a href="${escapeHtml(baseUrl)}" style="color:#8B6A43;">Open the page &rarr;</a></p>`,
      unsub
    );
    try {
      await resend.emails.send({
        from: fromAddr(),
        to: s.email,
        subject: "Still here, still needed — Natalia & the kids",
        text: `It's been a little while, and Natalia and the kids are still held up by people like you. If you have a moment, sign up to bring a meal, spend time with the kids, or simply stop by.${highlightText}\n\nOpen the page: ${baseUrl}\n\nUnsubscribe: ${unsub}`,
        html,
      });
      sent += 1;
    } catch (err) {
      console.error("[email] digest send failed:", err);
    }
  }
  return sent;
}

/**
 * Multi-tenant version of the digest: each family's followers get a gentle
 * note about *their* family only, linking to that family's own page, with a
 * family-neutral unsubscribe footer.
 */
export async function sendFamilySubscriberDigest(
  subs: SubLite[],
  pageUrl: string,
  familyName: string,
  highlights: { html: string; text: string; count: number }
): Promise<number> {
  const resend = resendClient();
  if (!resend || subs.length === 0) return 0;

  const base = pageUrl.replace(/\/$/, "");
  const who = escapeHtml(familyName);
  const highlightBlock = highlights.count
    ? `<p style="margin-top:18px;"><strong>Ways to help right now:</strong></p>${highlights.html}`
    : "";
  const highlightText = highlights.count
    ? `\n\nWays to help right now:\n${highlights.text}`
    : "";

  let sent = 0;
  for (const s of subs) {
    const unsub = unsubLink(base, s.token);
    const inner =
      `<h2 style="color:#8B6A43;font-weight:400;">Still here, still needed 💛</h2>` +
      `<p>It's been a little while, and ${who} is still held up by people like you. ` +
      `Grief doesn't move fast — the quiet weeks and months are when showing up matters most.</p>` +
      `<p>If you have a moment, there are still simple, real ways to help.</p>` +
      `${highlightBlock}` +
      `<p style="margin-top:18px;"><a href="${escapeHtml(base)}" style="color:#8B6A43;">Open the page &rarr;</a></p>`;
    const footer =
      `<hr style="border:none;border-top:1px solid #E4DAC7;margin:22px 0"/>` +
      `<p style="font-size:12px;color:#9A9082;">You're receiving this because you asked to stay involved with ${who}. ` +
      `<a href="${escapeHtml(unsub)}" style="color:#8B6A43;">Unsubscribe</a>.</p>`;
    const html = `<div style="font-family: Georgia, serif; color:#3E3A33; line-height:1.7; max-width:560px;">${inner}${footer}</div>`;
    try {
      await resend.emails.send({
        from: fromAddr(),
        to: s.email,
        subject: `Still here, still needed — ${familyName}`,
        text:
          `It's been a little while, and ${familyName} is still held up by people like you. ` +
          `If you have a moment, there are still simple, real ways to help.${highlightText}\n\n` +
          `Open the page: ${base}\n\nUnsubscribe: ${unsub}`,
        html,
      });
      sent += 1;
    } catch (err) {
      console.error("[email] family digest send failed:", err);
    }
  }
  return sent;
}

/** Instant blast when a new event/need is posted. */
export async function sendSubscriberEventBlast(
  subs: SubLite[],
  baseUrl: string,
  event: { title: string; whenText: string; location?: string | null; description?: string | null }
): Promise<number> {
  const resend = resendClient();
  if (!resend || subs.length === 0) return 0;

  const detail =
    `${escapeHtml(event.whenText)}` +
    (event.location ? ` · ${escapeHtml(event.location)}` : "");

  let sent = 0;
  for (const s of subs) {
    const unsub = unsubLink(baseUrl, s.token);
    const html = wrapHtml(
      `<h2 style="color:#8B6A43;font-weight:400;">A new way to show up 💛</h2>
       <p><strong>${escapeHtml(event.title)}</strong><br/><span style="color:#6B6356;">${detail}</span></p>
       ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ""}
       <p>If you can be there, add your name — it means the world to the kids to see familiar faces.</p>
       <p style="margin-top:14px;"><a href="${escapeHtml(baseUrl)}#events" style="color:#8B6A43;">Add your name &rarr;</a></p>`,
      unsub
    );
    try {
      await resend.emails.send({
        from: fromAddr(),
        to: s.email,
        subject: `A new way to show up: ${event.title}`,
        text: `${event.title}\n${event.whenText}${event.location ? ` · ${event.location}` : ""}\n${event.description || ""}\n\nIf you can be there, add your name: ${baseUrl}#events\n\nUnsubscribe: ${unsub}`,
        html,
      });
      sent += 1;
    } catch (err) {
      console.error("[email] event blast failed:", err);
    }
  }
  return sent;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
