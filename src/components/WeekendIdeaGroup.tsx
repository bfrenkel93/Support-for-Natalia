import type { WeekendGroup } from "@/lib/weekend/types";

function metaLine(category: string, ageLabel: string | null): string {
  const cat = category ? category.charAt(0).toUpperCase() + category.slice(1) : "";
  return [cat, ageLabel].filter(Boolean).join(" · ");
}

/** One weekend's recommendations — featured pick + a few alternatives. Pure. */
export default function WeekendIdeaGroup({
  group,
  heading,
  signupHref = "/#calendar",
}: {
  group: WeekendGroup;
  heading?: string;
  signupHref?: string;
}) {
  const { weekend, featured, others, covered } = group;

  return (
    <div className="border-t border-line/70 py-10 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">{heading ?? weekend.label}</p>
        {heading && (
          <p className="text-[0.7rem] uppercase tracking-wide text-ink-faint">
            {weekend.label}
          </p>
        )}
      </div>

      {featured && (
        <div className="mt-5">
          <p className="text-[0.66rem] uppercase tracking-label text-ink-faint">
            Featured
          </p>
          <h3 className="mt-2 font-serif text-2xl font-light text-ink">
            {featured.title}
          </h3>
          {featured.venue && (
            <p className="mt-0.5 text-sm text-ink-soft">{featured.venue}</p>
          )}
          {featured.blurb && (
            <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">
              {featured.blurb}
            </p>
          )}
          <p className="mt-3 text-[0.7rem] uppercase tracking-wide text-ink-faint">
            {metaLine(featured.category, featured.ageLabel)}
            {featured.bestFor ? ` · ${featured.bestFor}` : ""}
          </p>
          {featured.joeNote && (
            <p className="mt-2 text-[0.7rem] uppercase tracking-wide text-bronze">
              Joe would have liked this one
            </p>
          )}
          {featured.url && (
            <a
              href={featured.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-link mt-4 inline-block"
            >
              {featured.special ? "Details & tickets →" : "View details →"}
            </a>
          )}
        </div>
      )}

      {others.length > 0 && (
        <div className="mt-8">
          <p className="text-[0.66rem] uppercase tracking-label text-ink-faint">
            Also worth doing
          </p>
          <ul className="mt-3 divide-y divide-line/60">
            {others.map((o) => (
              <li key={o.id} className="flex items-baseline justify-between gap-4 py-2.5">
                <span className="min-w-0">
                  <span className="text-ink">{o.title}</span>
                  {o.venue && (
                    <span className="ml-2 text-sm text-ink-faint">{o.venue}</span>
                  )}
                </span>
                {o.url && (
                  <a
                    href={o.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-[0.68rem] uppercase tracking-wide text-bronze underline decoration-line-strong underline-offset-4 hover:text-bronze-soft"
                  >
                    View →
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        {covered ? (
          <p className="text-[0.72rem] uppercase tracking-wide text-ink-faint">
            This weekend is covered — thank you
          </p>
        ) : (
          <a href={signupHref} className="btn-ghost">
            Request this weekend
          </a>
        )}
      </div>
    </div>
  );
}
