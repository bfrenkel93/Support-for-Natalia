import type { MemoryWithUrls } from "@/lib/memories";
import { deleteMemory } from "@/app/admin/actions";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Private memories inside the authenticated dashboard, set like an oral-history
 * archive. Every image / download link is a short-lived signed URL generated on
 * the server — never a public bucket URL.
 */
export default function MemoryList({
  memories,
}: {
  memories: MemoryWithUrls[];
}) {
  if (memories.length === 0) {
    return (
      <p className="border-t border-line/70 py-10 text-sm text-ink-soft">
        No memories have been shared yet. When someone does, it will appear here
        — privately.
      </p>
    );
  }

  return (
    <div>
      {memories.map((m) => (
        <article
          key={m.id}
          className="border-t border-line/70 py-10 first:border-t-0 first:pt-0"
        >
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[0.7rem] uppercase tracking-wide text-bronze">
              {m.author_name || "Anonymous"}
              {m.author_email && (
                <span className="ml-2 lowercase tracking-normal text-ink-faint">
                  {m.author_email}
                </span>
              )}
            </p>
            <div className="flex items-center gap-4">
              <span className="text-[0.7rem] uppercase tracking-wide text-ink-faint">
                {formatWhen(m.created_at)}
              </span>
              <form action={deleteMemory}>
                <input type="hidden" name="id" value={m.id} />
                <button className="text-[0.68rem] uppercase tracking-wide text-ink-faint underline underline-offset-4 hover:text-bronze">
                  Delete
                </button>
              </form>
            </div>
          </div>

          {m.story && (
            <p className="mt-5 max-w-2xl whitespace-pre-line font-serif text-xl font-light leading-relaxed text-ink">
              {m.story}
            </p>
          )}

          {m.media.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {m.media.map((md) => (
                <figure key={md.id} className="overflow-hidden border border-line bg-bone">
                  {md.viewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={md.viewUrl} alt={md.file_name} className="h-44 w-full object-cover" />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center text-sm text-ink-faint">
                      Preview unavailable
                    </div>
                  )}
                  <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-[0.66rem] uppercase tracking-wide text-ink-faint">
                    <span className="truncate normal-case" title={md.file_name}>
                      {md.file_name}
                    </span>
                    {md.downloadUrl && (
                      <a href={md.downloadUrl} className="shrink-0 underline underline-offset-4 hover:text-bronze">
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
