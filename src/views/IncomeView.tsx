import { useMemo, useState, type FormEvent } from 'react';
import { createId } from '../data/demoData';
import { daysInMonth, defaultEntryDateForMonth, formatDate } from '../lib/date';
import { formatMoney, parseMoneyInput } from '../lib/format';
import type { IncomeEntry, RecurrenceFrequency } from '../types';
import { Card, EmptyState, SectionHeader } from '../components/ui';
import type { ViewProps } from './types';

type RepeatMode = 'once' | 'monthly' | 'custom';

const emptyForm = (selectedMonth: string) => ({
  date: defaultEntryDateForMonth(selectedMonth),
  name: '',
  amount: '',
  category: 'Nettoeinkommen',
  source: '',
  accountId: 'account-private',
  tags: [] as string[],
  note: '',
  repeatMode: 'once' as RepeatMode,
  startMonth: selectedMonth,
  endMonth: '',
  frequency: 'monthly' as RecurrenceFrequency,
  intervalMonths: '1',
  active: true,
  autoInclude: true,
});

const recurrenceText = (entry: IncomeEntry) => {
  if (entry.type === 'one-time') return 'Nur dieses Monat';
  if (entry.recurrenceRule?.frequency === 'monthly') return 'Jeden Monat';
  if (entry.recurrenceRule?.frequency === 'biMonthly') return 'Alle 2 Monate';
  if (entry.recurrenceRule?.frequency === 'quarterly') return 'Quartalsweise';
  if (entry.recurrenceRule?.frequency === 'yearly') return 'Jährlich';
  return `Alle ${entry.recurrenceRule?.intervalMonths ?? 1} Monate`;
};

const recurrenceStartDate = (startMonth: string, entryDate: string) => {
  const day = Number(entryDate.slice(8, 10)) || 1;
  return `${startMonth}-${String(Math.min(day, daysInMonth(startMonth))).padStart(2, '0')}`;
};

export const IncomeView = ({ state, setState, selectedMonth, notify }: ViewProps) => {
  const [form, setForm] = useState(emptyForm(selectedMonth));
  const [editingId, setEditingId] = useState<string | null>(null);
  const incomeCategories = useMemo(
    () => state.categories.filter((category) => category.type === 'income'),
    [state.categories],
  );
  const quickTags = useMemo(
    () => state.tags.filter((tag) => tag.type === 'income' || tag.type === 'general'),
    [state.tags],
  );
  const sortedIncomeEntries = useMemo(
    () => [...state.incomeEntries].sort((a, b) => b.date.localeCompare(a.date)),
    [state.incomeEntries],
  );
  const selectedAccount = state.accounts.find((account) => account.id === form.accountId);
  const isBeforeAccountSnapshot = Boolean(selectedAccount && form.date <= selectedAccount.openingDate);

  const reset = () => {
    setEditingId(null);
    setForm(emptyForm(selectedMonth));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const amount = parseMoneyInput(form.amount);
    if (!form.name.trim() || amount <= 0) {
      notify('Name und positiver Betrag sind erforderlich.');
      return;
    }

    const isRecurring = form.repeatMode !== 'once';
    const entry: IncomeEntry = {
      id: editingId ?? createId('income'),
      date: form.date,
      name: form.name.trim(),
      amount,
      category: form.category,
      source: form.source.trim() || undefined,
      accountId: form.accountId || undefined,
      tags: form.tags,
      note: form.note.trim() || undefined,
      type: isRecurring ? 'recurring' : 'one-time',
      active: form.active,
      autoInclude: isRecurring ? form.autoInclude : false,
      startDate: isRecurring ? recurrenceStartDate(form.startMonth, form.date) : undefined,
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
      incomeEntries: editingId
        ? current.incomeEntries.map((item) => (item.id === editingId ? entry : item))
        : [...current.incomeEntries, entry],
    }));
    notify(editingId ? 'Einnahme aktualisiert.' : 'Einnahme gespeichert.');
    reset();
  };

  const edit = (entry: IncomeEntry) => {
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
      category: entry.category,
      source: entry.source ?? '',
      accountId: entry.accountId ?? 'account-private',
      tags: entry.tags ?? [],
      note: entry.note ?? '',
      repeatMode,
      startMonth: entry.startDate?.slice(0, 7) ?? selectedMonth,
      endMonth: entry.endDate?.slice(0, 7) ?? '',
      frequency: entry.recurrenceRule?.frequency ?? 'monthly',
      intervalMonths: String(entry.recurrenceRule?.intervalMonths ?? 1),
      active: entry.active,
      autoInclude: entry.autoInclude,
    });
  };

  const remove = (id: string) => {
    setState((current) => ({
      ...current,
      incomeEntries: current.incomeEntries.filter((entry) => entry.id !== id),
    }));
    notify('Einnahme gelöscht.');
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
    <div className="space-y-6">
      <Card>
        <SectionHeader
          title={editingId ? 'Einnahme bearbeiten' : 'Einnahme erfassen'}
          description="Einmalige und wiederkehrende Einnahmen bleiben vollständig editierbar."
        />
        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="label">Datum</span>
              <input className="field mt-1" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            </label>
            <label>
              <span className="label">Betrag</span>
              <input className="field mt-1" inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="z. B. 220,00" />
            </label>
          </div>
          <label>
            <span className="label">Name</span>
            <input className="field mt-1" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="z. B. Nettoeinkommen" />
          </label>
          <label>
            <span className="label">Kategorie</span>
            <select className="field mt-1" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              {incomeCategories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="label">Quelle optional</span>
              <input className="field mt-1" value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} placeholder="z. B. Arbeitgeber" />
            </label>
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
          </div>
          {isBeforeAccountSnapshot ? (
            <p className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100 light:text-amber-800">
              Diese Buchung liegt am oder vor dem Snapshot von {selectedAccount?.name}. Sie erscheint in der Monatsstatistik,
              verändert den aktuellen Kontostand aber nicht. Für neue Einnahmen nutze das heutige Datum.
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
            <span className="label">Wiederholung</span>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {[
                ['once', 'Nur dieses Monat'],
                ['monthly', 'Jeden Monat'],
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
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 light:text-slate-700">
                <input type="checkbox" checked={form.autoInclude} onChange={(event) => setForm({ ...form, autoInclude: event.target.checked })} />
                Automatisch jeden Monat berücksichtigen
              </label>
            </div>
          ) : null}

          <label>
            <span className="label">Notiz optional</span>
            <textarea className="field mt-1 min-h-24" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
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
        <SectionHeader
          title="Einnahmenliste"
          description="Klarere Kartenansicht mit Betrag, Konto, Wiederholung und Tags."
          action={<span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-300 light:border-slate-200 light:text-slate-600">{sortedIncomeEntries.length} Einträge</span>}
        />
        {sortedIncomeEntries.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {sortedIncomeEntries.map((entry) => {
              const account = state.accounts.find((item) => item.id === entry.accountId);
              const category = incomeCategories.find((item) => item.name === entry.category);
              return (
                <article key={entry.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-forge-mint/35 light:border-slate-200 light:bg-slate-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-forge-mint/25 bg-forge-mint/10 px-2.5 py-1 text-xs font-bold text-forge-mint">
                          {formatDate(entry.date)}
                        </span>
                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold text-slate-400 light:border-slate-200">
                          {recurrenceText(entry)}
                        </span>
                      </div>
                      <h3 className="mt-3 break-words text-lg font-extrabold text-slate-50 light:text-slate-950">{entry.name}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category?.color ?? '#47D7AC' }} />
                          {entry.category}
                        </span>
                        {account ? <span>· {account.name}</span> : null}
                        {entry.source ? <span>· {entry.source}</span> : null}
                      </div>
                    </div>
                    <p className="shrink-0 text-right text-2xl font-extrabold text-forge-mint">{formatMoney(entry.amount)}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(entry.tags ?? []).length ? (
                      (entry.tags ?? []).slice(0, 5).map((tagId) => {
                        const tag = state.tags.find((item) => item.id === tagId);
                        return tag ? (
                          <span key={tag.id} className="rounded-full px-2.5 py-1 text-xs font-bold text-slate-950" style={{ backgroundColor: tag.color }}>
                            {tag.name}
                          </span>
                        ) : null;
                      })
                    ) : (
                      <span className="rounded-full border border-dashed border-white/15 px-2.5 py-1 text-xs text-slate-500 light:border-slate-300">Keine Tags</span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button className="btn py-1.5" type="button" onClick={() => edit(entry)}>
                      Bearbeiten
                    </button>
                    <button className="btn btn-danger py-1.5" type="button" onClick={() => remove(entry.id)}>
                      Löschen
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState icon="income" title="Keine Einnahmen">
            Erfasste Einnahmen erscheinen hier und fließen automatisch in Dashboard und Projektion ein.
          </EmptyState>
        )}
      </Card>
    </div>
  );
};
