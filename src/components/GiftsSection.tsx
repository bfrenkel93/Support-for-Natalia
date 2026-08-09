import type { Gift } from "@/lib/supabase";
import SectionShell from "./SectionShell";
import GiftCard from "./GiftCard";
import PaymentMethods from "./PaymentMethods";

export default function GiftsSection({
  gifts,
  settings,
  number,
}: {
  gifts: Gift[];
  settings: Record<string, string>;
  number?: string;
}) {
  const hasPay = settings.pay_venmo || settings.pay_cashapp || settings.pay_zelle;
  if (gifts.length === 0 && !hasPay) return null;

  return (
    <SectionShell
      id="give"
      number={number}
      label="Give a Gift"
      title={settings.gifts_title || "Give a Gift"}
      intro={settings.gifts_intro}
      tone="ivory"
    >
      <div id="give-pay">
        <PaymentMethods
          venmo={settings.pay_venmo}
          cashapp={settings.pay_cashapp}
          zelle={settings.pay_zelle}
        />
      </div>

      {gifts.length > 0 && (
        <div>
          {gifts.map((gift) => (
            <GiftCard key={gift.id} gift={gift} />
          ))}
        </div>
      )}

      <p className="mt-8 text-xs leading-relaxed text-ink-faint">
        Contributions go directly to Natalia through the options above — nothing
        is charged through this page.
      </p>
    </SectionShell>
  );
}
