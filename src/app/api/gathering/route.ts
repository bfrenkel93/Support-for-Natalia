import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";
import { getFamilyBySlug, parseRecipients } from "@/lib/families";
import { getFamilyGathering } from "@/lib/gathering";

// Public: RSVP to a family's memorial gathering.
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const slug = String(body.slug ?? "").trim().toLowerCase().slice(0, 60);
  const name = String(body.name ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().slice(0, 200);
  const note = String(body.note ?? "").trim().slice(0, 1000);
  const attending = body.attending !== false && body.attending !== "false";
  let partySize = Number(body.party_size ?? 1);

  if (!name) {
    return NextResponse.json({ ok: false, error: "Please add your name." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "That email doesn't look right." }, { status: 400 });
  }
  if (!Number.isFinite(partySize)) partySize = 1;
  // Regrets don't add to the headcount.
  partySize = attending ? Math.max(1, Math.min(30, Math.round(partySize))) : 0;

  const family = slug ? await getFamilyBySlug(slug) : null;
  if (!family) {
    return NextResponse.json({ ok: false, error: "That page couldn't be found." }, { status: 404 });
  }
  if (family.content?.is_demo) {
    return NextResponse.json({
      ok: true,
      message: "This is an example page — create your own to try this for real. 💛",
    });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Not connected yet." }, { status: 503 });
  }

  const { error } = await supabase.from("gathering_rsvps").insert({
    family_id: family.id,
    name,
    email: email || null,
    party_size: partySize,
    attending,
    note: note || null,
  });
  if (error) {
    console.error("[gathering] insert failed:", error);
    return NextResponse.json({ ok: false, error: "Sorry — we couldn't save that. Please try again." }, { status: 500 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const recipients = parseRecipients(family.contact_email);
  if (apiKey && recipients.length) {
    try {
      const { total } = await getFamilyGathering(family.id);
      const resend = new Resend(apiKey);
      const from = process.env.RESEND_FROM || "Family Grief Support <onboarding@resend.dev>";
      await resend.emails.send({
        from,
        to: recipients,
        replyTo: email || undefined,
        subject: attending
          ? `New RSVP — ${name} (${partySize})`
          : `RSVP — ${name} can't make it`,
        text: [
          attending
            ? `${name} RSVP'd to your gathering with a party of ${partySize}.`
            : `${name} let you know they can't make the gathering.`,
          note ? `Note: ${note}` : ``,
          ``,
          `Running headcount: ${total}`,
        ].filter(Boolean).join("\n"),
      });
    } catch (err) {
      console.error("[gathering] notification failed:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    message: attending
      ? "Thank you — your RSVP is in. We're grateful you'll be there. 💛"
      : "Thank you for letting them know. 💛",
  });
}
