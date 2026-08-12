import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getFamilyBySlug, parseRecipients } from "@/lib/families";
import { getSupabase } from "@/lib/supabase";

// A supporter claims one of the family's posted needs. Public, by slug.
export const runtime = "nodejs";

function clean(v: unknown, max: number): string {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const slug = clean(body.slug, 200).toLowerCase();
  const requestId = clean(body.requestId, 100);
  const name = clean(body.name, 200);
  const email = clean(body.email, 200);

  if (!name) {
    return NextResponse.json({ ok: false, error: "Please add your name." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "That email doesn’t look right." }, { status: 400 });
  }

  const family = slug ? await getFamilyBySlug(slug) : null;
  if (!family) {
    return NextResponse.json({ ok: false, error: "That page couldn’t be found." }, { status: 404 });
  }
  if (family.content?.is_demo) {
    return NextResponse.json({
      ok: true,
      message: "This is a sample page — create your own to try this for real. 💛",
    });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ ok: false, error: "Not connected yet." }, { status: 503 });

  // Only claim if it isn't already taken (guards against two people at once).
  const { data, error } = await supabase
    .from("requests")
    .update({ claimed_by: name, claimed_email: email || null, claimed_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("family_id", family.id)
    .is("claimed_by", null)
    .select("id, title")
    .maybeSingle();

  if (error) {
    console.error("[request-claim] update failed:", error);
    return NextResponse.json({ ok: false, error: "Couldn’t save. Please try again." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Someone just claimed this one. Please refresh to see what’s left." },
      { status: 409 }
    );
  }

  // Notify the family.
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
        subject: `Someone’s helping — ${data.title}`,
        text: [
          `${name} just offered to help with "${data.title}" on your page.`,
          email ? `Email: ${email}` : `Email: (not provided)`,
        ].join("\n"),
      });
    } catch (err) {
      console.error("[request-claim] notification failed:", err);
    }
  }

  return NextResponse.json({ ok: true, message: "Thank you for stepping in. 💛" });
}
