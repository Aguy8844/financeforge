import { useEffect, useMemo, useState, type ComponentType, type Dispatch, type SetStateAction } from 'react';
import { createDemoState } from './data/demoData';
import { currentMonthKey } from './lib/date';
import { loadState, saveState } from './lib/storage';
import { buildLanguage, useStaticTranslations, type Language } from './lib/staticTranslations';
import type { AppState, ViewKey } from './types';
import { Shell } from './components/Shell';
import { DashboardView } from './views/DashboardView';
import { IncomeView } from './views/IncomeView';
import { ExpensesView } from './views/ExpensesView';
import { BudgetsView } from './views/BudgetsView';
import { SavingsGoalsView } from './views/SavingsGoalsView';
import { ProjectionView } from './views/ProjectionView';
import { RemindersView } from './views/RemindersView';
import { SettingsView } from './views/SettingsView';

const viewComponents: Record<ViewKey, ComponentType<{
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  selectedMonth: string;
  notify: (message: string) => void;
}>> = {
  dashboard: DashboardView,
  income: IncomeView,
  expenses: ExpensesView,
  budgets: BudgetsView,
  goals: SavingsGoalsView,
  projection: ProjectionView,
  reminders: RemindersView,
  settings: SettingsView,
};

type AppMode = 'local' | 'demo';

export default function App({
  mode = 'local',
  initialState,
  initialMonth,
  language = buildLanguage(),
}: {
  mode?: AppMode;
  initialState?: AppState;
  initialMonth?: string;
  language?: Language;
}) {
  const demoMode = mode === 'demo';
  useStaticTranslations(language);
  const [state, setState] = useState<AppState>(() => initialState ?? createDemoState());
  const [loaded, setLoaded] = useState(demoMode);
  const [activeView, setActiveView] = useState<ViewKey>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(initialMonth ?? currentMonthKey());
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (demoMode) {
      const demoState = initialState ?? createDemoState();
      setState(demoState);
      setActiveView(demoState.settings.defaultView);
      setLoaded(true);
      return;
    }

    let cancelled = false;
    loadState()
      .then((loaded) => {
        if (cancelled) return;
        setState(loaded);
        setActiveView(loaded.settings.defaultView);
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = createDemoState();
        setState(fallback);
        setActiveView(fallback.settings.defaultView);
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [demoMode, initialState]);

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.classList.toggle('dark', state.settings.theme === 'dark');
    document.documentElement.classList.toggle('light', state.settings.theme === 'light');
    if (demoMode) return;
    const timeout = window.setTimeout(() => saveState(state), 250);
    return () => window.clearTimeout(timeout);
  }, [state, loaded, demoMode]);

  const notify = (message: string) => {
    setToast(demoMode ? `${message} Demo wird nicht gespeichert.` : message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const View = useMemo(() => viewComponents[activeView], [activeView]);

  if (!loaded) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-100">
        <div className="glass-panel rounded-xl p-6 text-center">
          <p className="text-lg font-bold">FinanceForge wird geladen</p>
          <p className="mt-2 text-sm text-slate-400">Lokale Daten werden vorbereitet.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Shell
        state={state}
        activeView={activeView}
        onViewChange={setActiveView}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        demoMode={demoMode}
      >
        <View state={state} setState={setState} selectedMonth={selectedMonth} notify={notify} />
      </Shell>

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm font-semibold text-slate-100 shadow-glow backdrop-blur">
          {toast}
        </div>
      ) : null}
    </>
  );
}
