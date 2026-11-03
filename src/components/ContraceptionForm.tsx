import type { ContraceptionMethod, ContraceptionSettings, PillSchema } from '../lib/storage';
import ui from './ui.module.css';

const METHODS: { id: ContraceptionMethod; label: string }[] = [
  { id: 'none', label: 'Nessuno' },
  { id: 'patch', label: 'Cerotto' },
  { id: 'pill', label: 'Pillola' },
  { id: 'ring', label: 'Anello' },
];

const START_LABEL: Record<ContraceptionMethod, string> = {
  none: '',
  patch: 'Giorno in cui hai messo il cerotto 1',
  pill: 'Primo giorno della confezione',
  ring: "Giorno in cui hai inserito l'anello",
};

interface ContraceptionFormProps {
  value: ContraceptionSettings;
  onChange: (value: ContraceptionSettings) => void;
}

// Used both in the first-run questions and in the settings
export default function ContraceptionForm({ value, onChange }: ContraceptionFormProps) {
  const set = (changes: Partial<ContraceptionSettings>) => onChange({ ...value, ...changes });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className={ui.chips} role="group" aria-label="Metodo">
        {METHODS.map((m) => (
          <button key={m.id} className={ui.chip} aria-pressed={value.method === m.id} onClick={() => set({ method: m.id })}>
            {m.label}
          </button>
        ))}
      </div>

      {value.method === 'pill' && (
        <label className={ui.field}>
          Schema
          <select
            className={ui.input}
            value={value.pillSchema}
            onChange={(e) => set({ pillSchema: e.target.value as PillSchema })}
          >
            <option value="21-7">21 pillole + 7 giorni di pausa</option>
            <option value="24-4">24 pillole + 4 di pausa (o placebo)</option>
            <option value="continuous">Continua, senza pausa</option>
          </select>
        </label>
      )}

      {value.method !== 'none' && (
        <>
          <label className={ui.field}>
            {START_LABEL[value.method]}
            <input
              type="date"
              className={ui.input}
              value={value.startDate ?? ''}
              onChange={(e) => set({ startDate: e.target.value || null })}
            />
          </label>
          <p className={ui.hint}>
            Basta l'ultima volta che è successo. Poi l'app si ricalibra da sola su quello che segni nei giorni.
          </p>
        </>
      )}
    </div>
  );
}
