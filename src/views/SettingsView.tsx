import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { createDemoState, createId, defaultAccounts, defaultCategories, defaultTags } from '../data/demoData';
import { backupDateStamp, formatDate } from '../lib/date';
import { getAccountBalances } from '../lib/calculations';
import { clamp, formatMoney, parseMoneyInput } from '../lib/format';
import { ensureStateShape } from '../lib/storage';
import type { AccountTransfer, AppState, AssetAccount, Category, CategoryType, Tag, ViewKey } from '../types';
import { FinanceIcon, financeIconOptions } from '../components/Icons';
import { Card, ConfirmDialog, SectionHeader } from '../components/ui';
import type { ViewProps } from './types';

const viewOptions: Array<{ value: ViewKey; label: string }> = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'income', label: 'Einnahmen' },
  { value: 'expenses', label: 'Ausgaben' },
  { value: 'budgets', label: 'Budgets' },
  { value: 'goals', label: 'Sparziele' },
  { value: 'projection', label: 'Projektion' },
  { value: 'reminders', label: 'Erinnerungen' },
  { value: 'settings', label: 'Einstellungen' },
];

const emptyCategory = {
  name: '',
  type: 'expense' as CategoryType,
  color: '#38BDF8',
  icon: 'circle',
};

const emptyTag = {
  name: '',
  type: 'general' as Tag['type'],
  color: '#38BDF8',
  icon: 'circle',
};

const emptyTransfer = {
  date: '2026-05-10',
  fromAccountId: 'account-private',
  toAccountId: 'account-savings',
  amount: '',
  note: '',
};

const emptyAccount = {
  name: '',
  openingBalance: '',
  openingDate: '2026-05-10',
  color: '#38BDF8',
  icon: 'wallet',
};

const IconPicker = ({
  value,
  color,
  onChange,
}: {
  value: string;
  color: string;
  onChange: (icon: string) => void;
}) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 light:border-slate-200 light:bg-white/70">
    <p className="label mb-3">Icon auswählen</p>
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
      {financeIconOptions.map((icon) => {
        const active = icon.name === value;
        return (
          <button
            key={icon.name}
            className={`group flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border p-2 text-xs font-semibold transition ${
              active
                ? 'border-transparent text-slate-950 shadow-glow'
                : 'border-white/10 text-slate-400 hover:border-white/25 hover:bg-white/[0.06] light:border-slate-200 light:text-slate-600 light:hover:bg-slate-50'
            }`}
            style={active ? { backgroundColor: color } : undefined}
            title={icon.label}
            type="button"
            onClick={() => onChange(icon.name)}
          >
            <FinanceIcon name={icon.name} size={20} />
            <span className="max-w-full truncate">{icon.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

export const SettingsView = ({ state, setState, notify }: ViewProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [tagForm, setTagForm] = useState(emptyTag);
  const [transferForm, setTransferForm] = useState(emptyTransfer);
  const [accountForm, setAccountForm] = useState(emptyAccount);
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<AppState | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const accountBalances = getAccountBalances(state);

  const updateSetting = <K extends keyof typeof state.settings>(key: K, value: (typeof state.settings)[K]) => {
    setState((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
  };

  const addCategory = (event: FormEvent) => {
    event.preventDefault();
    if (!categoryForm.name.trim()) {
      notify('Kategoriename ist erforderlich.');
      return;
    }
    const category: Category = {
      id: createId('category'),
      name: categoryForm.name.trim(),
      type: categoryForm.type,
      color: categoryForm.color,
      icon: categoryForm.icon.trim() || 'circle',
    };
    setState((current) => ({ ...current, categories: [...current.categories, category] }));
    setCategoryForm(emptyCategory);
    notify('Kategorie gespeichert.');
  };

  const updateCategory = (id: string, patch: Partial<Category>) => {
    setState((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === id ? { ...category, ...patch } : category,
      ),
    }));
  };

  const removeCategory = (category: Category) => {
    const isUsed =
      state.expenseEntries.some((entry) => entry.categoryId === category.id) ||
      state.budgets.some((budget) => budget.categoryId === category.id) ||
      state.incomeEntries.some((entry) => entry.category === category.name);
    if (isUsed) {
      notify('Kategorie wird verwendet und kann nicht gelöscht werden.');
      return;
    }
    setState((current) => ({
      ...current,
      categories: current.categories.filter((item) => item.id !== category.id),
    }));
    notify('Kategorie gelöscht.');
  };

  const addTag = (event: FormEvent) => {
    event.preventDefault();
    if (!tagForm.name.trim()) {
      notify('Tag-Name ist erforderlich.');
      return;
    }
    const tag: Tag = {
      id: createId('tag'),
      name: tagForm.name.trim(),
      type: tagForm.type,
      color: tagForm.color,
      icon: tagForm.icon.trim() || 'circle',
    };
    setState((current) => ({ ...current, tags: [...current.tags, tag] }));
    setTagForm(emptyTag);
    notify('Tag gespeichert.');
  };

  const updateTag = (id: string, patch: Partial<Tag>) => {
    setState((current) => ({
      ...current,
      tags: current.tags.map((tag) => (tag.id === id ? { ...tag, ...patch } : tag)),
    }));
  };

  const removeTag = (tag: Tag) => {
    const isUsed =
      state.incomeEntries.some((entry) => entry.tags?.includes(tag.id)) ||
      state.expenseEntries.some((entry) => entry.tags?.includes(tag.id)) ||
      state.accountTransfers.some((transfer) => transfer.tags?.includes(tag.id)) ||
      state.accounts.some((account) => account.tagId === tag.id);
    if (isUsed) {
      notify('Tag wird verwendet und kann nicht gelöscht werden.');
      return;
    }
    setState((current) => ({ ...current, tags: current.tags.filter((item) => item.id !== tag.id) }));
    notify('Tag gelöscht.');
  };

  const updateAccount = (id: string, patch: Partial<AppState['accounts'][number]>) => {
    setState((current) => {
      const accounts = current.accounts.map((account) =>
        account.id === id ? { ...account, ...patch } : account,
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
  };

  const addAccount = (event: FormEvent) => {
    event.preventDefault();
    const openingBalance = parseMoneyInput(accountForm.openingBalance);
    if (!accountForm.name.trim()) {
      notify('Kontoname ist erforderlich.');
      return;
    }
    const account: AssetAccount = {
      id: createId('account'),
      name: accountForm.name.trim(),
      openingBalance,
      openingDate: accountForm.openingDate,
      color: accountForm.color,
      icon: accountForm.icon,
      active: true,
    };
    setState((current) => {
      const accounts = [...current.accounts, account];
      return {
        ...current,
        accounts,
        settings: {
          ...current.settings,
          startBalance: accounts.reduce((sum, item) => sum + item.openingBalance, 0),
        },
      };
    });
    setAccountForm(emptyAccount);
    setAccountFormOpen(false);
    notify('Konto hinzugefügt.');
  };

  const removeAccount = (account: AssetAccount) => {
    const isUsed =
      state.incomeEntries.some((entry) => entry.accountId === account.id) ||
      state.expenseEntries.some((entry) => entry.accountId === account.id) ||
      state.accountTransfers.some((transfer) => transfer.fromAccountId === account.id || transfer.toAccountId === account.id);
    if (isUsed) {
      notify('Konto wird verwendet und kann nicht gelöscht werden.');
      return;
    }
    setState((current) => {
      const accounts = current.accounts.filter((item) => item.id !== account.id);
      return {
        ...current,
        accounts,
        settings: {
          ...current.settings,
          startBalance: accounts.reduce((sum, item) => sum + item.openingBalance, 0),
        },
      };
    });
    notify('Konto gelöscht.');
  };

  const addTransfer = (event: FormEvent) => {
    event.preventDefault();
    const amount = parseMoneyInput(transferForm.amount);
    if (!transferForm.fromAccountId || !transferForm.toAccountId || transferForm.fromAccountId === transferForm.toAccountId || amount <= 0) {
      notify('Bitte zwei unterschiedliche Konten und einen positiven Betrag wählen.');
      return;
    }
    const transfer: AccountTransfer = {
      id: createId('transfer'),
      date: transferForm.date,
      fromAccountId: transferForm.fromAccountId,
      toAccountId: transferForm.toAccountId,
      amount,
      note: transferForm.note.trim() || undefined,
      tags: state.tags.some((tag) => tag.id === 'tag-eigenueberweisung')
        ? ['tag-eigenueberweisung']
        : [],
    };
    setState((current) => ({ ...current, accountTransfers: [...current.accountTransfers, transfer] }));
    setTransferForm(emptyTransfer);
    notify('Selbstüberweisung gespeichert.');
  };

  const removeTransfer = (id: string) => {
    setState((current) => ({
      ...current,
      accountTransfers: current.accountTransfers.filter((transfer) => transfer.id !== id),
    }));
    notify('Selbstüberweisung gelöscht.');
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financeforge-backup-${backupDateStamp()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify('Backup exportiert.');
  };

  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as AppState;
      if (!parsed || typeof parsed !== 'object' || !('settings' in parsed)) {
        throw new Error('Ungültiges Backup');
      }
      setPendingImport(ensureStateShape(parsed));
    } catch {
      notify('JSON konnte nicht gelesen werden.');
    }
  };

  const loadDemo = () => {
    setState(createDemoState());
    notify('Aktuelle Startdaten geladen.');
  };

  const clearData = () => {
    setState((current) => ({
      ...current,
      incomeEntries: [],
      expenseEntries: [],
      budgets: [],
      savingsGoals: [],
      monthClosures: [],
      categories: defaultCategories.map((category) => ({ ...category })),
      tags: defaultTags.map((tag) => ({ ...tag })),
      accounts: defaultAccounts.map((account) => ({ ...account })),
      accountTransfers: [],
    }));
    setDeleteConfirmOpen(false);
    notify('Lokale Finanzdaten gelöscht.');
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <SectionHeader title="Allgemein" />
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="label">Währung</span>
              <select className="field mt-1" value={state.settings.currency} onChange={(event) => updateSetting('currency', event.target.value as 'EUR')}>
                <option value="EUR">EUR</option>
              </select>
            </label>
            <label>
              <span className="label">Sprache</span>
              <select className="field mt-1" value={state.settings.language} onChange={() => updateSetting('language', 'de')}>
                <option value="de">Deutsch</option>
              </select>
            </label>
            <label>
              <span className="label">Darstellung</span>
              <select className="field mt-1" value={state.settings.theme} onChange={(event) => updateSetting('theme', event.target.value as 'dark' | 'light')}>
                <option value="dark">Dark Mode</option>
                <option value="light">Light Mode</option>
              </select>
            </label>
            <label>
              <span className="label">Standardansicht</span>
              <select className="field mt-1" value={state.settings.defaultView} onChange={(event) => updateSetting('defaultView', event.target.value as ViewKey)}>
                {viewOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Finanzparameter" />
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="label">Monatsbudget</span>
              <input className="field mt-1" type="number" step="0.01" value={state.settings.monthlyBudget} onChange={(event) => updateSetting('monthlyBudget', Number(event.target.value))} />
            </label>
            <label>
              <span className="label">Startvermögen</span>
              <input className="field mt-1" type="number" step="0.01" value={state.settings.startBalance} onChange={(event) => updateSetting('startBalance', Number(event.target.value))} />
            </label>
            <label>
              <span className="label">Standard-Sparrate</span>
              <input className="field mt-1" type="number" step="0.01" value={state.settings.defaultSavingsRate} onChange={(event) => updateSetting('defaultSavingsRate', Number(event.target.value))} />
            </label>
            <label>
              <span className="label">Zinssatz (%)</span>
              <input className="field mt-1" type="number" step="0.01" value={state.settings.annualInterestRate} onChange={(event) => updateSetting('annualInterestRate', Number(event.target.value))} />
            </label>
            <label>
              <span className="label">Zukünftiges Kapital</span>
              <input className="field mt-1" type="number" step="0.01" value={state.settings.futureCapitalAmount} onChange={(event) => updateSetting('futureCapitalAmount', Number(event.target.value))} />
            </label>
            <label>
              <span className="label">Kapitalzufluss-Datum</span>
              <input className="field mt-1" type="date" value={state.settings.futureCapitalDate} onChange={(event) => updateSetting('futureCapitalDate', event.target.value)} />
            </label>
            <label>
              <span className="label">Entnehmbarer Zinsanteil (%)</span>
              <input className="field mt-1" min="0" max="100" type="number" value={state.settings.withdrawableInterestPercentage} onChange={(event) => updateSetting('withdrawableInterestPercentage', clamp(Number(event.target.value), 0, 100))} />
            </label>
            <label>
              <span className="label">Reinvestierter Zinsanteil (%)</span>
              <input className="field mt-1" min="0" max="100" type="number" value={state.settings.reinvestInterestPercentage} onChange={(event) => updateSetting('reinvestInterestPercentage', clamp(Number(event.target.value), 0, 100))} />
            </label>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-300 light:text-slate-700">
            <input type="checkbox" checked={state.settings.futureCapitalEnabled} onChange={(event) => updateSetting('futureCapitalEnabled', event.target.checked)} />
            Kapitalzufluss aktiv
          </label>
        </Card>
      </div>

      <Card>
        <SectionHeader title="Vermögenskonten" description="Privatkonto ist dein Alltagsgeld. Das Sparkonto ist dein Sparziel-Pool. Das Startdatum ist ein Snapshot: nur Buchungen danach verändern den Kontostand." />
        <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <div className="grid gap-3 md:grid-cols-2">
            {state.accounts.map((account) => {
              const balance = accountBalances.find((item) => item.accountId === account.id);
              return (
                <div key={account.id} className="flex min-h-72 flex-col rounded-xl border border-white/10 bg-white/[0.035] p-4 light:border-slate-200 light:bg-slate-50">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ backgroundColor: `${account.color}26`, color: account.color }}>
                        <FinanceIcon name={account.icon} size={18} />
                      </div>
                      <div>
                        <p className="font-bold">{account.name}</p>
                        <p className="text-sm text-slate-400">Aktuell {formatMoney(balance?.balance ?? account.openingBalance)}</p>
                      </div>
                    </div>
                    <input className="h-10 w-14 rounded-lg border border-white/10 bg-transparent p-1 light:border-slate-200" type="color" value={account.color} onChange={(event) => updateAccount(account.id, { color: event.target.value })} />
                  </div>
                  <div className="grid flex-1 gap-3 content-start">
                    <label>
                      <span className="label">Name</span>
                      <input className="field mt-1" value={account.name} onChange={(event) => updateAccount(account.id, { name: event.target.value })} />
                    </label>
                    <label>
                      <span className="label">Startstand</span>
                      <input className="field mt-1" inputMode="decimal" value={account.openingBalance} onChange={(event) => updateAccount(account.id, { openingBalance: parseMoneyInput(event.target.value) })} />
                    </label>
                    <label>
                      <span className="label">Snapshot-Datum</span>
                      <input className="field mt-1" type="date" value={account.openingDate} onChange={(event) => updateAccount(account.id, { openingDate: event.target.value })} />
                    </label>
                  </div>
                  {state.accounts.length > 1 ? (
                    <button className="btn btn-danger mt-4" type="button" onClick={() => removeAccount(account)}>
                      Konto löschen
                    </button>
                  ) : null}
                </div>
              );
            })}

            <div className="flex min-h-72 flex-col rounded-xl border border-dashed border-white/20 bg-white/[0.025] p-4 light:border-slate-300 light:bg-slate-50/70">
              {accountFormOpen ? (
                <form className="flex flex-1 flex-col gap-3" onSubmit={addAccount}>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="font-bold">Neues Konto</p>
                    <button className="btn py-1.5" type="button" onClick={() => setAccountFormOpen(false)}>
                      Abbrechen
                    </button>
                  </div>
                  <label>
                    <span className="label">Name</span>
                    <input className="field mt-1" value={accountForm.name} onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })} placeholder="z. B. Tagesgeldkonto" />
                  </label>
                  <label>
                    <span className="label">Snapshot-Stand</span>
                    <input className="field mt-1" inputMode="decimal" value={accountForm.openingBalance} onChange={(event) => setAccountForm({ ...accountForm, openingBalance: event.target.value })} placeholder="z. B. 250,00" />
                  </label>
                  <label>
                    <span className="label">Snapshot-Datum</span>
                    <input className="field mt-1" type="date" value={accountForm.openingDate} onChange={(event) => setAccountForm({ ...accountForm, openingDate: event.target.value })} />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                      <span className="label">Farbe</span>
                      <input className="field mt-1 h-12" type="color" value={accountForm.color} onChange={(event) => setAccountForm({ ...accountForm, color: event.target.value })} />
                    </label>
                    <label>
                      <span className="label">Icon</span>
                      <select className="field mt-1" value={accountForm.icon} onChange={(event) => setAccountForm({ ...accountForm, icon: event.target.value })}>
                        {financeIconOptions.map((icon) => (
                          <option key={icon.name} value={icon.name}>{icon.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <button className="btn btn-primary mt-auto" type="submit">
                    Konto hinzufügen
                  </button>
                </form>
              ) : (
                <button
                  className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-white/[0.035] text-center transition hover:border-forge-cyan/50 hover:bg-forge-cyan/10 light:border-slate-200 light:bg-white"
                  type="button"
                  onClick={() => setAccountFormOpen(true)}
                >
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-forge-cyan/15 text-forge-cyan">
                    <FinanceIcon name="plus-circle" size={28} />
                  </span>
                  <span>
                    <span className="block text-lg font-bold">Konto hinzufügen</span>
                    <span className="mt-1 block text-sm text-slate-400">Giro, Tagesgeld, Depot oder Bar-Konto</span>
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 p-4 light:border-slate-200">
            <form className="space-y-3" onSubmit={addTransfer}>
              <p className="font-bold">Selbstüberweisung</p>
              <p className="text-sm leading-6 text-slate-400">
                Beispiel: Von Privatkonto nach Sparkonto bedeutet weniger verfügbares Alltagsgeld und mehr Sparziel-Fortschritt.
              </p>
              <label>
                <span className="label">Datum</span>
                <input className="field mt-1" type="date" value={transferForm.date} onChange={(event) => setTransferForm({ ...transferForm, date: event.target.value })} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="label">Von</span>
                  <select className="field mt-1" value={transferForm.fromAccountId} onChange={(event) => setTransferForm({ ...transferForm, fromAccountId: event.target.value })}>
                    {state.accounts.map((account) => (
                      <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="label">Nach</span>
                  <select className="field mt-1" value={transferForm.toAccountId} onChange={(event) => setTransferForm({ ...transferForm, toAccountId: event.target.value })}>
                    {state.accounts.map((account) => (
                      <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                <span className="label">Betrag</span>
                <input className="field mt-1" inputMode="decimal" value={transferForm.amount} onChange={(event) => setTransferForm({ ...transferForm, amount: event.target.value })} placeholder="z. B. 50,00" />
              </label>
              <label>
                <span className="label">Notiz optional</span>
                <input className="field mt-1" value={transferForm.note} onChange={(event) => setTransferForm({ ...transferForm, note: event.target.value })} />
              </label>
              <button className="btn btn-primary" type="submit">Überweisung speichern</button>
            </form>

            <div className="mt-4 space-y-2">
              {state.accountTransfers.map((transfer) => {
                const from = state.accounts.find((account) => account.id === transfer.fromAccountId)?.name ?? 'Konto';
                const to = state.accounts.find((account) => account.id === transfer.toAccountId)?.name ?? 'Konto';
                return (
                  <div key={transfer.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3 text-sm light:border-slate-200">
                    <div>
                      <p className="font-semibold">{from} {'->'} {to}</p>
                      <p className="text-slate-400">{formatDate(transfer.date)} · {formatMoney(transfer.amount)}</p>
                    </div>
                    <button className="btn btn-danger py-1.5" type="button" onClick={() => removeTransfer(transfer.id)}>Löschen</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Kategorien" />
        <form className="grid gap-3 md:grid-cols-[1fr_0.8fr_0.6fr_0.6fr_auto]" onSubmit={addCategory}>
          <input className="field" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} placeholder="Neue Kategorie" />
          <select className="field" value={categoryForm.type} onChange={(event) => setCategoryForm({ ...categoryForm, type: event.target.value as CategoryType })}>
            <option value="expense">Ausgabe</option>
            <option value="income">Einnahme</option>
          </select>
          <input className="field h-10" type="color" value={categoryForm.color} onChange={(event) => setCategoryForm({ ...categoryForm, color: event.target.value })} />
          <input className="field" value={categoryForm.icon} onChange={(event) => setCategoryForm({ ...categoryForm, icon: event.target.value })} placeholder="Icon" />
          <button className="btn btn-primary" type="submit">
            Hinzufügen
          </button>
        </form>
        <div className="mt-6 grid gap-4">
          {state.categories.map((category) => (
            <div key={category.id} className="grid gap-2 rounded-xl border border-white/10 p-3 light:border-slate-200 md:grid-cols-[auto_1fr_0.8fr_0.5fr_auto] md:items-center">
              <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ backgroundColor: `${category.color}26`, color: category.color }}>
                <FinanceIcon name={category.icon} size={18} />
              </div>
              <input className="field" value={category.name} onChange={(event) => updateCategory(category.id, { name: event.target.value })} />
              <select className="field" value={category.type} onChange={(event) => updateCategory(category.id, { type: event.target.value as CategoryType })}>
                <option value="expense">Ausgabe</option>
                <option value="income">Einnahme</option>
              </select>
              <input className="field h-10" type="color" value={category.color} onChange={(event) => updateCategory(category.id, { color: event.target.value })} />
              <button className="btn btn-danger" type="button" onClick={() => removeCategory(category)}>
                Löschen
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader title="Quick-Tags" description="Diese Tags kannst du beim Erfassen von Einnahmen und Ausgaben direkt anklicken." />
        <form className="space-y-4" onSubmit={addTag}>
          <div className="grid gap-4 md:grid-cols-[1fr_0.8fr_0.5fr_auto] md:items-end">
          <label>
            <span className="label">Name</span>
            <input className="field mt-1" value={tagForm.name} onChange={(event) => setTagForm({ ...tagForm, name: event.target.value })} placeholder="Neuer Tag" />
          </label>
          <label>
            <span className="label">Verwendung</span>
          <select className="field mt-1" value={tagForm.type} onChange={(event) => setTagForm({ ...tagForm, type: event.target.value as Tag['type'] })}>
            <option value="expense">Ausgabe</option>
            <option value="income">Einnahme</option>
            <option value="general">Allgemein</option>
          </select>
          </label>
          <label>
            <span className="label">Farbe</span>
            <input className="field mt-1 h-12" type="color" value={tagForm.color} onChange={(event) => setTagForm({ ...tagForm, color: event.target.value })} />
          </label>
          <button className="btn btn-primary h-12" type="submit">Hinzufügen</button>
          </div>
          <IconPicker
            value={tagForm.icon}
            color={tagForm.color}
            onChange={(icon) => setTagForm({ ...tagForm, icon })}
          />
        </form>
        <div className="mt-6 grid gap-4">
          {state.tags.map((tag) => (
            <div key={tag.id} className="rounded-xl border border-white/10 p-4 light:border-slate-200">
              <div className="grid gap-3 md:grid-cols-[auto_1fr_0.8fr_0.5fr_auto] md:items-center">
              <div className="grid h-12 w-12 place-items-center rounded-lg" style={{ backgroundColor: `${tag.color}26`, color: tag.color }}>
                <FinanceIcon name={tag.icon} size={22} />
              </div>
              <input className="field" value={tag.name} onChange={(event) => updateTag(tag.id, { name: event.target.value })} />
              <select className="field" value={tag.type} onChange={(event) => updateTag(tag.id, { type: event.target.value as Tag['type'] })}>
                <option value="expense">Ausgabe</option>
                <option value="income">Einnahme</option>
                <option value="general">Allgemein</option>
              </select>
              <input className="field h-12" type="color" value={tag.color} onChange={(event) => updateTag(tag.id, { color: event.target.value })} />
              <button className="btn btn-danger" type="button" onClick={() => removeTag(tag)}>Löschen</button>
              </div>
              <div className="mt-4">
                <IconPicker
                  value={tag.icon}
                  color={tag.color}
                  onChange={(icon) => updateTag(tag.id, { icon })}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <SectionHeader title="Import und Export" />
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" type="button" onClick={exportData}>
              Backup exportieren
            </button>
            <button className="btn" type="button" onClick={() => fileInputRef.current?.click()}>
              JSON importieren
            </button>
            <button className="btn" type="button" onClick={loadDemo}>
              Aktuelle Startdaten laden
            </button>
            <button className="btn btn-danger" type="button" onClick={() => setDeleteConfirmOpen(true)}>
              Alle Daten löschen
            </button>
          </div>
          <input ref={fileInputRef} className="hidden" type="file" accept="application/json,.json" onChange={importData} />
        </Card>

        <Card>
          <SectionHeader
            title="Lokale Erinnerungen"
            description="FinanceForge erinnert lokal im Browser. Es gibt keinen Mail-Server und keine externen Reminder-Dienste."
          />
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 light:text-slate-700">
            <input type="checkbox" checked={state.settings.remindersEnabled} onChange={(event) => updateSetting('remindersEnabled', event.target.checked)} />
            Lokale Erinnerungen aktivieren
          </label>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(pendingImport)}
        title="Backup importieren?"
        body="Der Import ersetzt deine aktuellen lokalen FinanceForge-Daten. Ohne Bestätigung wird nichts überschrieben."
        confirmLabel="Importieren"
        onCancel={() => setPendingImport(null)}
        onConfirm={() => {
          if (pendingImport) {
            setState(pendingImport);
            setPendingImport(null);
            notify('Backup importiert.');
          }
        }}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Alle lokalen Finanzdaten löschen?"
        body="Einnahmen, Ausgaben, Budgets, Sparziele, Transfers und Monatsabschlüsse werden entfernt. Standardkategorien, Quick-Tags und Kontovorlagen bleiben erhalten."
        confirmLabel="Daten löschen"
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={clearData}
      />
    </div>
  );
};
