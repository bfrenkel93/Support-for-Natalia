import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getFamilyByEditToken, parseRecipients } from "@/lib/families";

// Save a family's page details. Gated by the secret edit token (their private
// "manage" link) — no password.
export const runtime = "nodejs";

function clean(v: unknown, max: number): string {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
function multiline(v: unknown, max: number): string {
  return String(v ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const token = clean(body.token, 100);
  const family = token ? await getFamilyByEditToken(token) : null;
  if (!family) {
    return NextResponse.json({ ok: false, error: "This manage link isn't valid." }, { status: 404 });
  }

  const displayName = clean(body.displayName, 200) || family.display_name;
  const honoring = clean(body.honoring, 200);
  const town = clean(body.town, 200);
  const hasKids = body.hasKids === true || body.hasKids === "true";
  const isPublic = body.isPublic === true || body.isPublic === "true";
  const introMessage = multiline(body.introMessage, 6000);

  // Notification email(s) — where sign-ups, RSVPs, and memories are sent. May
  // hold more than one address (the family member and the friend who helps).
  const contactEmailRaw = clean(body.contactEmail, 300);
  const recipients = parseRecipients(contactEmailRaw);
  if (contactEmailRaw && recipients.length === 0) {
    return NextResponse.json(
      { ok: false, error: "That notification email doesn’t look right." },
      { status: 400 }
    );
  }
  const contactEmail = recipients.length
    ? recipients.join(", ")
    : family.contact_email;

  const content = {
    ...(family.content || {}),
    intro_title: displayName,
    eyebrow: clean(body.eyebrow, 120),
    relationship: clean(body.relationship, 60),
    intro_message: introMessage,
    memorial_title: clean(body.memorialTitle, 200),
    memorial_intro: multiline(body.memorialIntro, 3000),
    memorial_when: clean(body.memorialWhen, 200),
    memorial_where: clean(body.memorialWhere, 300),
    memorial_note: multiline(body.memorialNote, 2000),
    gifts_intro: multiline(body.giftsIntro, 2000),
    pay_venmo: clean(body.payVenmo, 120),
    pay_cashapp: clean(body.payCashapp, 120),
    pay_zelle: clean(body.payZelle, 120),
    show_calendar: body.showCalendar !== false,
    show_memorial: body.showMemorial !== false,
    show_gifts: body.showGifts !== false,
    show_subscribe: body.showSubscribe !== false,
    show_memories: body.showMemories !== false,
    show_events: body.showEvents !== false,
    memories_public: body.memoriesPublic === true,
    support_name: clean(body.supportName, 120),
    support_address: clean(body.supportAddress, 300),
    support_note: clean(body.supportNote, 500),
    show_support: body.showSupport !== false,
  };

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Not connected yet." }, { status: 503 });
  }

  const { error } = await supabase
    .from("families")
    .update({
      display_name: displayName,
      honoring: honoring || null,
      town: town || null,
      has_kids: hasKids,
      is_public: isPublic,
      contact_email: contactEmail,
      content,
    })
    .eq("id", family.id);

  if (error) {
    console.error("[manage] update failed:", error);
    return NextResponse.json({ ok: false, error: "Couldn't save. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug: family.slug });
}
