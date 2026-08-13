import { NextResponse } from "next/server";
import { createFamily } from "@/lib/families";
import { creatorWelcomeEmail } from "@/lib/emails";
import { sendEmail } from "@/lib/email";
import { resolveBaseUrl } from "@/lib/urls";
import { rateLimit, clientIp, TOO_MANY } from "@/lib/ratelimit";

// Public self-serve endpoint: turns the "create your page" form into a real,
// live family page. No approval — the page exists the moment this returns.
export const runtime = "nodejs";

function clean(v: unknown, max: number): string {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
function multiline(v: unknown, max: number): string {
  return String(v ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
}

export async function POST(req: Request) {
  // No one legitimately creates many pages a day from one place.
  if (!(await rateLimit("create-page", clientIp(req), 8, 86400))) {
    return NextResponse.json(TOO_MANY, { status: 429 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  // Honeypot: a hidden field real people never fill. Bots do. Pretend success
  // so they don't learn they were caught — but create nothing.
  if (clean(body.company, 200)) {
    return NextResponse.json({ ok: true, slug: "", pageUrl: "", manageUrl: "" });
  }

  const creatorName = clean(body.name, 200);
  const email = clean(body.email, 200);
  const familyEmail = clean(body.familyEmail, 200);
  const honoring = clean(body.honoring, 200);
  const relationship = clean(body.relationship, 160);
  const town = clean(body.town, 200);
  const hasKids = body.hasKids === true || body.hasKids === "true";
  const isPublic = body.isPublic === true || body.isPublic === "true";
  const introMessage = multiline(body.introMessage, 4000);

  // The page title defaults to the person's name (no separate "page name").
  const displayName = clean(body.displayName, 200) || honoring;

  if (!creatorName || !email || !/.+@.+\..+/.test(email) || !displayName) {
    return NextResponse.json(
      { ok: false, error: "Please include your name, a valid email, and the name of the person who died." },
      { status: 400 }
    );
  }

  const family = await createFamily({
    creatorName,
    contactEmail: email,
    familyEmail: familyEmail || undefined,
    displayName,
    honoring,
    relationship,
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

  // Best-effort email — never block the creation on email. Only the warm
  // welcome email is sent (the old plain "new page created" notice is gone).
  // Goes to the page creator only — never to the platform's own inbox.
  const welcome = creatorWelcomeEmail({
    displayName: family.display_name,
    pageUrl,
    manageUrl,
  });
  const emailResult = await sendEmail({
    to: [email],
    subject: welcome.subject,
    html: welcome.html,
    text: welcome.text,
  });
  if (!emailResult.ok) {
    console.error("create-page: welcome email failed:", emailResult.error);
  }

  return NextResponse.json({
    ok: true,
    slug: family.slug,
    pageUrl,
    manageUrl,
  });
}
