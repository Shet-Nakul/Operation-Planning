const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Converts a week label such as "Nov 23 - Nov 29, 2026" (or "Dec 28 - Jan 03, 2027")
 * into the seven ISO dates Mon..Sun. The year belongs to the end date, so the
 * start is derived by stepping back six days.
 */
export function weekDatesFromRange(rangeLabel: string): string[] {
  const match = rangeLabel.match(/-\s*([A-Z][a-z]{2})\s+(\d{1,2}),\s*(\d{4})/);
  if (!match) throw new Error(`Unrecognised week range: "${rangeLabel}"`);
  const [, mon, day, year] = match;
  const end = new Date(Date.UTC(Number(year), MONTHS.indexOf(mon), Number(day)));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - (6 - i));
    return toIsoDate(d);
  });
}

/** "2026-11-25" -> "November 2026" (label used by the Employee Calendar). */
export function monthLabel(isoDate: string): string {
  const [y, m] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
