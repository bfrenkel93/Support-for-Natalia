import type { ReactNode } from "react";
import type { Slot } from "@/lib/supabase";
import SectionHeader from "./SectionHeader";
import SlotCard from "./SlotCard";

export default function SlotSection({
  id,
  eyebrow,
  title,
  subtitle,
  intro,
  chooseNote,
  slots,
  emptyText,
  tint,
  familyAddress,
  allergyNote,
  extra,
}: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  intro: string;
  chooseNote?: string;
  slots: Slot[];
  emptyText: string;
  tint: "sage" | "softblue";
  familyAddress: string;
  allergyNote?: string;
  extra?: ReactNode;
}) {
  const open = slots.filter((s) => !s.claimed);
  const claimed = slots.filter((s) => s.claimed);

  return (
    <section
      id={id}
      className={`section-anchor py-16 sm:py-24 ${
        tint === "sage" ? "bg-cream" : "bg-cream-soft"
      }`}
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          intro={intro}
        />

        {extra}

        <div className="mt-12">
          {chooseNote && (
            <p className="mb-6 max-w-measure text-ink-soft">{chooseNote}</p>
          )}
          {open.length > 0 ? (
            <>
              <div className="mb-5 flex items-center gap-4">
                <span className="eyebrow whitespace-nowrap">Open — pick a time</span>
                <span className="rule" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {open.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    familyAddress={familyAddress}
                    allergyNote={allergyNote}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="rounded-xl2 border border-dashed border-line-strong bg-cream-soft px-5 py-10 text-center text-ink-soft">
              {emptyText}
            </p>
          )}
        </div>

        {claimed.length > 0 && (
          <div className="mt-12">
            <div className="mb-5 flex items-center gap-4">
              <span className="eyebrow whitespace-nowrap text-sage-dark">
                Already covered — thank you
              </span>
              <span className="rule" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {claimed.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  familyAddress={familyAddress}
                  allergyNote={allergyNote}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
