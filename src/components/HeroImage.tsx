"use client";

import { useState } from "react";

/**
 * Hero photograph with graceful fallbacks: it tries the configured URL, then
 * the common filenames (hero.jpg / .jpeg / .png), and finally a quiet
 * placeholder — so the photo shows whatever it was named, and there's never a
 * broken-image icon.
 */
export default function HeroImage({ src }: { src: string }) {
  const candidates = Array.from(
    new Set([src, "/hero.jpg", "/hero.jpeg", "/hero.png", "/hero.webp"].filter(Boolean))
  );
  const [i, setI] = useState(0);
  const failed = i >= candidates.length;

  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-limestone to-sand/70 text-taupe">
        <span className="h-10 w-10 rounded-full border border-taupe/50" />
        <span className="text-[0.62rem] uppercase tracking-label">
          A family photograph
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={candidates[i]}
      alt="Natalia and the kids"
      onError={() => setI((n) => n + 1)}
      className="h-full w-full object-cover"
    />
  );
}
