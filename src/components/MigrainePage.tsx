import AddIcon from '~icons/material-symbols/add-rounded';
import { formatShort, todayKey } from '../lib/dates';
import { attackDay, durationLabel, sortAttacks } from '../lib/migraine';
import { attacksLast30 } from '../lib/stats';
import type { AppData } from '../lib/storage';
import ui from './ui.module.css';
import styles from './MigrainePage.module.css';

interface MigrainePageProps {
  data: AppData;
  onOpen: (id: string) => void;
  onNew: () => void;
}

export default function MigrainePage({ data, onOpen, onNew }: MigrainePageProps) {
  const attacks = sortAttacks(data.attacks);
  const ongoing = attacks.find((a) => a.end === null);

  // Group by month: "ottobre 2026" → attacks
  const groups = new Map<string, typeof attacks>();
  for (const a of attacks) {
    const month = new Date(attackDay(a) + 'T00:00').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    groups.set(month, [...(groups.get(month) ?? []), a]);
  }

  return (
    <div className={ui.page}>
      <header className={ui.pageHeader}>
        <h1 className={ui.pageTitle}>Emicrania</h1>
      </header>

      <section className={styles.summary}>
        <div>
          <strong>{attacksLast30(data, todayKey())}</strong>
          <span>attacchi negli ultimi 30 giorni</span>
        </div>
        <button className={ui.button} onClick={ongoing ? () => onOpen(ongoing.id) : onNew}>
          {ongoing ? 'Apri attacco in corso' : <><AddIcon aria-hidden="true" /> Nuovo attacco</>}
        </button>
      </section>

      {attacks.length === 0 && (
        <div className={ui.empty}>
          <p>Nessun attacco registrato. Quando arriva, tocca il + e completa i dettagli con calma dopo.</p>
        </div>
      )}

      {[...groups.entries()].map(([month, list]) => (
        <section key={month} className={styles.group}>
          <h2 className={styles.month}>{month}</h2>
          {list.map((a) => (
            <button key={a.id} className={styles.item} onClick={() => onOpen(a.id)}>
              <span className={styles.level} style={{ opacity: 0.45 + a.intensity / 18 }}>{a.intensity}</span>
              <span className={styles.text}>
                <strong>{formatShort(attackDay(a))}, ore {a.start.slice(11, 16)}</strong>
                <small>
                  {durationLabel(a)}
                  {a.aura && ' · aura'}
                  {a.triggers.length > 0 && ` · ${a.triggers.slice(0, 2).join(', ')}`}
                </small>
              </span>
              {a.end === null && <span className={styles.ongoing}>in corso</span>}
            </button>
          ))}
        </section>
      ))}
    </div>
  );
}
