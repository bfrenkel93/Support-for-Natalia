import { NextResponse } from "next/server";
import { sendEmail, organizerList } from "@/lib/email";

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

  // Goes to the platform owner (you) — the "Start a page" inbox.
  const recipients = organizerList();
  const to = recipients.length ? recipients : ["support@familygriefsupport.org"];

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

  const r = await sendEmail({
    to,
    replyTo: email,
    subject: `New page request — ${name}`,
    text,
  });
  if (!r.ok) {
    // Log but don't fail the request — we never want the person to hit an error.
    console.error("request-page: email send failed:", r.error);
  }

  return NextResponse.json({ ok: true });
}
