import RichText from "./RichText";
import type { Settings } from "@/lib/content";

/** Emphasize a lone ampersand in the title with a serif italic. */
function Title({ text }: { text: string }) {
  const parts = text.split(/(\s&\s)/);
  return (
    <>
      {parts.map((p, i) =>
        p === " & " ? (
          <span key={i} className="italic text-bronze">
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
    <section id="top" className="section-anchor bg-parchment">
      <div className="mx-auto grid max-w-content items-stretch gap-x-14 gap-y-10 px-6 pb-20 pt-16 sm:px-10 sm:pb-28 sm:pt-20 lg:grid-cols-12 lg:pt-24">
        {/* Photograph — large, full-bleed feeling, no rounded frame. */}
        <div className="animate-fade-up lg:col-span-7">
          <div className="relative aspect-[5/4] w-full overflow-hidden bg-limestone shadow-quiet sm:aspect-[16/11]">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt="Natalia and the kids"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-limestone to-sand/70 text-taupe">
                <span className="h-10 w-10 rounded-full border border-taupe/50" />
                <span className="text-[0.62rem] uppercase tracking-label">
                  A family photograph
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Text — asymmetric, set beside the image on desktop. */}
        <div className="animate-fade-up flex flex-col justify-center lg:col-span-5">
          {settings.hero_kicker && (
            <p className="eyebrow mb-5">{settings.hero_kicker}</p>
          )}
          <h1 className="font-serif text-[2.7rem] font-light leading-[1.06] text-ink sm:text-[3.4rem]">
            <Title text={settings.intro_title} />
          </h1>
          <div className="mt-7 max-w-measure text-[1.05rem] leading-[1.85]">
            <RichText text={settings.intro_message} />
          </div>
          <div className="mt-9 flex flex-wrap gap-4">
            <a href="#kids" className="btn">
              Visits for the kids
            </a>
            <a href="#support" className="btn-ghost">
              Support for Natalia
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
