import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFamilyBySlug, type FamilyContent } from "@/lib/families";
import { getFamilyBookings } from "@/lib/bookings";
import FamilyToolkit from "@/components/FamilyToolkit";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const family = await getFamilyBySlug(params.slug);
  if (!family) return { title: "Not found" };
  return {
    title: family.display_name,
    robots: family.is_public
      ? undefined
      : { index: false, follow: false, nocache: true },
  };
}

function paragraphs(text: string | undefined): string[] {
  return (text || "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default async function FamilyPage({
  params,
}: {
  params: { slug: string };
}) {
  const family = await getFamilyBySlug(params.slug);
  if (!family) notFound();

  const bookings = await getFamilyBookings(family.id);
  const bookingsLite = bookings.map((b) => ({
    event_date: b.event_date,
    kind: b.kind,
    name: b.name,
    private: b.private,
  }));

  const content: FamilyContent = family.content || {};
  const kicker = content.kicker || "For the people who love them";
  const title = content.intro_title || family.display_name;
  const intro = paragraphs(content.intro_message);

  return (
    <>
      <style>{css}</style>
      <main className="fp">
        <header className="fp-hero">
          <p className="fp-kicker">{kicker}</p>
          <h1 className="fp-title">{title}</h1>
          {family.town ? <p className="fp-town">{family.town}</p> : null}
        </header>

        {intro.length > 0 ? (
          <section className="fp-intro">
            {intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        ) : null}

        <FamilyToolkit
          slug={family.slug}
          hasKids={family.has_kids}
          bookings={bookingsLite}
        />

        <footer className="fp-footer">
          <span>familygriefsupport.org</span>
        </footer>
      </main>
    </>
  );
}

const css = `
  .fp {
    --paper: #F5F1E8; --ink: #2E2A23; --soft: #675f52; --faint: #9a917f;
    --bronze: #8B6A43; --line: #DED3BF;
    background: var(--paper); color: var(--ink);
    font-family: "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
    min-height: 100vh; margin: 0;
  }
  .fp-hero { max-width: 780px; margin: 0 auto; padding: clamp(4rem,10vh,7rem) 1.5rem 0; text-align: center; }
  .fp-kicker {
    font-family: "Avenir Next","Segoe UI",system-ui,sans-serif;
    text-transform: uppercase; letter-spacing: 0.22em; font-size: 0.72rem;
    font-weight: 600; color: var(--bronze); margin: 0 0 1.4rem;
  }
  .fp-title {
    font-weight: 400; font-size: clamp(2.2rem,6vw,3.4rem); line-height: 1.08;
    margin: 0; letter-spacing: -0.01em; text-wrap: balance;
  }
  .fp-town {
    font-family: "Avenir Next",system-ui,sans-serif; font-size: 0.9rem;
    color: var(--faint); margin: 1.1rem 0 0; letter-spacing: 0.02em;
  }
  .fp-intro { max-width: 600px; margin: clamp(2.5rem,6vh,3.5rem) auto 0; padding: 0 1.5rem; }
  .fp-intro p { font-size: 1.15rem; line-height: 1.75; color: var(--soft); margin: 0 0 1.3rem; }
  .fp-soon {
    max-width: 600px; margin: clamp(2.5rem,6vh,3.5rem) auto 0; padding: 2.2rem 1.5rem;
    border-top: 1px solid var(--line); text-align: center;
  }
  .fp-eyebrow {
    font-family: "Avenir Next",system-ui,sans-serif; text-transform: uppercase;
    letter-spacing: 0.2em; font-size: 0.68rem; font-weight: 600; color: var(--bronze); margin: 0 0 1.2rem;
  }
  .fp-ways {
    list-style: none; margin: 0 auto 1.4rem; padding: 0; display: flex; flex-wrap: wrap;
    gap: 0.6rem; justify-content: center; max-width: 460px;
  }
  .fp-ways li {
    font-family: "Avenir Next",system-ui,sans-serif; font-size: 0.85rem; color: var(--ink);
    background: #FBF9F3; border: 1px solid var(--line); border-radius: 999px; padding: 0.5rem 0.95rem;
  }
  .fp-note {
    font-family: "Avenir Next",system-ui,sans-serif; font-size: 0.95rem; line-height: 1.6;
    color: var(--soft); max-width: 42ch; margin: 0 auto;
  }
  .fp-footer {
    max-width: 780px; margin: clamp(3rem,8vh,5rem) auto 0; padding: 2rem 1.5rem 3rem;
    text-align: center; font-family: "Avenir Next",system-ui,sans-serif;
    font-size: 0.72rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--faint);
  }
  .ft { max-width: 600px; margin: clamp(2.5rem,6vh,3.5rem) auto 0; padding: 2.2rem 1.5rem 0; border-top: 1px solid var(--line); }
  .ft-list { list-style: none; margin: 1.4rem 0 2rem; padding: 0; display: grid; gap: 0; }
  .ft-list li { display: grid; grid-template-columns: 5.5rem 1fr auto; gap: 0.8rem; align-items: baseline; font-family: "Avenir Next",system-ui,sans-serif; font-size: 0.9rem; padding: 0.6rem 0; border-bottom: 1px solid var(--line); }
  .ft-date { color: var(--bronze); font-weight: 600; }
  .ft-kind { color: var(--soft); }
  .ft-name { color: var(--ink); text-align: right; }
  .ft-form { display: grid; gap: 0.9rem; margin-top: 0.5rem; }
  .ft-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
  @media (max-width: 460px) { .ft-row { grid-template-columns: 1fr; } }
  .ft-form label { display: grid; gap: 0.35rem; font-family: "Avenir Next",system-ui,sans-serif; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--soft); }
  .ft-opt { text-transform: none; letter-spacing: 0; color: var(--faint); }
  .ft-form input, .ft-form select { font-family: "Iowan Old Style",Palatino,Georgia,serif; font-size: 1rem; color: var(--ink); background: #FBF9F3; border: 1px solid var(--line); border-radius: 2px; padding: 0.6rem 0.7rem; width: 100%; }
  .ft-check { display: flex !important; flex-direction: row !important; align-items: center; gap: 0.5rem; text-transform: none !important; letter-spacing: 0 !important; font-size: 0.9rem !important; color: var(--soft) !important; }
  .ft-check input { width: auto; }
  .ft-btn { justify-self: start; font-family: "Avenir Next",system-ui,sans-serif; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.8rem; font-weight: 600; color: #F5F1E8; background: #2A2620; border: 0; border-radius: 2px; padding: 0.85rem 1.8rem; cursor: pointer; }
  .ft-btn:disabled { opacity: 0.6; }
  .ft-done { font-family: "Iowan Old Style",Palatino,Georgia,serif; font-size: 1.15rem; line-height: 1.6; color: var(--ink); text-align: center; margin: 1rem 0; }
  .ft-err { font-family: "Avenir Next",system-ui,sans-serif; font-size: 0.9rem; color: #B0785A; margin: 0.2rem 0 0; }
`;
