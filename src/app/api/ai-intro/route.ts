import { NextResponse } from "next/server";
import { getFamilyByEditToken } from "@/lib/families";

// Draft a warm opening message for a family's page using Claude.
// Gated by the family's secret edit token (their private "manage" link).
export const runtime = "nodejs";
export const maxDuration = 30;

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-5";

function clean(v: unknown, max: number): string {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const token = clean(body.token, 100);
  const family = token ? await getFamilyByEditToken(token) : null;
  if (!family) {
    return NextResponse.json({ ok: false, error: "This manage link isn't valid." }, { status: 404 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "AI drafting isn't turned on yet. Add ANTHROPIC_API_KEY in the site settings and try again.",
      },
      { status: 503 }
    );
  }

  // The family can pass a few words of their own to steer the draft.
  const notes = clean(body.notes, 600);
  const honoring = clean(body.honoring, 200) || family.honoring || "";
  const displayName = clean(body.displayName, 200) || family.display_name;
  const town = clean(body.town, 200) || family.town || "";
  const hasKids =
    body.hasKids === true || body.hasKids === "true" || family.has_kids;

  const facts = [
    honoring ? `They are honoring / remembering: ${honoring}` : null,
    `The page is titled: ${displayName}`,
    town ? `They are in: ${town}` : null,
    hasKids
      ? "There are children in the family."
      : "There are no children mentioned.",
    notes ? `A few words the family shared: ${notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `You are helping write the short opening message at the top of a private web page that a grieving family (or a friend helping them) has set up. The page is a gentle way for their community to show up for them — meals, visits, a hand with everyday life, keeping memories.

Write the opening message for this page. Use what you know:
${facts}

Guidelines:
- Warm, calm, human. Never saccharine, never clichéd ("thoughts and prayers", "in a better place", "everything happens for a reason" are all off-limits).
- Speak to the reader — the friends and community who love this family and want to help.
- 2 to 3 short paragraphs. Plain language.
- Acknowledge the loss gently, then turn toward how people can show up over time.
- Do not invent specific facts (dates, causes, relationships) that weren't given.
- Return ONLY the message text itself — no title, no preamble, no quotation marks, no sign-off.`;

  try {
    const res = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[ai-intro] Anthropic error:", res.status, detail.slice(0, 500));
      return NextResponse.json(
        { ok: false, error: "The writing helper is busy right now. Please try again in a moment." },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = (data.content || [])
      .filter((b) => b.type === "text" && b.text)
      .map((b) => b.text as string)
      .join("\n")
      .trim();

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "Couldn't draft a message this time. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, text });
  } catch (err) {
    console.error("[ai-intro] request failed:", err);
    return NextResponse.json(
      { ok: false, error: "The writing helper is busy right now. Please try again in a moment." },
      { status: 502 }
    );
  }
}
