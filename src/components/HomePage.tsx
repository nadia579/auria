import { useMemo } from 'react';
import { todayKey } from '../lib/dates';
import { calendarMarks, cycleStats, heroStatus, type HeroStatus } from '../lib/cycle';
import { contraceptionStatus } from '../lib/contraception';
import { attackDays } from '../lib/migraine';
import type { AppData } from '../lib/storage';
import Calendar from './Calendar';
import ui from './ui.module.css';
import styles from './HomePage.module.css';

interface HomePageProps {
  data: AppData;
  onOpenDay: (key: string) => void;
}

export default function HomePage({ data, onOpenDay }: HomePageProps) {
  const today = todayKey();

  // useMemo: recompute only when the data changes, not at every render
  const stats = useMemo(() => cycleStats(data), [data]);
  const marks = useMemo(() => calendarMarks(data, today, data.attacks.flatMap(attackDays)), [data, today]);
  const status = heroStatus(stats, today);
  const pill = contraceptionStatus(data, today);

  return (
    <div className={ui.page}>
      <h1 className={styles.wordmark}>Auria</h1>

      <section className={styles.hero} aria-label="Oggi">
        <Ring status={status} avgCycle={stats.avgCycle} avgPeriod={stats.avgPeriod} />
        {pill && (
          <p className={styles.contraception}>
            <strong>{pill.label}</strong>
            {pill.hint && <span>{pill.hint}</span>}
          </p>
        )}
        <button className={styles.heroButton} onClick={() => onOpenDay(today)}>
          {status.kind === 'period' ? 'Registra oggi' : 'Registra il ciclo'}
        </button>
      </section>

      <Calendar marks={marks} contraceptionOn={data.settings.contraception.method !== 'none'} onSelectDay={onOpenDay} />
    </div>
  );
}

// The big circle: a ring that fills up along the cycle, with the main number in the middle
function Ring({ status, avgCycle, avgPeriod }: { status: HeroStatus; avgCycle: number; avgPeriod: number }) {
  let big = '—';
  let label = 'Segna il primo giorno del ciclo per iniziare';
  let sub = '';
  let progress = 0;
  let period = false;

  switch (status.kind) {
    case 'period':
      big = String(status.day);
      label = 'giorno di mestruazione';
      sub = `Di solito dura ${avgPeriod} giorni`;
      progress = Math.min(status.day / avgPeriod, 1);
      period = true;
      break;
    case 'cycle':
      if (status.daysToNext === 0) {
        big = 'Oggi';
        label = 'potrebbe arrivare il ciclo';
      } else {
        big = String(status.daysToNext);
        label = status.daysToNext === 1 ? 'giorno al ciclo' : 'giorni al ciclo';
      }
      sub = `Giorno ${status.cycleDay} di ${avgCycle}`;
      progress = Math.min(status.cycleDay / avgCycle, 1);
      break;
    case 'late':
      big = String(status.daysLate);
      label = status.daysLate === 1 ? 'giorno di ritardo' : 'giorni di ritardo';
      sub = 'Segna il primo giorno quando arriva';
      progress = 1;
      break;
  }

  const r = 92;
  const circumference = 2 * Math.PI * r;
  const angle = progress * 2 * Math.PI - Math.PI / 2;

  return (
    <div className={styles.ring}>
      <svg viewBox="0 0 220 220" aria-hidden="true">
        <circle cx="110" cy="110" r={r} className={styles.track} />
        <circle
          cx="110"
          cy="110"
          r={r}
          className={period ? `${styles.progress} ${styles.progressPeriod}` : styles.progress}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform="rotate(-90 110 110)"
        />
        {progress > 0 && (
          <circle cx={110 + r * Math.cos(angle)} cy={110 + r * Math.sin(angle)} r="7" className={styles.knob} />
        )}
      </svg>
      <div className={styles.ringText}>
        <span className={big.length > 3 ? `${styles.big} ${styles.bigWord}` : styles.big}>{big}</span>
        <span className={styles.label}>{label}</span>
        {sub && <span className={styles.sub}>{sub}</span>}
      </div>
    </div>
  );
}
