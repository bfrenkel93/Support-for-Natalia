import RichText from "./RichText";
import type { Settings } from "@/lib/settings";

export default function Hero({ settings }: { settings: Settings }) {
  return (
    <section id="top" className="section-anchor relative overflow-hidden">
      {/* Soft layered background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sage-light/50 via-cream to-cream"
      />
      <div className="relative mx-auto max-w-4xl px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
        <div className="flex flex-col items-center text-center">
          {/* Photo placeholder — swap for a real family photo later. */}
          <div className="mb-8 h-32 w-32 overflow-hidden rounded-full border-4 border-cream-soft bg-sage-light shadow-soft sm:h-40 sm:w-40">
            <div className="flex h-full w-full items-center justify-center text-4xl text-sage-dark">
              <span aria-hidden="true">🌿</span>
              <span className="sr-only">Family photo placeholder</span>
            </div>
          </div>

          {settings.hero_kicker && (
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-clay">
              {settings.hero_kicker}
            </p>
          )}

          <h1 className="max-w-2xl text-balance font-serif text-3xl leading-tight text-ink sm:text-5xl">
            {settings.intro_title}
          </h1>

          <div className="mt-6 max-w-xl text-lg sm:text-xl">
            <RichText text={settings.intro_message} />
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#kids"
              className="rounded-full bg-sage px-6 py-3 font-semibold text-cream-soft shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-sage-dark"
            >
              Visits for the kids
            </a>
            <a
              href="#support"
              className="rounded-full bg-softblue px-6 py-3 font-semibold text-cream-soft shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-softblue-dark"
            >
              Support for Natalia
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
