import Patch1 from '~icons/auria/cerotto_1';
import Patch2 from '~icons/auria/cerotto_2';
import Patch3 from '~icons/auria/cerotto_3';
import PatchRemoved from '~icons/auria/cerotto_rimosso';
import PillTaken from '~icons/auria/pillola_presa';
import PillMissed from '~icons/auria/pillola_dimenticata';
import RingIn from '~icons/auria/anello_inserito';
import RingOut from '~icons/auria/anello_rimosso';
import type { ContraceptionEvent, ContraceptionMethod } from '../lib/storage';
import styles from './IconGrid.module.css';

// The buttons of each method. To add a method: a new entry here and in storage.ts
const OPTIONS = {
  patch: [
    { id: 'patch1', label: 'Cerotto 1', Icon: Patch1 },
    { id: 'patch2', label: 'Cerotto 2', Icon: Patch2 },
    { id: 'patch3', label: 'Cerotto 3', Icon: Patch3 },
    { id: 'removed', label: 'Rimosso', Icon: PatchRemoved },
  ],
  pill: [
    { id: 'pillTaken', label: 'Presa', Icon: PillTaken },
    { id: 'pillMissed', label: 'Dimenticata', Icon: PillMissed },
  ],
  ring: [
    { id: 'ringIn', label: 'Inserito', Icon: RingIn },
    { id: 'ringOut', label: 'Rimosso', Icon: RingOut },
  ],
} satisfies Record<Exclude<ContraceptionMethod, 'none'>, { id: ContraceptionEvent; label: string; Icon: unknown }[]>;

interface ContraceptionPickerProps {
  method: ContraceptionMethod;
  value: ContraceptionEvent | undefined;
  onChange: (value: ContraceptionEvent | undefined) => void;
}

export default function ContraceptionPicker({ method, value, onChange }: ContraceptionPickerProps) {
  if (method === 'none') return null;
  return (
    <div className={styles.grid}>
      {OPTIONS[method].map(({ id, label, Icon }) => (
        <button
          key={id}
          className={styles.item}
          onClick={() => onChange(id === value ? undefined : id)}
          aria-pressed={value === id}
        >
          <span className={styles.badge}>
            <Icon aria-hidden="true" />
          </span>
          {label}
        </button>
      ))}
    </div>
  );
}
