/**
 * Add-to-calendar links — restrained text links (Google + Apple/iCloud .ics).
 * Renders nothing when there's no calendar info.
 */
export default function CalendarButtons({
  googleUrl,
  icsPath,
  compact = false,
}: {
  googleUrl: string | null;
  icsPath: string | null;
  compact?: boolean;
}) {
  if (!googleUrl || !icsPath) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.68rem] uppercase tracking-wide text-ink-faint">
      {!compact && <span>Add to calendar</span>}
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-line-strong underline-offset-4 transition-colors hover:text-bronze"
      >
        Google
      </a>
      <a
        href={icsPath}
        className="underline decoration-line-strong underline-offset-4 transition-colors hover:text-bronze"
      >
        Apple
      </a>
    </div>
  );
}
