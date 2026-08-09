import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import SectionShell from "@/components/SectionShell";
import BookingCalendar from "@/components/BookingCalendar";
import IdeasList from "@/components/IdeasList";
import EventsSection from "@/components/EventsSection";
import MealHelp from "@/components/MealHelp";
import StorySection from "@/components/StorySection";
import GiftsSection from "@/components/GiftsSection";
import Reveal from "@/components/Reveal";
import WeekendIdeas from "@/components/WeekendIdeas";
import { getSettings } from "@/lib/settings";
import { getBookings } from "@/lib/bookings";
import { getActivityIdeas } from "@/lib/ideas";
import { getEvents } from "@/lib/events";
import { getGifts } from "@/lib/gifts";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, bookings, ideas, events, gifts] = await Promise.all([
    getSettings(),
    getBookings(),
    getActivityIdeas(),
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
      <Nav />
      <main>
        <Hero settings={settings} />

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
          <IdeasList ideas={ideas} />
          <a href="#calendar" className="btn mt-12 inline-flex">
            Request a weekend →
          </a>
        </SectionShell>

        {/* 02 · Things to Do Together */}
        <WeekendIdeas bookings={visibleBookings} number="02" />

        {/* 03 · For Natalia — context + meal help */}
        <SectionShell
          id="support"
          number="03"
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
                <span className="section-num">04</span>
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

        {/* 05 · Events */}
        <EventsSection
          events={events}
          settings={settings}
          familyAddress={familyAddress}
          number="05"
        />

        {/* 06 · Give a Gift */}
        <GiftsSection gifts={gifts} settings={settings} number="06" />

        {/* 07 · Stories */}
        <StorySection settings={settings} number="07" />
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
