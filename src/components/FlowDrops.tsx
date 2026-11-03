import DropFilled from '~icons/material-symbols/water-drop';
import DropEmpty from '~icons/material-symbols/water-drop-outline';
import styles from './FlowDrops.module.css';

interface FlowDropsProps {
  level: number;                        // 0-4
  onChange: (level: number) => void;
}

// 4 drops: tapping the 3rd fills 1-3; tapping the highest filled one empties them all
export default function FlowDrops({ level, onChange }: FlowDropsProps) {
  return (
    <div className={styles.drops}>
      {[1, 2, 3, 4].map((i) => (
        <button
          key={i}
          className={i <= level ? `${styles.drop} ${styles.filled}` : styles.drop}
          onClick={() => onChange(i === level ? 0 : i)}
          aria-label={`Flusso ${i} di 4`}
          aria-pressed={i <= level}
        >
          {i <= level ? <DropFilled aria-hidden="true" /> : <DropEmpty aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}
