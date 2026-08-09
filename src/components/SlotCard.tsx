import type { Slot } from "@/lib/supabase";
import SignupForm from "./SignupForm";
import CalendarButtons from "./CalendarButtons";
import { getCalendarInfo } from "@/lib/calendar";

const ACCENT = {
  kids: {
    bg: "bg-sage hover:bg-sage-dark",
    chip: "bg-sage-light text-sage-dark",
    claimed: "border-sage/40 bg-sage-light/30",
  },
  support: {
    bg: "bg-softblue hover:bg-softblue-dark",
    chip: "bg-softblue-light text-softblue-dark",
    claimed: "border-softblue/40 bg-softblue-light/30",
  },
} as const;

export default function SlotCard({
  slot,
  familyAddress,
  allergyNote,
}: {
  slot: Slot;
  familyAddress: string;
  allergyNote?: string;
}) {
  const accent = ACCENT[slot.category];
  const title = slot.label || formatDate(slot.event_date) || "Open slot";
  const cal = getCalendarInfo(slot, familyAddress, allergyNote);

  return (
    <div
      className={`flex flex-col gap-4 p-6 ${
        slot.claimed
          ? `rounded-xl2 border shadow-card ${accent.claimed}`
          : "card card-hover"
      }`}
    >
      <div>
        <h3 className="font-serif text-xl text-ink">{title}</h3>
        {slot.description && (
          <p className="mt-1.5 text-sm text-ink-soft">{slot.description}</p>
        )}
      </div>

      {slot.claimed ? (
        <div className="mt-auto space-y-3">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${accent.chip}`}
            >
              <span aria-hidden="true">✓</span>
              {slot.claimed_private || !slot.claimed_name
                ? "Claimed"
                : `Claimed by ${slot.claimed_name}`}
            </span>
            {!slot.claimed_private && slot.claimed_note && (
              <p className="mt-2 text-sm italic text-ink-soft">
                “{slot.claimed_note}”
              </p>
            )}
          </div>
          <CalendarButtons
            googleUrl={cal?.googleUrl ?? null}
            icsPath={cal?.icsPath ?? null}
          />
        </div>
      ) : (
        <div className="mt-auto space-y-3">
          <SignupForm
            slotId={slot.id}
            category={slot.category}
            accentBg={accent.bg}
          />
          <CalendarButtons
            googleUrl={cal?.googleUrl ?? null}
            icsPath={cal?.icsPath ?? null}
          />
        </div>
      )}
    </div>
  );
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
