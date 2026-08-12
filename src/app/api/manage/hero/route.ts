import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getFamilyByEditToken } from "@/lib/families";
import { stripJpegMetadata } from "@/lib/image";

// Upload a family's hero photo. Gated by the secret edit token. Stored in the
// public 'family-heroes' bucket; the URL is saved to the family's content.
export const runtime = "nodejs";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid upload." }, { status: 400 });
  }

  const token = String(form.get("token") || "").trim();
  const file = form.get("file");
  const family = token ? await getFamilyByEditToken(token) : null;
  if (!family) {
    return NextResponse.json({ ok: false, error: "This manage link isn't valid." }, { status: 404 });
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "Please choose a photo." }, { status: 400 });
  }
  const contentType = (file.type || "").toLowerCase();
  if (!ALLOWED.has(contentType)) {
    return NextResponse.json({ ok: false, error: "Please use a JPEG, PNG, WEBP, or HEIC photo." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "That photo is a bit large — please keep it under 12 MB." }, { status: 400 });
  }

  let buffer: Buffer = Buffer.from(await file.arrayBuffer());
  if (contentType === "image/jpeg") {
    // Strip EXIF/location data before it's stored.
    buffer = stripJpegMetadata(buffer);
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Not connected yet." }, { status: 503 });
  }

  const path = `${family.id}/hero`;
  const { error: upErr } = await supabase.storage
    .from("family-heroes")
    .upload(path, buffer, { contentType, upsert: true });
  if (upErr) {
    console.error("[manage/hero] upload failed:", upErr);
    return NextResponse.json({ ok: false, error: "Couldn't upload that photo. Please try again." }, { status: 500 });
  }

  const { data } = supabase.storage.from("family-heroes").getPublicUrl(path);
  const url = `${data.publicUrl}?v=${Date.now()}`;

  const content = { ...(family.content || {}), hero_image_url: url };
  const { error: updErr } = await supabase
    .from("families")
    .update({ content })
    .eq("id", family.id);
  if (updErr) {
    console.error("[manage/hero] save url failed:", updErr);
    return NextResponse.json({ ok: false, error: "Uploaded, but couldn't save it. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url });
}
