import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import SlotSection from "@/components/SlotSection";
import CalendarView from "@/components/CalendarView";
import EventsSection from "@/components/EventsSection";
import MealHelp from "@/components/MealHelp";
import StorySection from "@/components/StorySection";
import GiftsSection from "@/components/GiftsSection";
import RichText from "@/components/RichText";
import { getSettings } from "@/lib/settings";
import { getEvents } from "@/lib/events";
import { getGifts } from "@/lib/gifts";
import { getSupabase, isSupabaseConfigured, type Slot } from "@/lib/supabase";

// Always render fresh so newly-claimed slots show up immediately.
export const dynamic = "force-dynamic";

async function getSlots(): Promise<Slot[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("slots")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("event_date", { ascending: true });
  if (error || !data) return [];
  return data as Slot[];
}

export default async function Home() {
  const [settings, slots, events, gifts] = await Promise.all([
    getSettings(),
    getSlots(),
    getEvents(),
    getGifts(),
  ]);
  const kids = slots.filter((s) => s.category === "kids");
  const support = slots.filter((s) => s.category === "support");
  const familyAddress = settings.family_address || "";

  return (
    <>
      <Nav />
      <main>
        <Hero settings={settings} />

        {!isSupabaseConfigured() && <SetupNotice />}

        <CalendarView slots={slots} events={events} />

        <SlotSection
          id="kids"
          eyebrow="Once a month, on a weekend"
          title="Visits for the Kids"
          subtitle={settings.kids_subtitle}
          intro={settings.kids_intro}
          chooseNote={settings.kids_choose_note}
          slots={kids}
          emptyText="No open weekends listed just yet — check back soon."
          tint="sage"
          familyAddress={familyAddress}
        />

        <EventsSection
          events={events}
          settings={settings}
          familyAddress={familyAddress}
        />

        <SlotSection
          id="support"
          eyebrow="An ongoing rotation"
          title="Support for Natalia"
          subtitle={settings.support_subtitle}
          intro={settings.support_intro}
          chooseNote={settings.support_choose_note}
          slots={support}
          emptyText="No open days listed just yet — check back soon."
          tint="sage"
          familyAddress={familyAddress}
          allergyNote={settings.allergy_note}
          extra={
            familyAddress ? (
              <MealHelp
                address={familyAddress}
                allergyNote={settings.allergy_note}
              />
            ) : null
          }
        />

        <GiftsSection gifts={gifts} settings={settings} />

        <StorySection settings={settings} />

        {/* Other ways to help */}
        <section
          id="help"
          className="section-anchor bg-cream-soft py-16 sm:py-24"
        >
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <p className="eyebrow mb-3">Every bit helps</p>
            <h2 className="font-serif text-3xl text-ink sm:text-[2.6rem]">
              Other Ways to Help
            </h2>
            <div className="mt-5 text-lg leading-relaxed">
              <RichText text={settings.other_ways} />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-cream-deep/40 py-12">
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-6">
          <span className="text-clay" aria-hidden="true">
            ✦
          </span>
          <div className="prose-warm mx-auto mt-3">
            <RichText text={settings.footer_note} />
          </div>
          {settings.contact_email && (
            <p className="mt-3 text-sm text-ink-soft">
              Questions?{" "}
              <a
                href={`mailto:${settings.contact_email}`}
                className="font-semibold text-sage-dark underline underline-offset-2"
              >
                {settings.contact_email}
              </a>
            </p>
          )}
        </div>
      </footer>
    </>
  );
}

function SetupNotice() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-6 sm:px-6">
      <div className="rounded-xl2 border border-clay/30 bg-clay/5 px-5 py-4 text-sm text-clay-dark">
        <strong>Almost ready:</strong> connect Supabase (set{" "}
        <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code>SUPABASE_SERVICE_ROLE_KEY</code>) to turn on sign-ups. See{" "}
        <code>README.md</code> for the two-minute setup. This notice only shows
        until it&apos;s configured.
      </div>
    </div>
  );
}
