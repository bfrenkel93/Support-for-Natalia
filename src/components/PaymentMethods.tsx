import CopyText from "./CopyText";

/**
 * "Ways to give" — Natalia's payment handles. Venmo and Cash App become
 * tappable links; Zelle is shown as a number to enter in your own bank app
 * (Zelle has no universal web link). All values are editable in the admin.
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
    <div
      id="give-pay"
      className="mt-8 rounded-xl2 border border-line bg-cream-soft p-5 shadow-card sm:p-6"
    >
      <p className="eyebrow mb-3">Ways to give</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
        {venmoHandle && (
          <a
            href={`https://venmo.com/u/${venmoHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#3D95CE] px-5 py-3 font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5"
          >
            <span aria-hidden="true">Venmo</span>
            <span className="font-normal opacity-90">@{venmoHandle}</span>
          </a>
        )}
        {cashTag && (
          <a
            href={`https://cash.app/$${cashTag}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#00C244] px-5 py-3 font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5"
          >
            <span aria-hidden="true">Cash App</span>
            <span className="font-normal opacity-90">${cashTag}</span>
          </a>
        )}
        {zelleValue && (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-[#6D1ED4] px-5 py-3 text-center font-semibold text-white shadow-soft">
            <span>Zelle</span>
            <CopyText
              value={zelleValue}
              className="font-normal text-white/95"
            />
          </div>
        )}
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        After you send something, you can log it on any gift below so we can keep
        track of the goals — totally optional.
      </p>
    </div>
  );
}
