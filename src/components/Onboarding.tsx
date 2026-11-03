import { useState } from 'react';
import { todayKey } from '../lib/dates';
import type { Settings } from '../lib/storage';
import ContraceptionForm from './ContraceptionForm';
import LockSettings from './LockSettings';
import Stepper from './Stepper';
import ui from './ui.module.css';
import styles from './Onboarding.module.css';

interface OnboardingProps {
  settings: Settings;
  onDone: (settings: Settings) => void;
}

const STEPS = 6;

// First-run questions. Answers stay in a draft until the end, then are saved in one go
export default function Onboarding({ settings, onDone }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(settings);
  const set = (changes: Partial<Settings>) => setDraft((d) => ({ ...d, ...changes }));
  const next = () => setStep((s) => s + 1);

  let content;
  switch (step) {
    case 0:
      content = (
        <>
          <p className={styles.wordmark}>Auria</p>
          <h1 className={styles.question}>Ciclo ed emicrania, in un posto solo</h1>
          <p className={ui.hint}>
            Qualche domanda per partire. Puoi cambiare tutto quando vuoi nelle impostazioni. I tuoi dati restano solo
            su questo telefono.
          </p>
        </>
      );
      break;
    case 1:
      content = (
        <>
          <h1 className={styles.question}>Quando è iniziata l'ultima mestruazione?</h1>
          <input
            type="date"
            className={ui.input}
            max={todayKey()}
            value={draft.lastPeriodStart ?? ''}
            onChange={(e) => set({ lastPeriodStart: e.target.value || null })}
            aria-label="Primo giorno dell'ultima mestruazione"
          />
          <p className={ui.hint}>Se non lo ricordi, salta: lo segnerai quando arriva.</p>
        </>
      );
      break;
    case 2:
      content = (
        <>
          <h1 className={styles.question}>Quanto durano di solito?</h1>
          <div className={ui.row}>
            <span className={ui.rowLabel}>
              Ciclo
              <span className={ui.rowSub}>Dal primo giorno al primo giorno successivo</span>
            </span>
            <Stepper label="Durata del ciclo" value={draft.cycleLength} min={18} max={45} onChange={(cycleLength) => set({ cycleLength })} />
          </div>
          <div className={ui.row}>
            <span className={ui.rowLabel}>Mestruazione</span>
            <Stepper label="Durata della mestruazione" value={draft.periodLength} min={2} max={10} onChange={(periodLength) => set({ periodLength })} />
          </div>
          <p className={ui.hint}>Non sai? Lascia 28 e 5: dopo un paio di cicli l'app usa le tue medie.</p>
        </>
      );
      break;
    case 3:
      content = (
        <>
          <h1 className={styles.question}>Usi un contraccettivo?</h1>
          <ContraceptionForm value={draft.contraception} onChange={(contraception) => set({ contraception })} />
        </>
      );
      break;
    case 4:
      content = (
        <>
          <h1 className={styles.question}>Soffri di emicrania?</h1>
          <p className={ui.hint}>Se sì, l'app tiene un diario degli attacchi e cerca il collegamento con il ciclo.</p>
          <div className={styles.choices}>
            <button className={ui.chip} aria-pressed={draft.tracksMigraine} onClick={() => set({ tracksMigraine: true })}>Sì</button>
            <button className={ui.chip} aria-pressed={!draft.tracksMigraine} onClick={() => set({ tracksMigraine: false })}>No</button>
          </div>
        </>
      );
      break;
    default:
      content = (
        <>
          <h1 className={styles.question}>Vuoi proteggere l'app?</h1>
          <LockSettings lock={draft.lock} onChange={(lock) => set({ lock })} />
        </>
      );
  }

  const last = step === STEPS - 1;

  return (
    <div className={styles.screen}>
      <div className={styles.progress} aria-label={`Passo ${step + 1} di ${STEPS}`}>
        {Array.from({ length: STEPS }, (_, i) => (
          <span key={i} className={i <= step ? styles.done : undefined} />
        ))}
      </div>

      <div className={styles.card}>{content}</div>

      <div className={styles.nav}>
        {step > 0 && (
          <button className={styles.back} onClick={() => setStep((s) => s - 1)}>Indietro</button>
        )}
        <button className={styles.next} onClick={last ? () => onDone(draft) : next}>
          {step === 0 ? 'Iniziamo' : last ? 'Fatto' : step === 1 && !draft.lastPeriodStart ? 'Salta' : 'Avanti'}
        </button>
      </div>
    </div>
  );
}
