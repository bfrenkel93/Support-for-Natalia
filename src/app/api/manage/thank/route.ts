import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getFamilyByEditToken } from "@/lib/families";

export const runtime = "nodejs";

function clean(v: unknown, max: number): string {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Send a warm one-tap thank-you from a family to a helper. Gated by the
 * family's secret edit token; only sends to an address that was already
 * given on this page.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const token = clean(body.token, 200);
  const email = clean(body.email, 200);
  const name = clean(body.name, 200);

  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "No valid email on file for this person." },
      { status: 400 }
    );
  }

  const family = await getFamilyByEditToken(token);
  if (!family) {
    return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Email isn't connected yet." }, { status: 503 });
  }

  const who = family.honoring?.trim() || family.display_name;
  const fromName = family.display_name || `${who}'s family`;
  const from =
    process.env.RESEND_FROM || "Family Grief Support <onboarding@resend.dev>";
  const first = name ? name.split(" ")[0] : "there";

  const text =
    `${first},\n\n` +
    `Thank you for showing up for ${who}. In a hard season, ` +
    `your kindness meant more than you know.\n\n` +
    `With love,\n${fromName}`;
  const html =
    `<div style="font-family:Georgia,serif;color:#332F28;font-size:16px;line-height:1.7;">` +
    `<p>${esc(first)},</p>` +
    `<p>Thank you for showing up for ${esc(who)}. In a hard season, ` +
    `your kindness meant more than you know.</p>` +
    `<p style="margin-top:18px;">With love,<br/>${esc(fromName)}</p></div>`;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: email,
      subject: "Thank you 💛",
      text,
      html,
    });
  } catch (err) {
    console.error("[thank] send failed", err);
    return NextResponse.json({ ok: false, error: "Couldn't send. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
