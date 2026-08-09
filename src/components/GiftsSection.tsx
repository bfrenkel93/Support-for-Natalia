import type { Gift } from "@/lib/supabase";
import SectionHeader from "./SectionHeader";
import GiftCard from "./GiftCard";
import PaymentMethods from "./PaymentMethods";

export default function GiftsSection({
  gifts,
  settings,
}: {
  gifts: Gift[];
  settings: Record<string, string>;
}) {
  const hasPay =
    settings.pay_venmo || settings.pay_cashapp || settings.pay_zelle;

  // Hide the section until there's at least a gift idea or a way to give.
  if (gifts.length === 0 && !hasPay) return null;

  return (
    <section id="give" className="section-anchor bg-sage-light/30 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        <SectionHeader
          eyebrow="Something a little bigger"
          title={settings.gifts_title || "Give a Gift"}
          intro={settings.gifts_intro}
        />

        <PaymentMethods
          venmo={settings.pay_venmo}
          cashapp={settings.pay_cashapp}
          zelle={settings.pay_zelle}
        />

        {gifts.length > 0 && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {gifts.map((gift) => (
              <GiftCard key={gift.id} gift={gift} />
            ))}
          </div>
        )}

        <p className="mt-6 text-sm text-ink-soft">
          Contributions go directly to Natalia through the options above —
          nothing is charged through this page.
        </p>
      </div>
    </section>
  );
}
