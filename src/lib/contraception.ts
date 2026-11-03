// Contraception: where you are in the cycle of patch, ring or pill.
// The app starts from the start date in the settings, then RECALIBRATES on what you log:
// tapping "Cerotto 2" on a day means that day is day 7 of a cycle, whatever the settings said.
import { addDays, daysBetween } from './dates';
import type { AppData, ContraceptionEvent, ContraceptionSettings } from './storage';

interface Plan {
  active: number;   // days with patch / ring / active pills
  pause: number;    // days of break (0 = continuous)
}

export function planOf(settings: ContraceptionSettings): Plan | null {
  switch (settings.method) {
    case 'patch':
    case 'ring':
      return { active: 21, pause: 7 };
    case 'pill':
      if (settings.pillSchema === '24-4') return { active: 24, pause: 4 };
      if (settings.pillSchema === 'continuous') return { active: 28, pause: 0 };
      return { active: 21, pause: 7 };
    default:
      return null;
  }
}

// Logging this event on a day means the cycle started N days before
const EVENT_OFFSET: Partial<Record<ContraceptionEvent, number>> = {
  patch1: 0,
  patch2: 7,
  patch3: 14,
  removed: 21,
  ringIn: 0,
  ringOut: 21,
};

// First day of the cycle that contains dayKey, or null if unknown
export function cycleAnchor(data: AppData, dayKey: string): string | null {
  const settings = data.settings.contraception;
  let bestDay: string | null = null;   // the most recent reference day ≤ dayKey
  let anchor: string | null = null;

  if (settings.startDate && settings.startDate <= dayKey) {
    bestDay = settings.startDate;
    anchor = settings.startDate;
  }
  for (const [key, day] of Object.entries(data.days)) {
    const offset = day.contraception ? EVENT_OFFSET[day.contraception] : undefined;
    if (offset === undefined || key > dayKey) continue;
    if (bestDay === null || key > bestDay) {
      bestDay = key;
      anchor = addDays(key, -offset);
    }
  }
  return anchor;
}

export interface ContraceptionStatus {
  label: string;          // "Cerotto 2 di 3", "Pausa: giorno 4 di 7"
  hint: string | null;    // "Oggi cambia il cerotto", null on ordinary days
  dayInCycle: number;     // 0-based
  inPause: boolean;
}

export function contraceptionStatus(data: AppData, dayKey: string): ContraceptionStatus | null {
  const settings = data.settings.contraception;
  const plan = planOf(settings);
  const anchor = cycleAnchor(data, dayKey);
  if (!plan || !anchor) return null;

  const length = plan.active + plan.pause;
  const dayInCycle = daysBetween(anchor, dayKey) % length;
  const inPause = dayInCycle >= plan.active;
  const pauseDay = dayInCycle - plan.active + 1;

  if (inPause) {
    let hint: string | null = null;
    if (pauseDay === 1 && settings.method === 'patch') hint = 'Oggi togli il cerotto';
    if (pauseDay === 1 && settings.method === 'ring') hint = "Oggi togli l'anello";
    if (pauseDay === plan.pause) hint = nextStartHint(settings.method);
    return { label: `Pausa: giorno ${pauseDay} di ${plan.pause}`, hint, dayInCycle, inPause };
  }

  switch (settings.method) {
    case 'patch': {
      const week = Math.floor(dayInCycle / 7) + 1;
      const hint = dayInCycle % 7 === 0 ? `Oggi metti il cerotto ${week}` : null;
      return { label: `Cerotto ${week} di 3`, hint, dayInCycle, inPause };
    }
    case 'ring': {
      const hint = dayInCycle === 0 ? "Oggi inserisci l'anello" : null;
      return { label: `Anello: giorno ${dayInCycle + 1} di 21`, hint, dayInCycle, inPause };
    }
    default:
      return { label: `Pillola ${dayInCycle + 1} di ${plan.active}`, hint: null, dayInCycle, inPause };
  }
}

function nextStartHint(method: ContraceptionSettings['method']): string {
  if (method === 'patch') return 'Domani metti il cerotto nuovo';
  if (method === 'ring') return "Domani inserisci l'anello nuovo";
  return 'Domani inizi la confezione nuova';
}
