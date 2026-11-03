import { useState } from 'react';
import ChevronLeft from '~icons/material-symbols/chevron-left-rounded';
import ChevronRight from '~icons/material-symbols/chevron-right-rounded';
import { dateKey, monthCells, monthTitle, todayKey } from '../lib/dates';
import type { CalendarMarks } from '../lib/cycle';
import ui from './ui.module.css';
import styles from './Calendar.module.css';

const WEEKDAYS = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];

interface CalendarProps {
  marks: CalendarMarks;
  contraceptionOn: boolean;   // hides the fertile window from the legend
  onSelectDay: (key: string) => void;
}

// Classes that make neighbouring days of the same kind join into a band:
// rounded on the left where the band starts, on the right where it ends.
// A band also breaks at the end of each row (Sunday) and restarts on Monday
function bandClasses(set: Set<string>, prev: string, next: string, column: number) {
  const classes: string[] = [];
  if (!set.has(prev) || column === 0) classes.push(styles.bandStart);
  if (!set.has(next) || column === 6) classes.push(styles.bandEnd);
  return classes;
}

export default function Calendar({ marks, contraceptionOn, onSelectDay }: CalendarProps) {
  const now = new Date();
  const today = todayKey();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  function move(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  return (
    <section className={ui.section}>
      <div className={styles.header}>
        <button className={ui.iconButton} onClick={() => move(-1)} aria-label="Mese precedente">
          <ChevronLeft />
        </button>
        <h2 className={styles.title}>{monthTitle(year, month)}</h2>
        <button className={ui.iconButton} onClick={() => move(1)} aria-label="Mese successivo">
          <ChevronRight />
        </button>
      </div>
      {!isCurrentMonth && (
        <button className={styles.todayLink} onClick={() => move((now.getFullYear() - year) * 12 + now.getMonth() - month)}>
          Torna a oggi
        </button>
      )}

      <div className={styles.grid}>
        {WEEKDAYS.map((w) => (
          <div key={w} className={styles.weekday}>{w}</div>
        ))}

        {monthCells(year, month).map((day, index) => {
          if (day === null) return <div key={`blank-${index}`} />;

          const key = dateKey(year, month, day);
          const prev = dateKey(year, month, day - 1);
          const next = dateKey(year, month, day + 1);
          const column = index % 7;

          // One kind of band per day, in order of importance
          const classes = [styles.day];
          if (marks.period.has(key)) {
            classes.push(styles.period, ...bandClasses(marks.period, prev, next, column));
          } else if (marks.predicted.has(key)) {
            classes.push(styles.predicted, ...bandClasses(marks.predicted, prev, next, column));
          } else if (marks.fertile.has(key)) {
            classes.push(styles.fertile, ...bandClasses(marks.fertile, prev, next, column));
          }
          if (key === today) classes.push(styles.today);
          if (marks.ovulation.has(key)) classes.push(styles.ovulation);
          if (key > today) classes.push(styles.future);

          const labels = [
            marks.period.has(key) && 'mestruazione',
            marks.predicted.has(key) && 'ciclo previsto',
            marks.ovulation.has(key) ? 'ovulazione prevista' : marks.fertile.has(key) && 'giorno fertile',
            marks.migraine.has(key) && 'emicrania',
          ].filter(Boolean);

          return (
            <button
              key={key}
              className={classes.join(' ')}
              onClick={() => onSelectDay(key)}
              aria-label={`${day}${labels.length ? ', ' + labels.join(', ') : ''}`}
            >
              <span className={styles.number}>{day}</span>
              <span className={styles.dots} aria-hidden="true">
                {marks.migraine.has(key) && <i className={styles.dotMigraine} />}
                {marks.logged.has(key) && <i className={styles.dotLogged} />}
              </span>
            </button>
          );
        })}
      </div>

      <ul className={styles.legend}>
        <li><i className={styles.swPeriod} />Mestruazione</li>
        <li><i className={styles.swPredicted} />Previsione</li>
        {!contraceptionOn && <li><i className={styles.swFertile} />Giorni fertili</li>}
        <li><i className={styles.dotMigraine} />Emicrania</li>
        <li><i className={styles.dotLogged} />Note e sintomi</li>
      </ul>
    </section>
  );
}
