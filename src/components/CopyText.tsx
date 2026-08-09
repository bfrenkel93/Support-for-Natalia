"use client";

import { useState } from "react";

/** Small "tap to copy" value — used for the Zelle number. */
export default function CopyText({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard unavailable — the value is still visible to type in.
        }
      }}
      className={`underline decoration-line-strong underline-offset-4 transition-colors hover:text-bronze ${className}`}
      title="Tap to copy"
    >
      {copied ? "Copied" : `${value} · copy`}
    </button>
  );
}
