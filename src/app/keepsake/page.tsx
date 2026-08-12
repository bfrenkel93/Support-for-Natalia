import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { getFamilyByEditToken } from "@/lib/families";
import { getFamilyMemoriesWithUrls } from "@/lib/memories";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "A Keepsake",
  robots: { index: false, follow: false, nocache: true },
};

function fmtDate(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  return new Date(t).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function KeepsakePage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  noStore();
  const token = (searchParams.token || "").trim();
  const family = token ? await getFamilyByEditToken(token) : null;

  if (!family) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-serif text-2xl font-light text-ink">
          This keepsake link isn’t valid
        </h1>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Please open it from your private “manage your page” screen, in full.
        </p>
      </main>
    );
  }

  const memories = await getFamilyMemoriesWithUrls(family.id);
  const who = family.honoring?.trim() || family.display_name;
  const title = family.honoring?.trim()
    ? `In loving memory of ${family.honoring.trim()}`
    : family.display_name;
  const photoCount = memories.reduce((n, m) => n + m.media.length, 0);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-ink print:py-0">
      <style>{`
        @media print {
          .keepsake-toolbar { display: none !important; }
          .keepsake-memory { break-inside: avoid; }
          body { background: #fff; }
        }
      `}</style>

      {/* Toolbar (screen only) */}
      <div className="keepsake-toolbar mb-10 flex flex-wrap items-center justify-between gap-4 rounded-sm border border-line bg-bone/40 px-5 py-4 print:hidden">
        <p className="text-sm text-ink-soft">
          A printable keepsake of every memory shared here. Use{" "}
          <span className="font-medium text-ink">Print / Save as PDF</span> to
          keep a copy.
        </p>
        <PrintButton />
      </div>

      {/* Cover */}
      <header className="border-b border-line pb-8 text-center">
        <p className="eyebrow">A keepsake of memories</p>
        <h1 className="mt-3 font-serif text-4xl font-light leading-tight text-ink">
          {title}
        </h1>
        <p className="mt-4 text-sm text-ink-faint">
          {memories.length} {memories.length === 1 ? "memory" : "memories"}
          {photoCount > 0 &&
            ` · ${photoCount} photo${photoCount === 1 ? "" : "s"}`}{" "}
          · gathered by the people who love {who}
        </p>
      </header>

      {memories.length === 0 ? (
        <p className="mt-12 text-center text-ink-soft">
          No memories have been shared yet. When they are, they’ll appear here.
        </p>
      ) : (
        <div className="mt-12 space-y-12">
          {memories.map((m) => (
            <article
              key={m.id}
              className="keepsake-memory border-b border-line/60 pb-12 last:border-0"
            >
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-serif text-xl font-light text-ink">
                  {m.author_name || "A friend"}
                </p>
                <p className="shrink-0 text-xs uppercase tracking-wide text-ink-faint">
                  {fmtDate(m.created_at)}
                </p>
              </div>
              {m.story && (
                <p className="mt-3 whitespace-pre-line leading-relaxed text-ink">
                  {m.story}
                </p>
              )}
              {m.media.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {m.media.map((md) =>
                    md.viewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={md.id}
                        src={md.viewUrl}
                        alt=""
                        className="w-full rounded-sm border border-line object-cover"
                      />
                    ) : null
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <p className="mt-12 border-t border-line pt-6 text-center text-xs text-ink-faint">
        familygriefsupport.org
      </p>
    </main>
  );
}
