import { useRef, useState } from 'react';
import DownloadIcon from '~icons/material-symbols/download-rounded';
import UploadIcon from '~icons/material-symbols/upload-rounded';
import EventIcon from '~icons/material-symbols/event-rounded';
import CloseIcon from '~icons/material-symbols/close-rounded';
import { download, exportBackup, parseBackup, remindersIcs } from '../lib/files';
import type { AppData, Settings } from '../lib/storage';
import ContraceptionForm from './ContraceptionForm';
import LockSettings from './LockSettings';
import Stepper from './Stepper';
import ui from './ui.module.css';

interface SettingsPageProps {
  data: AppData;
  onChange: (changes: Partial<Settings>) => void;
  onReplaceData: (data: AppData) => void;
}

export default function SettingsPage({ data, onChange, onReplaceData }: SettingsPageProps) {
  const { settings } = data;
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function importFile(file: File) {
    try {
      const next = parseBackup(await file.text());
      if (confirm('Sostituire tutti i dati di questo telefono con quelli del backup?')) {
        onReplaceData(next);
        setMessage('Backup ripristinato.');
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'File non valido');
    }
  }

  const method = settings.contraception.method;

  return (
    <div className={ui.page}>
      <header className={ui.pageHeader}>
        <h1 className={ui.pageTitle}>Impostazioni</h1>
      </header>

      <section className={ui.section}>
        <h2 className={ui.sectionTitle}>Ciclo</h2>
        <p className={ui.hint} style={{ margin: '4px 0 6px' }}>
          Valori usati finché non ci sono abbastanza cicli registrati.
        </p>
        <div className={ui.row}>
          <span className={ui.rowLabel}>Durata del ciclo</span>
          <Stepper label="Durata del ciclo" value={settings.cycleLength} min={18} max={45} onChange={(cycleLength) => onChange({ cycleLength })} />
        </div>
        <div className={ui.row}>
          <span className={ui.rowLabel}>Durata della mestruazione</span>
          <Stepper label="Durata della mestruazione" value={settings.periodLength} min={2} max={10} onChange={(periodLength) => onChange({ periodLength })} />
        </div>
      </section>

      <section className={ui.section}>
        <h2 className={ui.sectionTitle} style={{ marginBottom: 14 }}>Contraccezione</h2>
        <ContraceptionForm value={settings.contraception} onChange={(contraception) => onChange({ contraception })} />

        {method !== 'none' && settings.contraception.startDate && (
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className={ui.row}>
              <span className={ui.rowLabel}>
                Ora del promemoria
                <span className={ui.rowSub}>Per gli eventi nel calendario del telefono</span>
              </span>
              <input
                type="time"
                className={ui.input}
                style={{ width: 'auto' }}
                value={settings.contraception.reminderTime}
                onChange={(e) => onChange({ contraception: { ...settings.contraception, reminderTime: e.target.value || '21:00' } })}
              />
            </div>
            <button className={ui.buttonGhost} onClick={() => download('auria-promemoria.ics', remindersIcs(data), 'text/calendar')}>
              <EventIcon aria-hidden="true" /> Scarica i promemoria
            </button>
            <p className={ui.hint}>
              Un file con gli eventi del prossimo anno: aprilo con il calendario del telefono, oppure importalo da
              calendar.google.com → Impostazioni → Importa. Se cambi data, scaricalo di nuovo.
            </p>
          </div>
        )}
      </section>

      <section className={ui.section}>
        <div className={ui.row}>
          <span className={ui.rowLabel}>
            Diario dell'emicrania
            <span className={ui.rowSub}>Mostra la sezione e le statistiche</span>
          </span>
          <input
            type="checkbox"
            className={ui.switch}
            checked={settings.tracksMigraine}
            onChange={(e) => onChange({ tracksMigraine: e.target.checked })}
          />
        </div>
      </section>

      {(settings.cycleMeds.length > 0 || settings.migraineMeds.length > 0) && (
        <section className={ui.section}>
          <h2 className={ui.sectionTitle} style={{ marginBottom: 8 }}>I tuoi farmaci</h2>
          <p className={ui.hint} style={{ marginBottom: 12 }}>Toglierli dall'elenco non cancella i giorni in cui li hai segnati.</p>
          <MedList title="Per il ciclo" list={settings.cycleMeds} onChange={(cycleMeds) => onChange({ cycleMeds })} />
          <MedList title="Per l'emicrania" list={settings.migraineMeds} onChange={(migraineMeds) => onChange({ migraineMeds })} />
        </section>
      )}

      <LockSettings lock={settings.lock} onChange={(lock) => onChange({ lock })} />

      <section className={ui.section}>
        <h2 className={ui.sectionTitle}>Backup</h2>
        <p className={ui.hint} style={{ margin: '4px 0 14px' }}>
          I dati vivono solo su questo telefono. Se cancelli i dati di Chrome o disinstalli l'app, spariscono: salva un
          backup ogni tanto, per esempio su Google Drive.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className={ui.button} onClick={() => exportBackup(data)}>
            <DownloadIcon aria-hidden="true" /> Salva backup
          </button>
          <button className={ui.buttonGhost} onClick={() => fileInput.current?.click()}>
            <UploadIcon aria-hidden="true" /> Ripristina da backup
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importFile(file);
              e.target.value = '';
            }}
          />
          {message && <p className={ui.hint} role="status">{message}</p>}
        </div>
      </section>

      <p className={ui.hint} style={{ textAlign: 'center' }}>Auria 2.0</p>
    </div>
  );
}

function MedList({ title, list, onChange }: { title: string; list: string[]; onChange: (l: string[]) => void }) {
  if (list.length === 0) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <p className={ui.rowSub} style={{ marginBottom: 6 }}>{title}</p>
      <div className={ui.chips}>
        {list.map((name) => (
          <button key={name} className={ui.chip} onClick={() => onChange(list.filter((n) => n !== name))} aria-label={`Togli ${name}`}>
            {name} <CloseIcon aria-hidden="true" style={{ width: 16, height: 16, verticalAlign: -3 }} />
          </button>
        ))}
      </div>
    </div>
  );
}
