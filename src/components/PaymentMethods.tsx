import CopyText from "./CopyText";

/**
 * "Ways to give" — Natalia's handles, shown as restrained rows rather than
 * bright branded buttons. Venmo & Cash App link out; Zelle is a copyable number.
 */
export default function PaymentMethods({
  venmo,
  cashapp,
  zelle,
}: {
  venmo?: string;
  cashapp?: string;
  zelle?: string;
}) {
  const venmoHandle = venmo?.trim().replace(/^@/, "");
  const cashTag = cashapp?.trim().replace(/^\$/, "");
  const zelleValue = zelle?.trim();

  if (!venmoHandle && !cashTag && !zelleValue) return null;

  return (
    <div className="mb-14">
      <p className="eyebrow mb-5">Ways to give</p>
      <div className="divide-y divide-line/70 border-y border-line/70">
        {venmoHandle && (
          <a
            href={`https://venmo.com/u/${venmoHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between py-4 transition-colors hover:text-bronze"
          >
            <span className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#3D95CE]" />
              <span className="text-[0.8rem] uppercase tracking-wide">Venmo</span>
            </span>
            <span className="text-sm text-ink-soft group-hover:text-bronze">
              @{venmoHandle} →
            </span>
          </a>
        )}
        {cashTag && (
          <a
            href={`https://cash.app/$${cashTag}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between py-4 transition-colors hover:text-bronze"
          >
            <span className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#00C244]" />
              <span className="text-[0.8rem] uppercase tracking-wide">Cash App</span>
            </span>
            <span className="text-sm text-ink-soft group-hover:text-bronze">
              ${cashTag} →
            </span>
          </a>
        )}
        {zelleValue && (
          <div className="flex items-center justify-between py-4">
            <span className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#6D1ED4]" />
              <span className="text-[0.8rem] uppercase tracking-wide">Zelle</span>
            </span>
            <CopyText value={zelleValue} className="text-sm text-ink-soft" />
          </div>
        )}
      </div>
      <p className="mt-4 text-sm text-ink-soft">
        After you send something, you can note it on any gift below so we can keep
        track of the goals — entirely optional.
      </p>
    </div>
  );
}
