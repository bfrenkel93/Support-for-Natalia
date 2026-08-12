import Link from "next/link";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bronze">
        Family Grief Support
      </p>
      <h1 className="mt-5 font-serif text-3xl font-light leading-tight text-ink">
        This page may have moved.
      </h1>
      <p className="mt-4 leading-relaxed text-ink-soft">
        The link might be incomplete or out of date. If you were looking for a
        family&rsquo;s page, try opening the link you were sent again, in full.
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <Link
          href="/"
          className="rounded-sm bg-charcoal px-6 py-3 text-xs font-semibold uppercase tracking-wide text-parchment hover:opacity-90"
        >
          Go to the homepage
        </Link>
        <Link
          href="/create"
          className="text-sm font-medium text-bronze underline underline-offset-2 hover:text-ink"
        >
          Create a support page →
        </Link>
      </div>
    </main>
  );
}
