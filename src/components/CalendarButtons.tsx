import type { Slot } from "@/lib/supabase";
import { getCalendarInfo } from "@/lib/calendar";

/**
 * "Add to calendar" links for a slot — Google Calendar (opens a pre-filled
 * event) and Apple/iCloud (downloads an .ics that also works with Outlook).
 * Renders nothing if the slot has no date.
 */
export default function CalendarButtons({
  slot,
  familyAddress,
  allergyNote,
  compact = false,
}: {
  slot: Slot;
  familyAddress: string;
  allergyNote?: string;
  compact?: boolean;
}) {
  const info = getCalendarInfo(slot, familyAddress, allergyNote);
  if (!info) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      {!compact && (
        <span className="text-ink-soft">Add to calendar:</span>
      )}
      <a
        href={info.googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-semibold text-sage-dark underline underline-offset-2 hover:text-sage"
      >
        <span aria-hidden="true">📅</span> Google
      </a>
      <a
        href={info.icsPath}
        className="inline-flex items-center gap-1 font-semibold text-softblue-dark underline underline-offset-2 hover:text-softblue"
      >
        <span aria-hidden="true">🗓️</span> Apple / iCloud
      </a>
    </div>
  );
}
