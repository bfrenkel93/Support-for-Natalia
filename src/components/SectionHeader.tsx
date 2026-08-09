import RichText from "./RichText";

/** Consistent editorial section header: eyebrow · serif title · italic subtitle · intro. */
export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  intro,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  intro?: string;
}) {
  return (
    <div className="max-w-measure">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="font-serif text-3xl leading-tight text-ink sm:text-[2.6rem]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 font-serif text-xl italic text-clay-dark">
          {subtitle}
        </p>
      )}
      {intro && (
        <div className="mt-5 text-lg leading-relaxed">
          <RichText text={intro} />
        </div>
      )}
    </div>
  );
}
