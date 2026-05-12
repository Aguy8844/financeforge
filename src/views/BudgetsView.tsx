import { useMemo, useState, type FormEvent } from 'react';
import { createId } from '../data/demoData';
import { expenseOccursInMonth, getMonthlySummary } from '../lib/calculations';
import { daysInMonth, elapsedDaysInMonth } from '../lib/date';
import { formatMoney, formatPercent, parseMoneyInput } from '../lib/format';
import type { Budget } from '../types';
import { Card, EmptyState, ProgressBar, SectionHeader, StatCard } from '../components/ui';
import type { ViewProps } from './types';

const budgetStatus = (percent: number) => {
  if (percent > 100) return { label: 'Überschritten', className: 'text-rose-300' };
  if (percent > 90) return { label: 'Kritisch', className: 'text-rose-300' };
  if (percent > 70) return { label: 'Achtung', className: 'text-amber-300' };
  return { label: 'Gut', className: 'text-emerald-300' };
};

const emptyForm = {
  name: '',
  amount: '',
  categoryId: '',
  active: true,
};

export const BudgetsView = ({ state, setState, selectedMonth, notify }: ViewProps) => {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const summary = getMonthlySummary(state, selectedMonth);
  const expenseCategories = useMemo(
    () => state.categories.filter((category) => category.type === 'expense'),
    [state.categories],
  );

  const categorySpend = (categoryId?: string) =>
    categoryId
      ? state.expenseEntries
          .filter((entry) => entry.categoryId === categoryId && expenseOccursInMonth(entry, selectedMonth))
          .reduce((sum, entry) => sum + entry.amount, 0)
      : summary.expenseTotal;

  const reset = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const amount = parseMoneyInput(form.amount);
    if (!form.name.trim() || amount <= 0) {
      notify('Budgetname und positiver Betrag sind erforderlich.');
      return;
    }
    const budget: Budget = {
      id: editingId ?? createId('budget'),
      name: form.name.trim(),
      amount,
      categoryId: form.categoryId || undefined,
      period: 'monthly',
      active: form.active,
    };

    setState((current) => ({
      ...current,
      settings: budget.categoryId ? current.settings : { ...current.settings, monthlyBudget: budget.amount },
      budgets: editingId
        ? current.budgets.map((item) => (item.id === editingId ? budget : item))
        : [...current.budgets, budget],
    }));
    notify(editingId ? 'Budget aktualisiert.' : 'Budget gespeichert.');
    reset();
  };

  const edit = (budget: Budget) => {
    setEditingId(budget.id);
    setForm({
      name: budget.name,
      amount: String(budget.amount),
      categoryId: budget.categoryId ?? '',
      active: budget.active,
    });
  };

  const toggleActive = (id: string) => {
    setState((current) => ({
      ...current,
      budgets: current.budgets.map((budget) =>
        budget.id === id ? { ...budget, active: !budget.active } : budget,
      ),
    }));
  };

  const remove = (id: string) => {
    setState((current) => ({
      ...current,
      budgets: current.budgets.filter((budget) => budget.id !== id),
    }));
    notify('Budget gelöscht.');
  };

  const idealUsage =
    summary.monthlyBudget * (elapsedDaysInMonth(selectedMonth) / Math.max(1, daysInMonth(selectedMonth)));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Monatsbudget" value={formatMoney(summary.monthlyBudget)} icon="budgets" tone="cyan" />
        <StatCard label="Verbraucht" value={formatMoney(summary.expenseTotal)} icon="expenses" tone={summary.isOverBudget ? 'rose' : 'amber'} />
        <StatCard label="Restbudget" value={formatMoney(summary.remainingBudget)} icon="wallet" tone={summary.remainingBudget >= 0 ? 'mint' : 'rose'} />
        <StatCard label="Idealer Verbrauch" value={formatMoney(idealUsage)} icon="calendar" tone={summary.isSpendingTooFast ? 'amber' : 'violet'} />
      </div>

      {summary.isSpendingTooFast ? (
        <Card className="border-amber-300/25 bg-amber-300/[0.08]">
          <p className="font-bold text-amber-100 light:text-amber-900">Du gibst schneller aus als geplant.</p>
          <p className="mt-1 text-sm text-amber-100/75 light:text-amber-800">
            Ideal bis heute wären {formatMoney(idealUsage)}, aktuell sind es {formatMoney(summary.expenseTotal)}.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <SectionHeader title={editingId ? 'Budget bearbeiten' : 'Budget erstellen'} />
          <form className="space-y-4" onSubmit={submit}>
            <label>
              <span className="label">Name</span>
              <input className="field mt-1" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="z. B. Freizeitbudget" />
            </label>
            <label>
              <span className="label">Betrag</span>
              <input className="field mt-1" inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="z. B. 600,00" />
            </label>
            <label>
              <span className="label">Budgetart</span>
              <select className="field mt-1" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
                <option value="">Gesamtbudget pro Monat</option>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    Kategorie: {category.name}
                  </option>
                ))}
              </select>
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
          <SectionHeader title="Budgetübersicht" />
          {state.budgets.length ? (
            <div className="space-y-3">
              {state.budgets.map((budget) => {
                const spent = categorySpend(budget.categoryId);
                const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
                const status = budgetStatus(percent);
                const category = state.categories.find((item) => item.id === budget.categoryId);
                return (
                  <div key={budget.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-4 light:border-slate-200 light:bg-slate-50">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-bold">{budget.name}</p>
                        <p className="text-sm text-slate-400">
                          {category ? category.name : 'Gesamtbudget'} · {budget.active ? 'aktiv' : 'inaktiv'}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-bold">{formatMoney(spent)} / {formatMoney(budget.amount)}</p>
                        <p className={`text-sm font-semibold ${status.className}`}>{status.label}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={spent} max={budget.amount} />
                      <p className="mt-2 text-xs text-slate-400">{formatPercent(percent, 0)} verbraucht</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className="btn py-1.5" type="button" onClick={() => edit(budget)}>
                        Bearbeiten
                      </button>
                      <button className="btn py-1.5" type="button" onClick={() => toggleActive(budget.id)}>
                        {budget.active ? 'Deaktivieren' : 'Aktivieren'}
                      </button>
                      <button className="btn btn-danger py-1.5" type="button" onClick={() => remove(budget.id)}>
                        Löschen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon="budgets" title="Keine Budgets">
              Budgets können als Gesamtbudget oder pro Kategorie angelegt werden.
            </EmptyState>
          )}
        </Card>
      </div>
    </div>
  );
};
