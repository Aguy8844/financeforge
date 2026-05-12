import { useMemo, useState, type FormEvent } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { createId } from '../data/demoData';
import {
  getAccountBalances,
  getAverageMonthlyExpenses,
  getDailyMonthSeries,
  getExpenseModeTotals,
  getExpenseReviewStats,
  getHighestExpenses,
  getMonthSeries,
  getMonthlySummary,
  getWeeklyMonthSeries,
} from '../lib/calculations';
import { addMonths, defaultEntryDateForMonth, formatDate } from '../lib/date';
import { formatMoney, parseMoneyInput } from '../lib/format';
import type { ExpenseEntry, ExpenseReview, RecurrenceFrequency } from '../types';
import { Card, EmptyState, SectionHeader, StatCard } from '../components/ui';
import type { ViewProps } from './types';

type RepeatMode = 'once' | 'monthly' | 'custom';

const emptyForm = (selectedMonth: string, firstCategoryId: string) => ({
  date: defaultEntryDateForMonth(selectedMonth),
  name: '',
  amount: '',
  categoryId: firstCategoryId,
  accountId: 'account-private',
  tags: [] as string[],
  paymentMethod: '',
  note: '',
  review: 'ok' as ExpenseReview,
  repeatMode: 'once' as RepeatMode,
  startMonth: selectedMonth,
  endMonth: '',
  frequency: 'monthly' as RecurrenceFrequency,
  intervalMonths: '1',
  active: true,
});

const recurrenceText = (entry: ExpenseEntry) => {
  if (entry.type === 'one-time') return 'Einmalig';
  if (entry.recurrenceRule?.frequency === 'monthly') return 'Monatlich';
  if (entry.recurrenceRule?.frequency === 'biMonthly') return 'Alle 2 Monate';
  if (entry.recurrenceRule?.frequency === 'quarterly') return 'Quartalsweise';
  if (entry.recurrenceRule?.frequency === 'yearly') return 'Jährlich';
  return `Alle ${entry.recurrenceRule?.intervalMonths ?? 1} Monate`;
};

const reviewLabel: Record<ExpenseReview, string> = {
  necessary: 'notwendig',
  ok: 'okay',
  unnecessary: 'unnötig',
};

export const ExpensesView = ({ state, setState, selectedMonth, notify }: ViewProps) => {
  const expenseCategories = useMemo(
    () => state.categories.filter((category) => category.type === 'expense'),
    [state.categories],
  );
  const firstCategoryId = expenseCategories[0]?.id ?? 'expense-other';
  const [form, setForm] = useState(emptyForm(selectedMonth, firstCategoryId));
  const [editingId, setEditingId] = useState<string | null>(null);
  const summary = getMonthlySummary(state, selectedMonth);
  const accountBalances = getAccountBalances(state);
  const privateBalance = accountBalances.find((account) => account.accountId === 'account-private')?.balance ?? 0;
  const savingsBalance = accountBalances.find((account) => account.accountId === 'account-savings')?.balance ?? 0;
  const previousSummary = getMonthlySummary(state, addMonths(selectedMonth, -1));
  const trend = getMonthSeries(state, addMonths(selectedMonth, -5), 6);
  const dailySeries = getDailyMonthSeries(state, selectedMonth);
  const weeklySeries = getWeeklyMonthSeries(state, selectedMonth);
  const expenseModeTotals = getExpenseModeTotals(state, selectedMonth);
  const reviewStats = getExpenseReviewStats(state, selectedMonth);
  const averageExpenses = getAverageMonthlyExpenses(state, 6);
  const highestExpenses = getHighestExpenses(state, 5);
  const frequentCategory = summary.topCategories[0]?.name ?? 'Keine Daten';
  const frequentTag = summary.topTags[0]?.name ?? 'Keine Daten';
  const budgetPressure = summary.expenseTotal - summary.idealBudgetUsage;
  const flexibleSpend = summary.topTags
    .filter((tag) => ['Freizeit', 'Essen/Trinken'].includes(tag.name))
    .reduce((sum, tag) => sum + tag.amount, 0);
  const noSpendRecoveryDays =
    budgetPressure > 0 && summary.dailyBudget > 0 ? Math.ceil(budgetPressure / summary.dailyBudget) : 0;
  const trackedExpenseDays = dailySeries.filter((day) => day.Ausgaben > 0).length;
  const mostExpensiveDay = dailySeries.reduce((highest, day) =>
    day.Ausgaben > highest.Ausgaben ? day : highest,
  );
  const savingsTransferTotal = dailySeries.reduce((sum, day) => sum + day.Sparen, 0);
  const quickTags = useMemo(
    () => state.tags.filter((tag) => tag.type === 'expense' || tag.type === 'general'),
    [state.tags],
  );
  const selectedAccount = state.accounts.find((account) => account.id === form.accountId);
  const isBeforeAccountSnapshot = Boolean(selectedAccount && form.date <= selectedAccount.openingDate);

  const reset = () => {
    setEditingId(null);
    setForm(emptyForm(selectedMonth, firstCategoryId));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const amount = parseMoneyInput(form.amount);
    if (!form.name.trim() || amount <= 0) {
      notify('Beschreibung und positiver Betrag sind erforderlich.');
      return;
    }

    const isRecurring = form.repeatMode !== 'once';
    const entry: ExpenseEntry = {
      id: editingId ?? createId('expense'),
      date: form.date,
      name: form.name.trim(),
      amount,
      categoryId: form.categoryId,
      accountId: form.accountId || undefined,
      tags: form.tags,
      paymentMethod: form.paymentMethod.trim() || undefined,
      note: form.note.trim() || undefined,
      review: form.review,
      type: isRecurring ? 'recurring' : 'one-time',
      active: form.active,
      startDate: isRecurring ? `${form.startMonth}-01` : undefined,
      endDate: isRecurring && form.endMonth ? `${form.endMonth}-01` : undefined,
      recurrenceRule: isRecurring
        ? {
            frequency: form.repeatMode === 'monthly' ? 'monthly' : form.frequency,
            intervalMonths:
              form.frequency === 'custom' ? Math.max(1, Number(form.intervalMonths) || 1) : undefined,
          }
        : undefined,
    };

    setState((current) => ({
      ...current,
      expenseEntries: editingId
        ? current.expenseEntries.map((item) => (item.id === editingId ? entry : item))
        : [...current.expenseEntries, entry],
    }));
    notify(editingId ? 'Ausgabe aktualisiert.' : 'Ausgabe gespeichert.');
    reset();
  };

  const edit = (entry: ExpenseEntry) => {
    const repeatMode: RepeatMode =
      entry.type === 'one-time'
        ? 'once'
        : entry.recurrenceRule?.frequency === 'monthly'
          ? 'monthly'
          : 'custom';
    setEditingId(entry.id);
    setForm({
      date: entry.date,
      name: entry.name,
      amount: String(entry.amount),
      categoryId: entry.categoryId,
      accountId: entry.accountId ?? 'account-private',
      tags: entry.tags ?? [],
      paymentMethod: entry.paymentMethod ?? '',
      note: entry.note ?? '',
      review: entry.review ?? 'ok',
      repeatMode,
      startMonth: entry.startDate?.slice(0, 7) ?? selectedMonth,
      endMonth: entry.endDate?.slice(0, 7) ?? '',
      frequency: entry.recurrenceRule?.frequency ?? 'monthly',
      intervalMonths: String(entry.recurrenceRule?.intervalMonths ?? 1),
      active: entry.active,
    });
  };

  const remove = (id: string) => {
    setState((current) => ({
      ...current,
      expenseEntries: current.expenseEntries.filter((entry) => entry.id !== id),
    }));
    notify('Ausgabe gelöscht.');
  };

  const toggleTag = (tagId: string) => {
    setForm((current) => ({
      ...current,
      tags: current.tags.includes(tagId)
        ? current.tags.filter((id) => id !== tagId)
        : [...current.tags, tagId],
    }));
  };

  const selectAccount = (accountId: string) => {
    const accountTagIds = state.accounts
      .map((account) => account.tagId)
      .filter((tagId): tagId is string => Boolean(tagId));
    const account = state.accounts.find((item) => item.id === accountId);
    setForm((current) => ({
      ...current,
      accountId,
      tags: [
        ...current.tags.filter((tagId) => !accountTagIds.includes(tagId)),
        ...(account?.tagId ? [account.tagId] : []),
      ],
    }));
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Ausgaben Monat" value={formatMoney(summary.expenseTotal)} icon="expenses" tone="rose" />
        <StatCard label="Ø pro Monat" value={formatMoney(averageExpenses)} icon="chart" tone="cyan" />
        <StatCard
          label="Vergleich Vormonat"
          value={formatMoney(summary.expenseTotal - previousSummary.expenseTotal)}
          icon="line-chart"
          tone={summary.expenseTotal <= previousSummary.expenseTotal ? 'mint' : 'amber'}
        />
        <StatCard label="Top-Kategorie" value={frequentCategory} icon="circle" tone="violet" />
        <StatCard label="Stärkster Tag" value={frequentTag} icon="sparkles" tone="amber" />
      </div>

      <Card className={budgetPressure > 0 ? 'border-rose-400/30' : 'border-emerald-400/20'}>
        <SectionHeader
          title="Ausgaben-Bremse"
          description="Diese Werte zeigen dir, wo du sofort Druck rausnehmen kannst."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 light:border-slate-200 light:bg-slate-50">
            <p className="label">Gegen idealen Verlauf</p>
            <p className={`mt-2 text-2xl font-extrabold ${budgetPressure > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
              {budgetPressure > 0 ? `+${formatMoney(budgetPressure)}` : formatMoney(Math.abs(budgetPressure))}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 light:border-slate-200 light:bg-slate-50">
            <p className="label">Freizeit + Essen/Trinken</p>
            <p className="mt-2 text-2xl font-extrabold">{formatMoney(flexibleSpend)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 light:border-slate-200 light:bg-slate-50">
            <p className="label">Empfehlung</p>
            <p className="mt-2 text-xl font-extrabold">
              {noSpendRecoveryDays > 0 ? `${noSpendRecoveryDays} No-Spend-Tage` : 'Plan halten'}
            </p>
          </div>
        </div>
        <p className="mt-4 rounded-xl bg-slate-950/35 p-4 text-sm leading-6 text-slate-300 light:bg-white/75 light:text-slate-700">
          {budgetPressure > 0
            ? 'Du liegst vor deinem Budgettempo. Bis du wieder im Plan bist: keine spontanen Snacks, Lieferdienste, Geschenke oder Freizeitkäufe ohne vorherige Notiz.'
            : 'Du bist unter dem idealen Verbrauch. Halte die Linie und schiebe geplante Sparbeträge direkt aufs Sparkonto.'}
        </p>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <SectionHeader title="Fixkosten vs. variabel" description="Was jeden Monat automatisch kommt und was du aktiv steuern kannst." />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
              <p className="label">Fixkosten</p>
              <p className="mt-1 text-xl font-bold">{formatMoney(expenseModeTotals.fixed)}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
              <p className="label">Variabel</p>
              <p className="mt-1 text-xl font-bold">{formatMoney(expenseModeTotals.variable)}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
              <p className="label">Fixkosten-Anteil</p>
              <p className="mt-1 text-xl font-bold">{expenseModeTotals.fixedShare.toFixed(0).replace('.', ',')} %</p>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Ausgaben-Review" description="Markiere Ausgaben als notwendig, okay oder unnötig." />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
              <p className="label">Notwendig</p>
              <p className="mt-1 text-xl font-bold text-forge-mint">{formatMoney(reviewStats.necessary)}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
              <p className="label">Okay</p>
              <p className="mt-1 text-xl font-bold">{formatMoney(reviewStats.ok)}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
              <p className="label">Unnötig</p>
              <p className="mt-1 text-xl font-bold text-rose-300">{formatMoney(reviewStats.unnecessary)}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader
          title="Tagesauswertung"
          description="Jeder Tag wird einzeln getrackt: Ausgaben, Einnahmen und Eigenüberweisungen aufs Sparkonto."
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
            <p className="mt-1 text-xl font-bold">{formatMoney(summary.incomeTotal)}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
            <p className="label">Getrackte Ausgabentage</p>
            <p className="mt-1 text-xl font-bold">{trackedExpenseDays}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
            <p className="label">Höchster Tagesabfluss</p>
            <p className="mt-1 text-xl font-bold">
              {mostExpensiveDay.label}. · {formatMoney(mostExpensiveDay.Ausgaben)}
            </p>
          </div>
        </div>
        <div className="mb-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 p-3 light:border-slate-200">
            <p className="label">Ins Sparkonto verschoben</p>
            <p className="mt-1 text-xl font-bold text-forge-mint">{formatMoney(savingsTransferTotal)}</p>
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
          description="Separate Säulenstatistik, damit du direkte Tagesvergleiche schneller erkennst."
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

      <Card>
        <SectionHeader title="Wochenansicht" description="Ausgaben, Einnahmen und Netto je Woche." />
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

      <div className="grid gap-6">
        <Card>
          <SectionHeader title={editingId ? 'Ausgabe bearbeiten' : 'Ausgabe erfassen'} />
          <form className="space-y-5" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="label">Datum</span>
                <input className="field mt-1" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
              </label>
              <label>
                <span className="label">Betrag</span>
                <input className="field mt-1" inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="z. B. 12,50" />
              </label>
            </div>
            <label>
              <span className="label">Name/Beschreibung</span>
              <input className="field mt-1" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="z. B. Lebensmittel" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="label">Kategorie</span>
                <select className="field mt-1" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
                  {expenseCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label">Zahlungsart optional</span>
                <input className="field mt-1" value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })} placeholder="Karte, Bar, Überweisung" />
              </label>
            </div>
            <label>
              <span className="label">Vermögenskonto</span>
              <select className="field mt-1" value={form.accountId} onChange={(event) => selectAccount(event.target.value)}>
                <option value="">Kein Konto</option>
                {state.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </label>
            {isBeforeAccountSnapshot ? (
              <p className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100 light:text-amber-800">
                Diese Buchung liegt am oder vor dem Snapshot von {selectedAccount?.name}. Sie erscheint in der Monatsstatistik,
                verändert den aktuellen Kontostand aber nicht. Für neue Ausgaben nutze das heutige Datum.
              </p>
            ) : null}

            <div>
              <span className="label">Quick-Tags</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {quickTags.map((tag) => (
                  <button
                    key={tag.id}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      form.tags.includes(tag.id)
                        ? 'border-transparent text-slate-950'
                        : 'border-white/10 text-slate-300 hover:border-white/25 light:border-slate-200 light:text-slate-700'
                    }`}
                    style={form.tags.includes(tag.id) ? { backgroundColor: tag.color } : undefined}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="label">Art</span>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                {[
                  ['once', 'Einmalig'],
                  ['monthly', 'Monatlich'],
                  ['custom', 'Benutzerdefiniert'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={`btn ${form.repeatMode === value ? 'btn-primary' : ''}`}
                    type="button"
                    onClick={() => setForm({ ...form, repeatMode: value as RepeatMode })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {form.repeatMode !== 'once' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="label">Startmonat</span>
                  <input className="field mt-1" type="month" value={form.startMonth} onChange={(event) => setForm({ ...form, startMonth: event.target.value })} />
                </label>
                <label>
                  <span className="label">Endmonat optional</span>
                  <input className="field mt-1" type="month" value={form.endMonth} onChange={(event) => setForm({ ...form, endMonth: event.target.value })} />
                </label>
                {form.repeatMode === 'custom' ? (
                  <>
                    <label>
                      <span className="label">Rhythmus</span>
                      <select className="field mt-1" value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value as RecurrenceFrequency })}>
                        <option value="biMonthly">Alle 2 Monate</option>
                        <option value="quarterly">Quartalsweise</option>
                        <option value="yearly">Jährlich</option>
                        <option value="custom">Eigener Abstand</option>
                      </select>
                    </label>
                    {form.frequency === 'custom' ? (
                      <label>
                        <span className="label">Abstand in Monaten</span>
                        <input className="field mt-1" min="1" type="number" value={form.intervalMonths} onChange={(event) => setForm({ ...form, intervalMonths: event.target.value })} />
                      </label>
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : null}

            <label>
              <span className="label">Notiz optional</span>
              <textarea className="field mt-1 min-h-20" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
            </label>
            <label>
              <span className="label">Ausgaben-Review</span>
              <select
                className="field mt-1"
                value={form.review}
                onChange={(event) => setForm({ ...form, review: event.target.value as ExpenseReview })}
              >
                <option value="necessary">notwendig</option>
                <option value="ok">okay</option>
                <option value="unnecessary">unnötig</option>
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
          <SectionHeader title="Ausgabenliste" />
          {state.expenseEntries.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.08em] text-slate-400">
                  <tr>
                    <th className="py-2">Datum</th>
                    <th>Beschreibung</th>
                    <th>Kategorie</th>
                    <th>Tags</th>
                    <th>Bewertung</th>
                    <th>Art</th>
                    <th className="text-right">Betrag</th>
                    <th className="text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 light:divide-slate-200">
                  {[...state.expenseEntries]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((entry) => {
                      const category = state.categories.find((item) => item.id === entry.categoryId);
                      return (
                        <tr key={entry.id}>
                          <td className="py-4 text-slate-400">{formatDate(entry.date)}</td>
                          <td className="font-semibold">{entry.name}</td>
                          <td>{category?.name ?? 'Ohne Kategorie'}</td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {(entry.tags ?? []).slice(0, 3).map((tagId) => {
                                const tag = state.tags.find((item) => item.id === tagId);
                                return tag ? (
                                  <span key={tag.id} className="rounded-full px-2 py-0.5 text-xs font-semibold text-slate-950" style={{ backgroundColor: tag.color }}>
                                    {tag.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </td>
                          <td>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              (entry.review ?? 'ok') === 'unnecessary'
                                ? 'bg-rose-400/20 text-rose-200'
                                : (entry.review ?? 'ok') === 'necessary'
                                  ? 'bg-emerald-400/20 text-emerald-200'
                                  : 'bg-slate-500/20 text-slate-200'
                            }`}>
                              {reviewLabel[entry.review ?? 'ok']}
                            </span>
                          </td>
                          <td>{recurrenceText(entry)}</td>
                          <td className="text-right font-bold">{formatMoney(entry.amount)}</td>
                          <td className="text-right">
                            <button className="btn mr-2 py-1.5" type="button" onClick={() => edit(entry)}>
                              Bearbeiten
                            </button>
                            <button className="btn btn-danger py-1.5" type="button" onClick={() => remove(entry.id)}>
                              Löschen
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon="expenses" title="Keine Ausgaben">
              Ausgaben liefern die Grundlage für Budgetwarnungen, Kategorien und Monatsberichte.
            </EmptyState>
          )}
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <SectionHeader title="Ausgabenentwicklung" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(value) => `${Number(value)}`} width={42} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Line type="monotone" dataKey="Ausgaben" stroke="#FB7185" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Höchste Einzel-Ausgaben" />
          {highestExpenses.length ? (
            <div className="space-y-3">
              {highestExpenses.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3 light:border-slate-200">
                  <div>
                    <p className="font-semibold">{entry.name}</p>
                    <p className="text-sm text-slate-400">{formatDate(entry.date)}</p>
                  </div>
                  <p className="font-bold">{formatMoney(entry.amount)}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="expenses" title="Keine Analyse">
              Nach der ersten Ausgabe zeigt FinanceForge die größten Einzelposten.
            </EmptyState>
          )}
        </Card>
      </div>

      <Card>
        <SectionHeader title="Ausgaben nach Tags" description="Schnelle Aufschlüsselung, wohin dein Geld am meisten fließt." />
        {summary.topTags.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {summary.topTags.slice(0, 8).map((tag) => (
              <div key={tag.tagId} className="rounded-xl border border-white/10 bg-white/[0.035] p-4 light:border-slate-200 light:bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{tag.name}</p>
                    <p className="text-sm text-slate-400">{tag.count} Buchungen</p>
                  </div>
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
                </div>
                <p className="mt-3 text-xl font-extrabold">{formatMoney(tag.amount)}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="sparkles" title="Noch keine Tag-Analyse">
            Weise Ausgaben Tags zu, dann erscheint hier die Auswertung nach Themen wie Essen, Geschenke, Parken oder Abos.
          </EmptyState>
        )}
      </Card>
    </div>
  );
};
