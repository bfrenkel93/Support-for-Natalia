"use client";

/** A small button that opens the browser's print / "Save as PDF" dialog. */
export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-sm bg-charcoal px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-parchment hover:opacity-90"
    >
      Print / Save as PDF
    </button>
  );
}
