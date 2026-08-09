import type { Category } from "./types";

/**
 * Automated family-suitability + quality scoring for ingested events.
 * Text-signal based — no external calls. Used by the ingestion job.
 */

const HARD_EXCLUDE = [
  "21+", "18+", "nightclub", "night club", "cocktail", "wine tasting",
  "beer tasting", "afterparty", "after party", "burlesque", "dating",
  "speed dating", "singles", "networking", "adults only", "adult only",
  "adults-only", "explicit", "late night", "late-night", "bar crawl",
  "casino", "gambling", "rave",
];

const NEGATIVE = [
  "conference", "seminar", "hearing", "political", "business", "gala",
  "fundraiser", "comedy", "stand-up", "stand up", "bar", "brewery",
  "distillery", "happy hour",
];

const POSITIVE = [
  "family", "kids", "children", "all ages", "all-ages", "museum", "science",
  "history", "historic", "interactive", "festival", "zoo", "aquarium",
  "puppet", "young audiences", "nature", "outdoor", "outdoors", "holiday",
  "seasonal", "educational", "hands-on", "reenactment", "exhibition",
  "exhibit", "circus", "magic", "storytime", "story time", "parade",
  "fireworks", "disney", "sesame", "paw patrol", "bluey", "matinee",
];

const HISTORY = [
  "history", "historic", "revolution", "revolutionary", "colonial",
  "freedom trail", "reenactment", "patriots", "constitution", "1776",
  "civil war", "world war", "wwii", "battle", "founding", "heritage",
  "lexington", "concord", "bunker hill",
];

function has(text: string, words: string[]): number {
  let n = 0;
  for (const w of words) if (text.includes(w)) n++;
  return n;
}

/** 0-100 family suitability. 0 means hard-excluded. */
export function familyScore(rawText: string): number {
  const text = rawText.toLowerCase();
  if (has(text, HARD_EXCLUDE) > 0) return 0;

  let score = 52;
  score += Math.min(30, has(text, POSITIVE) * 9);
  score -= Math.min(28, has(text, NEGATIVE) * 12);
  return Math.max(0, Math.min(100, score));
}

export function isHistoryText(rawText: string): boolean {
  return has(rawText.toLowerCase(), HISTORY) > 0;
}

const CATEGORY_WEIGHT: Record<Category, number> = {
  history: 10,
  science: 9,
  museums: 8,
  sports: 8,
  outdoors: 8,
  performances: 7,
  animals: 8,
  seasonal: 6,
};

/** 0-100 overall worthiness for this site. */
export function qualityScore(opts: {
  family: number;
  category: Category;
  isHistory: boolean;
  isSpecial: boolean;
  hasImage: boolean;
}): number {
  let s = Math.round(opts.family * 0.55); // family suitability is the base
  s += CATEGORY_WEIGHT[opts.category] ?? 5;
  if (opts.isHistory) s += 8; // Joe's history bias — subtle
  if (opts.isSpecial) s += 8; // a real dated happening beats an everyday option
  if (opts.hasImage) s += 4;
  return Math.max(0, Math.min(100, s));
}
