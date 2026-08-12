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
    ? `Your support page for ${esc(name)} is ready.`
    : `Your support page is ready.`;
  const subject = name
    ? `Your support page for ${name} is ready`
    : `Your support page is ready`;

  const eyebrow = (t: string) =>
    `<p style="margin:0; font-family:${SANS}; font-size:11px; line-height:1.4; letter-spacing:0.18em; text-transform:uppercase; color:${BRONZE};">${t}</p>`;

  const h2 = (t: string) =>
    `<h2 class="h2" style="margin:10px 0 0; font-family:${SERIF}; font-size:27px; line-height:1.15; font-weight:normal; color:${INK};">${t}</h2>`;

  const body = (t: string, mt = 18) =>
    `<p style="margin:${mt}px 0 0; font-family:${SERIF}; font-size:16px; line-height:1.62; color:${INK_SOFT};">${t}</p>`;

  const rule = (m = 48) =>
    `<div style="border-top:1px solid ${LINE}; line-height:1px; font-size:1px; margin:${m}px 0;">&nbsp;</div>`;

  const primaryBtn = (href: string, label: string) =>
    `<a href="${esc(href)}" style="display:inline-block; background:${INK}; color:${BG_CARD}; font-family:${SANS}; font-size:12px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; text-decoration:none; padding:15px 30px; border-radius:2px;">${label}</a>`;

  const outlineBtn = (href: string, label: string) =>
    `<a href="${esc(href)}" style="display:inline-block; background:${BG_CARD}; color:${INK}; border:1px solid ${INK}; font-family:${SANS}; font-size:12px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; text-decoration:none; padding:14px 29px; border-radius:2px;">${label}</a>`;

  const urlField = (url: string) =>
    `<div style="margin:22px 0 0; background:${URL_BOX}; border:1px solid ${LINE}; border-radius:2px; padding:14px 16px; font-family:${SANS}; font-size:14px; line-height:1.5; color:${INK}; word-break:break-all; overflow-wrap:break-word;">${esc(url)}</div>`;

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
    .pad { padding:28px 24px !important; }
    .h1 { font-size:31px !important; }
    .h2 { font-size:23px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background:${BG_OUTER};">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:${BG_OUTER}; font-size:1px; line-height:1px;">Your support page is ready — share it with your community, and make it your own.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG_OUTER};">
    <tr>
      <td align="center" style="padding:36px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background:${BG_CARD};">
          <tr>
            <td class="pad" style="padding:52px;">

              <!-- Masthead -->
              <p style="margin:0; font-family:${SERIF}; font-size:16px; letter-spacing:0.01em; color:${INK};">Family Grief Support</p>
              ${rule(28)}

              <!-- Welcome -->
              ${eyebrow("Welcome to Family Grief Support")}
              <h1 class="h1" style="margin:14px 0 0; font-family:${SERIF}; font-size:40px; line-height:1.12; font-weight:normal; color:${INK};">${headline}</h1>
              ${body("You created a place where the people who care can know how to show up.", 22)}
              ${body("You can begin making the page your own now. Add the family’s story, choose the kinds of support that would be most helpful, and share the page whenever you’re ready.")}

              <div style="height:40px; line-height:40px; font-size:1px;">&nbsp;</div>

              <!-- Section 1: share link -->
              ${eyebrow("Your family’s page")}
              ${h2("Share this link with your community.")}
              ${body("This is the link for friends, family, neighbors, coworkers, and anyone else who wants to help. They can use it to see what is needed, sign up to help, and stay connected over time.")}
              ${urlField(pageUrl)}
              <div style="margin-top:24px;">${primaryBtn(pageUrl, "View &amp; share page &rarr;")}</div>

              ${rule(48)}

              <!-- Section 2: private admin link -->
              ${eyebrow("For you")}
              ${h2("Make the page yours.")}
              ${body("Use your private admin link to edit the page, add or update needs, manage sign-ups, share announcements, and make changes as life changes.")}
              <div style="margin-top:24px;">${outlineBtn(manageUrl, "Edit your support page &rarr;")}</div>
              <p style="margin:20px 0 0; font-family:${SANS}; font-size:13px; line-height:1.55; color:${INK_FAINT};">Keep this link private. Anyone with this link may be able to manage your family’s support page.</p>

              ${rule(48)}

              <!-- Closing -->
              <p style="margin:0; font-family:${SERIF}; font-size:18px; line-height:1.5; color:${INK};">You don’t have to have everything figured out today.</p>
              ${body("Start with what would be helpful now. You can come back and change the page whenever you need to.")}
              ${body("We’re glad you’re here.")}
              <p style="margin:26px 0 0; font-family:${SERIF}; font-size:16px; color:${INK};">Family Grief Support</p>
              <p style="margin:4px 0 0; font-family:${SANS}; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:${INK_FAINT};">Showing up. Together.</p>

            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
          <tr>
            <td style="padding:24px 8px 8px; font-family:${SANS}; font-size:11px; letter-spacing:0.06em; color:${INK_FAINT};" align="center">
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
    name ? `Your support page for ${name} is ready.` : "Your support page is ready.",
    "",
    "You created a place where the people who care can know how to show up.",
    "You can begin making the page your own now — add the family’s story, choose",
    "the kinds of support that would be most helpful, and share it when you’re ready.",
    "",
    "— YOUR FAMILY’S PAGE —",
    "Share this link with friends, family, neighbors, and anyone who wants to help:",
    pageUrl,
    "",
    "— FOR YOU —",
    "Your private admin link — edit the page and manage sign-ups. Keep it private;",
    "anyone with this link may be able to manage the page:",
    manageUrl,
    "",
    "You don’t have to have everything figured out today. Start with what would be",
    "helpful now, and come back to change the page whenever you need to.",
    "",
    "We’re glad you’re here.",
    "Family Grief Support — Showing up. Together.",
  ].join("\n");

  return { subject, html, text };
}
