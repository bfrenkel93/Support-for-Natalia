import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getFamilyByEditToken } from "@/lib/families";

// Add / remove a family's posted needs ("Ways to help right now").
// Gated by the family's edit token.
export const runtime = "nodejs";

function clean(v: unknown, max: number): string {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = clean(body.token, 100);
  const family = token ? await getFamilyByEditToken(token) : null;
  if (!family) {
    return NextResponse.json({ ok: false, error: "This manage link isn't valid." }, { status: 404 });
  }

  const title = clean(body.title, 200);
  if (!title) {
    return NextResponse.json({ ok: false, error: "Please describe the need." }, { status: 400 });
  }
  const details = clean(body.details, 1000);
  const neededDate = clean(body.neededDate, 10);

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ ok: false, error: "Not connected yet." }, { status: 503 });

  const { data, error } = await supabase
    .from("requests")
    .insert({
      family_id: family.id,
      title,
      details: details || null,
      needed_date: /^\d{4}-\d{2}-\d{2}$/.test(neededDate) ? neededDate : null,
    })
    .select("id, title, details, needed_date, claimed_by, claimed_at")
    .single();
  if (error) {
    console.error("[manage/request] insert failed:", error);
    return NextResponse.json({ ok: false, error: "Couldn't add that. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, request: data });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = clean(body.token, 100);
  const id = clean(body.id, 100);
  const family = token ? await getFamilyByEditToken(token) : null;
  if (!family) {
    return NextResponse.json({ ok: false, error: "This manage link isn't valid." }, { status: 404 });
  }
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ ok: false, error: "Not connected yet." }, { status: 503 });

  const { error } = await supabase.from("requests").delete().eq("id", id).eq("family_id", family.id);
  if (error) {
    console.error("[manage/request] delete failed:", error);
    return NextResponse.json({ ok: false, error: "Couldn't remove that. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
