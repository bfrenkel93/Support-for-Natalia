import type { Season, Weekend } from "./weekends";

export type Category =
  | "history"
  | "science"
  | "museums"
  | "sports"
  | "outdoors"
  | "performances"
  | "animals"
  | "seasonal";

/** The filter tags surfaced on the dedicated page. */
export type FilterTag =
  | "history"
  | "outdoors"
  | "museums"
  | "sports"
  | "performances"
  | "seasonal";

export type EvergreenIdea = {
  id: string;
  title: string;
  venue: string;
  blurb: string;
  category: Category;
  ageLabel: string;
  bestFor: string;
  url: string;
  quality: number; // 0-100 baseline worthiness
  isHistory: boolean;
  indoor: boolean;
  seasons: Season[]; // seasons it especially shines in; [] = year-round
};

/** A single suggestion shown to a visitor (evergreen or a dated special event). */
export type Recommendation = {
  id: string;
  title: string;
  venue: string | null;
  blurb: string | null;
  category: Category | string;
  ageLabel: string | null;
  bestFor: string | null;
  url: string | null;
  isHistory: boolean;
  special: boolean; // a dated, time-specific event happening that weekend
  joeNote: boolean; // "Joe would have liked this one" — used very sparingly
  tags: FilterTag[];
};

export type WeekendGroup = {
  weekend: Weekend;
  featured: Recommendation | null;
  others: Recommendation[];
  covered: boolean; // a confirmed kids weekend already exists
};
