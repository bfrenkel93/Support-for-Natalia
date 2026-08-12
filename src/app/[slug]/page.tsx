import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFamilyBySlug, type FamilyContent } from "@/lib/families";
import { getFamilyBookings } from "@/lib/bookings";
import FamilyBookingCalendar from "@/components/FamilyBookingCalendar";
import FamilyMemoryForm from "@/components/FamilyMemoryForm";
import FamilySubscribeForm from "@/components/FamilySubscribeForm";

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

const ALL_WAYS = [
  { key: "meal", label: "Bring a meal", desc: "Sign up for a day to drop off dinner — no overlap, no group-text chaos.", dot: "bg-kind-meal" },
  { key: "visit", label: "Visit & spend time", desc: "Stop by for coffee, a walk, or just to sit with them for a while.", dot: "bg-kind-visit" },
  { key: "errand", label: "Run an errand / help", desc: "Groceries, a ride, something around the house — the everyday things.", dot: "bg-kind-errand" },
  { key: "kids", label: "Time with the kids", desc: "Take them somewhere fun — a familiar face from their world means the world.", dot: "bg-kind-kids" },
];

export default async function FamilyPage({
  params,
}: {
  params: { slug: string };
}) {
  const family = await getFamilyBySlug(params.slug);
  if (!family) notFound();

  const bookings = await getFamilyBookings(family.id);
  const content: FamilyContent = family.content || {};
  const kicker = content.kicker || "For the people who love them";
  const title = content.intro_title || family.display_name;
  const intro = paragraphs(content.intro_message);
  const ways = family.has_kids ? ALL_WAYS : ALL_WAYS.filter((w) => w.key !== "kids");

  return (
    <main className="mx-auto max-w-2xl px-6">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-line/60 py-4">
        <span className="font-serif text-base text-ink">{family.display_name}</span>
        <span className="text-[0.62rem] uppercase tracking-[0.18em] text-ink-faint">
          Private page
        </span>
      </div>

      {/* Hero photo */}
      {content.hero_image_url && (
        <div className="mt-8 overflow-hidden rounded-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.hero_image_url}
            alt=""
            className="h-64 w-full object-cover sm:h-96"
          />
        </div>
      )}

      {/* Hero */}
      <header
        className={`pb-10 text-center ${
          content.hero_image_url ? "pt-10" : "pt-16 sm:pt-24"
        }`}
      >
        <p className="eyebrow">{kicker}</p>
        <h1 className="mt-5 font-serif text-4xl font-light leading-[1.05] text-ink sm:text-5xl">
          {title}
        </h1>
        {(family.honoring || family.town) && (
          <p className="mt-5 text-sm text-ink-soft">
            {family.honoring ? `In memory of ${family.honoring}` : null}
            {family.honoring && family.town ? " · " : null}
            {family.town}
          </p>
        )}
      </header>

      {/* Story */}
      {intro.length > 0 && (
        <section className="prose-warm mx-auto max-w-xl border-t border-line/60 pt-10 text-center text-lg">
          {intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>
      )}

      {/* Ways to show up */}
      <section className="mt-14 text-center">
        <p className="eyebrow">Ways to show up</p>
        <h2 className="mx-auto mt-2 max-w-md font-serif text-2xl font-light text-ink sm:text-3xl">
          No one has to do everything. Everyone can do something.
        </h2>
        <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
          {ways.map((w) => (
            <div key={w.key} className="rounded-sm border border-line bg-bone/40 p-5">
              <h3 className="flex items-center gap-2 font-serif text-lg font-light text-ink">
                <span className={`h-2 w-2 rounded-full ${w.dot}`} />
                {w.label}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sign-up calendar */}
      <section className="mt-16">
        <div className="text-center">
          <p className="eyebrow">Sign up to show up</p>
          <h2 className="mt-2 font-serif text-2xl font-light text-ink sm:text-3xl">
            Pick a day that works for you
          </h2>
        </div>
        <div className="mt-8">
          <FamilyBookingCalendar
            slug={family.slug}
            hasKids={family.has_kids}
            bookings={bookings}
          />
        </div>
      </section>

      {/* Stay involved */}
      <section className="mt-16 border-t border-line/60 pt-12 text-center">
        <p className="eyebrow">Stay involved</p>
        <h2 className="mx-auto mt-2 max-w-md font-serif text-2xl font-light text-ink sm:text-3xl">
          A gentle way to stay close
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
          Leave your email and we’ll send an occasional note — when there’s a way
          to help, or news to share. Nothing more, and you can unsubscribe anytime.
        </p>
        <div className="mt-6">
          <FamilySubscribeForm slug={family.slug} />
        </div>
      </section>

      {/* Memories & stories */}
      <section className="mt-16 border-t border-line/60 pt-12 text-center">
        <p className="eyebrow">Memories &amp; stories</p>
        <h2 className="mx-auto mt-2 max-w-md font-serif text-2xl font-light text-ink sm:text-3xl">
          {family.honoring ? `Tell them about ${family.honoring}` : "Share a memory"}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
          Some memories are worth saving before they fade. Everything you share
          here is private — it goes only to the family.
        </p>
        <div className="mt-8">
          <FamilyMemoryForm slug={family.slug} />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 border-t border-line/60 py-10 text-center text-[0.7rem] uppercase tracking-[0.16em] text-ink-faint">
        familygriefsupport.org
      </footer>
    </main>
  );
}
