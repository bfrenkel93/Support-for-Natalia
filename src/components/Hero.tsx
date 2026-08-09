import RichText from "./RichText";
import type { Settings } from "@/lib/content";

/** Renders the hero title, treating a leading "&" pair with a serif italic. */
function Title({ text }: { text: string }) {
  // Emphasize a lone ampersand for an editorial touch.
  const parts = text.split(/(\s&\s)/);
  return (
    <>
      {parts.map((p, i) =>
        p === " & " ? (
          <span key={i} className="italic text-clay-dark">
            {" & "}
          </span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export default function Hero({ settings }: { settings: Settings }) {
  const photo = settings.hero_image_url?.trim();

  return (
    <section id="top" className="section-anchor relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-sage-light/40 to-transparent"
      />
      <div className="relative mx-auto max-w-3xl px-5 pb-16 pt-16 text-center sm:pb-24 sm:pt-24">
        {/* Photo — framed, soft. Swap the URL in the admin to use a real one. */}
        <div className="animate-fade-up mx-auto mb-10 w-full max-w-lg">
          <div className="overflow-hidden rounded-xl2 border border-line bg-cream-soft p-2 shadow-card">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-[0.9rem] bg-sage-light">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt="Natalia and the kids"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sage-dark">
                  <span aria-hidden="true" className="text-4xl">
                    🌿
                  </span>
                  <span className="text-xs uppercase tracking-label text-sage-dark/70">
                    A family photo goes here
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {settings.hero_kicker && (
          <p className="animate-fade-up eyebrow mb-4">{settings.hero_kicker}</p>
        )}

        <h1 className="animate-fade-up text-balance font-serif text-4xl leading-[1.08] text-ink sm:text-6xl">
          <Title text={settings.intro_title} />
        </h1>

        <div className="mx-auto mt-6 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-line-strong" />
          <span className="text-clay" aria-hidden="true">
            ✦
          </span>
          <span className="h-px w-10 bg-line-strong" />
        </div>

        <div className="animate-fade-up mx-auto mt-6 max-w-measure text-lg leading-relaxed">
          <RichText text={settings.intro_message} />
        </div>

        <div className="animate-fade-up mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="#kids"
            className="rounded-full bg-sage px-7 py-3 font-semibold text-cream-soft shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-sage-dark"
          >
            Visits for the kids
          </a>
          <a
            href="#support"
            className="rounded-full border border-line-strong bg-cream-soft px-7 py-3 font-semibold text-ink transition-colors hover:bg-cream-deep"
          >
            Support for Natalia
          </a>
        </div>
      </div>
    </section>
  );
}
