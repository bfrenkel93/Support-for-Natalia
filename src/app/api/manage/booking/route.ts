import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getFamilyByEditToken } from "@/lib/families";
import { sendFamilyRequestDecision } from "@/lib/email";
import type { Booking } from "@/lib/supabase";

export const runtime = "nodejs";

function clean(v: unknown, max: number): string {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function prettyDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * A family approves or declines a pending visit / kids request. Gated by the
 * family's secret edit token, and every update is scoped by family_id so one
 * family can never touch another's bookings.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const token = clean(body.token, 200);
  const id = clean(body.id, 60);
  const action = clean(body.action, 20); // "confirm" | "decline"
  const note = clean(body.note, 400);

  if (!token || !id || (action !== "confirm" && action !== "decline")) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const family = await getFamilyByEditToken(token);
  if (!family) {
    return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Not connected." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: action === "confirm" ? "confirmed" : "declined" })
    .eq("id", id)
    .eq("family_id", family.id) // never touch another family's booking
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: "Couldn't update that request." }, { status: 500 });
  }

  const b = data as Booking;
  if (b.email) {
    const familyName =
      family.display_name || (family.honoring ? `${family.honoring}'s family` : "the family");
    await sendFamilyRequestDecision({
      to: b.email,
      confirmed: action === "confirm",
      dateLabel: prettyDate(b.event_date),
      kind: b.kind,
      familyName,
      note: note || null,
    });
  }

  return NextResponse.json({ ok: true });
}
