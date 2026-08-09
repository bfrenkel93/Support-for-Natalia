import type { Slot } from "@/lib/supabase";
import SignupForm from "./SignupForm";
import CalendarButtons from "./CalendarButtons";
import { getCalendarInfo } from "@/lib/calendar";

/**
 * A single visit/meal as an editorial row — date set in serif, a restrained
 * action on the right, hairline divider. No cards, no colour blocks.
 */
export default function SlotCard({
  slot,
  familyAddress,
  allergyNote,
}: {
  slot: Slot;
  familyAddress: string;
  allergyNote?: string;
}) {
  const cal = getCalendarInfo(slot, familyAddress, allergyNote);
  const parts = splitDate(slot);

  return (
    <article className="border-t border-line/70 py-8 first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {parts.weekday && (
            <p className="text-[0.68rem] uppercase tracking-wide text-ink-faint">
              {parts.weekday}
            </p>
          )}
          <h3 className="mt-1 font-serif text-2xl font-light text-ink">
            {parts.main}
          </h3>
          {slot.description && (
            <p className="mt-1.5 text-sm text-ink-soft">{slot.description}</p>
          )}
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          {slot.claimed ? (
            <div className="sm:text-right">
              <p className="text-[0.68rem] uppercase tracking-wide text-bronze">
                {slot.claimed_private || !slot.claimed_name
                  ? "Claimed"
                  : `Claimed · ${slot.claimed_name}`}
              </p>
              {!slot.claimed_private && slot.claimed_note && (
                <p className="mt-1 max-w-xs text-sm italic text-ink-soft">
                  “{slot.claimed_note}”
                </p>
              )}
            </div>
          ) : (
            <SignupForm slotId={slot.id} category={slot.category} />
          )}

          <CalendarButtons
            googleUrl={cal?.googleUrl ?? null}
            icsPath={cal?.icsPath ?? null}
            compact
          />
        </div>
      </div>
    </article>
  );
}

/** Split a label/date into a small weekday line + a serif main line. */
function splitDate(slot: Slot): { weekday: string | null; main: string } {
  if (slot.label) return { weekday: null, main: slot.label };
  if (!slot.event_date) return { weekday: null, main: "Open" };
  const [y, m, d] = slot.event_date.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }),
    main: date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }),
  };
}
