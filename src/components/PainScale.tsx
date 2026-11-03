import type { CSSProperties } from 'react';
import styles from './PainScale.module.css';

interface PainScaleProps {
  value: number | undefined;   // 1-5
  onChange: (value: number | undefined) => void;
  max?: number;
}

// Row of numbered circles that get darker as pain grows. Tap the selected one to clear it
export default function PainScale({ value, onChange, max = 5 }: PainScaleProps) {
  return (
    <div className={styles.scale} style={{ gridTemplateColumns: `repeat(${max}, 1fr)` }}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          className={styles.step}
          // the higher the number, the stronger the colour
          style={{ '--level': n / max } as CSSProperties}
          onClick={() => onChange(n === value ? undefined : n)}
          aria-pressed={n === value}
          aria-label={`Livello ${n} di ${max}`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
