/**
 * "Add to calendar" links — Google Calendar (opens a pre-filled event) and
 * Apple/iCloud (downloads an .ics that also works with Outlook). Renders
 * nothing when there's no calendar info (e.g. an item with no date).
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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      {!compact && <span className="text-ink-soft">Add to calendar:</span>}
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-semibold text-sage-dark underline underline-offset-2 hover:text-sage"
      >
        <span aria-hidden="true">📅</span> Google
      </a>
      <a
        href={icsPath}
        className="inline-flex items-center gap-1 font-semibold text-softblue-dark underline underline-offset-2 hover:text-softblue"
      >
        <span aria-hidden="true">🗓️</span> Apple / iCloud
      </a>
    </div>
  );
}
