import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useState, type FormEvent } from 'react';
import { createId } from '../data/demoData';
import {
  buildMonthlyComment,
  buildFinanceAnalyzer,
  buildProjection,
  getAccountBalances,
  getDailyAccountBalanceSeries,
  getDailyExpenseBreakdown,
  getDailyMonthSeries,
  getExpenseModeTotals,
  getGoalMetrics,
  getMonthSeries,
  getMonthlySummary,
  getReminderMessages,
  getSavingsGoalAllocations,
  getSpendingScore,
  getTodayAllowance,
  getWeeklyMonthSeries,
} from '../lib/calculations';
import { addMonths, formatDate, formatMonth, isoToday } from '../lib/date';
import { formatMoney, formatPercent, parseMoneyInput } from '../lib/format';
import { FinanceIcon } from '../components/Icons';
import { Card, EmptyState, ProgressBar, SectionHeader, StatCard } from '../components/ui';
import type { ViewProps } from './types';

type QuickTransferDirection = 'to-savings' | 'to-private';

const emptyAccountDraft = () => ({
  name: '',
  openingBalance: '',
  openingDate: isoToday(),
  color: '#38BDF8',
  icon: 'wallet',
});

export const DashboardView = ({ state, setState, selectedMonth, notify }: ViewProps) => {
  const [quickTransferDirection, setQuickTransferDirection] = useState<QuickTransferDirection>('to-savings');
  const [quickTransferAmount, setQuickTransferAmount] = useState('');
  const [quickTransferNote, setQuickTransferNote] = useState('');
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [accountDraft, setAccountDraft] = useState(emptyAccountDraft);
  const [balanceEditAccountId, setBalanceEditAccountId] = useState<string | null>(null);
  const [balanceDraft, setBalanceDraft] = useState('');
  const [selectedTrackerDate, setSelectedTrackerDate] = useState(isoToday());
  const summary = getMonthlySummary(state, selectedMonth);
  const previousMonth = getMonthlySummary(state, addMonths(selectedMonth, -1));
  const reminders = getReminderMessages(state, selectedMonth);
  const accountBalances = getAccountBalances(state);
  const totalAssets = accountBalances.reduce((sum, account) => sum + account.balance, 0);
  const privateAccount = accountBalances.find((account) => account.accountId === 'account-private');
  const savingsAccount = accountBalances.find((account) => account.accountId === 'account-savings');
  const privateBalance = privateAccount?.balance ?? 0;
  const savingsBalance = savingsAccount?.balance ?? 0;
  const goalFunding = getSavingsGoalAllocations(state);
  const budgetPressure = summary.expenseTotal - summary.idealBudgetUsage;
  const avoidableSpend = summary.topTags
    .filter((tag) => ['Freizeit', 'Essen/Trinken'].includes(tag.name))
    .reduce((sum, tag) => sum + tag.amount, 0);
  const dailySeries = getDailyMonthSeries(state, selectedMonth);
  const selectedTrackerPoint =
    dailySeries.find((day) => day.date === selectedTrackerDate) ??
    dailySeries.find((day) => day.date === isoToday()) ??
    dailySeries.find((day) => day.Ausgaben > 0) ??
    dailySeries[0];
  const selectedDayDate = selectedTrackerPoint?.date ?? `${selectedMonth}-01`;
  const dayBreakdown = getDailyExpenseBreakdown(state, selectedDayDate);
  const financeAnalyzer = buildFinanceAnalyzer(state, selectedMonth, selectedDayDate);
  const accountBalanceSeries = getDailyAccountBalanceSeries(state, selectedMonth);
  const weeklySeries = getWeeklyMonthSeries(state, selectedMonth);
  const expenseModeTotals = getExpenseModeTotals(state, selectedMonth);
  const spendingScore = getSpendingScore(state, selectedMonth);
  const todayAllowance = getTodayAllowance(state, selectedMonth);
  const spendDays = dailySeries.filter((day) => day.Ausgaben > 0).length;
  const quietDays = dailySeries.length - spendDays;
  const dailyIncomeTotal = dailySeries.reduce((sum, day) => sum + day.Einnahmen, 0);
  const dailySavingsTransferTotal = dailySeries.reduce((sum, day) => sum + day.Sparen, 0);
  const mostExpensiveDay = dailySeries.reduce((highest, day) =>
    day.Ausgaben > highest.Ausgaben ? day : highest,
  );
  const monthSeries = getMonthSeries(state, addMonths(selectedMonth, -5), 6);
  const projection = buildProjection(state, 12).map((point) => ({
    ...point,
    Vermögen: Math.round(point.balance),
    'Ohne Kapitalzufluss': Math.round(point.balanceWithoutCapital),
  }));
  const activeGoals = [...state.savingsGoals]
    .filter((goal) => goal.active)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);
  const reportComment = buildMonthlyComment(summary);
  const monthClosed = state.monthClosures.some((closure) => closure.month === selectedMonth);
  const quickTransferFromAccountId = quickTransferDirection === 'to-savings' ? 'account-private' : 'account-savings';
  const quickTransferToAccountId = quickTransferDirection === 'to-savings' ? 'account-savings' : 'account-private';
  const quickTransferFromName = quickTransferDirection === 'to-savings' ? 'Privatkonto' : 'Sparkonto';
  const quickTransferToName = quickTransferDirection === 'to-savings' ? 'Sparkonto' : 'Privatkonto';
  const quickTransferAvailable = quickTransferDirection === 'to-savings' ? privateBalance : savingsBalance;

  const submitQuickTransfer = (event: FormEvent) => {
    event.preventDefault();
    const amount = parseMoneyInput(quickTransferAmount);
    if (!privateAccount || !savingsAccount) {
      notify('Privatkonto und Sparkonto müssen vorhanden sein.');
      return;
    }
    if (amount <= 0) {
      notify('Bitte einen positiven Betrag für die Eigenüberweisung eingeben.');
      return;
    }
    if (amount > quickTransferAvailable) {
      notify(`Der Betrag ist höher als dein aktuelles ${quickTransferFromName}.`);
      return;
    }
    setState((current) => ({
      ...current,
      accountTransfers: [
        ...current.accountTransfers,
        {
          id: createId('transfer'),
          date: isoToday(),
          fromAccountId: quickTransferFromAccountId,
          toAccountId: quickTransferToAccountId,
          amount,
          note:
            quickTransferNote.trim() ||
            (quickTransferDirection === 'to-savings'
              ? 'Sparziel-Eigenüberweisung'
              : 'Sparkonto-Entnahme'),
          tags: current.tags.some((tag) => tag.id === 'tag-eigenueberweisung') ? ['tag-eigenueberweisung'] : [],
        },
      ],
    }));
    setQuickTransferAmount('');
    setQuickTransferNote('');
    notify(`${quickTransferFromName} -> ${quickTransferToName} gespeichert.`);
  };

  const addDashboardAccount = (event: FormEvent) => {
    event.preventDefault();
    if (!accountDraft.name.trim()) {
      notify('Kontoname ist erforderlich.');
      return;
    }
    const openingBalance = parseMoneyInput(accountDraft.openingBalance);
    setState((current) => {
      const accounts = [
        ...current.accounts,
        {
          id: createId('account'),
          name: accountDraft.name.trim(),
          openingBalance,
          openingDate: accountDraft.openingDate,
          color: accountDraft.color,
          icon: accountDraft.icon,
          active: true,
        },
      ];
      return {
        ...current,
        accounts,
        settings: {
          ...current.settings,
          startBalance: accounts.reduce((sum, account) => sum + account.openingBalance, 0),
        },
      };
    });
    setAccountDraft(emptyAccountDraft());
    setAccountFormOpen(false);
    notify('Konto gespeichert.');
  };

  const startBalanceEdit = (accountId: string, currentBalance: number) => {
    setBalanceEditAccountId(accountId);
    setBalanceDraft(currentBalance.toFixed(2).replace('.', ','));
  };

  const applyBalanceCorrection = (accountId: string) => {
    const targetBalance = parseMoneyInput(balanceDraft);
    setState((current) => {
      const currentBalance = getAccountBalances(current).find((account) => account.accountId === accountId)?.balance;
      if (currentBalance === undefined) return current;
      const delta = targetBalance - currentBalance;
      const accounts = current.accounts.map((account) =>
        account.id === accountId
          ? { ...account, openingBalance: account.openingBalance + delta }
          : account,
      );
      return {
        ...current,
        accounts,
        settings: {
          ...current.settings,
          startBalance: accounts.reduce((sum, account) => sum + account.openingBalance, 0),
        },
      };
    });
    setBalanceEditAccountId(null);
    setBalanceDraft('');
    notify('Kontostand korrigiert.');
  };

  const selectTrackerDayFromChart = (event: unknown) => {
    const payload = (event as { activePayload?: Array<{ payload?: { date?: string } }> })?.activePayload?.[0]?.payload;
    if (payload?.date) setSelectedTrackerDate(payload.date);
  };

  const closeMonth = () => {
    if (monthClosed) {
      notify('Monatsabschluss ist bereits gespeichert.');
      return;
    }
    setState((current) => ({
      ...current,
      monthClosures: [
        ...current.monthClosures,
        {
          id: createId('closure'),
          month: selectedMonth,
          completedAt: new Date().toISOString(),
          note: reportComment,
        },
      ],
    }));
    notify('Monatsabschluss gespeichert.');
  };

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(135deg,rgba(56,189,248,0.18),rgba(71,215,172,0.08)_42%,rgba(15,23,42,0.72))] p-5 shadow-glow backdrop-blur-2xl light:border-slate-200 light:bg-[linear-gradient(135deg,rgba(224,242,254,0.9),rgba(240,253,250,0.82),rgba(255,255,255,0.9))] sm:p-6">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-forge-cyan to-transparent" />
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-forge-cyan">
              FinanceForge Cockpit
            </p>
            <h1 className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight text-white light:text-slate-950 md:text-4xl">
              Dein Privatkonto bleibt Alltag, dein Sparkonto baut Ziele
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 light:text-slate-600">
              {formatMoney(privateBalance)} sind aktuell verfügbar. Das Sparkonto wird automatisch proportional auf deine aktiven Sparziele verteilt.
            </p>
          </div>
          <div className="grid min-w-64 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-lg border border-white/10 bg-slate-950/35 p-3 light:border-slate-200 light:bg-white/75">
              <p className="label">Vermögen</p>
              <p className="mt-1 text-xl font-bold">{formatMoney(totalAssets)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-950/35 p-3 light:border-slate-200 light:bg-white/75">
              <p className="label">Einträge</p>
              <p className="mt-1 text-xl font-bold">
                {state.incomeEntries.length + state.expenseEntries.length}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-950/35 p-3 light:border-slate-200 light:bg-white/75">
              <p className="label">Aktive Ziele</p>
              <p className="mt-1 text-xl font-bold">
                {state.savingsGoals.filter((goal) => goal.active).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Spending Score"
          value={`${spendingScore.score}/100`}
          icon="chart"
          tone={spendingScore.tone as 'mint' | 'amber' | 'rose'}
          detail={spendingScore.label}
        />
        <StatCard
          label="Gesamteinnahmen"
          value={formatMoney(summary.incomeTotal)}
          icon="income"
          tone="mint"
          detail={formatMonth(selectedMonth)}
        />
        <StatCard
          label="Gesamtausgaben"
          value={formatMoney(summary.expenseTotal)}
          icon="expenses"
          tone={summary.isOverBudget ? 'rose' : 'amber'}
          detail={`${formatPercent(summary.expenseProgress, 0)} des Budgets`}
        />
        <StatCard
          label="Überschuss"
          value={formatMoney(summary.surplus)}
          icon="wallet"
          tone={summary.surplus >= 0 ? 'cyan' : 'rose'}
          detail={`Sparquote ${formatPercent(summary.savingsRate)}`}
        />
        <StatCard
          label="Tagesbudget"
          value={formatMoney(summary.dailyBudget)}
          icon="calendar"
          tone={summary.dailyBudget >= 0 ? 'violet' : 'rose'}
          detail={`Restbudget ${formatMoney(summary.remainingBudget)}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className={summary.isSpendingTooFast || avoidableSpend > summary.monthlyBudget * 0.25 ? 'border-rose-400/30' : 'border-emerald-400/20'}>
          <SectionHeader
            title="Ausgaben-Coach"
            description="Klartext, damit dein Privatkonto nicht unnötig ausläuft."
          />
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="label">Budgetdruck</p>
              <p className={`mt-2 text-2xl font-extrabold ${budgetPressure > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                {budgetPressure > 0 ? `+${formatMoney(budgetPressure)}` : formatMoney(Math.abs(budgetPressure))}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {budgetPressure > 0 ? 'über idealem Verlauf' : 'unter idealem Verlauf'}
              </p>
            </div>
            <div>
              <p className="label">Freizeit + Essen</p>
              <p className="mt-2 text-2xl font-extrabold">{formatMoney(avoidableSpend)}</p>
              <p className="mt-1 text-sm text-slate-400">stärkster Hebel zum Bremsen</p>
            </div>
            <div>
              <p className="label">Rest pro Tag</p>
              <p className={`mt-2 text-2xl font-extrabold ${summary.dailyBudget < 10 ? 'text-rose-300' : 'text-forge-mint'}`}>
                {formatMoney(summary.dailyBudget)}
              </p>
              <p className="mt-1 text-sm text-slate-400">für den restlichen Monat</p>
            </div>
          </div>
          <p className="mt-5 rounded-xl bg-slate-950/35 p-4 text-sm leading-6 text-slate-300 light:bg-white/70 light:text-slate-700">
            {summary.isSpendingTooFast
              ? 'Stopp-Regel: Heute keine spontanen Essen/Freizeit-Ausgaben mehr. Erst wieder eintragen, wenn es bewusst geplant ist.'
              : 'Du bist im Rahmen. Halte das Privatkonto sauber und verschiebe geplante Sparbeträge direkt aufs Sparkonto.'}
          </p>
        </Card>

        <Card>
          <SectionHeader title="Sparkonto als Ziel-Pool" description="Jeder Euro dort zählt automatisch zu deinen Sparzielen." />
          <div className="space-y-4">
            <div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-slate-400">Sparkonto</span>
                <span className="font-bold">{formatMoney(goalFunding.savingsPool)}</span>
              </div>
              <div className="mt-2 flex justify-between gap-3 text-sm">
                <span className="text-slate-400">Zielabdeckung</span>
                <span className="font-bold">{formatPercent(goalFunding.coverage, 1)}</span>
              </div>
              <ProgressBar value={goalFunding.savingsPool} max={goalFunding.totalTarget} className="mt-3" />
            </div>
            <p className="text-sm text-slate-400">
              Beispiel: Eine Eigenüberweisung von {formatMoney(600)} aufs Sparkonto erhöht diesen Pool sofort und verteilt sich auf alle aktiven Ziele.
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {accountBalances.map((account) => (
          <div key={account.accountId} className="glass-panel min-h-[118px] rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="label">{account.name}</p>
                <p className="mt-2 text-2xl font-extrabold">{formatMoney(account.balance)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.045] text-slate-400 transition hover:border-forge-cyan/50 hover:text-forge-cyan light:border-slate-200 light:bg-white"
                  title="Kontostand korrigieren"
                  type="button"
                  onClick={() => startBalanceEdit(account.accountId, account.balance)}
                >
                  <FinanceIcon name="pencil" size={15} />
                </button>
                <span className="h-3 w-3 rounded-full shadow-glow" style={{ backgroundColor: account.color }} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Snapshot {formatMoney(account.openingBalance)}
            </p>
            {balanceEditAccountId === account.accountId ? (
              <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/30 p-3 light:border-slate-200 light:bg-white/75">
                <label>
                  <span className="label">Aktueller Kontostand</span>
                  <input
                    className="field mt-1"
                    inputMode="decimal"
                    value={balanceDraft}
                    onChange={(event) => setBalanceDraft(event.target.value)}
                    placeholder="z. B. 829,42"
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn btn-primary py-1.5" type="button" onClick={() => applyBalanceCorrection(account.accountId)}>
                    Setzen
                  </button>
                  <button className="btn py-1.5" type="button" onClick={() => setBalanceEditAccountId(null)}>
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ))}
        {accountFormOpen ? (
          <form className="glass-panel min-h-[118px] rounded-xl border border-dashed border-forge-cyan/40 p-4" onSubmit={addDashboardAccount}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-bold">Neues Konto</p>
              <button className="btn py-1.5" type="button" onClick={() => setAccountFormOpen(false)}>
                Abbrechen
              </button>
            </div>
            <div className="grid gap-3">
              <label>
                <span className="label">Name</span>
                <input
                  className="field mt-1"
                  value={accountDraft.name}
                  onChange={(event) => setAccountDraft({ ...accountDraft, name: event.target.value })}
                  placeholder="z. B. Tagesgeld"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="label">Snapshot-Stand</span>
                  <input
                    className="field mt-1"
                    inputMode="decimal"
                    value={accountDraft.openingBalance}
                    onChange={(event) => setAccountDraft({ ...accountDraft, openingBalance: event.target.value })}
                    placeholder="0,00"
                  />
                </label>
                <label>
                  <span className="label">Snapshot-Datum</span>
                  <input
                    className="field mt-1"
                    type="date"
                    value={accountDraft.openingDate}
                    onChange={(event) => setAccountDraft({ ...accountDraft, openingDate: event.target.value })}
                  />
                </label>
              </div>
              <div className="flex items-end gap-3">
                <label className="flex-1">
                  <span className="label">Farbe</span>
                  <input
                    className="field mt-1 h-11"
                    type="color"
                    value={accountDraft.color}
                    onChange={(event) => setAccountDraft({ ...accountDraft, color: event.target.value })}
                  />
                </label>
                <button className="btn btn-primary mb-0.5" type="submit">
                  Speichern
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            className="min-h-[118px] rounded-xl border-2 border-dashed border-white/20 bg-white/[0.025] p-4 text-left transition hover:border-forge-cyan/55 hover:bg-forge-cyan/10 light:border-slate-300 light:bg-white/70"
            type="button"
            onClick={() => setAccountFormOpen(true)}
          >
            <div className="flex h-full items-center justify-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-forge-cyan/10 text-forge-cyan light:bg-sky-50">
                <FinanceIcon name="plus-circle" size={26} />
              </span>
              <div>
                <p className="font-extrabold">Konto hinzufügen</p>
                <p className="mt-1 text-sm text-slate-400">Privat, Sparen, Depot oder Bar.</p>
              </div>
            </div>
          </button>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <SectionHeader title="Heute darf ich ausgeben" description="Tageslimit minus heutige Ausgaben." />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
              <p className="label">Erlaubt heute</p>
              <p className="mt-1 text-xl font-bold">{formatMoney(todayAllowance.allowedToday)}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
              <p className="label">Heute ausgegeben</p>
              <p className="mt-1 text-xl font-bold text-rose-300">{formatMoney(todayAllowance.spentToday)}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
              <p className="label">Heute noch frei</p>
              <p className={`mt-1 text-xl font-bold ${todayAllowance.remainingToday >= 0 ? 'text-forge-mint' : 'text-rose-300'}`}>
                {formatMoney(todayAllowance.remainingToday)}
              </p>
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-slate-950/35 p-4 text-sm leading-6 text-slate-300 light:bg-white/70 light:text-slate-700">
            {todayAllowance.remainingToday >= 0
              ? 'Bleib darunter. Alles, was du nicht brauchst, kann aufs Sparkonto und arbeitet für deine Ziele.'
              : 'Heute ist das Tageslimit gerissen. Ab jetzt nur noch notwendige Ausgaben eintragen.'}
          </p>
        </Card>

        <Card>
          <SectionHeader title="Direktüberweisung" description="Zwischen Privatkonto und Sparkonto umbuchen." />
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            {[
              {
                value: 'to-savings' as QuickTransferDirection,
                title: 'Privat -> Sparen',
                description: 'Geld zu deinen Sparzielen legen.',
              },
              {
                value: 'to-private' as QuickTransferDirection,
                title: 'Sparen -> Privat',
                description: 'Sparkonto anzapfen, wenn es nötig ist.',
              },
            ].map((option) => (
              <button
                key={option.value}
                className={`rounded-xl border p-3 text-left transition ${
                  quickTransferDirection === option.value
                    ? 'border-forge-cyan/60 bg-forge-cyan/10 shadow-glow'
                    : 'border-white/10 bg-white/[0.035] hover:border-white/25 light:border-slate-200 light:bg-white'
                }`}
                type="button"
                onClick={() => setQuickTransferDirection(option.value)}
              >
                <span className="block text-sm font-extrabold">{option.title}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-400">{option.description}</span>
              </button>
            ))}
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
              <p className="label">Von</p>
              <p className="mt-1 font-bold">{quickTransferFromName}</p>
              <p className="mt-1 text-sm text-slate-400">Verfügbar: {formatMoney(quickTransferAvailable)}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
              <p className="label">Nach</p>
              <p className="mt-1 font-bold">{quickTransferToName}</p>
              <p className="mt-1 text-sm text-slate-400">
                {quickTransferDirection === 'to-savings'
                  ? 'Erhöht deinen Sparziel-Pool.'
                  : 'Reduziert deinen Sparziel-Pool.'}
              </p>
            </div>
          </div>
          <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={submitQuickTransfer}>
            <label>
              <span className="label">Betrag</span>
              <input
                className="field mt-1"
                inputMode="decimal"
                value={quickTransferAmount}
                onChange={(event) => setQuickTransferAmount(event.target.value)}
                placeholder="z. B. 50,00"
              />
            </label>
            <label>
              <span className="label">Notiz optional</span>
              <input
                className="field mt-1"
                value={quickTransferNote}
                onChange={(event) => setQuickTransferNote(event.target.value)}
                placeholder={quickTransferDirection === 'to-savings' ? 'z. B. Monats-Sparen' : 'z. B. Reserve nutzen'}
              />
            </label>
            <div className="flex items-end">
              <button className="btn btn-primary w-full" type="submit">
                Buchen
              </button>
            </div>
          </form>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
              <p className="label">Fixkosten</p>
              <p className="mt-1 text-xl font-bold">{formatMoney(expenseModeTotals.fixed)}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
              <p className="label">Variable Ausgaben</p>
              <p className="mt-1 text-xl font-bold">{formatMoney(expenseModeTotals.variable)}</p>
            </div>
          </div>
        </Card>
      </div>

      {reminders.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {reminders.slice(0, 4).map((reminder) => (
            <div
              key={reminder.id}
              className="rounded-xl border border-amber-300/20 bg-amber-300/[0.08] p-4 text-sm light:bg-amber-50"
            >
              <p className="font-bold text-amber-100 light:text-amber-900">{reminder.title}</p>
              <p className="mt-1 text-amber-100/75 light:text-amber-800">{reminder.body}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <SectionHeader
            title="Monatsbudget"
            description={
              summary.isSpendingTooFast
                ? 'Die aktuellen Ausgaben liegen über dem idealen Tagesverlauf.'
                : 'Budgetverbrauch und Restbudget im ausgewählten Monat.'
            }
          />
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="label">Monatsbudget</p>
              <p className="mt-1 text-2xl font-bold">{formatMoney(summary.monthlyBudget)}</p>
            </div>
            <div>
              <p className="label">Idealer Verbrauch bis heute</p>
              <p className="mt-1 text-2xl font-bold">{formatMoney(summary.idealBudgetUsage)}</p>
            </div>
            <div>
              <p className="label">Vormonat Vergleich</p>
              <p className="mt-1 text-2xl font-bold">
                {formatMoney(summary.expenseTotal - previousMonth.expenseTotal)}
              </p>
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-2 flex justify-between text-sm text-slate-400">
              <span>Ausgabenfortschritt</span>
              <span>{formatPercent(summary.expenseProgress, 0)}</span>
            </div>
            <ProgressBar value={summary.expenseTotal} max={summary.monthlyBudget} />
          </div>
        </Card>

        <Card>
          <SectionHeader title="Top-Ausgabenkategorien" />
          {summary.topCategories.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.topCategories}
                    dataKey="amount"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={3}
                  >
                    {summary.topCategories.map((item) => (
                      <Cell key={item.categoryId} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon="chart" title="Keine Ausgaben im Monat">
              Sobald du Ausgaben erfasst, erscheinen hier die stärksten Kategorien.
            </EmptyState>
          )}
        </Card>
      </div>

      <Card>
        <SectionHeader
          title="Tages-Tracking"
          description="Linechart für Tagesbewegungen und kumulierte Ausgaben im ausgewählten Monat."
        />
        <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
            <p className="label">Privatkonto aktuell</p>
            <p className="mt-1 text-xl font-bold">{formatMoney(privateBalance)}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
            <p className="label">Sparkonto aktuell</p>
            <p className="mt-1 text-xl font-bold text-forge-mint">{formatMoney(savingsBalance)}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
            <p className="label">Einnahmen im Monat</p>
            <p className="mt-1 text-xl font-bold">{formatMoney(dailyIncomeTotal)}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
            <p className="label">Tage mit Ausgaben</p>
            <p className="mt-1 text-xl font-bold">{spendDays}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
            <p className="label">No-Spend-Tage</p>
            <p className="mt-1 text-xl font-bold text-forge-mint">{quietDays}</p>
          </div>
        </div>
        <div className="mb-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
            <p className="label">Teuerster Tag</p>
            <p className="mt-1 text-xl font-bold">
              {mostExpensiveDay.label}. · {formatMoney(mostExpensiveDay.Ausgaben)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
            <p className="label">Netto Sparkonto-Transfers</p>
            <p className="mt-1 text-xl font-bold text-forge-cyan">{formatMoney(dailySavingsTransferTotal)}</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailySeries} onClick={selectTrackerDayFromChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `${Number(value)}`} width={42} />
              <Tooltip formatter={(value) => formatMoney(Number(value))} labelFormatter={(label) => `${label}. Tag`} />
              <Line type="monotone" dataKey="Ausgaben" stroke="#FB7185" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Einnahmen" stroke="#47D7AC" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Sparen" stroke="#38BDF8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Kumulierte Ausgaben" stroke="#FB7185" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-xl border border-white/10 bg-slate-950/24 p-4 light:border-slate-200 light:bg-white/75">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="label">Aktiver Tag</p>
                <p className="mt-1 text-xl font-extrabold">{formatDate(selectedDayDate)}</p>
              </div>
              <div className="text-right">
                <p className="label">Ausgaben am Tag</p>
                <p className="mt-1 text-xl font-extrabold text-rose-300">{formatMoney(dayBreakdown.total)}</p>
              </div>
            </div>
            {dayBreakdown.total > 0 ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dayBreakdown.categories}
                        dataKey="amount"
                        innerRadius={48}
                        nameKey="name"
                        outerRadius={82}
                        paddingAngle={3}
                      >
                        {dayBreakdown.categories.map((item) => (
                          <Cell key={item.categoryId} fill={item.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatMoney(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="label">Wofür ausgegeben</p>
                    <div className="mt-2 space-y-2">
                      {dayBreakdown.categories.slice(0, 5).map((category) => (
                        <div key={category.categoryId} className="rounded-lg border border-white/10 p-3 light:border-slate-200">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                              <span className="font-semibold">{category.name}</span>
                            </div>
                            <span className="font-bold">{formatMoney(category.amount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="label">Einzelbuchungen</p>
                    <div className="mt-2 space-y-2">
                      {dayBreakdown.entries.slice(0, 4).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.035] p-3 light:bg-slate-50">
                          <div>
                            <p className="font-semibold">{entry.name}</p>
                            <p className="text-xs text-slate-400">{entry.tags.length ? entry.tags.join(' · ') : entry.categoryName}</p>
                          </div>
                          <p className="font-bold">{formatMoney(entry.amount)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState icon="chart" title="Keine Ausgaben an diesem Tag">
                Dieser Tag belastet dein Budget nicht.
              </EmptyState>
            )}
          </div>

          <div className="rounded-xl border border-forge-cyan/20 bg-forge-cyan/[0.07] p-4 light:border-sky-200 light:bg-sky-50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="label">Finanzen-Analyser</p>
                <p className="mt-1 text-xl font-extrabold">{financeAnalyzer.title}</p>
              </div>
              <span className="rounded-full border border-forge-cyan/30 px-2.5 py-1 text-xs font-bold text-forge-cyan">
                lokal
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300 light:text-slate-700">{financeAnalyzer.summary}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-slate-950/25 p-3 light:border-slate-200 light:bg-white/75">
                <p className="label">Einsparpotenzial</p>
                <p className="mt-1 text-xl font-bold text-forge-mint">{formatMoney(financeAnalyzer.estimatedSavings)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-950/25 p-3 light:border-slate-200 light:bg-white/75">
                <p className="label">Fokusbereich</p>
                <p className="mt-1 text-xl font-bold">{financeAnalyzer.focusLabel}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {financeAnalyzer.insights.map((insight) => (
                <div
                  key={insight.title}
                  className={`rounded-lg border p-3 ${
                    insight.severity === 'critical'
                      ? 'border-rose-300/25 bg-rose-300/10'
                      : insight.severity === 'warning'
                        ? 'border-amber-300/25 bg-amber-300/10'
                        : 'border-emerald-300/20 bg-emerald-300/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold">{insight.title}</p>
                    {insight.amount ? <p className="text-sm font-bold">{formatMoney(insight.amount)}</p> : null}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-300 light:text-slate-700">{insight.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Lokale Regelanalyse ohne externe KI-API. Ein echtes lokales LLM kann später optional angebunden werden.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader
          title="Tägliche Einnahmen/Ausgaben"
          description="Eigene Säulenstatistik für direkte Tagesvergleiche."
        />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `${Number(value)}`} width={42} />
              <Tooltip formatter={(value) => formatMoney(Number(value))} labelFormatter={(label) => `${label}. Tag`} />
              <Bar dataKey="Einnahmen" fill="#47D7AC" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Ausgaben" fill="#FB7185" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <SectionHeader title="Kontostand pro Tag" description="Privatkonto, Sparkonto und Gesamtvermögen im Monatsverlauf." />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accountBalanceSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(value) => `${Number(value)}`} width={42} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} labelFormatter={(label) => `${label}. Tag`} />
                <Line type="monotone" dataKey="Privatkonto" stroke="#38BDF8" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Sparkonto" stroke="#47D7AC" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Gesamt" stroke="#A78BFA" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Wochenansicht" description="Welche Woche dein Budget am meisten belastet." />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(value) => `${Number(value)}`} width={42} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Line type="monotone" dataKey="Ausgaben" stroke="#FB7185" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Einnahmen" stroke="#47D7AC" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Netto" stroke="#38BDF8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <SectionHeader title="Vermögensentwicklung" description="Simulation auf Basis deiner editierbaren Parameter." />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projection}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} width={42} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Line type="monotone" dataKey="Vermögen" stroke="#47D7AC" strokeWidth={3} dot={false} />
                <Line
                  type="monotone"
                  dataKey="Ohne Kapitalzufluss"
                  stroke="#A78BFA"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Monatsvergleich" description="Einnahmen, Ausgaben und Überschuss der letzten Monate." />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(value) => `${Number(value)}`} width={42} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Line type="monotone" dataKey="Einnahmen" stroke="#47D7AC" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Ausgaben" stroke="#FB7185" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Überschuss" stroke="#38BDF8" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <SectionHeader title="Wichtigste Sparziele" />
          <div className="space-y-4">
            {activeGoals.map((goal) => {
              const allocation = goalFunding.allocations.find((item) => item.goal.id === goal.id);
              const effectiveCurrent = allocation?.effectiveCurrent ?? goal.currentAmount;
              const metrics = getGoalMetrics(goal, Math.max(0, summary.surplus), effectiveCurrent);
              return (
                <div key={goal.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-4 light:border-slate-200 light:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{goal.name}</p>
                      <p className="text-sm text-slate-400">
                        Restbetrag {formatMoney(metrics.remaining)} · Sparkonto-Anteil {formatMoney(allocation?.savingsShare ?? 0)}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-300 light:text-slate-600">
                      Prio {goal.priority}
                    </span>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={effectiveCurrent} max={goal.targetAmount} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="Monatsabschluss"
            action={
              <button className="btn btn-primary" type="button" onClick={closeMonth}>
                Abschließen
              </button>
            }
          />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
              <p className="label">Einnahmen</p>
              <p className="mt-1 font-bold">{formatMoney(summary.incomeTotal)}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
              <p className="label">Ausgaben</p>
              <p className="mt-1 font-bold">{formatMoney(summary.expenseTotal)}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
              <p className="label">Sparbetrag</p>
              <p className="mt-1 font-bold">{formatMoney(summary.surplus)}</p>
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-white/[0.04] p-4 text-sm leading-6 text-slate-300 light:bg-slate-50 light:text-slate-700">
            {reportComment}
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Status: {monthClosed ? 'Monatsabschluss gespeichert' : 'Noch nicht abgeschlossen'}
          </p>
        </Card>
      </div>
    </div>
  );
};
