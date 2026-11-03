// Backup (JSON) and calendar reminders (.ics): files the app hands to you
import { addDays, todayKey } from './dates';
import { cycleAnchor, planOf } from './contraception';
import { migrate, type AppData } from './storage';

export function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// --- Backup ----------------------------------------------------------------

export function exportBackup(data: AppData) {
  download(`auria-backup-${todayKey()}.json`, JSON.stringify(data, null, 2), 'application/json');
}

// Throws if the file isn't an Auria backup
export function parseBackup(text: string): AppData {
  const raw = JSON.parse(text);
  if (!raw || typeof raw !== 'object' || !('days' in raw) || !('settings' in raw)) {
    throw new Error('Questo file non è un backup di Auria');
  }
  return migrate(raw);
}

// --- Calendar reminders ----------------------------------------------------

interface Reminder {
  day: string;      // "2026-11-04"
  title: string;
  dailyCount?: number;    // repeat every day for N days (pill)
  forever?: boolean;      // repeat every day with no end (continuous pill)
}

const CYCLES_AHEAD = 13;   // about one year

export function reminders(data: AppData): Reminder[] {
  const settings = data.settings.contraception;
  const plan = planOf(settings);
  const today = todayKey();
  const anchor = cycleAnchor(data, today) ?? settings.startDate;
  if (!plan || !anchor) return [];

  const length = plan.active + plan.pause;
  // First cycle start that isn't in the past
  let start = anchor;
  while (addDays(start, length) <= today) start = addDays(start, length);

  if (settings.method === 'pill' && plan.pause === 0) {
    return [{ day: today, title: 'Prendi la pillola', forever: true }];
  }

  const list: Reminder[] = [];
  for (let c = 0; c < CYCLES_AHEAD; c++) {
    const s = addDays(start, c * length);
    if (settings.method === 'patch') {
      list.push({ day: s, title: 'Metti il cerotto 1' });
      list.push({ day: addDays(s, 7), title: 'Cambia il cerotto: cerotto 2' });
      list.push({ day: addDays(s, 14), title: 'Cambia il cerotto: cerotto 3' });
      list.push({ day: addDays(s, 21), title: 'Togli il cerotto: inizia la pausa' });
    } else if (settings.method === 'ring') {
      list.push({ day: s, title: "Inserisci l'anello" });
      list.push({ day: addDays(s, 21), title: "Togli l'anello: inizia la pausa" });
    } else {
      list.push({ day: s, title: 'Prendi la pillola', dailyCount: plan.active });
    }
  }
  return list.filter((r) => r.day >= today || r.dailyCount);
}

// iCalendar file: Google Calendar, Samsung Calendar and Outlook all import it
export function remindersIcs(data: AppData): string {
  const time = data.settings.contraception.reminderTime.replace(':', '') + '00';
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Auria//IT', 'CALSCALE:GREGORIAN'];

  reminders(data).forEach((r, i) => {
    const date = r.day.replace(/-/g, '');
    lines.push(
      'BEGIN:VEVENT',
      `UID:auria-${date}-${i}@auria`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${date}T${time}`,
      'DURATION:PT10M',
      `SUMMARY:${r.title}`,
    );
    if (r.dailyCount) lines.push(`RRULE:FREQ=DAILY;COUNT=${r.dailyCount}`);
    if (r.forever) lines.push('RRULE:FREQ=DAILY');
    lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${r.title}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
