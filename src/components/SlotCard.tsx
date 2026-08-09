import type { Slot } from "@/lib/supabase";
import SignupForm from "./SignupForm";
import CalendarButtons from "./CalendarButtons";

const ACCENT = {
  kids: {
    bg: "bg-sage hover:bg-sage-dark",
    chip: "bg-sage-light text-sage-dark",
    claimed: "border-sage/40 bg-sage-light/40",
  },
  support: {
    bg: "bg-softblue hover:bg-softblue-dark",
    chip: "bg-softblue-light text-softblue-dark",
    claimed: "border-softblue/40 bg-softblue-light/40",
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

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl2 border p-5 shadow-soft transition-shadow ${
        slot.claimed
          ? accent.claimed
          : "border-cream-deep bg-cream-soft hover:shadow-lg"
      }`}
    >
      <div>
        <h3 className="font-serif text-lg text-ink">{title}</h3>
        {slot.description && (
          <p className="mt-1 text-sm text-ink-soft">{slot.description}</p>
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
            slot={slot}
            familyAddress={familyAddress}
            allergyNote={allergyNote}
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
            slot={slot}
            familyAddress={familyAddress}
            allergyNote={allergyNote}
          />
        </div>
      )}
    </div>
  );
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  // value is YYYY-MM-DD; render without timezone drift.
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
