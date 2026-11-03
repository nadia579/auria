// Data model and persistence in localStorage.
// Everything the app knows lives in ONE object (AppData), saved as JSON under STORAGE_KEY.

export type ContraceptionMethod = 'none' | 'patch' | 'pill' | 'ring';
export type PillSchema = '21-7' | '24-4' | 'continuous';

// What you can log on a day for contraception
export type ContraceptionEvent =
  | 'patch1' | 'patch2' | 'patch3' | 'removed'   // patch
  | 'pillTaken' | 'pillMissed'                    // pill
  | 'ringIn' | 'ringOut';                         // ring

export interface ContraceptionSettings {
  method: ContraceptionMethod;
  startDate: string | null;   // first day of a cycle: first patch, first pill of a pack, ring inserted
  pillSchema: PillSchema;
  reminderTime: string;       // "21:00", used for calendar reminders
}

// One day of the calendar. Every field is optional: a day only has what you filled in
export interface DayData {
  flow?: number;                        // 0-4 drops
  symptoms?: string[];                  // symptom ids, e.g. ['cramps', 'fatigue']
  pain?: number;                        // 1-5
  meds?: string[];                      // medicines taken for the cycle
  note?: string;
  contraception?: ContraceptionEvent;
}

export type MedEffect = 'none' | 'partial' | 'full';

export interface AttackMed {
  name: string;
  time: string;          // "15:00", may be empty
  effect: MedEffect;
}

// One migraine attack
export interface Attack {
  id: string;
  start: string;         // "2026-10-20T14:30"
  end: string | null;    // null while it's still going on
  intensity: number;     // 1-10
  aura: boolean;
  locations: string[];
  symptoms: string[];
  triggers: string[];
  meds: AttackMed[];
  note: string;
}

export interface LockSettings {
  enabled: boolean;
  pinHash: string | null;
  salt: string | null;
  credentialId: string | null;   // fingerprint (WebAuthn) credential, if set up
}

export interface Settings {
  onboarded: boolean;            // false until the first-run questions are answered
  cycleLength: number;           // used until there are enough logged cycles
  periodLength: number;
  lastPeriodStart: string | null;
  tracksMigraine: boolean;
  contraception: ContraceptionSettings;
  lock: LockSettings;
  cycleMeds: string[];           // your list of medicines for the cycle
  migraineMeds: string[];        // your list of medicines for migraine
}

export interface AppData {
  version: number;
  days: Record<string, DayData>;  // map: date key ("2026-10-25") → day data
  attacks: Attack[];
  settings: Settings;
}

// Short unique id. Not crypto.randomUUID(): that only exists on HTTPS,
// and during development the phone opens the app over plain http
export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const DATA_VERSION = 2;
const STORAGE_KEY = 'auria.data';

export function emptyData(): AppData {
  return {
    version: DATA_VERSION,
    days: {},
    attacks: [],
    settings: {
      onboarded: false,
      cycleLength: 28,
      periodLength: 5,
      lastPeriodStart: null,
      tracksMigraine: true,
      contraception: { method: 'none', startDate: null, pillSchema: '21-7', reminderTime: '21:00' },
      lock: { enabled: false, pinHash: null, salt: null, credentialId: null },
      cycleMeds: [],
      migraineMeds: [],
    },
  };
}

// Brings data of any older version up to the current shape.
// Strategy: start from the defaults and lay the saved values over them,
// so fields added after the data was saved get their default value.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrate(raw: any): AppData {
  const d = emptyData();
  if (!raw || typeof raw !== 'object') return d;

  const settings = raw.settings ?? {};
  return {
    version: DATA_VERSION,
    days: raw.days && typeof raw.days === 'object' ? raw.days : {},
    attacks: Array.isArray(raw.attacks) ? raw.attacks.map(normalizeAttack) : [],
    settings: {
      ...d.settings,
      ...settings,
      contraception: { ...d.settings.contraception, ...settings.contraception },
      lock: { ...d.settings.lock, ...settings.lock },
    },
  };
}

// Version 1 attacks only had id, start, end, intensity and note
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAttack(a: any): Attack {
  return {
    id: String(a.id ?? newId()),
    start: a.start,
    end: a.end ?? null,
    intensity: a.intensity ?? 5,
    aura: a.aura ?? false,
    locations: a.locations ?? [],
    symptoms: a.symptoms ?? [],
    triggers: a.triggers ?? [],
    meds: a.meds ?? [],
    note: a.note ?? '',
  };
}

export function loadData(): AppData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? emptyData() : migrate(JSON.parse(saved));
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
