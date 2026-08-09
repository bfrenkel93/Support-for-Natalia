import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import SlotSection from "@/components/SlotSection";
import CalendarView from "@/components/CalendarView";
import EventsSection from "@/components/EventsSection";
import MealHelp from "@/components/MealHelp";
import StorySection from "@/components/StorySection";
import GiftsSection from "@/components/GiftsSection";
import SectionShell from "@/components/SectionShell";
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
          number="01"
          label="For the Kids"
          title="Visits for the Kids"
          subtitle={settings.kids_subtitle}
          intro={settings.kids_intro}
          chooseNote={settings.kids_choose_note}
          slots={kids}
          emptyText="No open weekends listed just yet — please check back soon."
          tone="parchment"
          familyAddress={familyAddress}
        />

        <EventsSection
          events={events}
          settings={settings}
          familyAddress={familyAddress}
          number="02"
        />

        <SlotSection
          id="support"
          number="03"
          label="For Natalia"
          title="Support for Natalia"
          subtitle={settings.support_subtitle}
          intro={settings.support_intro}
          chooseNote={settings.support_choose_note}
          slots={support}
          emptyText="No open days listed just yet — please check back soon."
          tone="parchment"
          familyAddress={familyAddress}
          allergyNote={settings.allergy_note}
          extra={
            familyAddress ? (
              <MealHelp address={familyAddress} allergyNote={settings.allergy_note} />
            ) : null
          }
        />

        <GiftsSection gifts={gifts} settings={settings} number="04" />

        <StorySection settings={settings} number="05" />

        <SectionShell
          id="help"
          number="06"
          label="Other Ways"
          title="Other Ways to Help"
          tone="parchment"
        >
          <div className="text-[1.02rem] leading-[1.9]">
            <RichText text={settings.other_ways} />
          </div>
        </SectionShell>
      </main>

      <Footer settings={settings} />
    </>
  );
}

function Footer({ settings }: { settings: Record<string, string> }) {
  return (
    <footer className="bg-charcoal py-20 text-parchment">
      <div className="mx-auto max-w-content px-6 text-center sm:px-10">
        <p className="whitespace-pre-line font-serif text-xl font-light leading-relaxed text-parchment/90">
          {settings.footer_note}
        </p>
        {settings.contact_email && (
          <p className="mt-6 text-[0.72rem] uppercase tracking-wide text-parchment/50">
            <a
              href={`mailto:${settings.contact_email}`}
              className="underline decoration-parchment/30 underline-offset-4 transition-colors hover:text-parchment"
            >
              {settings.contact_email}
            </a>
          </p>
        )}
      </div>
    </footer>
  );
}

function SetupNotice() {
  return (
    <div className="mx-auto max-w-content px-6 py-6 sm:px-10">
      <div className="border-l-2 border-bronze/50 bg-bone/60 px-5 py-4 text-sm text-ink-soft">
        <strong className="font-semibold text-ink">Almost ready:</strong> connect
        Supabase (set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code>SUPABASE_SERVICE_ROLE_KEY</code>) to turn on sign-ups. See{" "}
        <code>README.md</code>. This notice only shows until it&apos;s configured.
      </div>
    </div>
  );
}
