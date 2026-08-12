import { NextResponse } from "next/server";
import { getFamilyBySlug, accessToken, accessCookieName } from "@/lib/families";

// Verify a page's access code. On success, set an httpOnly cookie the page
// reads server-side to unlock. Low-stakes gate — a shared family code.
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const slug = String(body.slug || "").trim().toLowerCase();
  const code = String(body.code || "").trim();
  const family = slug ? await getFamilyBySlug(slug) : null;
  if (!family) {
    return NextResponse.json({ ok: false, error: "That page couldn’t be found." }, { status: 404 });
  }

  const required = (family.content?.access_code || "").trim();
  if (!required) {
    // No code set — nothing to unlock.
    return NextResponse.json({ ok: true });
  }
  if (code.toLowerCase() !== required.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "That code isn’t right." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(accessCookieName(family.id), accessToken(family.id, required), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60 days
  });
  return res;
}
