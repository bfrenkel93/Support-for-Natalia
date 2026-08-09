import type { MemoryWithUrls } from "@/lib/memories";
import { deleteMemory } from "@/app/admin/actions";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Renders private memories (stories + photos) inside the authenticated
 * dashboard. Every image src / download link is a short-lived signed URL that
 * was generated on the server — nothing here is a public bucket URL.
 */
export default function MemoryList({
  memories,
}: {
  memories: MemoryWithUrls[];
}) {
  if (memories.length === 0) {
    return (
      <p className="rounded-xl2 border border-dashed border-cream-deep bg-cream-soft px-5 py-8 text-center text-ink-soft">
        No memories have been shared yet. When someone does, it will appear here
        — privately.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {memories.map((m) => (
        <article
          key={m.id}
          className="rounded-xl2 border border-cream-deep bg-cream-soft p-5"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold text-ink">
              {m.author_name || "Anonymous"}
              {m.author_email && (
                <span className="ml-2 text-sm font-normal text-ink-soft">
                  {m.author_email}
                </span>
              )}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-ink-soft">
                {formatWhen(m.created_at)}
              </span>
              <form action={deleteMemory}>
                <input type="hidden" name="id" value={m.id} />
                <button className="rounded-full border border-clay/30 px-3 py-1 text-xs text-clay-dark hover:bg-clay/10">
                  Delete
                </button>
              </form>
            </div>
          </div>

          {m.story && (
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ink">
              {m.story}
            </p>
          )}

          {m.media.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {m.media.map((md) => (
                <figure
                  key={md.id}
                  className="overflow-hidden rounded-xl border border-cream-deep bg-cream"
                >
                  {md.viewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={md.viewUrl}
                      alt={md.file_name}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 w-full items-center justify-center text-sm text-ink-soft">
                      Preview unavailable
                    </div>
                  )}
                  <figcaption className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs text-ink-soft">
                    <span className="truncate" title={md.file_name}>
                      {md.file_name}
                    </span>
                    {md.downloadUrl && (
                      <a
                        href={md.downloadUrl}
                        className="shrink-0 font-semibold text-sage-dark underline underline-offset-2"
                      >
                        Download
                      </a>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
