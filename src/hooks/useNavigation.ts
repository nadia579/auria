import { useCallback, useEffect, useState } from 'react';

// Every screen of the app
export type View =
  | { name: 'home' }
  | { name: 'migraine' }
  | { name: 'stats' }
  | { name: 'settings' }
  | { name: 'day'; key: string }
  | { name: 'attack'; id: string };

export type Tab = 'home' | 'migraine' | 'stats' | 'settings';

// Navigation that works with Android's back gesture.
// Opening a sub-page (a day, an attack) adds a step to the browser history,
// so "back" closes it instead of closing the app. Switching tab replaces the step.
export function useNavigation() {
  const [view, setView] = useState<View>(() => (history.state?.view as View) ?? { name: 'home' });

  useEffect(() => {
    if (!history.state?.view) history.replaceState({ view: { name: 'home' } }, '');
    const onPop = (e: PopStateEvent) => setView((e.state?.view as View) ?? { name: 'home' });
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Opens a sub-page: back returns to where you were
  // depth = how many sub-pages are open on top of a tab
  const open = useCallback((next: View) => {
    history.pushState({ view: next, depth: (history.state?.depth ?? 0) + 1 }, '');
    setView(next);
    window.scrollTo(0, 0);
  }, []);

  // Replaces the current page, e.g. moving to the next day without piling up history
  const replace = useCallback((next: View) => {
    history.replaceState({ view: next, depth: history.state?.depth ?? 0 }, '');
    setView(next);
  }, []);

  const showTab = useCallback((tab: Tab) => {
    history.replaceState({ view: { name: tab } }, '');
    setView({ name: tab } as View);
    window.scrollTo(0, 0);
  }, []);

  // After a reload on a sub-page there's nothing behind it: go to the home tab instead of leaving the app
  const back = useCallback(() => {
    if ((history.state?.depth ?? 0) > 0) history.back();
    else showTab('home');
  }, [showTab]);

  return { view, open, replace, showTab, back };
}
