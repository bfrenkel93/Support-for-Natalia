import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFamilyBySlug, type FamilyContent } from "@/lib/families";

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

        <section className="fp-soon">
          <p className="fp-eyebrow">Coming to this page</p>
          <ul className="fp-ways">
            <li>Bring a meal</li>
            <li>Spend time together</li>
            <li>Help with what matters</li>
            <li>Share a memory</li>
          </ul>
          <p className="fp-note">
            The people who love this family will be able to sign up to show up —
            with meals, visits, everyday help, and memories worth keeping.
          </p>
        </section>

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
`;
