import { NextResponse } from "next/server";
import { Resend } from "resend";

// Public marketing form ("Start a page") submissions land here and are emailed
// to the owner. Reuses the same Resend config as the rest of the app.
export const runtime = "nodejs";

function clean(v: unknown, max: number): string {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const name = clean(body.name, 200);
  const email = clean(body.email, 200);
  const honoring = clean(body.honoring, 300);
  const message = clean(body.message, 4000);

  if (!name || !email || !/.+@.+\..+/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Please include your name and a valid email." },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL || "support@familygriefsupport.org";
  const from =
    process.env.RESEND_FROM || "Family Grief Support <onboarding@resend.dev>";

  const text = [
    `New page request from the familygriefsupport.org landing page.`,
    ``,
    `Name: ${name}`,
    `Email: ${email}`,
    `Supporting: ${honoring || "(not specified)"}`,
    ``,
    `Message:`,
    message || "(none)",
  ].join("\n");

  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from,
        to,
        replyTo: email,
        subject: `New page request — ${name}`,
        text,
      });
    } catch (err) {
      // Log but don't fail the request — we never want the person to hit an error.
      console.error("request-page: email send failed", err);
    }
  } else {
    console.warn("request-page: RESEND_API_KEY not set — request not emailed", {
      name,
      email,
      honoring,
    });
  }

  return NextResponse.json({ ok: true });
}
