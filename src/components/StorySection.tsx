import RichText from "./RichText";
import StoryForm from "./StoryForm";
import type { Settings } from "@/lib/content";

export default function StorySection({ settings }: { settings: Settings }) {
  return (
    <section
      id="stories"
      className="section-anchor bg-clay/5 py-14 sm:py-20"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-clay">
          For the kids, someday
        </p>
        <h2 className="font-serif text-2xl text-ink sm:text-4xl">
          {settings.stories_title}
        </h2>

        <div className="mt-5 text-lg">
          <RichText text={settings.stories_body} />
        </div>

        <p className="mt-6 font-serif text-xl italic text-clay-dark">
          Tell them a story.
        </p>

        {settings.stories_privacy && (
          <div className="mt-5 flex gap-3 rounded-xl2 border border-sage/30 bg-sage-light/40 px-4 py-3">
            <span aria-hidden="true" className="text-lg">
              🔒
            </span>
            <p className="text-sm text-ink-soft">{settings.stories_privacy}</p>
          </div>
        )}

        <StoryForm />
      </div>
    </section>
  );
}
