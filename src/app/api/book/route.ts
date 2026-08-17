import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getFamilyBySlug, parseRecipients } from "@/lib/families";
import { sendEmail } from "@/lib/email";
import { FAMILY_KIND_LABEL } from "@/lib/bookings";
import { resolveBaseUrl } from "@/lib/urls";
import { rateLimit, clientIp, TOO_MANY } from "@/lib/ratelimit";

// A supporter signs up to show up for a specific family (meal / visit / errand /
// time with the kids). Scoped to that family; the family gets an email.
export const runtime = "nodejs";

const VALID_KINDS = ["kids", "meal", "visit", "errand"] as const;
type Kind = (typeof VALID_KINDS)[number];

function clean(v: unknown, max: number): string {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  if (!(await rateLimit("book", clientIp(req), 20, 3600))) {
    return NextResponse.json(TOO_MANY, { status: 429 });
  }
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
      message: "This is a sample page — create your own to try this for real. 💛",
    });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Sign-ups aren't connected yet." }, { status: 503 });
  }

  // Visits and time with the kids are a request the family approves; meals and
  // errands are instant (no reason to gate a dropped-off meal).
  const requested = kind === "visit" || kind === "kids";

  // The family can pause new visit/kids requests when it's a lot right now.
  // Meals and other help still go through.
  if (requested && family.content?.pause_requests) {
    return NextResponse.json({
      ok: false,
      error:
        "The family is taking a little breathing room and isn’t accepting new visit requests right now. Meals and other help are still welcome — thank you. 💛",
    });
  }

  const { data: inserted, error } = await supabase
    .from("bookings")
    .insert({
      family_id: family.id,
      event_date: eventDate,
      kind,
      status: requested ? "requested" : "confirmed",
      name,
      email: email || null,
      note: note || null,
      private: isPrivate,
    })
    .select("id")
    .single();

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

  // Let the family know someone signed up (best-effort). Requests get one-tap
  // Approve / Decline links right in the email — no login, no dashboard.
  // Instant sign-ups (meals, errands) are just a warm heads-up.
  const recipients = parseRecipients(family.contact_email);
  if (recipients.length) {
    const base = resolveBaseUrl(req);
    const bookingId = inserted?.id;
    const approveUrl = `${base}/manage/approve?token=${family.edit_token}&id=${bookingId}&do=confirm`;
    const declineUrl = `${base}/manage/approve?token=${family.edit_token}&id=${bookingId}&do=decline`;
    const kindLabel = FAMILY_KIND_LABEL[kind];
    const dateLabel = prettyDate(eventDate);

    const text = [
      requested
        ? `${name} would like to help — this one is yours to approve.`
        : `${name} just signed up on your page "${family.display_name}".`,
      ``,
      `What: ${kindLabel}`,
      `When: ${dateLabel}`,
      email ? `Email: ${email}` : `Email: (not provided)`,
      note ? `Note: ${note}` : ``,
      requested && bookingId ? `` : ``,
      requested && bookingId ? `Approve: ${approveUrl}` : ``,
      requested && bookingId ? `Decline: ${declineUrl}` : ``,
    ].filter(Boolean).join("\n");

    const html =
      requested && bookingId
        ? `<div style="font-family:Georgia,serif;color:#3E3A33;line-height:1.7;font-size:16px;">
             <p><strong>${escapeHtml(name)}</strong> would like to help — this one is yours to approve.</p>
             <p style="color:#6E6858;">${escapeHtml(kindLabel)} · ${escapeHtml(dateLabel)}${email ? ` · ${escapeHtml(email)}` : ""}</p>
             ${note ? `<p style="color:#6E6858;">“${escapeHtml(note)}”</p>` : ""}
             <p style="margin-top:18px;">
               <a href="${approveUrl}" style="display:inline-block;background:#2A2620;color:#F7F4ED;text-decoration:none;padding:11px 22px;border-radius:3px;font-size:14px;">Approve</a>
               &nbsp;&nbsp;
               <a href="${declineUrl}" style="display:inline-block;border:1px solid #C6B99F;color:#3E3A33;text-decoration:none;padding:10px 22px;border-radius:3px;font-size:14px;">Decline</a>
             </p>
             <p style="color:#9A9082;font-size:13px;margin-top:14px;">One tap — no login needed. It’ll ask you to confirm.</p>
           </div>`
        : undefined;

    const r = await sendEmail({
      to: recipients,
      replyTo: email || undefined,
      subject: requested
        ? `A request to approve — ${kindLabel} on ${dateLabel}`
        : `New sign-up — ${kindLabel} on ${dateLabel}`,
      text,
      html,
    });
    if (!r.ok) console.error("[book] notification failed:", r.error);
  }

  return NextResponse.json({
    ok: true,
    pending: requested,
    message: requested
      ? "Your request has been sent. The family will confirm it or suggest another time — thank you for offering to show up. 💛"
      : "Thank you for showing up for them. Your day is saved. 💛",
  });
}
