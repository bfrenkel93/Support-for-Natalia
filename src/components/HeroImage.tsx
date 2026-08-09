"use client";

import { useState } from "react";

/**
 * Hero photograph with a graceful fallback: if the image is missing (e.g.
 * `hero.jpg` hasn't been uploaded yet) it shows a quiet placeholder instead of
 * a broken image.
 */
export default function HeroImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
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
      src={src}
      alt="Natalia and the kids"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  );
}
