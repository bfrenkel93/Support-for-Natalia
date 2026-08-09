export type Season = "winter" | "spring" | "summer" | "fall";

export type Weekend = {
  key: string; // YYYY-MM-DD of the Saturday
  saturdayYmd: string;
  sundayYmd: string;
  label: string; // e.g. "September 12–13"
  season: Season;
  index: number; // 0 = the upcoming weekend
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function ymd(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function seasonForMonth(month0: number): Season {
  // month0 is 0-11
  if (month0 === 11 || month0 <= 1) return "winter";
  if (month0 <= 4) return "spring";
  if (month0 <= 7) return "summer";
  return "fall";
}

/** The Saturday on or after `from` (UTC). */
function upcomingSaturday(from: Date): Date {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const day = d.getUTCDay(); // 0 Sun … 6 Sat
  const delta = (6 - day + 7) % 7;
  d.setUTCDate(d.getUTCDate() + delta);
  return d;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Build the next `count` weekends starting from `now` (defaults to today). */
export function upcomingWeekends(count: number, now: Date = new Date()): Weekend[] {
  const firstSat = upcomingSaturday(now);
  const weekends: Weekend[] = [];
  for (let i = 0; i < count; i++) {
    const sat = new Date(firstSat);
    sat.setUTCDate(firstSat.getUTCDate() + i * 7);
    const sun = new Date(sat);
    sun.setUTCDate(sat.getUTCDate() + 1);

    const sameMonth = sat.getUTCMonth() === sun.getUTCMonth();
    const label = sameMonth
      ? `${MONTHS[sat.getUTCMonth()]} ${sat.getUTCDate()}–${sun.getUTCDate()}`
      : `${MONTHS[sat.getUTCMonth()]} ${sat.getUTCDate()} – ${MONTHS[sun.getUTCMonth()]} ${sun.getUTCDate()}`;

    weekends.push({
      key: ymd(sat),
      saturdayYmd: ymd(sat),
      sundayYmd: ymd(sun),
      label,
      season: seasonForMonth(sat.getUTCMonth()),
      index: i,
    });
  }
  return weekends;
}

/** Is a YYYY-MM-DD date the Saturday or Sunday of the given weekend? */
export function dateInWeekend(dateYmd: string, w: Weekend): boolean {
  return dateYmd === w.saturdayYmd || dateYmd === w.sundayYmd;
}
