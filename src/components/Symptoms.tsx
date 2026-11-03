// Your own icons, from src/icons/auria (file name without .svg)
import Cramps from '~icons/auria/crampi-addominali';
import Bloating from '~icons/auria/gonfiore-addominale';
import Backache from '~icons/auria/mal-di-schiena';
import Headache from '~icons/auria/mal-di-testa';
import Nausea from '~icons/auria/nausea';
import Spotting from '~icons/auria/spotting';
import Breasts from '~icons/auria/seni-sensibili';
import Fatigue from '~icons/auria/stanchezza';
import styles from './IconGrid.module.css';

// id is what gets saved, label and Icon are what you see. To add a symptom: one line here
const SYMPTOMS = [
  { id: 'cramps',   label: 'Crampi addominali', Icon: Cramps },
  { id: 'spotting', label: 'Perdite',           Icon: Spotting },
  { id: 'fatigue',  label: 'Stanchezza',        Icon: Fatigue },
  { id: 'bloating', label: 'Gonfiore',          Icon: Bloating },
  { id: 'backache', label: 'Mal di schiena',    Icon: Backache },
  { id: 'headache', label: 'Mal di testa',      Icon: Headache },
  { id: 'breasts',  label: 'Seno sensibile',    Icon: Breasts },
  { id: 'nausea',   label: 'Nausea',            Icon: Nausea },
];

interface SymptomsProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function Symptoms({ selected, onChange }: SymptomsProps) {
  // Adds the symptom if missing, removes it if already there (always a NEW list)
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  return (
    <div className={styles.grid}>
      {SYMPTOMS.map(({ id, label, Icon }) => (
        <button key={id} className={styles.item} onClick={() => toggle(id)} aria-pressed={selected.includes(id)}>
          <span className={styles.badge}>
            <Icon aria-hidden="true" />
          </span>
          {label}
        </button>
      ))}
    </div>
  );
}
