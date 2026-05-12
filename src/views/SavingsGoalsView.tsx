import { useMemo, useState, type DragEvent, type FormEvent } from 'react';
import { createId } from '../data/demoData';
import { getGoalMetrics, getMonthlySummary, getSavingsGoalAllocations } from '../lib/calculations';
import { formatMonth } from '../lib/date';
import { formatMoney, formatPercent, parseMoneyInput } from '../lib/format';
import type { SavingsAllocationMode, SavingsGoal } from '../types';
import { FinanceIcon } from '../components/Icons';
import { Card, EmptyState, ProgressBar, SectionHeader, StatCard } from '../components/ui';
import type { ViewProps } from './types';

const emptyForm = {
  name: '',
  targetAmount: '',
  currentAmount: '0',
  targetDate: '2027-01-01',
  category: '',
  description: '',
  icon: 'target',
  allocationPercentage: '',
  active: true,
};

const goalIconOptions = [
  { name: 'bike', label: 'Motorrad' },
  { name: 'car', label: 'Auto' },
  { name: 'cpu', label: 'PC' },
  { name: 'gamepad-2', label: 'Gaming' },
  { name: 'piggy-bank', label: 'Sparen' },
  { name: 'wallet', label: 'Geld' },
  { name: 'target', label: 'Ziel' },
  { name: 'sparkles', label: 'Wunsch' },
];

const allocationModeLabels: Record<SavingsAllocationMode, string> = {
  proportional: 'Proportional',
  priority: 'Nach Priorität',
  manual: 'Manuell %',
};

const normalizePriorities = (goals: SavingsGoal[]) =>
  goals
    .map((goal, index) => ({ ...goal, priority: index + 1 }))
    .sort((a, b) => a.priority - b.priority);

export const SavingsGoalsView = ({ state, setState, selectedMonth, notify }: ViewProps) => {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const summary = getMonthlySummary(state, selectedMonth);
  const activeGoals = useMemo(
    () => [...state.savingsGoals].filter((goal) => goal.active).sort((a, b) => a.priority - b.priority),
    [state.savingsGoals],
  );
  const goalFunding = getSavingsGoalAllocations(state);
  const allocationByGoal = new Map(goalFunding.allocations.map((allocation) => [allocation.goal.id, allocation]));
  const monthlyPool = Math.max(0, summary.surplus || state.settings.defaultSavingsRate);
  const totalWeight = activeGoals.reduce((sum, _goal, index) => sum + (activeGoals.length - index), 0) || 1;
  const suggestions = Object.fromEntries(
    activeGoals.map((goal, index) => [
      goal.id,
      monthlyPool * ((activeGoals.length - index) / totalWeight),
    ]),
  );
  const firstReachable = activeGoals
    .map((goal) => ({
      goal,
      months: getGoalMetrics(
        goal,
        suggestions[goal.id] ?? 0,
        allocationByGoal.get(goal.id)?.effectiveCurrent ?? goal.currentAmount,
      ).monthsAtCurrentRate,
    }))
    .filter((item) => Number.isFinite(item.months))
    .sort((a, b) => a.months - b.months)[0];
  const manualPercentTotal = activeGoals.reduce((sum, goal) => sum + (goal.allocationPercentage ?? 0), 0);

  const setAllocationMode = (mode: SavingsAllocationMode) => {
    setState((current) => ({
      ...current,
      settings: { ...current.settings, savingsAllocationMode: mode },
    }));
    notify(`Zielverteilung auf ${allocationModeLabels[mode]} gesetzt.`);
  };

  const reset = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const targetAmount = parseMoneyInput(form.targetAmount);
    const currentAmount = parseMoneyInput(form.currentAmount);
    if (!form.name.trim() || targetAmount <= 0) {
      notify('Name und Zielbetrag sind erforderlich.');
      return;
    }
    const nextPriority =
      editingId
        ? state.savingsGoals.find((goal) => goal.id === editingId)?.priority ?? state.savingsGoals.length + 1
        : state.savingsGoals.length + 1;
    const goal: SavingsGoal = {
      id: editingId ?? createId('goal'),
      name: form.name.trim(),
      targetAmount,
      currentAmount: Math.max(0, currentAmount),
      priority: nextPriority,
      targetDate: form.targetDate,
      category: form.category.trim() || 'Allgemein',
      description: form.description.trim(),
      icon: form.icon.trim() || 'target',
      allocationPercentage: form.allocationPercentage ? Math.max(0, Number(form.allocationPercentage)) : undefined,
      active: form.active,
    };

    setState((current) => ({
      ...current,
      savingsGoals: editingId
        ? current.savingsGoals.map((item) => (item.id === editingId ? goal : item))
        : normalizePriorities([...current.savingsGoals, goal]),
    }));
    notify(editingId ? 'Sparziel aktualisiert.' : 'Sparziel gespeichert.');
    reset();
  };

  const edit = (goal: SavingsGoal) => {
    setEditingId(goal.id);
    setForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      targetDate: goal.targetDate,
      category: goal.category,
      description: goal.description,
      icon: goal.icon,
      allocationPercentage: goal.allocationPercentage ? String(goal.allocationPercentage) : '',
      active: goal.active,
    });
  };

  const remove = (id: string) => {
    setState((current) => ({
      ...current,
      savingsGoals: normalizePriorities(current.savingsGoals.filter((goal) => goal.id !== id)),
    }));
    notify('Sparziel gelöscht.');
  };

  const setMainGoal = (id: string) => {
    setState((current) => {
      const sorted = [...current.savingsGoals].sort((a, b) => a.priority - b.priority);
      const selected = sorted.find((goal) => goal.id === id);
      const rest = sorted.filter((goal) => goal.id !== id);
      return {
        ...current,
        savingsGoals: normalizePriorities(selected ? [selected, ...rest] : sorted),
      };
    });
    notify('Hauptziel aktualisiert.');
  };

  const onDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    setState((current) => {
      const sorted = [...current.savingsGoals].sort((a, b) => a.priority - b.priority);
      const fromIndex = sorted.findIndex((goal) => goal.id === draggingId);
      const toIndex = sorted.findIndex((goal) => goal.id === targetId);
      if (fromIndex < 0 || toIndex < 0) return current;
      const [moved] = sorted.splice(fromIndex, 1);
      sorted.splice(toIndex, 0, moved);
      return { ...current, savingsGoals: normalizePriorities(sorted) };
    });
    setDraggingId(null);
  };

  const dragProps = (goal: SavingsGoal) => ({
    draggable: true,
    onDragStart: (event: DragEvent) => {
      event.dataTransfer.effectAllowed = 'move';
      setDraggingId(goal.id);
    },
    onDragOver: (event: DragEvent) => event.preventDefault(),
    onDrop: () => onDrop(goal.id),
  });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Aktive Ziele" value={String(activeGoals.length)} icon="goals" tone="violet" />
        <StatCard
          label="Sparkonto-Pool"
          value={formatMoney(goalFunding.savingsPool)}
          icon="piggy-bank"
          tone="mint"
          detail="zählt direkt zu Zielen"
        />
        <StatCard
          label="Zielabdeckung"
          value={formatPercent(goalFunding.coverage, 1)}
          icon="line-chart"
          tone={goalFunding.coverage >= 25 ? 'cyan' : 'amber'}
          detail={`von ${formatMoney(goalFunding.totalTarget)}`}
        />
        <StatCard label="Monats-Spielraum" value={formatMoney(monthlyPool)} icon="wallet" tone="mint" />
        <StatCard
          label="Zuerst erreichbar"
          value={firstReachable?.goal.name ?? 'Noch offen'}
          icon="calendar"
          tone="cyan"
          detail={firstReachable ? `${firstReachable.months} Monate` : undefined}
        />
      </div>

      <Card>
        <SectionHeader
          title="Sparziel-Verteilung"
          description="Lege fest, wie das Sparkonto auf deine Ziele gerechnet wird."
        />
        <div className="grid gap-3 md:grid-cols-3">
          {(['proportional', 'priority', 'manual'] as SavingsAllocationMode[]).map((mode) => (
            <button
              key={mode}
              className={`btn ${state.settings.savingsAllocationMode === mode ? 'btn-primary' : ''}`}
              type="button"
              onClick={() => setAllocationMode(mode)}
            >
              {allocationModeLabels[mode]}
            </button>
          ))}
        </div>
        {state.settings.savingsAllocationMode === 'manual' ? (
          <p className={`mt-4 rounded-xl p-3 text-sm ${Math.round(manualPercentTotal) === 100 ? 'bg-emerald-400/10 text-emerald-200' : 'bg-amber-400/10 text-amber-200'}`}>
            Manuelle Summe: {manualPercentTotal.toFixed(0).replace('.', ',')} %. Zielwerte kannst du beim Bearbeiten eines Sparziels setzen.
          </p>
        ) : null}
      </Card>

      <Card className="border-emerald-400/20 bg-[linear-gradient(135deg,rgba(71,215,172,0.1),rgba(56,189,248,0.05))]">
        <SectionHeader
          title="Sparkonto = Sparziel-Fortschritt"
          description="Dein Privatkonto bleibt für Alltag und Ausgaben. Alles am Sparkonto wird als aktiver Ziel-Pool gerechnet und proportional auf deine Ziele verteilt."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-slate-950/25 p-4 light:border-slate-200 light:bg-white/70">
            <p className="label">Aktuell im Ziel-Pool</p>
            <p className="mt-2 text-2xl font-extrabold">{formatMoney(goalFunding.savingsPool)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/25 p-4 light:border-slate-200 light:bg-white/70">
            <p className="label">Noch offen gesamt</p>
            <p className="mt-2 text-2xl font-extrabold">
              {formatMoney(Math.max(0, goalFunding.totalTarget - goalFunding.totalCovered))}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/25 p-4 light:border-slate-200 light:bg-white/70">
            <p className="label">Nächster sinnvoller Move</p>
            <p className="mt-2 text-lg font-bold text-forge-mint">Eigenüberweisung aufs Sparkonto</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <SectionHeader title={editingId ? 'Sparziel bearbeiten' : 'Sparziel anlegen'} />
          <form className="space-y-4" onSubmit={submit}>
            <label>
              <span className="label">Name</span>
              <input className="field mt-1" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="z. B. Honda CBR500R" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="label">Zielbetrag</span>
                <input className="field mt-1" inputMode="decimal" value={form.targetAmount} onChange={(event) => setForm({ ...form, targetAmount: event.target.value })} placeholder="z. B. 3.500,00" />
              </label>
              <label>
                <span className="label">Manueller Zusatzfortschritt</span>
                <input className="field mt-1" inputMode="decimal" value={form.currentAmount} onChange={(event) => setForm({ ...form, currentAmount: event.target.value })} placeholder="z. B. 250,00" />
                <span className="mt-1 block text-xs text-slate-500">
                  Das Sparkonto wird automatisch zusätzlich angerechnet.
                </span>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="label">Wunschdatum</span>
                <input className="field mt-1" type="date" value={form.targetDate} onChange={(event) => setForm({ ...form, targetDate: event.target.value })} />
              </label>
              <label>
                <span className="label">Kategorie</span>
                <input className="field mt-1" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
              </label>
            </div>
            <label>
              <span className="label">Manuelle Zielverteilung in %</span>
              <input
                className="field mt-1"
                min="0"
                max="100"
                step="1"
                type="number"
                value={form.allocationPercentage}
                onChange={(event) => setForm({ ...form, allocationPercentage: event.target.value })}
                placeholder="z. B. 50"
              />
            </label>
            <div>
              <span className="label">Icon</span>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {goalIconOptions.map((option) => (
                  <button
                    key={option.name}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${
                      form.icon === option.name
                        ? 'border-forge-cyan bg-forge-cyan/15 text-forge-cyan'
                        : 'border-white/10 text-slate-300 hover:border-white/25 light:border-slate-200 light:text-slate-700'
                    }`}
                    type="button"
                    onClick={() => setForm({ ...form, icon: option.name })}
                  >
                    <FinanceIcon name={option.name} size={18} />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <label>
              <span className="label">Beschreibung</span>
              <textarea className="field mt-1 min-h-20" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 light:text-slate-700">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
              Aktiv
            </label>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary" type="submit">
                {editingId ? 'Aktualisieren' : 'Speichern'}
              </button>
              {editingId ? (
                <button className="btn" type="button" onClick={reset}>
                  Abbrechen
                </button>
              ) : null}
            </div>
          </form>
        </Card>

        <Card>
          <SectionHeader title="Prioritäten" description="Ziele können per Drag & Drop neu sortiert werden." />
          {state.savingsGoals.length ? (
            <div className="space-y-3">
              {[...state.savingsGoals]
                .sort((a, b) => a.priority - b.priority)
                .map((goal) => {
                  const contribution = suggestions[goal.id] ?? 0;
                  const allocation = allocationByGoal.get(goal.id);
                  const effectiveCurrent = allocation?.effectiveCurrent ?? goal.currentAmount;
                  const metrics = getGoalMetrics(goal, contribution, effectiveCurrent);
                  return (
                    <div
                      key={goal.id}
                      {...dragProps(goal)}
                      className="cursor-move rounded-xl border border-white/10 bg-white/[0.035] p-4 light:border-slate-200 light:bg-slate-50"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-forge-cyan light:bg-slate-100">
                            <FinanceIcon name={goal.icon} size={20} />
                          </div>
                          <div>
                            <p className="font-bold">
                              {goal.priority}. {goal.name}
                              {goal.priority === 1 ? <span className="ml-2 text-xs text-forge-mint">Hauptziel</span> : null}
                            </p>
                            <p className="text-sm text-slate-400">
                              Rest {formatMoney(metrics.remaining)} · {formatPercent(metrics.progress, 0)}
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                              Benötigt {formatMoney(metrics.requiredMonthly)} monatlich bis {formatMonth(goal.targetDate.slice(0, 7))}
                            </p>
                          </div>
                        </div>
                        <div className="min-w-44 text-left md:text-right">
                          <p className="text-sm text-slate-400">Vorschlag</p>
                          <p className="font-bold">{formatMoney(contribution)} / Monat</p>
                          <p className={metrics.realistic ? 'text-sm text-emerald-300' : 'text-sm text-amber-300'}>
                            {metrics.realistic ? 'realistisch' : 'mehr Sparrate nötig'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-4">
                        <div className="rounded-lg border border-white/10 px-3 py-2 light:border-slate-200">
                          <p className="text-xs text-slate-400">Sparkonto-Anteil</p>
                          <p className="font-bold">{formatMoney(allocation?.savingsShare ?? 0)}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 px-3 py-2 light:border-slate-200">
                          <p className="text-xs text-slate-400">Manuell %</p>
                          <p className="font-bold">{goal.allocationPercentage ?? 0} %</p>
                        </div>
                        <div className="rounded-lg border border-white/10 px-3 py-2 light:border-slate-200">
                          <p className="text-xs text-slate-400">Manuell extra</p>
                          <p className="font-bold">{formatMoney(allocation?.manualAmount ?? goal.currentAmount)}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 px-3 py-2 light:border-slate-200">
                          <p className="text-xs text-slate-400">Wirksamer Stand</p>
                          <p className="font-bold">{formatMoney(effectiveCurrent)}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <ProgressBar value={effectiveCurrent} max={goal.targetAmount} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button className="btn py-1.5" type="button" onClick={() => setMainGoal(goal.id)}>
                          Als Hauptziel
                        </button>
                        <button className="btn py-1.5" type="button" onClick={() => edit(goal)}>
                          Bearbeiten
                        </button>
                        <button className="btn btn-danger py-1.5" type="button" onClick={() => remove(goal.id)}>
                          Löschen
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <EmptyState icon="goals" title="Keine Sparziele">
              Neue Ziele werden nach Priorität sortiert und in die Dashboard-Auswertung übernommen.
            </EmptyState>
          )}
        </Card>
      </div>
    </div>
  );
};
