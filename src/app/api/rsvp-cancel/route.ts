import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Cancel an RSVP via its unguessable token. POST-only (never a bare GET link),
// so email link-scanners can't cancel people by accident.
export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? "").trim();
  const type = String(body.type ?? "g").trim();

  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
  }

  const table = type === "e" ? "event_rsvps" : "gathering_rsvps";
  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json({ ok: false, error: "Not connected." }, { status: 503 });
  }

  const { error } = await sb.from(table).delete().eq("cancel_token", token);
  if (error) {
    console.error("[rsvp-cancel] delete failed:", error);
    return NextResponse.json(
      { ok: false, error: "Couldn't cancel. Please try again." },
      { status: 500 }
    );
  }

  // Idempotent: a token that no longer matches anything still returns ok, so a
  // second click just confirms "already canceled."
  return NextResponse.json({ ok: true });
}
