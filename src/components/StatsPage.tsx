import { useMemo } from 'react';
import { todayKey } from '../lib/dates';
import { cycleStats } from '../lib/cycle';
import { migraineStats, WINDOW_AFTER, WINDOW_BEFORE } from '../lib/stats';
import type { AppData } from '../lib/storage';
import ui from './ui.module.css';
import styles from './StatsPage.module.css';

const pct = (x: number) => `${Math.round(x * 100)}%`;

export default function StatsPage({ data }: { data: AppData }) {
  const today = todayKey();
  const cycle = useMemo(() => cycleStats(data), [data]);
  const migraine = useMemo(() => migraineStats(data, today), [data, today]);
  const fromData = cycle.cycleLengths.length > 0;
  const maxBar = Math.max(1, ...migraine.byCycleDay);

  return (
    <div className={ui.page}>
      <header className={ui.pageHeader}>
        <h1 className={ui.pageTitle}>Statistiche</h1>
      </header>

      <section className={ui.section}>
        <h2 className={`${ui.sectionTitle} ${styles.spaced}`}>Il tuo ciclo</h2>
        <div className={styles.tiles}>
          <div className={styles.tile}>
            <strong>{cycle.avgCycle}</strong>
            <span>giorni di ciclo, in media</span>
          </div>
          <div className={styles.tile}>
            <strong>{cycle.avgPeriod}</strong>
            <span>giorni di mestruazione</span>
          </div>
        </div>
        <p className={`${ui.hint} ${styles.note}`}>
          {fromData
            ? `Calcolato sugli ultimi ${cycle.cycleLengths.length} cicli registrati.`
            : 'Per ora sono i valori delle impostazioni: dopo due cicli registrati, li calcolo dai tuoi dati.'}
        </p>

        {fromData && (
          <div className={styles.history} aria-label="Durata degli ultimi cicli">
            {cycle.cycleLengths.map((len, i) => (
              <div key={i} className={styles.historyBar}>
                <span style={{ height: `${(len / 45) * 100}%` }} />
                <small>{len}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      {data.settings.tracksMigraine && (
        <section className={ui.section}>
          <h2 className={`${ui.sectionTitle} ${styles.spaced}`}>Emicrania e ciclo</h2>

          {migraine.total === 0 ? (
            <p className={ui.hint}>
              Servono attacchi registrati e almeno un ciclo segnato con le gocce per vedere il collegamento.
            </p>
          ) : (
            <>
              <p className={styles.headline}>{pct(migraine.share)}</p>
              <p className={styles.lead}>
                degli attacchi ({migraine.inWindow} su {migraine.total}) cade tra {WINDOW_BEFORE} giorni prima e{' '}
                {WINDOW_AFTER} giorni dopo l'inizio del ciclo.
              </p>
              <p className={`${ui.hint} ${styles.note}`}>
                Se gli attacchi fossero distribuiti a caso, in quella finestra ne cadrebbe circa il{' '}
                {pct(migraine.expectedShare)}.
                {migraine.total >= 6 && migraine.share > migraine.expectedShare * 1.5 &&
                  ' La differenza è marcata: vale la pena parlarne con il tuo neurologo o ginecologo.'}
                {migraine.total < 6 && ' Con pochi attacchi il dato è ancora poco affidabile.'}
              </p>

              <h3 className={styles.chartTitle}>Attacchi per giorno del ciclo</h3>
              <div className={styles.chart} role="img" aria-label="Attacchi per giorno del ciclo">
                {migraine.byCycleDay.map((n, i) => {
                  // days 1-4 and the last 2: the menstrual window
                  const inWindow = i <= WINDOW_AFTER || i >= migraine.byCycleDay.length - WINDOW_BEFORE;
                  return (
                    <div key={i} className={inWindow ? `${styles.col} ${styles.colWindow}` : styles.col}>
                      <span style={{ height: `${(n / maxBar) * 100}%` }} title={`Giorno ${i + 1}: ${n}`} />
                    </div>
                  );
                })}
              </div>
              <div className={styles.axis}>
                <span>giorno 1</span>
                <span>{migraine.byCycleDay.length}</span>
              </div>
            </>
          )}
        </section>
      )}

      {data.settings.tracksMigraine && migraine.topTriggers.length > 0 && (
        <section className={ui.section}>
          <h2 className={`${ui.sectionTitle} ${styles.spaced}`}>Cause più frequenti</h2>
          <ul className={styles.list}>
            {migraine.topTriggers.map((t) => (
              <li key={t.name}>
                <span>{t.name}</span>
                <span className={styles.track}>
                  <span style={{ width: `${(t.count / migraine.topTriggers[0].count) * 100}%` }} />
                </span>
                <b>{t.count}</b>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.settings.tracksMigraine && migraine.meds.length > 0 && (
        <section className={ui.section}>
          <h2 className={`${ui.sectionTitle} ${styles.spaced}`}>Quanto funzionano i farmaci</h2>
          {migraine.meds.map((m) => {
            const total = m.full + m.partial + m.none;
            return (
              <div key={m.name} className={styles.med}>
                <div className={styles.medHead}>
                  <strong>{m.name}</strong>
                  <span>{total} {total === 1 ? 'volta' : 'volte'}</span>
                </div>
                <div className={styles.stack}>
                  <span className={styles.full} style={{ flex: m.full }} />
                  <span className={styles.partial} style={{ flex: m.partial }} />
                  <span className={styles.none} style={{ flex: m.none }} />
                </div>
                <small className={ui.hint}>
                  Risolto {m.full} · Parziale {m.partial} · Nessun effetto {m.none}
                </small>
              </div>
            );
          })}
        </section>
      )}

      <p className={styles.disclaimer}>
        Le previsioni sono stime basate sui tuoi dati: non sono un metodo contraccettivo né una diagnosi.
      </p>
    </div>
  );
}
