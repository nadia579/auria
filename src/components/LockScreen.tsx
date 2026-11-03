import { useEffect, useState } from 'react';
import Fingerprint from '~icons/material-symbols/fingerprint';
import { hashPin, verifyBiometric } from '../lib/lock';
import type { LockSettings } from '../lib/storage';
import PinPad from './PinPad';
import styles from './LockScreen.module.css';

interface LockScreenProps {
  lock: LockSettings;
  onUnlock: () => void;
}

export default function LockScreen({ lock, onUnlock }: LockScreenProps) {
  const [error, setError] = useState<string | null>(null);

  async function tryFingerprint() {
    if (lock.credentialId && (await verifyBiometric(lock.credentialId))) onUnlock();
  }

  // Offer the fingerprint straight away; if the phone refuses without a tap, the button is there
  useEffect(() => {
    if (!lock.credentialId) return;
    verifyBiometric(lock.credentialId).then((ok) => ok && onUnlock());
  }, [lock.credentialId, onUnlock]);

  async function checkPin(pin: string) {
    if (lock.salt && (await hashPin(pin, lock.salt)) === lock.pinHash) {
      onUnlock();
    } else {
      setError('PIN sbagliato');
    }
  }

  return (
    <div className={styles.screen}>
      <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" className={styles.logo} />
      <p className={styles.name}>Auria</p>
      <PinPad
        dark
        title="Inserisci il PIN"
        error={error}
        onComplete={(pin) => {
          setError(null);
          checkPin(pin);
        }}
        extraKey={
          lock.credentialId && (
            <button onClick={tryFingerprint} aria-label="Sblocca con l'impronta" className={styles.finger}>
              <Fingerprint />
            </button>
          )
        }
      />
    </div>
  );
}
