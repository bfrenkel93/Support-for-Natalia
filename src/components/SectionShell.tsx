import type { ReactNode } from "react";
import Reveal from "./Reveal";
import RichText from "./RichText";

const TONE: Record<string, string> = {
  parchment: "bg-parchment",
  ivory: "bg-ivory",
  limestone: "bg-limestone/60",
  bone: "bg-bone",
};

/**
 * The editorial section frame used across the site: a numbered, left-aligned
 * rail (number · label · serif title · intro) beside a wide content column.
 * Asymmetric on desktop, cleanly stacked on mobile. No cards, no borders —
 * rhythm comes from whitespace, typography, and a single hairline.
 */
export default function SectionShell({
  id,
  number,
  label,
  title,
  subtitle,
  intro,
  tone = "parchment",
  children,
}: {
  id: string;
  number?: string;
  label: string;
  title: string;
  subtitle?: string;
  intro?: string;
  tone?: keyof typeof TONE | string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`section-anchor ${TONE[tone] ?? TONE.parchment} py-24 sm:py-32`}
    >
      <div className="mx-auto grid max-w-content gap-x-12 gap-y-10 px-6 sm:px-10 lg:grid-cols-12">
        <Reveal as="header" className="lg:col-span-4">
          <div className="flex items-center gap-4">
            {number && <span className="section-num">{number}</span>}
            <span className="eyebrow">{label}</span>
          </div>
          <h2 className="mt-6 font-serif text-[2rem] font-light leading-[1.12] text-ink sm:text-[2.6rem]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-3 font-serif text-lg italic text-bronze">
              {subtitle}
            </p>
          )}
          {intro && (
            <div className="mt-6 max-w-measure text-[1.02rem] leading-[1.85]">
              <RichText text={intro} />
            </div>
          )}
        </Reveal>

        <div className="lg:col-span-7 lg:col-start-6">{children}</div>
      </div>
    </section>
  );
}
