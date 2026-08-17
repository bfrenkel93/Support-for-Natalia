import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getFamilyByEditToken } from "@/lib/families";

// Pause / resume new visit & kids requests. Edit-token gated. Only flips the
// one flag, leaving the rest of the page content untouched.
export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? "").trim();
  const paused = body.paused === true || body.paused === "true";

  const family = token ? await getFamilyByEditToken(token) : null;
  if (!family) {
    return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Not connected." }, { status: 503 });
  }

  const content = { ...(family.content || {}), pause_requests: paused };
  const { error } = await supabase
    .from("families")
    .update({ content })
    .eq("id", family.id);

  if (error) {
    console.error("[manage/pause] update failed:", error);
    return NextResponse.json({ ok: false, error: "Couldn't save. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, paused });
}
