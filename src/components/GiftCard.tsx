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
    <div className="card flex flex-col gap-4 p-6">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-serif text-xl text-ink">{gift.title}</h3>
          {gift.cost != null && (
            <span className="shrink-0 text-sm font-semibold text-ink-soft">
              {money(gift.cost)}
            </span>
          )}
        </div>
        {gift.description && (
          <p className="mt-1.5 text-sm text-ink-soft">{gift.description}</p>
        )}
      </div>

      {pct != null && (
        <div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-sage-light">
            <div
              className="h-full rounded-full bg-sage transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-ink-soft">
            {money(pledgedTotal)} of {money(gift.cost!)} gathered
            {contributors > 0 &&
              ` · ${contributors} ${contributors === 1 ? "person" : "people"}`}
          </p>
        </div>
      )}
      {pct == null && contributors > 0 && (
        <p className="text-xs text-ink-soft">
          {contributors} {contributors === 1 ? "person has" : "people have"}{" "}
          chipped in
        </p>
      )}

      {contributors > 0 && (
        <ul className="flex flex-wrap gap-2">
          {gift.pledges.map((p) => (
            <li
              key={p.id}
              className="rounded-full bg-sage-light/70 px-3 py-1 text-sm text-sage-dark"
              title={p.note || undefined}
            >
              {p.name}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto space-y-2">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-clay px-5 py-2.5 font-semibold text-cream-soft shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-clay-dark"
          >
            <span aria-hidden="true">💛</span> Contribute
          </a>
        ) : (
          <p className="text-sm text-ink-soft">
            Send toward this gift using{" "}
            <a
              href="#give-pay"
              className="font-semibold text-sage-dark underline underline-offset-2"
            >
              Venmo, Cash App, or Zelle
            </a>{" "}
            above.
          </p>
        )}
        <PledgeForm giftId={gift.id} />
      </div>
    </div>
  );
}
