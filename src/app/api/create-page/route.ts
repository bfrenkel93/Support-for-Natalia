import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createFamily } from "@/lib/families";
import { creatorWelcomeEmail } from "@/lib/emails";

// Public self-serve endpoint: turns the "create your page" form into a real,
// live family page. No approval — the page exists the moment this returns.
export const runtime = "nodejs";

function clean(v: unknown, max: number): string {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
function multiline(v: unknown, max: number): string {
  return String(v ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
}

/**
 * Resolve the public base URL for links in emails. Prefers an explicit env
 * setting, then the real forwarded host (correct behind Vercel's proxy), and
 * only falls back to the request URL — so links never point at an internal
 * host or localhost in production.
 */
function resolveBaseUrl(req: Request): string {
  const env = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) {
    const proto = req.headers.get("x-forwarded-proto") || "https";
    return `${proto}://${host}`;
  }
  return new URL(req.url).origin;
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const creatorName = clean(body.name, 200);
  const email = clean(body.email, 200);
  const familyEmail = clean(body.familyEmail, 200);
  const displayName = clean(body.displayName, 200);
  const honoring = clean(body.honoring, 200);
  const town = clean(body.town, 200);
  const hasKids = body.hasKids === true || body.hasKids === "true";
  const isPublic = body.isPublic === true || body.isPublic === "true";
  const introMessage = multiline(body.introMessage, 4000);

  if (!creatorName || !email || !/.+@.+\..+/.test(email) || !displayName) {
    return NextResponse.json(
      { ok: false, error: "Please include your name, a valid email, and a name for the page." },
      { status: 400 }
    );
  }

  const family = await createFamily({
    creatorName,
    contactEmail: email,
    familyEmail: familyEmail || undefined,
    displayName,
    honoring,
    town,
    hasKids,
    isPublic,
    introMessage,
  });

  if (!family) {
    return NextResponse.json(
      { ok: false, error: "Something went wrong creating the page. Please try again." },
      { status: 500 }
    );
  }

  const origin = resolveBaseUrl(req);
  const pageUrl = `${origin}/${family.slug}`;
  const manageUrl = `${origin}/manage?token=${family.edit_token}`;

  // Best-effort emails — never block the creation on email.
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const resend = new Resend(apiKey);
    const from =
      process.env.RESEND_FROM || "Family Grief Support <onboarding@resend.dev>";
    const owner = process.env.NOTIFY_EMAIL || "brookefrenkel@gmail.com";

    try {
      await resend.emails.send({
        from,
        to: owner,
        replyTo: email,
        subject: `New page created — ${family.display_name}`,
        text: [
          `A new family page was just created.`,
          ``,
          `Page: ${family.display_name}`,
          `URL: ${pageUrl}`,
          `Manage: ${manageUrl}`,
          `Honoring: ${honoring || "(not specified)"}`,
          `Children: ${hasKids ? "yes" : "no"}`,
          `Visibility: ${isPublic ? "public" : "private (link only)"}`,
          `Created by: ${creatorName} <${email}>`,
        ].join("\n"),
      });
    } catch (err) {
      console.error("create-page: owner email failed", err);
    }

    try {
      const welcome = creatorWelcomeEmail({
        displayName: family.display_name,
        pageUrl,
        manageUrl,
      });
      await resend.emails.send({
        from,
        to: email,
        subject: welcome.subject,
        html: welcome.html,
        text: welcome.text,
      });
    } catch (err) {
      console.error("create-page: creator email failed", err);
    }
  } else {
    console.warn("create-page: RESEND_API_KEY not set — no emails sent");
  }

  return NextResponse.json({
    ok: true,
    slug: family.slug,
    pageUrl,
    manageUrl,
  });
}
