import { NextResponse } from "next/server";
import { getFamilyBySlug } from "@/lib/families";
import { sendEmail } from "@/lib/email";
import { addFamilySubscriber } from "@/lib/subscribers";

// Public: someone opts in to occasional updates for a specific family.
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const slug = String(body.slug ?? "").trim().toLowerCase().slice(0, 60);
  const email = String(body.email ?? "").trim().slice(0, 200);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email." }, { status: 400 });
  }

  const family = slug ? await getFamilyBySlug(slug) : null;
  if (!family) {
    return NextResponse.json({ ok: false, error: "That page couldn't be found." }, { status: 404 });
  }

  const result = await addFamilySubscriber(family.id, email);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: "Sorry — that didn't go through. Please try again." }, { status: 500 });
  }

  if (result.token) {
    const origin = new URL(req.url).origin;
    const r = await sendEmail({
      to: [email],
      subject: `You're following updates for ${family.display_name}`,
      text: [
        `Thank you for staying close.`,
        ``,
        `You'll get an occasional, gentle note about ways to show up for ${family.display_name}.`,
        ``,
        `You can unsubscribe anytime here:`,
        `${origin}/unsubscribe?token=${result.token}`,
      ].join("\n"),
    });
    if (!r.ok) console.error("[subscribe] confirmation failed:", r.error);
  }

  return NextResponse.json({
    ok: true,
    message: "You're on the list — thank you for staying close. 💛",
  });
}
