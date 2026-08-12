import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getFamilyByEditToken } from "@/lib/families";

// Add / remove a family's gift ideas. Gated by the secret edit token.
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
  const description = clean(body.description, 1000);
  const link = clean(body.link, 500);
  let cost: number | null = null;
  const c = Number(clean(body.cost, 40).replace(/[^0-9.]/g, ""));
  if (Number.isFinite(c) && c > 0) cost = c;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ ok: false, error: "Not connected yet." }, { status: 503 });

  const { data, error } = await supabase
    .from("gifts")
    .insert({
      family_id: family.id,
      title,
      description: description || null,
      link: link || null,
      cost,
    })
    .select("*")
    .single();
  if (error) {
    console.error("[manage/gift] insert failed:", error);
    return NextResponse.json({ ok: false, error: "Couldn't add that. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, gift: data });
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

  const { error } = await supabase.from("gifts").delete().eq("id", id).eq("family_id", family.id);
  if (error) {
    console.error("[manage/gift] delete failed:", error);
    return NextResponse.json({ ok: false, error: "Couldn't remove that. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
