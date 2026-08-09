"use client";

import { useState } from "react";
import type { WeekendGroup, FilterTag, Recommendation } from "@/lib/weekend/types";
import WeekendIdeaGroup from "./WeekendIdeaGroup";

type FilterKey = "all" | "this" | "next" | FilterTag;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "this", label: "This Weekend" },
  { key: "next", label: "Next Weekend" },
  { key: "history", label: "History" },
  { key: "outdoors", label: "Outdoors" },
  { key: "museums", label: "Museums" },
  { key: "sports", label: "Sports" },
  { key: "performances", label: "Performances" },
  { key: "seasonal", label: "Seasonal" },
];

const CATEGORY_KEYS: FilterKey[] = [
  "history",
  "outdoors",
  "museums",
  "sports",
  "performances",
  "seasonal",
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function WeekendIdeasExplorer({
  groups,
}: {
  groups: WeekendGroup[];
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [month, setMonth] = useState<number | "all">("all");

  // Distinct months present across the weekends (by the Saturday).
  const months = Array.from(
    new Set(groups.map((g) => Number(g.weekend.saturdayYmd.slice(5, 7)) - 1))
  ).sort((a, b) => a - b);

  let visible: WeekendGroup[] = groups;
  if (month !== "all") {
    visible = visible.filter(
      (g) => Number(g.weekend.saturdayYmd.slice(5, 7)) - 1 === month
    );
  }
  if (filter === "this") {
    visible = visible.filter((g) => g.weekend.index === 0);
  } else if (filter === "next") {
    visible = visible.filter((g) => g.weekend.index === 1);
  } else if (CATEGORY_KEYS.includes(filter)) {
    const out: WeekendGroup[] = [];
    for (const g of visible) {
      const all = [g.featured, ...g.others].filter(Boolean) as Recommendation[];
      const matches = all.filter((r) => r.tags.includes(filter as FilterTag));
      if (matches.length === 0) continue;
      out.push({ ...g, featured: matches[0], others: matches.slice(1, 4) });
    }
    visible = out;
  }

  return (
    <div>
      {months.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[0.68rem] uppercase tracking-wide text-ink-faint">
            Month
          </span>
          <button
            type="button"
            onClick={() => setMonth("all")}
            className={`rounded-sm border px-4 py-2 text-[0.68rem] uppercase tracking-wide transition-colors ${
              month === "all"
                ? "border-bronze bg-bone text-ink"
                : "border-line text-ink-soft hover:border-line-strong"
            }`}
          >
            All
          </button>
          {months.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMonth(m)}
              className={`rounded-sm border px-4 py-2 text-[0.68rem] uppercase tracking-wide transition-colors ${
                month === m
                  ? "border-bronze bg-bone text-ink"
                  : "border-line text-ink-soft hover:border-line-strong"
              }`}
            >
              {MONTH_NAMES[m]}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-sm border px-4 py-2 text-[0.68rem] uppercase tracking-wide transition-colors ${
              filter === f.key
                ? "border-bronze bg-bone text-ink"
                : "border-line text-ink-soft hover:border-line-strong"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-12">
        {visible.length === 0 ? (
          <p className="border-t border-line/70 py-10 text-sm text-ink-soft">
            Nothing matches that filter for these weekends — try another.
          </p>
        ) : (
          visible.map((g) => (
            <WeekendIdeaGroup key={g.weekend.key} group={g} signupHref="/#calendar" />
          ))
        )}
      </div>
    </div>
  );
}
