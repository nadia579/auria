// Cycle maths: periods are derived from the days with flow, predictions from their averages.
import { addDays, daysBetween } from './dates';
import type { AppData } from './storage';

export interface Range {
  start: string;
  end: string;
}

// Groups the days with flow into periods. A one-day gap (forgot to log) stays in the same period
export function periodRanges(days: AppData['days']): Range[] {
  const keys = Object.keys(days)
    .filter((k) => (days[k].flow ?? 0) > 0)
    .sort();
  const ranges: Range[] = [];
  for (const key of keys) {
    const last = ranges[ranges.length - 1];
    if (last && daysBetween(last.end, key) <= 2) {
      last.end = key;
    } else {
      ranges.push({ start: key, end: key });
    }
  }
  return ranges;
}

export interface CycleStats {
  avgCycle: number;
  avgPeriod: number;
  lastStart: string | null;
  cycleLengths: number[];   // last logged cycle lengths, oldest first
  periods: Range[];
}

const MIN_CYCLE = 18;
const MAX_CYCLE = 45;
const SAMPLE = 6;   // how many recent cycles the averages use

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function cycleStats(data: AppData): CycleStats {
  const periods = periodRanges(data.days);
  const { cycleLength, periodLength, lastPeriodStart } = data.settings;

  // Lengths between consecutive starts; very short or long ones are probably missing logs
  const lengths: number[] = [];
  for (let i = 1; i < periods.length; i++) {
    const len = daysBetween(periods[i - 1].start, periods[i].start);
    if (len >= MIN_CYCLE && len <= MAX_CYCLE) lengths.push(len);
  }
  const recent = lengths.slice(-SAMPLE);
  // The current period may still be going on, so it doesn't count for the average length
  const closed = periods.slice(0, -1).slice(-SAMPLE);

  let lastStart = periods.length ? periods[periods.length - 1].start : null;
  if (lastPeriodStart && (!lastStart || lastPeriodStart > lastStart)) lastStart = lastPeriodStart;

  return {
    avgCycle: recent.length ? Math.round(mean(recent)) : cycleLength,
    avgPeriod: closed.length
      ? Math.round(mean(closed.map((r) => daysBetween(r.start, r.end) + 1)))
      : periodLength,
    lastStart,
    cycleLengths: recent,
    periods,
  };
}

// Start days of the next `count` predicted periods
export function predictedStarts(stats: CycleStats, count = 3): string[] {
  if (!stats.lastStart) return [];
  const starts: string[] = [];
  for (let k = 1; k <= count; k++) starts.push(addDays(stats.lastStart, k * stats.avgCycle));
  return starts;
}

export type HeroStatus =
  | { kind: 'unknown' }
  | { kind: 'period'; day: number }
  | { kind: 'cycle'; cycleDay: number; daysToNext: number }
  | { kind: 'late'; daysLate: number };

// What the big circle on the home page says today
export function heroStatus(stats: CycleStats, today: string): HeroStatus {
  const current = stats.periods.find((r) => r.start <= today && today <= r.end);
  if (current) return { kind: 'period', day: daysBetween(current.start, today) + 1 };
  if (!stats.lastStart || stats.lastStart > today) return { kind: 'unknown' };

  const next = addDays(stats.lastStart, stats.avgCycle);
  const daysToNext = daysBetween(today, next);
  if (daysToNext < 0) return { kind: 'late', daysLate: -daysToNext };
  return { kind: 'cycle', cycleDay: daysBetween(stats.lastStart, today) + 1, daysToNext };
}

export interface CalendarMarks {
  period: Set<string>;
  predicted: Set<string>;
  fertile: Set<string>;
  ovulation: Set<string>;
  migraine: Set<string>;
  logged: Set<string>;     // days with symptoms, notes, pain or meds
}

// Everything the calendar needs, computed once per render
export function calendarMarks(data: AppData, today: string, attackDays: string[]): CalendarMarks {
  const stats = cycleStats(data);
  const marks: CalendarMarks = {
    period: new Set(),
    predicted: new Set(),
    fertile: new Set(),
    ovulation: new Set(),
    migraine: new Set(attackDays),
    logged: new Set(),
  };

  for (const [key, day] of Object.entries(data.days)) {
    if ((day.flow ?? 0) > 0) marks.period.add(key);
    if (day.symptoms?.length || day.note?.trim() || day.pain || day.meds?.length) marks.logged.add(key);
  }

  const starts = predictedStarts(stats);
  for (const start of starts) {
    // Predictions only in the future: the past is what you logged
    for (let i = 0; i < stats.avgPeriod; i++) {
      const k = addDays(start, i);
      if (k >= today && !marks.period.has(k)) marks.predicted.add(k);
    }
  }

  // Fertile window only makes sense without hormonal contraception.
  // Ovulation ≈ 14 days before the next period; fertile window = 5 days before it, plus the day after
  if (data.settings.contraception.method === 'none' && stats.lastStart) {
    for (const start of starts) {
      const ovulation = addDays(start, -14);
      marks.ovulation.add(ovulation);
      for (let i = -5; i <= 1; i++) marks.fertile.add(addDays(ovulation, i));
    }
  }
  return marks;
}
