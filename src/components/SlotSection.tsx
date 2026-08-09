import type { ReactNode } from "react";
import type { Slot } from "@/lib/supabase";
import SectionShell from "./SectionShell";
import SlotCard from "./SlotCard";

export default function SlotSection({
  id,
  number,
  label,
  title,
  subtitle,
  intro,
  chooseNote,
  slots,
  emptyText,
  tone = "parchment",
  familyAddress,
  allergyNote,
  extra,
}: {
  id: string;
  number?: string;
  label: string;
  title: string;
  subtitle?: string;
  intro: string;
  chooseNote?: string;
  slots: Slot[];
  emptyText: string;
  tone?: string;
  familyAddress: string;
  allergyNote?: string;
  extra?: ReactNode;
}) {
  const open = slots.filter((s) => !s.claimed);
  const claimed = slots.filter((s) => s.claimed);

  return (
    <SectionShell
      id={id}
      number={number}
      label={label}
      title={title}
      subtitle={subtitle}
      intro={intro}
      tone={tone}
    >
      {extra}

      {chooseNote && (
        <p className="mb-8 max-w-measure text-sm leading-relaxed text-ink-soft">
          {chooseNote}
        </p>
      )}

      {open.length > 0 ? (
        <div>
          {open.map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              familyAddress={familyAddress}
              allergyNote={allergyNote}
            />
          ))}
        </div>
      ) : (
        <p className="border-t border-line/70 py-10 text-sm text-ink-soft">
          {emptyText}
        </p>
      )}

      {claimed.length > 0 && (
        <div className="mt-14">
          <p className="eyebrow mb-6">Already covered — with thanks</p>
          <div>
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
    </SectionShell>
  );
}
