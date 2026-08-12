import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";
import { getFamilyBySlug, parseRecipients } from "@/lib/families";

// Public: RSVP to a family's event ("come cheer them on").
export const runtime = "nodejs";

function clean(v: unknown, max: number): string {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const slug = clean(body.slug, 60).toLowerCase();
  const eventId = clean(body.eventId, 100);
  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const note = clean(body.note, 500);

  if (!eventId) return NextResponse.json({ ok: false, error: "Something went wrong. Please refresh." }, { status: 400 });
  if (!name) return NextResponse.json({ ok: false, error: "Please add your name." }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "That email doesn't look right." }, { status: 400 });
  }

  const family = slug ? await getFamilyBySlug(slug) : null;
  if (!family) return NextResponse.json({ ok: false, error: "That page couldn't be found." }, { status: 404 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ ok: false, error: "Not connected yet." }, { status: 503 });

  const { data: event } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", eventId)
    .eq("family_id", family.id)
    .single();
  if (!event) return NextResponse.json({ ok: false, error: "That event isn't available anymore." }, { status: 404 });

  const { error } = await supabase.from("event_rsvps").insert({
    family_id: family.id,
    event_id: eventId,
    name,
    email: email || null,
    note: note || null,
  });
  if (error) {
    console.error("[rsvp] insert failed:", error);
    return NextResponse.json({ ok: false, error: "Sorry — we couldn't save that. Please try again." }, { status: 500 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const recipients = parseRecipients(family.contact_email);
  if (apiKey && recipients.length) {
    try {
      const resend = new Resend(apiKey);
      const from = process.env.RESEND_FROM || "Family Grief Support <onboarding@resend.dev>";
      await resend.emails.send({
        from,
        to: recipients,
        replyTo: email || undefined,
        subject: `New RSVP — ${name} for "${(event as { title: string }).title}"`,
        text: [
          `${name} is coming to "${(event as { title: string }).title}".`,
          note ? `Note: ${note}` : ``,
        ].filter(Boolean).join("\n"),
      });
    } catch (err) {
      console.error("[rsvp] notification failed:", err);
    }
  }

  return NextResponse.json({ ok: true, message: "You're on the list — thank you for showing up for them. 💛" });
}
