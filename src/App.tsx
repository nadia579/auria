import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from './hooks/useNavigation';
import { loadData, saveData, type AppData, type Attack, type DayData, type Settings } from './lib/storage';
import { nowLocal, todayKey } from './lib/dates';
import { newAttack } from './lib/migraine';
import HomePage from './components/HomePage';
import DayPage from './components/DayPage';
import MigrainePage from './components/MigrainePage';
import AttackPage from './components/AttackPage';
import StatsPage from './components/StatsPage';
import SettingsPage from './components/SettingsPage';
import Onboarding from './components/Onboarding';
import LockScreen from './components/LockScreen';
import TabBar from './components/TabBar';

// After this long in the background, the app locks again
const RELOCK_AFTER_MS = 60_000;

export default function App() {
  // App owns all the data: loaded once, saved at every change
  const [data, setData] = useState(loadData);
  const [locked, setLocked] = useState(() => data.settings.lock.enabled);
  const nav = useNavigation();

  useEffect(() => {
    saveData(data);
  }, [data]);

  // Lock again when you come back after a while
  useEffect(() => {
    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (data.settings.lock.enabled && Date.now() - hiddenAt > RELOCK_AFTER_MS) setLocked(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [data.settings.lock.enabled]);

  // --- Changes to the data: always a NEW object, never modify the old one ---

  const updateDay = useCallback((key: string, changes: Partial<DayData>) => {
    setData((prev) => ({
      ...prev,
      days: { ...prev.days, [key]: { ...prev.days[key], ...changes } },
    }));
  }, []);

  const updateSettings = useCallback((changes: Partial<Settings>) => {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, ...changes } }));
  }, []);

  const saveAttack = useCallback((attack: Attack) => {
    setData((prev) => ({
      ...prev,
      attacks: prev.attacks.some((a) => a.id === attack.id)
        ? prev.attacks.map((a) => (a.id === attack.id ? attack : a))
        : [...prev.attacks, attack],
    }));
  }, []);

  const deleteAttack = useCallback((id: string) => {
    setData((prev) => ({ ...prev, attacks: prev.attacks.filter((a) => a.id !== id) }));
  }, []);

  // Creates an attack (now, or at noon of a past day) and opens it
  const startAttack = useCallback(
    (dayKey?: string) => {
      const start = !dayKey || dayKey === todayKey() ? nowLocal() : `${dayKey}T12:00`;
      const attack = newAttack(start);
      saveAttack(attack);
      nav.open({ name: 'attack', id: attack.id });
    },
    [saveAttack, nav],
  );

  const openDay = useCallback((key: string) => nav.open({ name: 'day', key }), [nav]);
  const unlock = useCallback(() => setLocked(false), []);

  // --- What to show ---

  if (locked) {
    return <LockScreen lock={data.settings.lock} onUnlock={unlock} />;
  }

  if (!data.settings.onboarded) {
    return <Onboarding settings={data.settings} onDone={(s) => updateSettings({ ...s, onboarded: true })} />;
  }

  // An attack that no longer exists (deleted, or a restored backup) falls back to the home page
  const view =
    nav.view.name === 'attack' && !data.attacks.some((a) => a.id === (nav.view as { id: string }).id)
      ? ({ name: 'home' } as const)
      : nav.view;
  let page;
  switch (view.name) {
    case 'day':
      page = (
        <DayPage
          key={view.key}
          data={data}
          dayKey={view.key}
          onChange={(changes) => updateDay(view.key, changes)}
          onSettingsChange={updateSettings}
          onOpenAttack={(id) => nav.open({ name: 'attack', id })}
          onNewAttack={() => startAttack(view.key)}
          onMove={(key) => nav.replace({ name: 'day', key })}
          onBack={nav.back}
        />
      );
      break;
    case 'attack': {
      const attack = data.attacks.find((a) => a.id === view.id)!;
      page = (
        <AttackPage
          attack={attack}
          medList={data.settings.migraineMeds}
          onChange={saveAttack}
          onMedListChange={(migraineMeds) => updateSettings({ migraineMeds })}
          onDelete={() => {
            deleteAttack(attack.id);
            nav.back();
          }}
          onBack={nav.back}
        />
      );
      break;
    }
    case 'migraine':
      page = (
        <MigrainePage
          data={data}
          onOpen={(id) => nav.open({ name: 'attack', id })}
          onNew={() => startAttack()}
        />
      );
      break;
    case 'stats':
      page = <StatsPage data={data} />;
      break;
    case 'settings':
      page = (
        <SettingsPage
          data={data}
          onChange={updateSettings}
          onReplaceData={(next: AppData) => setData(next)}
        />
      );
      break;
    default:
      page = <HomePage data={data} onOpenDay={openDay} />;
  }

  const tab = view.name === 'day' ? 'home' : view.name === 'attack' ? 'migraine' : view.name;

  return (
    <>
      <main>{page}</main>
      <TabBar
        active={tab}
        showMigraine={data.settings.tracksMigraine}
        onTab={nav.showTab}
        onLogToday={() => openDay(todayKey())}
        onNewAttack={data.settings.tracksMigraine ? () => startAttack() : undefined}
      />
    </>
  );
}
