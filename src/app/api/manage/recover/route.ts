import { NextResponse } from "next/server";
import { getFamiliesByContactEmail } from "@/lib/families";
import { sendEmail } from "@/lib/email";
import { resolveBaseUrl } from "@/lib/urls";

// Public: "I lost my manage link." Looks up pages by the email on file and
// re-sends the private manage link — only ever to that on-file address.
// Always returns the same generic response so no one can probe which emails
// have pages (no account enumeration).
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 200);
  const generic = {
    ok: true,
    message:
      "If we have a page connected to that email, we’ve just sent the manage link there. Please check your inbox (and spam).",
  };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    // Don't leak validation state — respond the same either way.
    return NextResponse.json(generic);
  }

  const families = await getFamiliesByContactEmail(email);
  if (families.length === 0) {
    return NextResponse.json(generic);
  }

  const origin = resolveBaseUrl(req);
  const lines = families.map((f) => {
    const label = f.display_name || f.honoring || "your page";
    return `${label}\n${origin}/manage?token=${f.edit_token}`;
  });

  const text = [
    families.length === 1
      ? "Here’s your private link to manage your page:"
      : "Here are your private links to manage your pages:",
    "",
    ...lines,
    "",
    "Keep this link safe — anyone with it can edit the page. If you didn’t ask for this, you can ignore this email.",
  ].join("\n");

  const htmlLinks = families
    .map((f) => {
      const label = f.display_name || f.honoring || "your page";
      const url = `${origin}/manage?token=${f.edit_token}`;
      return `<p style="margin:0 0 14px;"><strong>${escapeHtml(label)}</strong><br/>
        <a href="${url}" style="color:#8B6A43;word-break:break-all;">${url}</a></p>`;
    })
    .join("");

  const html = `<div style="font-family:Georgia,serif;color:#332F28;font-size:16px;line-height:1.7;">
    <p>${
      families.length === 1
        ? "Here’s your private link to manage your page:"
        : "Here are your private links to manage your pages:"
    }</p>
    ${htmlLinks}
    <p style="color:#6E6858;font-size:14px;">Keep this link safe — anyone with it can edit the page. If you didn’t ask for this, you can ignore this email.</p>
  </div>`;

  const r = await sendEmail({
    to: [email],
    subject: "Your manage link 💛",
    text,
    html,
  });
  if (!r.ok) console.error("[recover] send failed:", r.error);

  // Always the same response, even if the send failed, so timing/content can't
  // be used to probe which emails exist.
  return NextResponse.json(generic);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
