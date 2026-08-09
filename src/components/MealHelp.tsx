/**
 * Meal-help block for the "Support for Natalia" section:
 *  - a clear allergy warning
 *  - an UberEats link and a map of restaurants near the family's home
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
    <div className="mt-8 rounded-xl2 border border-softblue/30 bg-softblue-light/30 p-5 sm:p-6">
      <h3 className="font-serif text-xl text-ink">Bringing a meal?</h3>
      <p className="mt-1 text-ink-soft">
        A dropped-off dinner is one of the kindest things you can do. Here&apos;s
        what you need.
      </p>

      {allergyNote && (
        <div className="mt-4 flex gap-3 rounded-xl border border-clay/40 bg-clay/10 px-4 py-3">
          <span aria-hidden="true" className="text-lg">
            ⚠️
          </span>
          <p className="text-sm font-medium text-clay-dark">{allergyNote}</p>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-5">
        <div className="sm:col-span-2 flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Delivering to</p>
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
            className="inline-flex items-center justify-center gap-2 rounded-full border border-softblue/50 px-5 py-2.5 font-semibold text-softblue-dark transition-colors hover:bg-softblue-light"
          >
            <span aria-hidden="true">📍</span> Restaurants nearby
          </a>
        </div>

        <div className="sm:col-span-3 overflow-hidden rounded-xl border border-cream-deep">
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
  );
}
