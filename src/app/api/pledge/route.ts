import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";
import { getFamilyBySlug } from "@/lib/families";

// Public: someone pledges toward one of a family's gift ideas (coordination
// only — money moves off-site via the family's payment handles).
export const runtime = "nodejs";

function clean(v: unknown, max: number): string {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const slug = clean(body.slug, 60).toLowerCase();
  const giftId = clean(body.giftId, 100);
  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const note = clean(body.note, 500);
  const amountRaw = clean(body.amount, 40);

  if (!giftId) return NextResponse.json({ ok: false, error: "Something went wrong. Please refresh." }, { status: 400 });
  if (!name) return NextResponse.json({ ok: false, error: "Please add your name." }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "That email doesn't look right." }, { status: 400 });
  }

  const family = slug ? await getFamilyBySlug(slug) : null;
  if (!family) return NextResponse.json({ ok: false, error: "That page couldn't be found." }, { status: 404 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ ok: false, error: "Not connected yet." }, { status: 503 });

  const { data: gift } = await supabase
    .from("gifts")
    .select("id, title")
    .eq("id", giftId)
    .eq("family_id", family.id)
    .single();
  if (!gift) return NextResponse.json({ ok: false, error: "That gift isn't available anymore." }, { status: 404 });

  let amount: number | null = null;
  const p = Number(amountRaw.replace(/[^0-9.]/g, ""));
  if (Number.isFinite(p) && p > 0) amount = p;

  const { error } = await supabase.from("gift_pledges").insert({
    family_id: family.id,
    gift_id: giftId,
    name,
    email: email || null,
    amount,
    note: note || null,
  });
  if (error) {
    console.error("[pledge] insert failed:", error);
    return NextResponse.json({ ok: false, error: "Sorry — we couldn't save that. Please try again." }, { status: 500 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && family.contact_email) {
    try {
      const resend = new Resend(apiKey);
      const from = process.env.RESEND_FROM || "Family Grief Support <onboarding@resend.dev>";
      await resend.emails.send({
        from,
        to: family.contact_email,
        replyTo: email || undefined,
        subject: `New gift pledge — ${name}`,
        text: [
          `${name} pledged toward "${(gift as { title: string }).title}".`,
          amount ? `Amount: $${amount}` : `Amount: (not specified)`,
          note ? `Note: ${note}` : ``,
        ].filter(Boolean).join("\n"),
      });
    } catch (err) {
      console.error("[pledge] notification failed:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Thank you for your generosity — it means more than you know. 💛",
  });
}
