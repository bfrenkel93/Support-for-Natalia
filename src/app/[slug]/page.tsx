import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import type { Metadata } from "next";
import {
  getFamilyBySlug,
  accessToken,
  accessCookieName,
  type FamilyContent,
} from "@/lib/families";
import AccessGate from "@/components/AccessGate";
import { getFamilyBookings } from "@/lib/bookings";
import { getFamilyGifts } from "@/lib/gifts";
import { getFamilyEvents } from "@/lib/events";
import { getFamilyRequests } from "@/lib/requests";
import { getFamilyMemoriesWithUrls } from "@/lib/memories";
import SectionShell from "@/components/SectionShell";
import FamilyRequests from "@/components/FamilyRequests";
import Reveal from "@/components/Reveal";
import MealHelp from "@/components/MealHelp";
import FamilyBookingCalendar from "@/components/FamilyBookingCalendar";
import FamilyGifts from "@/components/FamilyGifts";
import FamilyEvents from "@/components/FamilyEvents";
import FamilyMemoryForm from "@/components/FamilyMemoryForm";
import FamilySubscribeForm from "@/components/FamilySubscribeForm";
import FamilyGatheringForm from "@/components/FamilyGatheringForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const family = await getFamilyBySlug(params.slug);
  if (!family) return { title: "Not found" };

  // Build links against the domain the request actually came in on, so the
  // social-share image resolves to an absolute URL on the right host.
  const host = headers().get("host") || "familygriefsupport.org";
  const metadataBase = new URL(`https://${host}`);

  // The seeded sample/demo page is a public showcase of the product — give it
  // rich, descriptive metadata so it's a useful search & social result.
  if (family.content?.is_demo) {
    const title = "A sample support page · Family Grief Support";
    const description =
      "See what a Family Grief Support page looks like: a private place where a community coordinates meals, time with the kids, practical help, and shared memories for a grieving family.";
    return {
      metadataBase,
      title,
      description,
      alternates: { canonical: "https://familygriefsupport.org/sample" },
      robots: { index: true, follow: true },
      openGraph: {
        type: "website",
        url: "https://familygriefsupport.org/sample",
        siteName: "Family Grief Support",
        title,
        description,
      },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  const who = family.honoring?.trim() || family.display_name;
  const title = family.display_name;
  const description = `A private place for the people who love ${who} to help — with meals, time with the kids, practical support, and shared memories, for as long as it takes.`;

  return {
    metadataBase,
    title,
    description,
    robots: family.is_public
      ? undefined
      : { index: false, follow: false, nocache: true },
    openGraph: {
      type: "website",
      siteName: "Family Grief Support",
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function paragraphs(text: string | undefined): string[] {
  return (text || "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Emphasize a lone ampersand in the title with a serif italic (like Natalia's). */
function Title({ text }: { text: string }) {
  const parts = text.split(/(\s&\s)/);
  return (
    <>
      {parts.map((p, i) =>
        p === " & " ? (
          <span key={i} className="italic text-bronze">{" & "}</span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

const ALL_WAYS = [
  { key: "meal", label: "Bring a meal", desc: "Sign up for a day to drop off dinner — no overlap, no group-text chaos.", dot: "bg-kind-meal" },
  { key: "visit", label: "Visit & spend time", desc: "Stop by for coffee, a walk, or just to sit with them for a while.", dot: "bg-kind-visit" },
  { key: "errand", label: "Run an errand / help", desc: "Groceries, a ride, something around the house — the everyday things.", dot: "bg-kind-errand" },
  { key: "kids", label: "Time with the kids", desc: "Take them somewhere fun — a familiar face from their world means the world.", dot: "bg-kind-kids" },
];

const TONES = ["ivory", "parchment", "limestone", "bone"] as const;

export default async function FamilyPage({
  params,
}: {
  params: { slug: string };
}) {
  noStore(); // never serve a cached copy — always reflect the latest edits
  const family = await getFamilyBySlug(params.slug);
  if (!family) notFound();

  // Access-code gate: if the family set a code, require the matching cookie.
  const gateCode = (family.content?.access_code || "").trim();
  if (gateCode) {
    const cookie = cookies().get(accessCookieName(family.id))?.value;
    if (cookie !== accessToken(family.id, gateCode)) {
      return <AccessGate slug={family.slug} displayName={family.display_name} />;
    }
  }

  const bookings = await getFamilyBookings(family.id);
  const gifts = await getFamilyGifts(family.id);
  const giftsLite = gifts.map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description,
    cost: g.cost,
    pledgeCount: g.pledges.length,
    pledgedTotal: g.pledges.reduce((n, p) => n + (p.amount || 0), 0),
  }));
  const requests = await getFamilyRequests(family.id);
  const events = await getFamilyEvents(family.id);
  const eventsLite = events.map((ev) => ({
    id: ev.id,
    title: ev.title,
    event_date: ev.event_date,
    event_time: ev.event_time,
    location: ev.location,
    description: ev.description,
    attendees: ev.rsvps.map((r) => r.name),
  }));

  const content: FamilyContent = family.content || {};
  const title = content.intro_title?.trim() || family.honoring || family.display_name;
  const relParts = (content.relationship || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const relLabel =
    relParts.length === 0
      ? null
      : relParts.length === 1
        ? relParts[0]
        : `${relParts.slice(0, -1).join(", ")} & ${relParts[relParts.length - 1]}`;
  const story = paragraphs(content.intro_message);
  const ways = family.has_kids ? ALL_WAYS : ALL_WAYS.filter((w) => w.key !== "kids");

  // A memorial section shows once there's an actual gathering to announce.
  const hasMemorial = Boolean(
    content.memorial_title || content.memorial_when || content.memorial_where
  );

  // "Support for ___" — who support goes to, and the address for the map.
  const supportName =
    (content.support_name || "").trim() ||
    family.display_name.replace(/^for\s+/i, "").trim();
  const supportAddress =
    (content.support_address || "").trim() || (family.town || "").trim();

  const showCalendar = content.show_calendar !== false;
  const showMemorial = hasMemorial && content.show_memorial !== false;
  const showRequests = requests.length > 0;
  const showSupport = Boolean(supportAddress) && content.show_support !== false;
  const showGifts = giftsLite.length > 0 && content.show_gifts !== false;
  const showSubscribe = content.show_subscribe !== false;
  const showMemories = content.show_memories !== false;
  const showEvents = eventsLite.length > 0 && content.show_events !== false;
  const memoriesPublic = content.memories_public === true;

  // The public "wall" shows only memories each sharer marked public.
  const publicMemories = showMemories
    ? (await getFamilyMemoriesWithUrls(family.id))
        .filter((m) => m.is_public)
        .map((m) => ({
          id: m.id,
          author_name: m.author_name,
          story: m.story,
          photos: m.media
            .map((md) => md.viewUrl)
            .filter((u): u is string => Boolean(u)),
        }))
    : [];

  // Neutral botanical placeholder until the family adds their own photo.
  const heroPhoto = content.hero_image_url?.trim() || "/marketing-hero.jpg";
  const eyebrow =
    content.eyebrow?.trim() ||
    (family.honoring ? `For the people who love ${family.honoring}` : null);
  // Warm, pronoun-free descriptor under the name (e.g. "A beloved father & husband").
  // The town is intentionally not shown here — it lives with the memorial info
  // and the meal-drop-off map instead.
  const heroMeta = relLabel ? `A beloved ${relLabel}` : "";

  // Numbered sections (subscribe is a quiet closing band, like Natalia's).
  const ordered: string[] = [];
  if (showMemorial) ordered.push("gathering");
  if (showCalendar) ordered.push("calendar");
  if (showRequests) ordered.push("requests");
  if (showSupport) ordered.push("support");
  if (showGifts) ordered.push("gifts");
  if (showEvents) ordered.push("events");
  if (showMemories) ordered.push("stories");
  const num = (k: string) => String(ordered.indexOf(k) + 1).padStart(2, "0");
  const tone = (k: string) => TONES[ordered.indexOf(k) % TONES.length];

  const navLinks = [
    showMemorial ? { href: "#gathering", label: "Gathering" } : null,
    showCalendar ? { href: "#calendar", label: "Calendar" } : null,
    showRequests ? { href: "#requests", label: "Help Now" } : null,
    showSupport ? { href: "#support", label: `For ${supportName}` } : null,
    showGifts ? { href: "#gifts", label: "Give a Gift" } : null,
    showEvents ? { href: "#events", label: "Events" } : null,
    showMemories ? { href: "#stories", label: "Stories" } : null,
    showSubscribe ? { href: "#stay", label: "Stay Involved" } : null,
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <>
      {content.is_demo && (
        <div className="bg-charcoal px-4 py-2.5 text-parchment">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs sm:text-sm">
            <a href="/" className="font-medium text-parchment/90 underline underline-offset-2 hover:text-parchment">
              ← Back to home
            </a>
            <span className="text-parchment/40" aria-hidden="true">·</span>
            <span className="text-parchment/85">You’re viewing a sample page.</span>
            <a href="/create" className="font-medium underline underline-offset-2">
              Create one for your family →
            </a>
          </div>
        </div>
      )}

      {/* Sticky dashboard bar */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-parchment/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-content flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-10 sm:py-4">
          <a href="#top" className="shrink-0 font-serif text-base font-normal tracking-tight text-ink">
            {family.display_name}
          </a>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:justify-end sm:gap-x-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-[0.6rem] font-medium uppercase tracking-wide text-ink-soft transition-colors duration-300 hover:text-bronze sm:text-[0.72rem]"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <span className="text-[0.6rem] uppercase tracking-wide text-ink-faint sm:text-[0.72rem]">
                Private page
              </span>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section id="top" className="section-anchor bg-parchment">
          <div className="mx-auto grid max-w-content items-stretch gap-x-14 gap-y-10 px-6 pb-20 pt-16 sm:px-10 sm:pb-28 sm:pt-20 lg:grid-cols-12 lg:pt-24">
            <div className="animate-fade-up lg:col-span-7">
              <div className="relative aspect-[5/4] w-full overflow-hidden bg-limestone shadow-quiet sm:aspect-[16/11]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroPhoto}
                  alt={content.hero_image_url ? `A photo shared for ${title}` : ""}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="animate-fade-up flex flex-col justify-center lg:col-span-5">
              {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
              <h1 className="font-serif text-[2.7rem] font-light leading-[1.06] text-ink sm:text-[3.4rem]">
                <Title text={title} />
              </h1>
              {heroMeta && (
                <p className="mt-5 text-sm text-ink-soft">{heroMeta}</p>
              )}
              {story.length > 0 && (
                <div className="mt-7 max-w-measure space-y-4 text-[1.05rem] leading-[1.85] text-ink-soft">
                  {story.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              )}
              <div className="mt-9 flex flex-wrap gap-4">
                {showCalendar && (
                  <a href="#calendar" className="btn">Sign up to help</a>
                )}
                {showMemories && (
                  <a href="#stories" className="btn-ghost">Share a memory</a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Memorial gathering */}
        {showMemorial && (
          <SectionShell
            id="gathering"
            number={num("gathering")}
            label="Gathering"
            title={content.memorial_title || "A gathering"}
            intro={content.memorial_intro}
            tone={tone("gathering")}
          >
            {(content.memorial_when || content.memorial_where) && (
              <div className="space-y-1 text-[1.02rem] text-ink">
                {content.memorial_when && (
                  <p><span className="text-ink-faint">When · </span>{content.memorial_when}</p>
                )}
                {content.memorial_where && (
                  <p><span className="text-ink-faint">Where · </span>{content.memorial_where}</p>
                )}
              </div>
            )}
            {content.memorial_note && (
              <p className="mt-4 text-sm text-ink-faint">{content.memorial_note}</p>
            )}
            <div className="mt-8">
              <FamilyGatheringForm slug={family.slug} />
            </div>
          </SectionShell>
        )}

        {/* Calendar */}
        {showCalendar && (
          <SectionShell
            id="calendar"
            number={num("calendar")}
            label="Ways to show up"
            title="The Calendar"
            intro={`Choose any open day to bring a meal, stop by for a visit, run an errand${family.has_kids ? ", or spend time with the kids" : ""}. You’ll see what’s already covered so it stays nicely spread out.`}
            tone={tone("calendar")}
          >
            <div className="grid gap-3 sm:grid-cols-2">
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
            <div className="mt-10">
              <FamilyBookingCalendar
                slug={family.slug}
                hasKids={family.has_kids}
                bookings={bookings}
              />
            </div>
          </SectionShell>
        )}

        {/* Ways to help right now */}
        {showRequests && (
          <SectionShell
            id="requests"
            number={num("requests")}
            label="Ways to help right now"
            title="A few specific needs"
            intro="Small, specific things that would help this week. If one fits, claim it — the family will know it’s covered."
            tone={tone("requests")}
          >
            <FamilyRequests
              slug={family.slug}
              requests={requests.map((r) => ({
                id: r.id,
                title: r.title,
                details: r.details,
                needed_date: r.needed_date,
                claimed_by: r.claimed_by,
              }))}
            />
          </SectionShell>
        )}

        {/* Support for ___ (with a map) */}
        {showSupport && (
          <SectionShell
            id="support"
            number={num("support")}
            label={`For ${supportName}`}
            title={`Support for ${supportName}`}
            intro={content.support_note ? undefined : "A hand with meals and the everyday things. Here’s where to bring them."}
            tone={tone("support")}
          >
            <MealHelp address={supportAddress} allergyNote={content.support_note} />
            {showCalendar && (
              <a href="#calendar" className="btn mt-2 inline-flex">
                Sign up on the calendar →
              </a>
            )}
          </SectionShell>
        )}

        {/* Give a gift */}
        {showGifts && (
          <SectionShell
            id="gifts"
            number={num("gifts")}
            label="Give a Gift"
            title="A gift of rest"
            tone={tone("gifts")}
          >
            <FamilyGifts
              slug={family.slug}
              gifts={giftsLite}
              intro={content.gifts_intro}
              pay={{
                venmo: content.pay_venmo,
                cashapp: content.pay_cashapp,
                zelle: content.pay_zelle,
              }}
            />
          </SectionShell>
        )}

        {/* Events */}
        {showEvents && (
          <SectionShell
            id="events"
            number={num("events")}
            label="Events"
            title="Show up for the little big moments"
            tone={tone("events")}
          >
            <FamilyEvents slug={family.slug} events={eventsLite} />
          </SectionShell>
        )}

        {/* Stories & memories */}
        {showMemories && (
          <SectionShell
            id="stories"
            number={num("stories")}
            label="Stories"
            title={family.honoring ? `Share a story about ${family.honoring}` : "Share a story"}
            intro={
              memoriesPublic
                ? "Some memories are worth saving before they fade. Share yours with everyone who loved them, or keep it just for the family."
                : "Some memories are worth saving before they fade. Everything you share here is private — it goes only to the family."
            }
            tone={tone("stories")}
          >
            <FamilyMemoryForm slug={family.slug} allowPublic={memoriesPublic} />
            {publicMemories.length > 0 && (
              <div className="mt-12">
                <p className="eyebrow mb-6">Shared by the people who loved them</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {publicMemories.map((m) => (
                    <div key={m.id} className="rounded-sm border border-line bg-bone/40 p-5">
                      {m.story && (
                        <p className="whitespace-pre-line leading-relaxed text-ink-soft">{m.story}</p>
                      )}
                      {m.photos.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {m.photos.map((src, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={src} alt="" className="h-32 w-full rounded-sm object-cover" />
                          ))}
                        </div>
                      )}
                      {m.author_name && (
                        <p className="mt-3 font-serif text-sm italic text-bronze">— {m.author_name}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionShell>
        )}

        {/* Stay involved */}
        {showSubscribe && (
          <section id="stay" className="section-anchor bg-bone/60 py-16 sm:py-20">
            <div className="mx-auto max-w-2xl px-6 text-center sm:px-10">
              <Reveal>
                <p className="eyebrow mb-3">Stay involved</p>
                <h2 className="font-serif text-2xl font-light text-ink sm:text-3xl">
                  A gentle way to stay close
                </h2>
                <p className="mx-auto mt-3 max-w-measure leading-relaxed text-ink-soft">
                  Leave your email and we’ll send an occasional note — when there’s
                  a way to help, or news to share. Nothing more, and you can
                  unsubscribe anytime.
                </p>
                <div className="mx-auto mt-7 max-w-md text-left">
                  <FamilySubscribeForm slug={family.slug} />
                </div>
              </Reveal>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-charcoal py-16 text-parchment">
        <div className="mx-auto max-w-content px-6 text-center sm:px-10">
          <p className="font-serif text-lg font-light text-parchment/90">
            {family.display_name}
          </p>
          <p className="mt-3 text-[0.7rem] uppercase tracking-[0.16em] text-parchment/50">
            familygriefsupport.org
          </p>
        </div>
      </footer>
    </>
  );
}
