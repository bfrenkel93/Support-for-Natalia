import type { Slot } from "./supabase";

/**
 * Builds "Add to calendar" data for a slot. Events are all-day:
 * kids weekends span Sat–Sun (2 days), support days are a single day.
 * Returns null when a slot has no date (calendar entries need one).
 */
export type CalendarInfo = {
  title: string;
  details: string;
  location: string;
  startYmd: string; // YYYYMMDD (inclusive)
  endYmd: string; // YYYYMMDD (exclusive, per iCalendar all-day rules)
  googleUrl: string;
  icsPath: string;
};

const SECTION_TITLE: Record<Slot["category"], string> = {
  kids: "Weekend with the kids",
  support: "Support for Natalia",
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function ymdCompact(y: number, m: number, d: number): string {
  return `${y}${pad(m)}${pad(d)}`;
}

/** Add days to a YYYY-MM-DD string using UTC math (no timezone drift). */
function addDaysCompact(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return ymdCompact(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function getCalendarInfo(
  slot: Slot,
  familyAddress: string,
  allergyNote?: string
): CalendarInfo | null {
  if (!slot.event_date) return null;

  const [y, m, d] = slot.event_date.split("-").map(Number);
  if (!y || !m || !d) return null;

  const spanDays = slot.category === "kids" ? 2 : 1;
  const startYmd = ymdCompact(y, m, d);
  const endYmd = addDaysCompact(slot.event_date, spanDays);

  const title = SECTION_TITLE[slot.category];

  const detailParts: string[] = [];
  if (slot.description) detailParts.push(slot.description);
  if (slot.category === "support") {
    detailParts.push("Support for Natalia — a visit, a meal, or some company.");
    if (allergyNote) detailParts.push(allergyNote);
  } else {
    detailParts.push(
      "A weekend spending time with the kids, keeping them connected to Joe's world."
    );
  }
  const details = detailParts.join("\n\n");
  const location = familyAddress || "";

  const googleUrl =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${startYmd}/${endYmd}` +
    `&details=${encodeURIComponent(details)}` +
    (location ? `&location=${encodeURIComponent(location)}` : "");

  return {
    title,
    details,
    location,
    startYmd,
    endYmd,
    googleUrl,
    icsPath: `/api/calendar/${slot.id}`,
  };
}

/** Escape a value for an iCalendar text field. */
function icsEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Build a complete .ics file body for a slot. `stamp` is an ISO timestamp. */
export function buildIcs(info: CalendarInfo, uid: string, stamp: string): string {
  const dtstamp =
    stamp
      .replace(/[-:]/g, "")
      .replace(/\.\d+/, "")
      .replace(/Z?$/, "Z"); // -> YYYYMMDDTHHMMSSZ

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Support for Natalia//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@support-for-natalia`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${info.startYmd}`,
    `DTEND;VALUE=DATE:${info.endYmd}`,
    `SUMMARY:${icsEscape(info.title)}`,
    `DESCRIPTION:${icsEscape(info.details)}`,
    info.location ? `LOCATION:${icsEscape(info.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}
