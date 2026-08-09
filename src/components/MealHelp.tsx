/**
 * Meal-help block for the "Support for Natalia" section:
 *  - a clear allergy warning
 *  - an Uber Eats link and a map of restaurants near the family's home
 * The map uses Google's embed URL (no API key needed).
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
  const uberEats = `https://www.ubereats.com/search?q=${encodeURIComponent(
    address
  )}`;

  return (
    <div className="mt-12 overflow-hidden rounded-xl2 border border-line bg-cream shadow-card">
      <div className="border-b border-line bg-softblue-light/30 px-6 py-5">
        <h3 className="font-serif text-2xl text-ink">Bringing a meal?</h3>
        <p className="mt-1 text-ink-soft">
          A dropped-off dinner is one of the kindest things you can do.
          Here&apos;s what you need.
        </p>
      </div>

      <div className="p-6">
        {allergyNote && (
          <div className="flex gap-3 rounded-xl border border-clay/40 bg-clay/10 px-4 py-3">
            <span aria-hidden="true" className="text-lg">
              ⚠️
            </span>
            <p className="text-sm font-medium text-clay-dark">{allergyNote}</p>
          </div>
        )}

        <div className="mt-5 grid gap-5 sm:grid-cols-5">
          <div className="flex flex-col gap-3 sm:col-span-2">
            <div>
              <p className="eyebrow mb-1">Delivering to</p>
              <p className="text-ink-soft">{address}</p>
            </div>
            <a
              href={uberEats}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-softblue px-5 py-2.5 font-semibold text-cream-soft shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-softblue-dark"
            >
              <span aria-hidden="true">🛵</span> Order on Uber Eats
            </a>
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-line-strong px-5 py-2.5 font-semibold text-softblue-dark transition-colors hover:bg-softblue-light/40"
            >
              <span aria-hidden="true">📍</span> Restaurants nearby
            </a>
          </div>

          <div className="overflow-hidden rounded-xl border border-line sm:col-span-3">
            <iframe
              title="Restaurants near the family's home"
              src={mapEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-56 w-full sm:h-64"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
