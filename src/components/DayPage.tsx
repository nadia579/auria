import ArrowBack from '~icons/material-symbols/arrow-back-rounded';
import ChevronLeft from '~icons/material-symbols/chevron-left-rounded';
import ChevronRight from '~icons/material-symbols/chevron-right-rounded';
import AddIcon from '~icons/material-symbols/add-rounded';
import { addDays, formatLong, todayKey } from '../lib/dates';
import { contraceptionStatus } from '../lib/contraception';
import { attackDays, durationLabel } from '../lib/migraine';
import type { AppData, DayData, Settings } from '../lib/storage';
import FlowDrops from './FlowDrops';
import ContraceptionPicker from './ContraceptionPicker';
import Symptoms from './Symptoms';
import PainScale from './PainScale';
import ChipPicker from './ChipPicker';
import ui from './ui.module.css';
import styles from './DayPage.module.css';

interface DayPageProps {
  data: AppData;
  dayKey: string;
  onChange: (changes: Partial<DayData>) => void;
  onSettingsChange: (changes: Partial<Settings>) => void;
  onOpenAttack: (id: string) => void;
  onNewAttack: () => void;
  onMove: (key: string) => void;   // go to the previous / next day
  onBack: () => void;
}

export default function DayPage({
  data, dayKey, onChange, onSettingsChange, onOpenAttack, onNewAttack, onMove, onBack,
}: DayPageProps) {
  const day = data.days[dayKey] ?? {};
  const { settings } = data;
  const status = contraceptionStatus(data, dayKey);
  const attacks = data.attacks.filter((a) => attackDays(a).includes(dayKey));
  const isToday = dayKey === todayKey();

  return (
    <div className={ui.page}>
      <header className={ui.pageHeader}>
        <button className={ui.iconButton} onClick={onBack} aria-label="Indietro">
          <ArrowBack />
        </button>
        <h1 className={ui.pageTitle}>
          {formatLong(dayKey)}
          {isToday && <span className={styles.todayTag}>oggi</span>}
        </h1>
        <button className={ui.iconButton} onClick={() => onMove(addDays(dayKey, -1))} aria-label="Giorno precedente">
          <ChevronLeft />
        </button>
        <button className={ui.iconButton} onClick={() => onMove(addDays(dayKey, 1))} aria-label="Giorno successivo">
          <ChevronRight />
        </button>
      </header>

      <section className={ui.section}>
        <div className={ui.sectionHead}>
          <h2 className={ui.sectionTitle}>Flusso</h2>
          <p className={ui.hint}>{FLOW_LABELS[day.flow ?? 0]}</p>
        </div>
        <FlowDrops level={day.flow ?? 0} onChange={(flow) => onChange({ flow })} />
      </section>

      {settings.contraception.method !== 'none' && (
        <section className={ui.section}>
          <div className={ui.sectionHead}>
            <h2 className={ui.sectionTitle}>Contraccezione</h2>
          </div>
          {status && (
            <p className={styles.status}>
              {status.label}
              {status.hint && <strong>{status.hint}</strong>}
            </p>
          )}
          <ContraceptionPicker
            method={settings.contraception.method}
            value={day.contraception}
            onChange={(contraception) => onChange({ contraception })}
          />
        </section>
      )}

      <section className={ui.section}>
        <h2 className={`${ui.sectionTitle} ${styles.spaced}`}>Sintomi</h2>
        <Symptoms selected={day.symptoms ?? []} onChange={(symptoms) => onChange({ symptoms })} />
      </section>

      <section className={ui.section}>
        <div className={ui.sectionHead}>
          <h2 className={ui.sectionTitle}>Dolore</h2>
          <p className={ui.hint}>{day.pain ? PAIN_LABELS[day.pain] : 'Tocca per segnarlo'}</p>
        </div>
        <PainScale value={day.pain} onChange={(pain) => onChange({ pain })} />
      </section>

      <section className={ui.section}>
        <h2 className={`${ui.sectionTitle} ${styles.spaced}`}>Farmaci presi</h2>
        <ChipPicker
          options={settings.cycleMeds}
          selected={day.meds ?? []}
          onChange={(meds) => onChange({ meds })}
          onAddOption={(name) => onSettingsChange({ cycleMeds: [...settings.cycleMeds, name] })}
          addLabel="Aggiungi farmaco"
        />
      </section>

      {settings.tracksMigraine && (
        <section className={ui.section}>
          <h2 className={`${ui.sectionTitle} ${styles.spaced}`}>Emicrania</h2>
          {attacks.map((a) => (
            <button key={a.id} className={styles.attack} onClick={() => onOpenAttack(a.id)}>
              <span className={styles.attackLevel}>{a.intensity}</span>
              <span>
                Attacco delle {a.start.slice(11, 16)}
                <small>{durationLabel(a)}{a.aura ? ' · con aura' : ''}</small>
              </span>
            </button>
          ))}
          <button className={ui.buttonGhost} onClick={onNewAttack}>
            <AddIcon aria-hidden="true" /> Aggiungi attacco
          </button>
        </section>
      )}

      <section className={ui.section}>
        <label className={ui.field}>
          <span className={ui.sectionTitle} style={{ color: 'var(--ink)' }}>Note</span>
          <textarea
            className={ui.input}
            value={day.note ?? ''}
            onChange={(e) => onChange({ note: e.target.value })}
            placeholder="Come ti senti oggi?"
          />
        </label>
      </section>
    </div>
  );
}

const FLOW_LABELS = ['Nessuno', 'Spotting', 'Leggero', 'Medio', 'Abbondante'];
const PAIN_LABELS = ['', 'Lieve', 'Fastidioso', 'Moderato', 'Forte', 'Molto forte'];
