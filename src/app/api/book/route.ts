import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";
import { getFamilyBySlug, parseRecipients } from "@/lib/families";
import { FAMILY_KIND_LABEL } from "@/lib/bookings";

// A supporter signs up to show up for a specific family (meal / visit / errand /
// time with the kids). Scoped to that family; the family gets an email.
export const runtime = "nodejs";

const VALID_KINDS = ["kids", "meal", "visit", "errand"] as const;
type Kind = (typeof VALID_KINDS)[number];

function clean(v: unknown, max: number): string {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function prettyDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const slug = clean(body.slug, 60).toLowerCase();
  const eventDate = clean(body.event_date, 10);
  const kind = clean(body.kind, 10) as Kind;
  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const note = clean(body.note, 1000);
  const isPrivate = body.private === true || body.private === "true";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return NextResponse.json({ ok: false, error: "Please choose a day." }, { status: 400 });
  }
  if (!VALID_KINDS.includes(kind)) {
    return NextResponse.json({ ok: false, error: "Please choose what you'd like to do." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ ok: false, error: "Please add your name." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "That email doesn't look right." }, { status: 400 });
  }

  const family = await getFamilyBySlug(slug);
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
    return NextResponse.json({ ok: false, error: "Sign-ups aren't connected yet." }, { status: 503 });
  }

  const { error } = await supabase.from("bookings").insert({
    family_id: family.id,
    event_date: eventDate,
    kind,
    status: "confirmed",
    name,
    email: email || null,
    note: note || null,
    private: isPrivate,
  });

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { ok: false, error: "A meal is already booked for that day — please pick another day, or choose a visit instead." },
        { status: 409 }
      );
    }
    console.error("[book] insert failed:", error);
    return NextResponse.json({ ok: false, error: "Sorry — we couldn't save that. Please try again." }, { status: 500 });
  }

  // Let the family know someone signed up (best-effort).
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
        subject: `New sign-up — ${FAMILY_KIND_LABEL[kind]} on ${prettyDate(eventDate)}`,
        text: [
          `${name} just signed up on your page "${family.display_name}".`,
          ``,
          `What: ${FAMILY_KIND_LABEL[kind]}`,
          `When: ${prettyDate(eventDate)}`,
          email ? `Email: ${email}` : `Email: (not provided)`,
          note ? `Note: ${note}` : ``,
        ].filter(Boolean).join("\n"),
      });
    } catch (err) {
      console.error("[book] notification failed:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Thank you for showing up for them. Your day is saved. 💛",
  });
}
