import type { Gift } from "@/lib/supabase";
import PledgeForm from "./PledgeForm";

function money(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

export default function GiftCard({ gift }: { gift: Gift }) {
  const pledgedTotal = gift.pledges.reduce((sum, p) => sum + (p.amount || 0), 0);
  const contributors = gift.pledges.length;
  const pct =
    gift.cost && gift.cost > 0
      ? Math.min(100, Math.round((pledgedTotal / gift.cost) * 100))
      : null;
  const link = gift.link?.trim();

  return (
    <article className="border-t border-line/70 py-8 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-6">
        <h3 className="font-serif text-2xl font-light text-ink">{gift.title}</h3>
        {gift.cost != null && (
          <span className="shrink-0 text-sm tabular-nums text-ink-faint">
            {money(gift.cost)}
          </span>
        )}
      </div>
      {gift.description && (
        <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-ink-soft">
          {gift.description}
        </p>
      )}

      {pct != null && (
        <div className="mt-5 max-w-sm">
          <div className="h-px w-full bg-line">
            <div className="h-px bg-bronze transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-[0.7rem] uppercase tracking-wide text-ink-faint">
            {money(pledgedTotal)} of {money(gift.cost!)}
            {contributors > 0 && ` · ${contributors} ${contributors === 1 ? "person" : "people"}`}
          </p>
        </div>
      )}
      {pct == null && contributors > 0 && (
        <p className="mt-4 text-[0.7rem] uppercase tracking-wide text-ink-faint">
          {contributors} {contributors === 1 ? "person has" : "people have"} chipped in
        </p>
      )}

      {contributors > 0 && (
        <p className="mt-3 text-sm text-ink-soft">
          {gift.pledges.map((p, i) => (
            <span key={p.id}>
              {i > 0 && <span className="text-line-strong"> · </span>}
              <span title={p.note || undefined}>{p.name}</span>
            </span>
          ))}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="btn-ghost self-start">
            Contribute
          </a>
        ) : (
          <p className="text-sm text-ink-soft">
            Send toward this gift using{" "}
            <a href="#give-pay" className="text-bronze underline decoration-line-strong underline-offset-4">
              Venmo, Cash App, or Zelle
            </a>{" "}
            above.
          </p>
        )}
        <PledgeForm giftId={gift.id} />
      </div>
    </article>
  );
}
