import SectionHeader from "./SectionHeader";
import StoryForm from "./StoryForm";
import type { Settings } from "@/lib/content";

export default function StorySection({ settings }: { settings: Settings }) {
  return (
    <section id="stories" className="section-anchor bg-clay/[0.06] py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-6">
        <SectionHeader
          eyebrow="For the kids, someday"
          title={settings.stories_title}
          intro={settings.stories_body}
        />

        <p className="mt-6 font-serif text-2xl italic text-clay-dark">
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
