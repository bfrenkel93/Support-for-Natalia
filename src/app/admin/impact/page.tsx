import { adminPasswordIsSet, isAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getImpactStats } from "@/lib/impact";
import { FAMILY_KIND_LABEL } from "@/lib/bookings";
import type { Booking } from "@/lib/supabase";
import LoginForm from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

function fmtDate(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatCard({
  value,
  label,
  sub,
}: {
  value: string | number;
  label: string;
  sub?: string;
}) {
  return (
    <div className="rounded-sm border border-line bg-bone/40 p-5">
      <p className="font-serif text-4xl font-light leading-none text-ink">{value}</p>
      <p className="mt-2 text-sm font-medium text-ink">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-soft">{sub}</p>}
    </div>
  );
}

export default async function ImpactPage() {
  if (!isAdmin()) {
    return <LoginForm passwordSet={adminPasswordIsSet()} />;
  }

  const s = await getImpactStats();
  const n = (x: number) => x.toLocaleString("en-US");

  const kindBits = Object.entries(s.mealsByKind)
    .sort((a, b) => b[1] - a[1])
    .map(([k, count]) => `${n(count)} ${FAMILY_KIND_LABEL[k as Booking["kind"]] || k}`)
    .join(" · ");

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Private dashboard</p>
          <h1 className="font-serif text-3xl font-light text-ink">Impact</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Everything happening across every family page.
          </p>
        </div>
        <div className="flex items-center gap-5">
          <a href="/admin" className="btn-link">
            ← Family admin
          </a>
        </div>
      </div>

      {!isSupabaseConfigured() && (
        <p className="mt-6 border-l-2 border-bronze/50 bg-bone/60 px-5 py-4 text-sm text-ink-soft">
          Supabase isn&apos;t connected yet, so there&apos;s nothing to report.
        </p>
      )}

      {/* Headline numbers */}
      <section className="mt-10">
        <h2 className="eyebrow">The whole picture</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            value={n(s.pages)}
            label="Family pages"
            sub={`${n(s.activePages)} with activity`}
          />
          <StatCard
            value={n(s.meals)}
            label="Meals & help scheduled"
            sub={kindBits || undefined}
          />
          <StatCard
            value={n(s.memories)}
            label="Memories shared"
            sub={s.photos ? `${n(s.photos)} photo${s.photos === 1 ? "" : "s"}` : undefined}
          />
          <StatCard
            value={n(s.rsvpHeadcount)}
            label="Memorial RSVPs"
            sub={`${n(s.rsvpParties)} part${s.rsvpParties === 1 ? "y" : "ies"}`}
          />
          <StatCard
            value={s.giftTotal ? `$${n(s.giftTotal)}` : n(s.giftCount)}
            label="Gifts logged"
            sub={
              s.giftTotal
                ? `${n(s.giftCount)} gift${s.giftCount === 1 ? "" : "s"}`
                : "no amounts logged"
            }
          />
          <StatCard
            value={n(s.subscribers)}
            label="People following"
            sub={s.requests ? `${n(s.requestsOpen)} open request${s.requestsOpen === 1 ? "" : "s"}` : undefined}
          />
        </div>
        <p className="mt-4 text-sm text-ink-soft">
          {s.publicPages} public · {s.privatePages} private ·{" "}
          <span className="text-bronze">{s.newPages30d} new in the last 30 days</span>
        </p>
      </section>

      {/* Per-family breakdown */}
      <section className="mt-12">
        <h2 className="font-serif text-2xl font-light text-ink">By family</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Newest pages first. The sample page is not counted.
        </p>
        <div className="mt-4 overflow-x-auto rounded-sm border border-line">
          {s.families.length === 0 ? (
            <p className="bg-bone/40 px-5 py-6 text-ink-soft">
              No family pages yet. They&apos;ll appear here as people create them.
            </p>
          ) : (
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-bone/60 text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3 font-medium">Family</th>
                  <th className="px-3 py-3 font-medium">Created</th>
                  <th className="px-3 py-3 text-right font-medium">Meals</th>
                  <th className="px-3 py-3 text-right font-medium">Memories</th>
                  <th className="px-3 py-3 text-right font-medium">RSVPs</th>
                  <th className="px-3 py-3 text-right font-medium">Gifts</th>
                  <th className="px-3 py-3 text-right font-medium">Follows</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {s.families.map((f) => (
                  <tr key={f.id} className="bg-bone/30">
                    <td className="px-4 py-3">
                      <a
                        href={`/${f.slug}`}
                        className="font-medium text-ink underline-offset-2 hover:underline"
                      >
                        {f.name}
                      </a>
                      <span className="ml-2 text-xs text-ink-faint">
                        /{f.slug}
                        {!f.isPublic && " · private"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-ink-soft">{fmtDate(f.createdAt)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{f.meals || "—"}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{f.memories || "—"}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{f.rsvps || "—"}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{f.gifts || "—"}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{f.subscribers || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <p className="mt-10 text-xs text-ink-faint">
        Updated {new Date(s.generatedAt).toLocaleString("en-US")}. Refresh for the
        latest.
      </p>
      <div className="h-16" />
    </div>
  );
}
