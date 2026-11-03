// Statistics: cycle summary and the link between migraine and cycle
import { addDays, daysBetween } from './dates';
import { cycleStats } from './cycle';
import { attackDay } from './migraine';
import type { AppData } from './storage';

// The window neurologists call "menstrual migraine": from 2 days before to 3 days after the period starts
export const WINDOW_BEFORE = 2;
export const WINDOW_AFTER = 3;
const WINDOW_SIZE = WINDOW_BEFORE + 1 + WINDOW_AFTER;

export interface MigraineStats {
  total: number;              // attacks with a known cycle position
  inWindow: number;
  share: number;              // inWindow / total
  expectedShare: number;      // share if attacks were spread evenly across the cycle
  byCycleDay: number[];       // index 0 = cycle day 1
  avgIntensity: number;
  topTriggers: { name: string; count: number }[];
  meds: { name: string; full: number; partial: number; none: number }[];
}

export function migraineStats(data: AppData, today: string): MigraineStats {
  const stats = cycleStats(data);
  const starts = stats.periods.map((p) => p.start);
  const recent = data.attacks.filter((a) => daysBetween(attackDay(a), today) <= 365);

  const byCycleDay = new Array(stats.avgCycle).fill(0);
  let total = 0;
  let inWindow = 0;

  for (const attack of recent) {
    const day = attackDay(attack);
    // Distance from the closest period start, before or after
    let best: number | null = null;
    for (const s of starts) {
      const off = daysBetween(s, day);
      if (best === null || Math.abs(off) < Math.abs(best)) best = off;
    }
    if (best === null || Math.abs(best) > stats.avgCycle / 2) continue;
    total++;
    if (best >= -WINDOW_BEFORE && best <= WINDOW_AFTER) inWindow++;

    // Cycle day counted from the last start before the attack
    const previous = starts.filter((s) => s <= day).pop();
    if (previous) {
      const cycleDay = daysBetween(previous, day);
      if (cycleDay < byCycleDay.length) byCycleDay[cycleDay]++;
    }
  }

  const triggerCount = new Map<string, number>();
  const medCount = new Map<string, { full: number; partial: number; none: number }>();
  for (const a of recent) {
    for (const t of a.triggers) triggerCount.set(t, (triggerCount.get(t) ?? 0) + 1);
    for (const m of a.meds) {
      const c = medCount.get(m.name) ?? { full: 0, partial: 0, none: 0 };
      c[m.effect]++;
      medCount.set(m.name, c);
    }
  }

  return {
    total,
    inWindow,
    share: total ? inWindow / total : 0,
    expectedShare: WINDOW_SIZE / stats.avgCycle,
    byCycleDay,
    avgIntensity: recent.length ? recent.reduce((s, a) => s + a.intensity, 0) / recent.length : 0,
    topTriggers: [...triggerCount.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    meds: [...medCount.entries()].map(([name, c]) => ({ name, ...c })),
  };
}

// Attacks in the last 30 days, for the summary card
export function attacksLast30(data: AppData, today: string): number {
  const from = addDays(today, -29);
  return data.attacks.filter((a) => attackDay(a) >= from && attackDay(a) <= today).length;
}
