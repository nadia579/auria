import ArrowBack from '~icons/material-symbols/arrow-back-rounded';
import DeleteIcon from '~icons/material-symbols/delete-outline-rounded';
import CloseIcon from '~icons/material-symbols/close-rounded';
import { nowLocal } from '../lib/dates';
import { ATTACK_SYMPTOMS, EFFECT_LABELS, LOCATIONS, TRIGGERS, durationLabel } from '../lib/migraine';
import type { Attack, MedEffect } from '../lib/storage';
import ChipPicker from './ChipPicker';
import ui from './ui.module.css';
import styles from './AttackPage.module.css';

interface AttackPageProps {
  attack: Attack;
  medList: string[];
  onChange: (attack: Attack) => void;
  onMedListChange: (list: string[]) => void;
  onDelete: () => void;
  onBack: () => void;
}

// Every change is saved at once, like the day page
export default function AttackPage({ attack, medList, onChange, onMedListChange, onDelete, onBack }: AttackPageProps) {
  const set = (changes: Partial<Attack>) => onChange({ ...attack, ...changes });
  const medNames = attack.meds.map((m) => m.name);

  // Keeps the details (time, effect) of medicines already chosen, adds new ones, drops removed ones
  function setMedNames(names: string[]) {
    set({
      meds: names.map(
        (name) => attack.meds.find((m) => m.name === name) ?? { name, time: nowLocal().slice(11, 16), effect: 'partial' },
      ),
    });
  }

  function setMed(name: string, changes: { time?: string; effect?: MedEffect }) {
    set({ meds: attack.meds.map((m) => (m.name === name ? { ...m, ...changes } : m)) });
  }

  return (
    <div className={ui.page}>
      <header className={ui.pageHeader}>
        <button className={ui.iconButton} onClick={onBack} aria-label="Indietro">
          <ArrowBack />
        </button>
        <h1 className={ui.pageTitle}>Attacco di emicrania</h1>
      </header>

      <section className={ui.section}>
        <div className={ui.sectionHead}>
          <h2 className={ui.sectionTitle}>Quando</h2>
          <p className={ui.hint}>{durationLabel(attack)}</p>
        </div>
        <div className={styles.when}>
          <label className={ui.field}>
            Inizio
            <input
              type="datetime-local"
              className={ui.input}
              value={attack.start}
              onChange={(e) => e.target.value && set({ start: e.target.value })}
            />
          </label>
          {attack.end === null ? (
            <button className={ui.button} onClick={() => set({ end: nowLocal() })}>
              È finito adesso
            </button>
          ) : (
            <label className={ui.field}>
              Fine
              <span className={styles.endRow}>
                <input
                  type="datetime-local"
                  className={ui.input}
                  value={attack.end}
                  min={attack.start}
                  onChange={(e) => set({ end: e.target.value || null })}
                />
                <button className={ui.iconButton} onClick={() => set({ end: null })} aria-label="Ancora in corso">
                  <CloseIcon />
                </button>
              </span>
            </label>
          )}
        </div>
      </section>

      <section className={ui.section}>
        <div className={ui.sectionHead}>
          <h2 className={ui.sectionTitle}>Intensità</h2>
          <p className={styles.intensityValue}>{attack.intensity}<small>/10</small></p>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={attack.intensity}
          onChange={(e) => set({ intensity: Number(e.target.value) })}
          className={styles.range}
          aria-label="Intensità da 1 a 10"
        />
        <div className={styles.rangeLabels}><span>Lieve</span><span>Insopportabile</span></div>
      </section>

      <section className={ui.section}>
        <div className={ui.row}>
          <span className={ui.rowLabel}>
            Aura
            <span className={ui.rowSub}>Disturbi visivi o formicolii prima del dolore</span>
          </span>
          <input type="checkbox" className={ui.switch} checked={attack.aura} onChange={(e) => set({ aura: e.target.checked })} />
        </div>
      </section>

      <Chips title="Dove fa male" options={LOCATIONS} selected={attack.locations} onChange={(locations) => set({ locations })} />
      <Chips title="Sintomi" options={ATTACK_SYMPTOMS} selected={attack.symptoms} onChange={(symptoms) => set({ symptoms })} />
      <Chips title="Possibili cause" options={TRIGGERS} selected={attack.triggers} onChange={(triggers) => set({ triggers })} />

      <section className={ui.section}>
        <h2 className={`${ui.sectionTitle} ${styles.spaced}`}>Farmaci</h2>
        <ChipPicker
          options={medList}
          selected={medNames}
          onChange={setMedNames}
          onAddOption={(name) => onMedListChange([...medList, name])}
          addLabel="Aggiungi farmaco"
        />
        {attack.meds.map((m) => (
          <div key={m.name} className={styles.med}>
            <div className={styles.medHead}>
              <strong>{m.name}</strong>
              <input
                type="time"
                className={`${ui.input} ${styles.time}`}
                value={m.time}
                onChange={(e) => setMed(m.name, { time: e.target.value })}
                aria-label={`Ora di ${m.name}`}
              />
            </div>
            <div className={ui.segmented} role="group" aria-label={`Effetto di ${m.name}`}>
              {(Object.keys(EFFECT_LABELS) as MedEffect[]).map((effect) => (
                <button key={effect} aria-pressed={m.effect === effect} onClick={() => setMed(m.name, { effect })}>
                  {EFFECT_LABELS[effect]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className={ui.section}>
        <label className={ui.field}>
          <span className={ui.sectionTitle} style={{ color: 'var(--ink)' }}>Note</span>
          <textarea className={ui.input} value={attack.note} onChange={(e) => set({ note: e.target.value })} />
        </label>
      </section>

      <button
        className={ui.buttonDanger}
        onClick={() => {
          if (confirm('Eliminare questo attacco?')) onDelete();
        }}
      >
        <DeleteIcon aria-hidden="true" /> Elimina attacco
      </button>
    </div>
  );
}

function Chips(props: { title: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  return (
    <section className={ui.section}>
      <h2 className={`${ui.sectionTitle} ${styles.spaced}`}>{props.title}</h2>
      <ChipPicker options={props.options} selected={props.selected} onChange={props.onChange} />
    </section>
  );
}
