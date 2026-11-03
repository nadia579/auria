import { useState, type ReactNode } from 'react';
import Backspace from '~icons/material-symbols/backspace-outline-rounded';
import styles from './PinPad.module.css';

const PIN_LENGTH = 4;

interface PinPadProps {
  title: string;
  error?: string | null;
  onComplete: (pin: string) => void;   // called when 4 digits have been typed
  extraKey?: ReactNode;          // bottom-left key, e.g. fingerprint
  dark?: boolean;
}

export default function PinPad({ title, error, onComplete, extraKey, dark }: PinPadProps) {
  const [pin, setPin] = useState('');

  function press(digit: string) {
    const next = (pin + digit).slice(0, PIN_LENGTH);
    setPin(next);
    if (next.length === PIN_LENGTH) {
      onComplete(next);
      setPin('');
    }
  }

  return (
    <div className={dark ? `${styles.pad} ${styles.dark}` : styles.pad}>
      <p className={styles.title}>{title}</p>
      <div className={error ? `${styles.dots} ${styles.shake}` : styles.dots} aria-hidden="true">
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span key={i} className={i < pin.length ? styles.on : undefined} />
        ))}
      </div>
      <p className={styles.error} role="alert">{error ?? ''}</p>

      <div className={styles.keys}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} onClick={() => press(d)}>{d}</button>
        ))}
        <div className={styles.extra}>{extraKey}</div>
        <button onClick={() => press('0')}>0</button>
        <button onClick={() => setPin(pin.slice(0, -1))} aria-label="Cancella" className={styles.erase}>
          <Backspace />
        </button>
      </div>
    </div>
  );
}
