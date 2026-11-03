import { useEffect, useState } from 'react';
import { biometricAvailable, hashPin, lockAvailable, newSalt, registerBiometric } from '../lib/lock';
import type { LockSettings as Lock } from '../lib/storage';
import PinPad from './PinPad';
import ui from './ui.module.css';

interface LockSettingsProps {
  lock: Lock;
  onChange: (lock: Lock) => void;
}

// PIN setup is two steps: type it, then type it again
type Step = 'idle' | 'first' | 'confirm';

export default function LockSettings({ lock, onChange }: LockSettingsProps) {
  const [step, setStep] = useState<Step>('idle');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [canFingerprint, setCanFingerprint] = useState(false);

  useEffect(() => {
    biometricAvailable().then(setCanFingerprint);
  }, []);

  if (!lockAvailable()) {
    return (
      <section className={ui.section}>
        <h2 className={ui.sectionTitle}>Blocco</h2>
        <p className={ui.hint} style={{ marginTop: 4 }}>
          Il blocco con PIN e impronta funziona nell'app pubblicata (serve una connessione sicura, HTTPS).
        </p>
      </section>
    );
  }

  async function onPin(pin: string) {
    if (step === 'first') {
      setFirstPin(pin);
      setError(null);
      setStep('confirm');
      return;
    }
    if (pin !== firstPin) {
      setError('I due PIN non coincidono, riprova');
      setStep('first');
      return;
    }
    const salt = newSalt();
    onChange({ ...lock, enabled: true, salt, pinHash: await hashPin(pin, salt) });
    setStep('idle');
    setError(null);
  }

  async function toggleFingerprint(on: boolean) {
    if (!on) return onChange({ ...lock, credentialId: null });
    try {
      onChange({ ...lock, credentialId: await registerBiometric() });
    } catch {
      setError("Impronta non attivata: riprova, e conferma con il dito quando il telefono lo chiede");
    }
  }

  return (
    <section className={ui.section}>
      <h2 className={ui.sectionTitle}>Blocco</h2>
      <p className={ui.hint} style={{ margin: '4px 0 6px' }}>
        Chiede il PIN all'apertura e dopo un minuto in background. È un blocco della porta: i dati non vengono cifrati.
      </p>

      {step !== 'idle' ? (
        <div style={{ paddingTop: 12 }}>
          <PinPad
            title={step === 'first' ? 'Scegli un PIN di 4 cifre' : 'Ripeti il PIN'}
            error={error}
            onComplete={onPin}
          />
          <button className={ui.buttonGhost} style={{ width: '100%', marginTop: 12 }} onClick={() => setStep('idle')}>
            Annulla
          </button>
        </div>
      ) : lock.enabled ? (
        <>
          {canFingerprint && (
            <div className={ui.row}>
              <span className={ui.rowLabel}>Sblocco con impronta</span>
              <input
                type="checkbox"
                className={ui.switch}
                checked={!!lock.credentialId}
                onChange={(e) => toggleFingerprint(e.target.checked)}
              />
            </div>
          )}
          {error && <p className={ui.hint} role="alert">{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button className={ui.buttonGhost} style={{ flex: 1 }} onClick={() => setStep('first')}>Cambia PIN</button>
            <button
              className={ui.buttonDanger}
              style={{ flex: 1 }}
              onClick={() => {
                if (confirm('Disattivare il blocco?')) onChange({ enabled: false, pinHash: null, salt: null, credentialId: null });
              }}
            >
              Disattiva
            </button>
          </div>
        </>
      ) : (
        <button className={ui.button} style={{ width: '100%', marginTop: 12 }} onClick={() => setStep('first')}>
          Imposta un PIN
        </button>
      )}
    </section>
  );
}
