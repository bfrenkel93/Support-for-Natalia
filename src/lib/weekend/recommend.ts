import { EVERGREEN_IDEAS } from "./evergreen";
import type {
  EvergreenIdea,
  FilterTag,
  Recommendation,
  WeekendGroup,
} from "./types";
import type { Weekend } from "./weekends";

function tagsForIdea(idea: EvergreenIdea): FilterTag[] {
  const tags = new Set<FilterTag>();
  if (idea.isHistory) tags.add("history");
  if (idea.category === "outdoors" || (idea.category === "animals" && !idea.indoor))
    tags.add("outdoors");
  if (["museums", "science"].includes(idea.category) || (idea.category === "animals" && idea.indoor))
    tags.add("museums");
  if (idea.category === "sports") tags.add("sports");
  if (idea.category === "performances") tags.add("performances");
  if (idea.seasons.length > 0) tags.add("seasonal");
  return Array.from(tags);
}

function scoreIdea(idea: EvergreenIdea, w: Weekend): number {
  let s = idea.quality;
  if (idea.seasons.length === 0) s += 4;
  else s += idea.seasons.includes(w.season) ? 14 : -6;
  if (w.season === "winter") s += idea.indoor ? 8 : -12;
  if (w.season === "summer") s += idea.indoor ? -2 : 8;
  if (idea.isHistory) s += 6; // a quiet nod to what Joe loved
  return s;
}

function toRecommendation(idea: EvergreenIdea, joeNote: boolean): Recommendation {
  return {
    id: idea.id,
    title: idea.title,
    venue: idea.venue,
    blurb: idea.blurb,
    category: idea.category,
    ageLabel: idea.ageLabel,
    bestFor: idea.bestFor,
    url: idea.url,
    isHistory: idea.isHistory,
    special: false,
    joeNote,
    tags: tagsForIdea(idea),
  };
}

/**
 * Builds the per-weekend recommendations. Special (dated) events take priority
 * as the featured pick; evergreen experiences fill in and guarantee every
 * weekend has good ideas. Selection rotates so the same places don't repeat
 * weekend after weekend, and leans seasonal + a subtle history bias.
 */
export function buildWeekendGroups(params: {
  weekends: Weekend[];
  coveredWeekendKeys?: Set<string>;
  specialByWeekend?: Map<string, Recommendation[]>;
}): WeekendGroup[] {
  const { weekends, coveredWeekendKeys, specialByWeekend } = params;
  const recentFeatured: string[] = []; // last 2 featured ids
  let previousOthers: string[] = [];

  return weekends.map((w) => {
    const specials = specialByWeekend?.get(w.key) ?? [];

    // Score + gently rotate evergreen candidates for this weekend.
    const ranked = EVERGREEN_IDEAS.map((idea, i) => ({
      idea,
      score: scoreIdea(idea, w) + ((i + w.index) % 5),
    })).sort((a, b) => b.score - a.score);

    const picked: Recommendation[] = [];
    const usedIds = new Set<string>();

    // Featured: a special event if we have one, else the best fresh evergreen.
    let featured: Recommendation | null = specials[0] ?? null;
    if (featured) {
      usedIds.add(featured.id);
    } else {
      const freshFirst = ranked.filter((r) => !recentFeatured.includes(r.idea.id));
      const choice = (freshFirst[0] ?? ranked[0])?.idea;
      if (choice) {
        const joeNote = choice.isHistory && w.index % 4 === 0;
        featured = toRecommendation(choice, joeNote);
        usedIds.add(choice.id);
      }
    }

    // Others: remaining specials first, then evergreen not shown last weekend.
    for (const sp of specials.slice(1)) {
      if (picked.length >= 3) break;
      if (!usedIds.has(sp.id)) {
        picked.push(sp);
        usedIds.add(sp.id);
      }
    }
    for (const r of ranked) {
      if (picked.length >= 3) break;
      if (usedIds.has(r.idea.id)) continue;
      if (previousOthers.includes(r.idea.id) && ranked.length > 6) continue;
      picked.push(toRecommendation(r.idea, false));
      usedIds.add(r.idea.id);
    }

    if (featured) {
      recentFeatured.push(featured.id);
      if (recentFeatured.length > 2) recentFeatured.shift();
    }
    previousOthers = picked.map((p) => p.id);

    return {
      weekend: w,
      featured,
      others: picked,
      covered: coveredWeekendKeys?.has(w.key) ?? false,
    };
  });
}
