/**
 * The gentle "this page has wound down" view shown once a family closes their
 * page. No forms, no calendar — just a warm closing note. All data is kept;
 * the page can be reopened anytime.
 */
export default function ClosedPage({
  eyebrow = "With gratitude",
  message,
}: {
  eyebrow?: string;
  message: string;
}) {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-bronze">
        {eyebrow}
      </p>
      <div className="mt-6 h-px w-12 bg-line-strong" />
      <p className="mt-8 whitespace-pre-line font-serif text-2xl font-light leading-relaxed text-ink">
        {message}
      </p>
    </main>
  );
}
