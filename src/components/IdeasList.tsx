import type { ActivityIdea } from "@/lib/supabase";

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Inspiration for time with the kids — a quiet editorial list. */
export default function IdeasList({ ideas }: { ideas: ActivityIdea[] }) {
  if (ideas.length === 0) return null;

  return (
    <div className="mt-14">
      <p className="eyebrow mb-6">A few ideas</p>
      <div>
        {ideas.map((idea) => {
          const when = formatDate(idea.event_date);
          return (
            <div
              key={idea.id}
              className="flex flex-col gap-1 border-t border-line/70 py-6 first:border-t-0 first:pt-0 sm:flex-row sm:items-baseline sm:justify-between"
            >
              <div className="min-w-0">
                <h3 className="font-serif text-xl font-light text-ink">
                  {idea.title}
                </h3>
                <p className="mt-1 text-sm text-ink-soft">
                  {when}
                  {when && idea.location ? " · " : ""}
                  {idea.location}
                </p>
                {idea.note && (
                  <p className="mt-1 text-sm italic text-ink-soft">{idea.note}</p>
                )}
              </div>
              {idea.url && (
                <a
                  href={idea.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-link shrink-0"
                >
                  Details →
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
