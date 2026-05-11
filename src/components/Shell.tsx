import type { ReactNode } from 'react';
import type { AppState, ViewKey } from '../types';
import { FinanceIcon } from './Icons';
import { cn } from '../lib/cn';
import { formatMonth } from '../lib/date';
import { InfoTooltip } from './ui';

const navItems: Array<{ key: ViewKey; label: string; icon: string }> = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'income', label: 'Einnahmen', icon: 'income' },
  { key: 'expenses', label: 'Ausgaben', icon: 'expenses' },
  { key: 'budgets', label: 'Budgets', icon: 'budgets' },
  { key: 'goals', label: 'Sparziele', icon: 'goals' },
  { key: 'projection', label: 'Projektion', icon: 'projection' },
  { key: 'reminders', label: 'Erinnerungen', icon: 'reminders' },
  { key: 'settings', label: 'Einstellungen', icon: 'settings' },
];

export const Shell = ({
  state,
  activeView,
  onViewChange,
  selectedMonth,
  onMonthChange,
  demoMode = false,
  children,
}: {
  state: AppState;
  activeView: ViewKey;
  onViewChange: (view: ViewKey) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  demoMode?: boolean;
  children: ReactNode;
}) => {
  return (
    <div className="finance-app-shell min-h-screen overflow-hidden text-slate-100 light:text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950/75 p-5 backdrop-blur-2xl light:border-slate-200 light:bg-white/90 lg:block">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-forge-cyan via-sky-300 to-forge-mint text-slate-950 shadow-glow ring-1 ring-white/30">
              <FinanceIcon name="euro" size={23} />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-xl font-extrabold tracking-tight text-transparent light:from-slate-950 light:to-slate-600">
                FinanceForge
              </h1>
              <p className="text-xs font-medium text-slate-400">Private Finance OS</p>
            </div>
          </div>

          <nav className="mt-8 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-400 transition hover:bg-white/[0.08] hover:text-white light:hover:bg-slate-100 light:hover:text-slate-950',
                  activeView === item.key &&
                    'bg-gradient-to-r from-forge-cyan/20 to-forge-mint/10 text-white shadow-soft ring-1 ring-forge-cyan/25 light:from-slate-950 light:to-slate-800 light:text-white',
                )}
                type="button"
                onClick={() => onViewChange(item.key)}
              >
                <span
                  className={cn(
                    'grid h-8 w-8 place-items-center rounded-lg bg-white/[0.055] text-slate-400 transition group-hover:text-forge-cyan light:bg-slate-100',
                    activeView === item.key && 'bg-forge-cyan/20 text-forge-cyan light:bg-white/10',
                  )}
                >
                  <FinanceIcon name={item.icon} size={17} />
                </span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-xl border border-forge-cyan/20 bg-gradient-to-br from-forge-cyan/10 to-white/[0.035] p-4 light:border-sky-200 light:from-sky-50 light:to-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-forge-cyan">
                  {demoMode ? 'Statische Demo' : 'Null-Start aktiv'}
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {demoMode ? 'Öffentliche Vorführdaten' : 'Alles lokal und leer vorbereitet'}
                </p>
              </div>
              {demoMode ? (
                <InfoTooltip label="Demo-Hinweis">
                  Diese Demo nutzt dieselben Views wie die echte App, aber einen separaten Fake-Datensatz. Es wird nichts in deinem echten FinanceForge-Speicher gelesen oder gespeichert.
                </InfoTooltip>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Zuletzt aktualisiert: {new Date(state.updatedAt).toLocaleString('de-DE')}
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/58 px-4 py-3 backdrop-blur-2xl light:border-slate-200 light:bg-white/85 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-forge-cyan via-sky-300 to-forge-mint text-slate-950 shadow-glow">
                  <FinanceIcon name="euro" size={21} />
                </div>
                <div>
                  <p className="text-base font-extrabold tracking-tight">FinanceForge</p>
                  <p className="text-xs text-slate-400">Lokale Finanz-App</p>
                </div>
              </div>

              <div className="hidden lg:block">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                  {formatMonth(selectedMonth)}
                </p>
                <h2 className="bg-gradient-to-r from-white via-slate-100 to-forge-cyan bg-clip-text text-3xl font-extrabold tracking-tight text-transparent light:from-slate-950 light:via-slate-800 light:to-sky-600">
                  {navItems.find((item) => item.key === activeView)?.label}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2 light:border-slate-200 light:bg-white/80">
                {demoMode ? (
                  <a
                    className="rounded-lg border border-forge-mint/30 bg-forge-mint/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-forge-mint transition hover:bg-forge-mint/15"
                    href="/"
                  >
                    Zur App
                  </a>
                ) : null}
                <label className="label" htmlFor="month-select">
                  Monat
                </label>
                <input
                  id="month-select"
                  className="field w-auto"
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => onMonthChange(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2 lg:hidden">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  className={cn(
                    'flex h-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.055] text-slate-400 transition light:border-slate-200 light:bg-white',
                    activeView === item.key && 'border-forge-cyan/60 bg-forge-cyan/10 text-forge-cyan shadow-glow',
                  )}
                  title={item.label}
                  type="button"
                  onClick={() => onViewChange(item.key)}
                >
                  <FinanceIcon name={item.icon} size={19} />
                </button>
              ))}
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {demoMode ? <DemoTour /> : null}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

const DemoTour = () => {
  const tips = [
    {
      title: 'Fake-Daten',
      body: 'Alle Konten, Buchungen, Budgets und Sparziele sind frei erfundene Vorführdaten für Screenshots und GitHub.',
      icon: 'shield',
    },
    {
      title: 'Keine Speicherung',
      body: 'Änderungen in der Demo laufen nur in der aktuellen Browser-Session und werden nicht in IndexedDB oder localStorage geschrieben.',
      icon: 'download',
    },
    {
      title: 'Echte UI',
      body: 'Die Demo verwendet die echte FinanceForge-Shell, Navigation, Formulare, Auswertungen und Diagramme.',
      icon: 'dashboard',
    },
    {
      title: 'Tooltips',
      body: 'Fahre über die Info-Symbole, um zu erklären, was Besucher auf GitHub gerade sehen.',
      icon: 'info',
    },
  ];

  return (
    <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {tips.map((tip) => (
        <div key={tip.title} className="rounded-xl border border-forge-cyan/20 bg-forge-cyan/[0.07] p-4 light:border-sky-200 light:bg-sky-50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-forge-cyan/15 text-forge-cyan">
                <FinanceIcon name={tip.icon} size={17} />
              </span>
              <p className="font-bold">{tip.title}</p>
            </div>
            <InfoTooltip label={`${tip.title} erklären`}>{tip.body}</InfoTooltip>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">{tip.body}</p>
        </div>
      ))}
    </div>
  );
};
