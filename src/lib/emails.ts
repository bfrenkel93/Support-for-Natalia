import "server-only";

// Transactional email templates for Family Grief Support.
//
// Everything here is plain, table-based, inline-styled HTML built to survive
// real email clients (Gmail, Apple Mail, Outlook). No web fonts, no external
// CSS, no images — the brand is carried by color, serif type, and space.

const INK = "#2E2A23"; // charcoal
const INK_SOFT = "#5F5749";
const INK_FAINT = "#9A917F";
const BRONZE = "#8B6A43"; // warm taupe accent
const LINE = "#DDD3BF";
const BG_OUTER = "#EDE7DA"; // warm limestone
const BG_CARD = "#FBF9F3"; // ivory
const URL_BOX = "#F3EEE3";

const SERIF = "Georgia, 'Times New Roman', Times, serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type WelcomeEmailInput = {
  displayName?: string | null;
  pageUrl: string;
  manageUrl: string;
};

/**
 * The email sent to the person who just created a page. Two clearly separated
 * halves: the public share link (primary) and the private admin link (quieter).
 */
export function creatorWelcomeEmail(input: WelcomeEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const name = (input.displayName || "").trim();
  const pageUrl = input.pageUrl;
  const manageUrl = input.manageUrl;

  const headline = name
    ? `Your page for ${esc(name)} is ready.`
    : `Your page is ready.`;
  const subject = name
    ? `Your page for ${name} is ready`
    : `Your page is ready`;
  const displayUrl = pageUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  const eyebrow = (t: string) =>
    `<p style="margin:0; font-family:${SANS}; font-size:11px; line-height:1.4; letter-spacing:0.18em; text-transform:uppercase; color:${BRONZE};">${t}</p>`;

  const actionH = (t: string) =>
    `<h2 class="h2" style="margin:8px 0 0; font-family:${SERIF}; font-size:30px; line-height:1.12; font-weight:normal; color:${INK};">${t}</h2>`;

  const lede = (t: string) =>
    `<p style="margin:11px 0 0; font-family:${SANS}; font-size:15px; line-height:1.55; color:${INK_SOFT};">${t}</p>`;

  // A quiet ring emblem standing in for the logo mark (email-client safe).
  const ornament = `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="46" height="46" align="center" valign="middle" style="width:46px; height:46px; border:1px solid #CBBEA2; border-radius:50%;"><span style="display:inline-block; width:6px; height:6px; background:${BRONZE}; border-radius:50%; line-height:6px; font-size:0;">&nbsp;</span></td></tr></table>`;

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<title>${esc(subject)}</title>
<style>
  body { margin:0; padding:0; background:${BG_OUTER}; }
  a { color:${BRONZE}; }
  @media only screen and (max-width:620px) {
    .container { width:100% !important; }
    .pad { padding:32px 24px !important; }
    .h1 { font-size:34px !important; }
    .h2 { font-size:26px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background:${BG_OUTER};">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:${BG_OUTER}; font-size:1px; line-height:1px;">Your page is ready. Share the link, and use your private link to edit it.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG_OUTER};">
    <tr>
      <td align="center" style="padding:36px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background:${BG_CARD};">
          <tr>
            <td class="pad" style="padding:48px;">

              <!-- Masthead (quiet) -->
              <p style="margin:0; font-family:${SANS}; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:${INK_FAINT};">Family Grief Support</p>

              <!-- Welcome -->
              <div style="margin-top:30px;">${eyebrow("Welcome to Family Grief Support")}</div>
              <h1 class="h1" style="margin:12px 0 0; max-width:520px; font-family:${SERIF}; font-size:45px; line-height:1.05; font-weight:normal; color:${INK};">${headline}</h1>
              <p style="margin:16px 0 0; max-width:520px; font-family:${SANS}; font-size:17px; line-height:1.5; color:${INK_SOFT};">You created a place for the people who care to know how to show up.</p>

              <!-- Ornament -->
              <div style="margin:40px 0 4px;">${ornament}</div>

              <!-- 01 · Share -->
              ${eyebrow("01 &middot; Share")}
              ${actionH("Invite your community.")}
              ${lede("Send this link to friends and family so they can see what’s needed and find a way to help.")}
              <a href="${esc(pageUrl)}" style="display:block; margin:18px 0 0; background:${URL_BOX}; border:1px solid ${LINE}; border-radius:2px; padding:13px 16px; font-family:${SANS}; font-size:15px; line-height:1.4; color:${INK}; text-decoration:none; word-break:break-all; overflow-wrap:break-word;">${esc(displayUrl)}</a>
              <div style="margin-top:20px;"><a href="${esc(pageUrl)}" style="display:inline-block; background:${INK}; color:${BG_CARD}; font-family:${SANS}; font-size:12px; font-weight:600; letter-spacing:0.13em; text-transform:uppercase; text-decoration:none; padding:15px 30px; border-radius:2px;">View &amp; share page &rarr;</a></div>

              <!-- separation -->
              <div style="border-top:1px solid ${LINE}; line-height:1px; font-size:1px; margin:54px 0;">&nbsp;</div>

              <!-- 02 · Manage -->
              ${eyebrow("02 &middot; Manage")}
              ${actionH("Make the page theirs.")}
              ${lede("Add their story, choose what would be helpful, manage sign-ups, and update the page whenever things change.")}
              <div style="margin-top:20px;"><a href="${esc(manageUrl)}" style="display:inline-block; background:${BG_CARD}; color:${BRONZE}; border:1px solid ${BRONZE}; font-family:${SANS}; font-size:12px; font-weight:600; letter-spacing:0.13em; text-transform:uppercase; text-decoration:none; padding:14px 29px; border-radius:2px;">Edit support page &rarr;</a></div>
              <p style="margin:16px 0 0; font-family:${SANS}; font-size:12px; line-height:1.55; color:${INK_FAINT};">This is your private admin link. Keep it somewhere safe and don’t share it publicly.</p>

              <!-- separation -->
              <div style="border-top:1px solid ${LINE}; line-height:1px; font-size:1px; margin:54px 0;">&nbsp;</div>

              <!-- Closing -->
              <p style="margin:0; font-family:${SERIF}; font-size:18px; line-height:1.45; color:${INK};">You don’t have to finish everything today.</p>
              <p style="margin:8px 0 0; font-family:${SANS}; font-size:15px; line-height:1.55; color:${INK_SOFT};">Start with what would help now. You can change the page anytime.</p>
              <p style="margin:36px 0 0; font-family:${SERIF}; font-size:16px; color:${INK};">Family Grief Support</p>
              <p style="margin:4px 0 0; font-family:${SANS}; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:${INK_FAINT};">Showing up. Together.</p>

            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
          <tr>
            <td style="padding:22px 8px 8px; font-family:${SANS}; font-size:11px; letter-spacing:0.06em; color:${INK_FAINT};" align="center">
              familygriefsupport.org
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    "FAMILY GRIEF SUPPORT",
    "",
    name ? `Your page for ${name} is ready.` : "Your page is ready.",
    "You created a place for the people who care to know how to show up.",
    "",
    "01 · SHARE — Invite your community.",
    "Send this link to friends and family:",
    pageUrl,
    "",
    "02 · MANAGE — Make the page theirs.",
    "Your private admin link (keep it safe, don’t share it publicly):",
    manageUrl,
    "",
    "You don’t have to finish everything today. Start with what would help now —",
    "you can change the page anytime.",
    "",
    "Family Grief Support — Showing up. Together.",
  ].join("\n");

  return { subject, html, text };
}
