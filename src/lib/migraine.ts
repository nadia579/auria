// Migraine diary: option lists and helpers on attacks
import { addDays, daysBetween, nowLocal } from './dates';
import { newId, type Attack } from './storage';

export const LOCATIONS = [
  'Tempia sinistra', 'Tempia destra', 'Fronte', 'Dietro gli occhi',
  'Nuca', 'Tutta la testa', 'Collo',
];

export const ATTACK_SYMPTOMS = [
  'Nausea', 'Vomito', 'Luce fastidiosa', 'Rumori fastidiosi', 'Odori fastidiosi',
  'Vertigini', 'Dolore pulsante', 'Formicolii', 'Difficoltà a concentrarsi',
];

export const TRIGGERS = [
  'Dormito poco', 'Dormito troppo', 'Stress', 'Ciclo', 'Saltato un pasto',
  'Poca acqua', 'Alcol', 'Caffeina', 'Schermi', 'Meteo', 'Viaggio', 'Sport',
];

export const EFFECT_LABELS = { none: 'Nessun effetto', partial: 'Parziale', full: 'Risolto' } as const;

export function newAttack(start = nowLocal()): Attack {
  return {
    id: newId(),
    start,
    end: null,
    intensity: 5,
    aura: false,
    locations: [],
    symptoms: [],
    triggers: [],
    meds: [],
    note: '',
  };
}

export const attackDay = (a: Attack) => a.start.slice(0, 10);

// Every day an attack touches (at most a week, in case the end was never set)
export function attackDays(a: Attack): string[] {
  const first = attackDay(a);
  const last = a.end ? a.end.slice(0, 10) : first;
  const n = Math.min(Math.max(daysBetween(first, last), 0), 6);
  return Array.from({ length: n + 1 }, (_, i) => addDays(first, i));
}

// "3 h 20 min", or "in corso"
export function durationLabel(a: Attack): string {
  if (!a.end) return 'in corso';
  const minutes = Math.round((new Date(a.end).getTime() - new Date(a.start).getTime()) / 60000);
  if (minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export const sortAttacks = (attacks: Attack[]) => [...attacks].sort((a, b) => b.start.localeCompare(a.start));
