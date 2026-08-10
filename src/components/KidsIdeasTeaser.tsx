import { EVERGREEN_IDEAS } from "@/lib/weekend/evergreen";

// A small, intentional taste — leaning into what Joe loved (history, science, a ballgame).
const TEASER_IDS = ["eg-uss", "eg-freedom-trail", "eg-mos", "eg-fenway-tour"];

export default function KidsIdeasTeaser() {
  const ideas = TEASER_IDS.map((id) =>
    EVERGREEN_IDEAS.find((e) => e.id === id)
  ).filter(Boolean) as (typeof EVERGREEN_IDEAS)[number][];

  return (
    <div className="mt-12">
      <p className="eyebrow mb-5">
        A few things Joe would have loved to do with them
      </p>
      <ul className="divide-y divide-line/60 border-y border-line/60">
        {ideas.map((idea) => (
          <li key={idea.id} className="flex items-baseline justify-between gap-4 py-3.5">
            <span className="min-w-0">
              <span className="text-ink">{idea.title}</span>
              <span className="ml-2 text-sm text-ink-faint">{idea.venue}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-4">
        <a href="/weekend-ideas" className="btn-ghost">
          See all weekend ideas
        </a>
        <a href="#calendar" className="btn">
          Request a weekend
        </a>
      </div>
    </div>
  );
}
