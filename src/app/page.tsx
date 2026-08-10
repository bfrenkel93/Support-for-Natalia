import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import MemorialSection from "@/components/MemorialSection";
import SectionShell from "@/components/SectionShell";
import BookingCalendar from "@/components/BookingCalendar";
import KidsIdeasTeaser from "@/components/KidsIdeasTeaser";
import EventsSection from "@/components/EventsSection";
import MealHelp from "@/components/MealHelp";
import StorySection from "@/components/StorySection";
import GiftsSection from "@/components/GiftsSection";
import SubscribeForm from "@/components/SubscribeForm";
import SubscribeModal from "@/components/SubscribeModal";
import Reveal from "@/components/Reveal";
import { getSettings } from "@/lib/settings";
import { getBookings } from "@/lib/bookings";
import { getEvents } from "@/lib/events";
import { getGifts } from "@/lib/gifts";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, bookings, events, gifts] = await Promise.all([
    getSettings(),
    getBookings(),
    getEvents(),
    getGifts(),
  ]);

  const familyAddress = settings.family_address || "";
  // The public calendar shows everything except declined requests.
  const visibleBookings = bookings.filter((b) => b.status !== "declined");
  const eventMarkers = events.map((e) => ({
    id: e.id,
    title: e.title,
    event_date: e.event_date,
  }));

  return (
    <>
      <SubscribeModal />
      <Nav />
      <main>
        <Hero settings={settings} />

        <MemorialSection settings={settings} />

        {!isSupabaseConfigured() && <SetupNotice />}

        {/* 01 · For the Kids — context + ideas */}
        <SectionShell
          id="kids"
          number="01"
          label="For the Kids"
          title="Visits for the Kids"
          subtitle={settings.kids_subtitle}
          intro={settings.kids_intro}
          tone="parchment"
        >
          <KidsIdeasTeaser />
        </SectionShell>

        {/* 02 · For Natalia — context + meal help */}
        <SectionShell
          id="support"
          number="02"
          label="For Natalia"
          title="Support for Natalia"
          subtitle={settings.support_subtitle}
          intro={settings.support_intro}
          tone="ivory"
        >
          {familyAddress && (
            <MealHelp address={familyAddress} allergyNote={settings.allergy_note} />
          )}
          <a href="#calendar" className="btn mt-4 inline-flex">
            Sign up on the calendar →
          </a>
        </SectionShell>

        {/* 04 · The shared calendar */}
        <section id="calendar" className="section-anchor bg-parchment py-24 sm:py-32">
          <div className="mx-auto max-w-content px-6 sm:px-10">
            <Reveal>
              <div className="flex items-center gap-4">
                <span className="section-num">03</span>
                <span className="eyebrow">Sign up</span>
              </div>
              <h2 className="mt-6 max-w-measure font-serif text-[2rem] font-light leading-tight text-ink sm:text-[2.6rem]">
                The Calendar
              </h2>
              <p className="mt-4 max-w-measure text-[1.02rem] leading-[1.85] text-ink-soft">
                Choose any open day to bring a meal, stop by for a visit, run an
                errand, or request a weekend with the kids. You&apos;ll see
                what&apos;s already covered so it stays nicely spread out.
              </p>
            </Reveal>
            <div className="mt-12">
              <BookingCalendar bookings={visibleBookings} events={eventMarkers} />
            </div>
          </div>
        </section>

        {/* 04 · Events */}
        <EventsSection
          events={events}
          settings={settings}
          familyAddress={familyAddress}
          number="04"
        />

        {/* 05 · Give a Gift */}
        <GiftsSection gifts={gifts} settings={settings} number="05" />

        {/* 06 · Stories */}
        <StorySection settings={settings} number="06" />

        {/* Stay involved */}
        <section id="stay" className="section-anchor bg-bone/60 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl px-6 text-center sm:px-10">
            <p className="eyebrow mb-3">Stay involved</p>
            <h2 className="font-serif text-2xl font-light text-ink sm:text-3xl">
              Get an occasional note
            </h2>
            <p className="mx-auto mt-3 max-w-measure leading-relaxed text-ink-soft">
              Every couple of months — and whenever there&apos;s a new way to
              help — we&apos;ll send a gentle reminder. No noise, and you can
              unsubscribe anytime.
            </p>
            <div className="mx-auto mt-7 max-w-md text-left">
              <SubscribeForm />
            </div>
          </div>
        </section>
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
