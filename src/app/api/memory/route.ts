import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getFamilyBySlug, parseRecipients } from "@/lib/families";
import { stripJpegMetadata } from "@/lib/image";
import {
  saveFamilyMemory,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_BYTES,
  MAX_FILES,
  type IncomingFile,
} from "@/lib/memories";

// Public: a supporter shares a story + photos for a specific family. Private —
// stored in the non-public memories bucket; only the family can view them.
export const runtime = "nodejs";

const MAX_STORY = 8000;

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid submission." }, { status: 400 });
  }

  const slug = String(form.get("slug") || "").trim().toLowerCase();
  const name = String(form.get("name") || "").trim().slice(0, 200);
  const email = String(form.get("email") || "").trim().slice(0, 200);
  const story = String(form.get("story") || "").trim().slice(0, MAX_STORY);
  const rawFiles = form
    .getAll("media")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (!story && rawFiles.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Please write something or add at least one photo." },
      { status: 400 }
    );
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "That email doesn't look right." }, { status: 400 });
  }
  if (rawFiles.length > MAX_FILES) {
    return NextResponse.json(
      { ok: false, error: `Please share up to ${MAX_FILES} photos at a time.` },
      { status: 400 }
    );
  }

  const family = slug ? await getFamilyBySlug(slug) : null;
  if (!family) {
    return NextResponse.json({ ok: false, error: "That page couldn't be found." }, { status: 404 });
  }

  const files: IncomingFile[] = [];
  for (const file of rawFiles) {
    const contentType = (file.type || "").toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return NextResponse.json(
        { ok: false, error: "Only photos are supported (JPEG, PNG, WEBP, GIF, or HEIC)." },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { ok: false, error: `Each photo needs to be under ${Math.floor(MAX_FILE_BYTES / (1024 * 1024))} MB.` },
        { status: 400 }
      );
    }
    let buffer: Buffer = Buffer.from(await file.arrayBuffer());
    if (contentType === "image/jpeg") buffer = stripJpegMetadata(buffer);
    files.push({
      buffer,
      fileName: file.name || "photo",
      contentType,
      sizeBytes: buffer.length,
    });
  }

  // A story can be public only if this family allows public stories at all.
  const allowPublic = family.content?.memories_public === true;
  const wantsPublic = String(form.get("isPublic") || "") === "true";

  const result = await saveFamilyMemory(family.id, {
    authorName: name,
    authorEmail: email,
    story,
    isPublic: allowPublic && wantsPublic,
    files,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error || "Couldn't save. Please try again." },
      { status: 500 }
    );
  }

  // Notify the family that something was shared — never the content itself.
  const apiKey = process.env.RESEND_API_KEY;
  const recipients = parseRecipients(family.contact_email);
  if (apiKey && recipients.length) {
    try {
      const resend = new Resend(apiKey);
      const from = process.env.RESEND_FROM || "Family Grief Support <onboarding@resend.dev>";
      const origin = new URL(req.url).origin;
      await resend.emails.send({
        from,
        to: recipients,
        subject: `A new memory was shared 💛`,
        text: [
          `${name || "Someone"} just shared ${
            result.photoCount > 0 ? `a memory with ${result.photoCount} photo(s)` : "a memory"
          } on your page.`,
          ``,
          `You can read it privately here:`,
          `${origin}/manage?token=${family.edit_token}`,
        ].join("\n"),
      });
    } catch (err) {
      console.error("[memory] notification failed:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Thank you for sharing this. It's safe with the family. 💛",
  });
}
