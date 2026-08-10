import type { Settings } from "@/lib/content";
import Reveal from "./Reveal";

/**
 * A quiet, editable "gathering" band — the memorial's date/time/place. Details
 * default to "To be announced" and are edited from the admin (Edit page text).
 */
export default function MemorialSection({ settings }: { settings: Settings }) {
  const when = settings.memorial_when?.trim();
  const where = settings.memorial_where?.trim();
  const note = settings.memorial_note?.trim();

  return (
    <section id="gathering" className="section-anchor bg-limestone/60 py-24 sm:py-28">
      <div className="mx-auto max-w-content px-6 text-center sm:px-10">
        <Reveal>
          <p className="eyebrow">Remembering Joe</p>
          <h2 className="mx-auto mt-5 max-w-2xl font-serif text-[2rem] font-light leading-[1.12] text-ink sm:text-[2.6rem]">
            {settings.memorial_title}
          </h2>
          {settings.memorial_intro && (
            <p className="mx-auto mt-5 max-w-measure text-[1.02rem] leading-[1.85] text-ink-soft">
              {settings.memorial_intro}
            </p>
          )}

          <div className="mx-auto mt-10 flex max-w-xl flex-col items-stretch gap-px overflow-hidden border-y border-line/70 sm:flex-row sm:gap-0">
            <div className="flex-1 px-6 py-6 sm:border-r sm:border-line/70">
              <p className="text-[0.66rem] uppercase tracking-label text-ink-faint">
                When
              </p>
              <p className="mt-2 font-serif text-lg font-light text-ink">
                {when || "To be announced"}
              </p>
            </div>
            <div className="flex-1 px-6 py-6">
              <p className="text-[0.66rem] uppercase tracking-label text-ink-faint">
                Where
              </p>
              <p className="mt-2 font-serif text-lg font-light text-ink">
                {where || "To be announced"}
              </p>
            </div>
          </div>

          {note && (
            <p className="mx-auto mt-6 max-w-measure text-sm leading-relaxed text-ink-soft">
              {note}
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
