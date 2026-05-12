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
  buildProjection,
  getAccountBalances,
  getDailyAccountBalanceSeries,
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
import { addMonths, formatMonth, isoToday } from '../lib/date';
import { formatMoney, formatPercent, parseMoneyInput } from '../lib/format';
import { Card, EmptyState, ProgressBar, SectionHeader, StatCard } from '../components/ui';
import type { ViewProps } from './types';

export const DashboardView = ({ state, setState, selectedMonth, notify }: ViewProps) => {
  const [quickTransferAmount, setQuickTransferAmount] = useState('');
  const [quickTransferNote, setQuickTransferNote] = useState('');
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

  const submitQuickTransfer = (event: FormEvent) => {
    event.preventDefault();
    const amount = parseMoneyInput(quickTransferAmount);
    if (amount <= 0) {
      notify('Bitte einen positiven Betrag für die Eigenüberweisung eingeben.');
      return;
    }
    if (amount > privateBalance) {
      notify('Der Betrag ist höher als dein aktuelles Privatkonto.');
      return;
    }
    setState((current) => ({
      ...current,
      accountTransfers: [
        ...current.accountTransfers,
        {
          id: createId('transfer'),
          date: isoToday(),
          fromAccountId: 'account-private',
          toAccountId: 'account-savings',
          amount,
          note: quickTransferNote.trim() || 'Sparziel-Eigenüberweisung',
          tags: current.tags.some((tag) => tag.id === 'tag-eigenueberweisung') ? ['tag-eigenueberweisung'] : [],
        },
      ],
    }));
    setQuickTransferAmount('');
    setQuickTransferNote('');
    notify('Eigenüberweisung aufs Sparkonto gespeichert.');
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
          <div key={account.accountId} className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="label">{account.name}</p>
                <p className="mt-2 text-2xl font-extrabold">{formatMoney(account.balance)}</p>
              </div>
              <span className="h-3 w-3 rounded-full shadow-glow" style={{ backgroundColor: account.color }} />
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Snapshot {formatMoney(account.openingBalance)}
            </p>
          </div>
        ))}
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
          <SectionHeader title="Schnell sparen" description="Eigenüberweisung direkt vom Privatkonto aufs Sparkonto." />
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
                placeholder="z. B. Monats-Sparen"
              />
            </label>
            <div className="flex items-end">
              <button className="btn btn-primary w-full" type="submit">
                Verschieben
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
            <p className="label">Ins Sparkonto verschoben</p>
            <p className="mt-1 text-xl font-bold text-forge-cyan">{formatMoney(dailySavingsTransferTotal)}</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailySeries}>
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
