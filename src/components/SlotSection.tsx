import type { ReactNode } from "react";
import type { Slot } from "@/lib/supabase";
import RichText from "./RichText";
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

  const eyebrowColor = tint === "sage" ? "text-sage-dark" : "text-softblue-dark";

  return (
    <section
      id={id}
      className={`section-anchor py-14 sm:py-20 ${
        tint === "sage" ? "bg-cream" : "bg-cream-soft"
      }`}
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p
            className={`mb-2 text-sm font-semibold uppercase tracking-[0.18em] ${eyebrowColor}`}
          >
            {eyebrow}
          </p>
          <h2 className="font-serif text-2xl text-ink sm:text-4xl">{title}</h2>
          {subtitle && (
            <p className="mt-2 font-serif text-lg italic text-ink-soft">
              {subtitle}
            </p>
          )}
          <div className="mt-4 text-lg">
            <RichText text={intro} />
          </div>
        </div>

        {extra}

        {/* Open slots */}
        <div className="mt-9">
          {chooseNote && (
            <p className="mb-5 max-w-2xl text-ink-soft">{chooseNote}</p>
          )}
          {open.length > 0 ? (
            <>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-soft">
                Open — pick a time
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
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
            <p className="rounded-xl2 border border-dashed border-cream-deep bg-cream-soft px-5 py-8 text-center text-ink-soft">
              {emptyText}
            </p>
          )}
        </div>

        {/* Already covered */}
        {claimed.length > 0 && (
          <div className="mt-10">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-soft">
              Already covered — thank you 💛
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
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
