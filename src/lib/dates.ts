// Date helpers. Days are always handled as keys like "2026-10-25" (local time, no hours):
// they sort correctly as strings and are the keys of data.days.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// (2026, 9, 25) → "2026-10-25". Month is 0-based, like in Date
export function dateKey(year: number, month: number, day: number): string {
  const d = new Date(year, month, day); // also normalises day 0, day 32...
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function keyOf(date: Date): string {
  return dateKey(date.getFullYear(), date.getMonth(), date.getDate());
}

export function todayKey(): string {
  return keyOf(new Date());
}

// "2026-10-25" → Date at local midnight
export function parseKey(key: string): Date {
  return new Date(key + 'T00:00');
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key);
  return dateKey(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

// Days from a to b. Rounded because of daylight saving: some days last 23 or 25 hours
export function daysBetween(a: string, b: string): number {
  return Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / MS_PER_DAY);
}

// Cells of the month grid starting on Monday: nulls before day 1, then day numbers.
// October 2026 → [null, null, null, 1, 2, ..., 31]
export function monthCells(year: number, month: number): (number | null)[] {
  const blanks = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < blanks; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  return cells;
}

// "domenica 25 ottobre"
export function formatLong(key: string): string {
  return parseKey(key).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
}

// "25 ott"
export function formatShort(key: string): string {
  return parseKey(key).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

export function monthTitle(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
}

// "2026-10-20T14:30" for the current moment (local time), the format of <input type="datetime-local">
export function nowLocal(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${keyOf(d)}T${hh}:${mi}`;
}
