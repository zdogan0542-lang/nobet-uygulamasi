/**
 * Date helpers that operate on calendar dates (YYYY-MM-DD) and use UTC
 * internally to avoid DST / timezone off-by-one bugs.
 *
 * The cycle math fix: advancing a duty by `cycleDays` must add the FULL
 * duration. Oct 20 + 7 days = Oct 27. The previous off-by-one treated the
 * start day as "day 1" and added (cycleDays - 1), landing on Oct 26 — that
 * is wrong. We add the exact duration.
 */

export function toISODate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): Date {
  // Parse at noon UTC to avoid any boundary drift.
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/**
 * Add exactly `days` calendar days to an ISO date and return the new ISO date.
 * Oct 20 + 7 -> Oct 27.
 */
export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toISODate(date);
}

/**
 * Advance a duty cycle: the new start date is the current start date plus
 * the full cycle length in days.
 */
export function advanceCycle(
  currentStartISO: string,
  cycleDays: number,
): string {
  return addDays(currentStartISO, cycleDays);
}

/**
 * Human-friendly Turkish date label, e.g. "20 Eki 2026".
 */
const TR_MONTHS = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

const TR_WEEKDAYS = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];

export function formatTR(iso: string): string {
  const date = parseISODate(iso);
  return `${date.getUTCDate()} ${TR_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Date with weekday, e.g. "27 Ekim 2026, Salı" */
export function formatTRWithWeekday(iso: string): string {
  const date = parseISODate(iso);
  return `${formatTR(iso)}, ${TR_WEEKDAYS[date.getUTCDay()]}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}
