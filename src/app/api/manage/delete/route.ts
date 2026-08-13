import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getFamilyByEditToken, NATALIA_FAMILY_ID } from "@/lib/families";

// Permanently delete a family page and everything on it. Gated by the secret
// edit token (the family's private "manage" link).
export const runtime = "nodejs";

// Deleted children-first so any foreign keys are satisfied. Every content table
// carries a family_id (migration 001), so all are scoped by it.
const CHILD_TABLES = [
  "gift_pledges", "gifts", "memory_media", "memories", "event_rsvps", "events",
  "bookings", "subscribers", "gathering_rsvps", "activity_ideas", "requests",
];

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const token = String(body.token || "").trim();
  const family = token ? await getFamilyByEditToken(token) : null;
  if (!family) {
    return NextResponse.json({ ok: false, error: "This manage link isn't valid." }, { status: 404 });
  }
  if (family.id === NATALIA_FAMILY_ID) {
    return NextResponse.json({ ok: false, error: "This page can't be deleted." }, { status: 403 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Not connected yet." }, { status: 503 });
  }

  // Best-effort: remove the hero photo from storage.
  try {
    await supabase.storage.from("family-heroes").remove([`${family.id}/hero`]);
  } catch {
    // ignore — an orphaned file is harmless
  }

  for (const t of CHILD_TABLES) {
    const { error } = await supabase.from(t).delete().eq("family_id", family.id);
    if (error) console.error(`[manage/delete] ${t}:`, error.message);
  }

  const { error } = await supabase.from("families").delete().eq("id", family.id);
  if (error) {
    console.error("[manage/delete] families:", error);
    return NextResponse.json({ ok: false, error: "Couldn't delete. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
