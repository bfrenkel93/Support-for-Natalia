/**
 * Meal-help block for "For Natalia": a quiet allergy note, an Uber Eats link,
 * and a map of restaurants near the home. Restrained — no cards, thin rules.
 */
export default function MealHelp({
  address,
  allergyNote,
}: {
  address: string;
  allergyNote?: string;
}) {
  const mapQuery = encodeURIComponent(`restaurants near ${address}`);
  const mapEmbed = `https://www.google.com/maps?q=${mapQuery}&z=14&output=embed`;
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const uberEats = `https://www.ubereats.com/search?q=${encodeURIComponent(address)}`;

  return (
    <div className="mb-14">
      <p className="eyebrow mb-4">Bringing a meal</p>

      {allergyNote && (
        <p className="border-l-2 border-bronze/50 pl-4 text-sm leading-relaxed text-ink-soft">
          {allergyNote}
        </p>
      )}

      <div className="mt-7 grid gap-8 sm:grid-cols-5">
        <div className="flex flex-col gap-4 sm:col-span-2">
          <div>
            <p className="text-[0.68rem] uppercase tracking-wide text-ink-faint">
              Delivering to
            </p>
            <p className="mt-1 text-ink-soft">{address}</p>
          </div>
          <div className="flex flex-col gap-3">
            <a href={uberEats} target="_blank" rel="noopener noreferrer" className="btn-ghost">
              Order on Uber Eats
            </a>
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-link"
            >
              See restaurants nearby →
            </a>
          </div>
        </div>

        <div className="overflow-hidden border border-line sm:col-span-3">
          <iframe
            title="Restaurants near the family's home"
            src={mapEmbed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-60 w-full grayscale-[0.35] sm:h-64"
          />
        </div>
      </div>
    </div>
  );
}
