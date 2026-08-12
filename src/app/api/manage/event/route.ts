import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getFamilyByEditToken } from "@/lib/families";

// Add / remove a family's events ("come cheer them on"). Gated by edit token.
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
    return NextResponse.json({ ok: false, error: "Please add a title." }, { status: 400 });
  }
  const eventDate = clean(body.eventDate, 10);
  const eventTime = clean(body.eventTime, 60);
  const location = clean(body.location, 300);
  const description = clean(body.description, 1000);

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ ok: false, error: "Not connected yet." }, { status: 503 });

  const { data, error } = await supabase
    .from("events")
    .insert({
      family_id: family.id,
      title,
      event_date: /^\d{4}-\d{2}-\d{2}$/.test(eventDate) ? eventDate : null,
      event_time: eventTime || null,
      location: location || null,
      description: description || null,
    })
    .select("*")
    .single();
  if (error) {
    console.error("[manage/event] insert failed:", error);
    return NextResponse.json({ ok: false, error: "Couldn't add that. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, event: data });
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

  const { error } = await supabase.from("events").delete().eq("id", id).eq("family_id", family.id);
  if (error) {
    console.error("[manage/event] delete failed:", error);
    return NextResponse.json({ ok: false, error: "Couldn't remove that. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
