import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, monthCells } from './dates';
import { calendarMarks, cycleStats, heroStatus, periodRanges } from './cycle';
import { contraceptionStatus } from './contraception';
import { migraineStats } from './stats';
import { emptyData, migrate, type AppData } from './storage';
import { newAttack } from './migraine';
import { parseBackup, reminders } from './files';

// Builds data with flow on the given days
function withPeriods(...ranges: [string, number][]): AppData {
  const data = emptyData();
  for (const [start, len] of ranges) {
    for (let i = 0; i < len; i++) data.days[addDays(start, i)] = { flow: 2 };
  }
  return data;
}

describe('dates', () => {
  it('counts days across the daylight saving change', () => {
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });
  it('October 2026 starts on Thursday', () => {
    const cells = monthCells(2026, 9);
    expect(cells.slice(0, 4)).toEqual([null, null, null, 1]);
    expect(cells.length).toBe(34);
  });
});

describe('cycle', () => {
  it('groups flow days into periods, tolerating a one-day gap', () => {
    const data = withPeriods(['2026-09-01', 3]);
    data.days['2026-09-05'] = { flow: 1 };
    expect(periodRanges(data.days)).toEqual([{ start: '2026-09-01', end: '2026-09-05' }]);
  });

  it('averages the logged cycles', () => {
    const data = withPeriods(['2026-08-01', 5], ['2026-08-31', 4], ['2026-09-30', 5]);
    const stats = cycleStats(data);
    expect(stats.avgCycle).toBe(30);
    expect(stats.avgPeriod).toBe(5); // the last period may still be ongoing: not counted
    expect(stats.lastStart).toBe('2026-09-30');
  });

  it('falls back to the settings without data', () => {
    const data = emptyData();
    data.settings.lastPeriodStart = '2026-10-01';
    expect(cycleStats(data).avgCycle).toBe(28);
    expect(heroStatus(cycleStats(data), '2026-10-10')).toEqual({ kind: 'cycle', cycleDay: 10, daysToNext: 19 });
  });

  it('says how late the period is', () => {
    const data = withPeriods(['2026-09-01', 5]);
    expect(heroStatus(cycleStats(data), '2026-10-01')).toEqual({ kind: 'late', daysLate: 2 });
  });

  it('says which day of the period it is', () => {
    const data = withPeriods(['2026-10-24', 3]);
    expect(heroStatus(cycleStats(data), '2026-10-26')).toEqual({ kind: 'period', day: 3 });
  });

  it('marks predicted period and fertile window', () => {
    const data = withPeriods(['2026-10-01', 5]);
    const marks = calendarMarks(data, '2026-10-10', []);
    expect(marks.predicted.has('2026-10-29')).toBe(true);
    expect(marks.ovulation.has('2026-10-15')).toBe(true);
    expect(marks.fertile.has('2026-10-10')).toBe(true);
  });

  it('hides the fertile window with hormonal contraception', () => {
    const data = withPeriods(['2026-10-01', 5]);
    data.settings.contraception.method = 'patch';
    expect(calendarMarks(data, '2026-10-10', []).fertile.size).toBe(0);
  });
});

describe('contraception', () => {
  const patchData = (startDate: string) => {
    const data = emptyData();
    data.settings.contraception = { ...data.settings.contraception, method: 'patch', startDate };
    return data;
  };

  it('follows the patch cycle from the start date', () => {
    const data = patchData('2026-10-01');
    expect(contraceptionStatus(data, '2026-10-01')?.label).toBe('Cerotto 1 di 3');
    expect(contraceptionStatus(data, '2026-10-08')?.label).toBe('Cerotto 2 di 3');
    expect(contraceptionStatus(data, '2026-10-27')?.label).toBe('Pausa: giorno 6 di 7');
    expect(contraceptionStatus(data, '2026-10-29')?.label).toBe('Cerotto 1 di 3');
  });

  it('recalibrates on what you log', () => {
    // The settings say 3 October, but the patch was really removed on 22 October
    const data = patchData('2026-10-03');
    expect(contraceptionStatus(data, '2026-10-27')?.label).toBe('Pausa: giorno 4 di 7');
    data.days['2026-10-22'] = { contraception: 'removed' };
    expect(contraceptionStatus(data, '2026-10-27')?.label).toBe('Pausa: giorno 6 di 7');
  });

  it('gives hints on change days', () => {
    const data = patchData('2026-10-01');
    expect(contraceptionStatus(data, '2026-10-08')?.hint).toBe('Oggi metti il cerotto 2');
    expect(contraceptionStatus(data, '2026-10-22')?.hint).toBe('Oggi togli il cerotto');
  });

  it('handles the 24+4 pill', () => {
    const data = emptyData();
    data.settings.contraception = { ...data.settings.contraception, method: 'pill', pillSchema: '24-4', startDate: '2026-10-01' };
    expect(contraceptionStatus(data, '2026-10-24')?.label).toBe('Pillola 24 di 24');
    expect(contraceptionStatus(data, '2026-10-25')?.label).toBe('Pausa: giorno 1 di 4');
  });

  it('builds patch reminders', () => {
    const data = patchData('2026-10-01');
    const list = reminders(data);
    expect(list.length).toBeGreaterThan(40);
    expect(list.every((r) => r.title.length > 0)).toBe(true);
  });
});

describe('migraine stats', () => {
  it('counts attacks in the menstrual window', () => {
    const data = withPeriods(['2026-08-01', 5], ['2026-08-29', 5], ['2026-09-26', 5]);
    data.attacks = [
      newAttack('2026-08-02T10:00'),  // day 2 → in window
      newAttack('2026-08-27T10:00'),  // 2 days before → in window
      newAttack('2026-09-12T10:00'),  // middle of the cycle
    ];
    const stats = migraineStats(data, '2026-10-01');
    expect(stats.total).toBe(3);
    expect(stats.inWindow).toBe(2);
    expect(stats.byCycleDay[1]).toBe(1);
  });
});

describe('storage', () => {
  it('migrates version 1 data', () => {
    const v1 = {
      version: 1,
      cycles: [],
      days: { '2026-10-25': { flow: 3, symptoms: ['cramps'], contraception: 'patch1' } },
      attacks: [{ id: 'a1', start: '2026-10-20T14:30', end: null, intensity: 7 }],
      settings: { cycleLength: 30, periodLength: 5, lock: { enabled: false }, contraception: { method: 'patch', startDate: '2026-10-21' } },
    };
    const data = migrate(v1);
    expect(data.version).toBe(2);
    expect(data.days['2026-10-25'].flow).toBe(3);
    expect(data.settings.cycleLength).toBe(30);
    expect(data.settings.contraception.pillSchema).toBe('21-7');
    expect(data.attacks[0].triggers).toEqual([]);
  });

  it('rejects files that are not a backup', () => {
    expect(() => parseBackup('{"hello": 1}')).toThrow();
  });
});
