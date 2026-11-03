import { useState } from 'react';
import CalendarIcon from '~icons/material-symbols/calendar-month-outline-rounded';
import MigraineIcon from '~icons/material-symbols/neurology-outline-rounded';
import StatsIcon from '~icons/material-symbols/bar-chart-rounded';
import SettingsIcon from '~icons/material-symbols/settings-outline-rounded';
import AddIcon from '~icons/material-symbols/add-rounded';
import Drop from '~icons/material-symbols/water-drop-outline';
import type { Tab } from '../hooks/useNavigation';
import styles from './TabBar.module.css';

interface TabBarProps {
  active: string;
  showMigraine: boolean;
  onTab: (tab: Tab) => void;
  onLogToday: () => void;
  onNewAttack?: () => void;   // undefined when migraine tracking is off
}

export default function TabBar({ active, showMigraine, onTab, onLogToday, onNewAttack }: TabBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs: { id: Tab; label: string; Icon: typeof CalendarIcon }[] = [
    { id: 'home', label: 'Calendario', Icon: CalendarIcon },
    ...(showMigraine ? [{ id: 'migraine' as Tab, label: 'Emicrania', Icon: MigraineIcon }] : []),
    { id: 'stats', label: 'Statistiche', Icon: StatsIcon },
    { id: 'settings', label: 'Impostazioni', Icon: SettingsIcon },
  ];
  const half = Math.ceil(tabs.length / 2);

  function onAdd() {
    if (onNewAttack) setMenuOpen((open) => !open);
    else onLogToday();
  }

  const renderTab = ({ id, label, Icon }: (typeof tabs)[number]) => (
    <button
      key={id}
      className={styles.tab}
      aria-current={active === id ? 'page' : undefined}
      onClick={() => {
        setMenuOpen(false);
        onTab(id);
      }}
    >
      <Icon aria-hidden="true" />
      {label}
    </button>
  );

  return (
    <>
      {menuOpen && (
        <div className={styles.backdrop} onClick={() => setMenuOpen(false)}>
          <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setMenuOpen(false);
                onLogToday();
              }}
            >
              <span className={styles.menuIcon}><Drop aria-hidden="true" /></span>
              <span>
                Registra oggi
                <small>Flusso, sintomi, note</small>
              </span>
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onNewAttack?.();
              }}
            >
              <span className={styles.menuIcon}><MigraineIcon aria-hidden="true" /></span>
              <span>
                Ho un attacco adesso
                <small>Parte da ora, completi dopo</small>
              </span>
            </button>
          </div>
        </div>
      )}

      <nav className={styles.bar} aria-label="Sezioni">
        {tabs.slice(0, half).map(renderTab)}
        <button
          className={styles.add}
          onClick={onAdd}
          aria-label="Aggiungi"
          aria-expanded={onNewAttack ? menuOpen : undefined}
        >
          <AddIcon aria-hidden="true" className={menuOpen ? styles.addOpen : undefined} />
        </button>
        {tabs.slice(half).map(renderTab)}
      </nav>
    </>
  );
}
