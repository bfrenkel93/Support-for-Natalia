import Reveal from "./Reveal";
import RichText from "./RichText";
import StoryForm from "./StoryForm";
import type { Settings } from "@/lib/content";

export default function StorySection({
  settings,
  number,
}: {
  settings: Settings;
  number?: string;
}) {
  return (
    <section id="stories" className="section-anchor bg-limestone/60 py-24 sm:py-32">
      <div className="mx-auto max-w-content px-6 sm:px-10">
        <Reveal>
          <div className="flex items-center gap-4">
            {number && <span className="section-num">{number}</span>}
            <span className="eyebrow">An archive · for the children</span>
          </div>
          <h2 className="mt-8 max-w-4xl font-serif text-[2.4rem] font-light leading-[1.08] text-ink sm:text-[3.4rem]">
            {settings.stories_title}
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-x-14 gap-y-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <div className="max-w-measure text-[1.05rem] leading-[1.9] text-ink-soft">
              <RichText text={settings.stories_body} />
            </div>
            <p className="mt-8 font-serif text-2xl font-light italic leading-snug text-bronze">
              Tell them a story. Someday, they will know another piece of their
              dad through you.
            </p>
          </Reveal>

          <Reveal className="lg:col-span-5 lg:col-start-8">
            {settings.stories_privacy && (
              <p className="border-l-2 border-bronze/40 pl-4 text-sm leading-relaxed text-ink-soft">
                {settings.stories_privacy}
              </p>
            )}
            <div className="mt-8">
              <StoryForm />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
