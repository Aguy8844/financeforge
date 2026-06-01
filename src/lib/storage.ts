import { createDemoState } from '../data/demoData';
import { parseMoneyInput } from './format';
import type { AppState } from '../types';

const DB_NAME = 'financeforge-db';
const DB_VERSION = 1;
const STORE_NAME = 'state';
const STATE_KEY = 'financeforge-state';
const CURRENT_SCHEMA_VERSION = 7;

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB wird nicht unterstützt.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const saveState = async (state: AppState) => {
  const nextState = { ...state, updatedAt: new Date().toISOString() };
  localStorage.setItem(STATE_KEY, JSON.stringify(nextState));

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(nextState, STATE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    localStorage.setItem(STATE_KEY, JSON.stringify(nextState));
  }
};

export const loadState = async (): Promise<AppState> => {
  try {
    const db = await openDatabase();
    const state = await new Promise<AppState | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(STATE_KEY);
      request.onsuccess = () => resolve(request.result as AppState | undefined);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (state) return ensureStateShape(state);
  } catch {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) return ensureStateShape(JSON.parse(raw) as AppState);
  }

  const initial = createDemoState();
  await saveState(initial);
  return initial;
};

export const clearStoredState = async () => {
  localStorage.removeItem(STATE_KEY);
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(STATE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    localStorage.removeItem(STATE_KEY);
  }
};

export const ensureStateShape = (state: AppState): AppState => {
  const demo = createDemoState();
  const shaped = {
    ...demo,
    ...state,
    settings: { ...demo.settings, ...state.settings },
    incomeEntries: (state.incomeEntries ?? []).map((entry) => ({
      ...entry,
      amount: normalizeAmount(entry.amount),
      tags: entry.tags ?? [],
    })),
    expenseEntries: (state.expenseEntries ?? []).map((entry) => ({
      ...entry,
      amount: normalizeAmount(entry.amount),
      amountAdjustments: (entry.amountAdjustments ?? []).map((adjustment) => ({
        ...adjustment,
        amount: normalizeAmount(adjustment.amount),
      })),
      tags: entry.tags ?? [],
      review: entry.review ?? 'ok',
    })),
    categories: state.categories ?? demo.categories,
    tags: state.tags ?? demo.tags,
    accounts: (state.accounts ?? demo.accounts).map((account) => ({
      ...account,
      openingBalance: normalizeAmount(account.openingBalance),
    })),
    accountTransfers: (state.accountTransfers ?? []).map((transfer) => ({
      ...transfer,
      amount: normalizeAmount(transfer.amount),
      tags: transfer.tags ?? [],
    })),
    budgets: (state.budgets ?? []).map((budget) => ({
      ...budget,
      amount: normalizeAmount(budget.amount),
    })),
    savingsGoals: (state.savingsGoals ?? []).map((goal) => ({
      ...goal,
      targetAmount: normalizeAmount(goal.targetAmount),
      currentAmount: normalizeAmount(goal.currentAmount),
      allocationPercentage: goal.allocationPercentage,
    })),
    reminders: state.reminders ?? demo.reminders,
    monthClosures: state.monthClosures ?? [],
  };

  if ((state.schemaVersion ?? 0) < CURRENT_SCHEMA_VERSION) {
    return seedCurrentFinanceData(shaped, demo);
  }

  return { ...shaped, schemaVersion: CURRENT_SCHEMA_VERSION };
};

const normalizeAmount = (value: unknown) =>
  typeof value === 'string'
    ? parseMoneyInput(value)
    : Number.isFinite(Number(value))
      ? Number(value)
      : 0;

const seedCurrentFinanceData = (state: AppState, seeded: AppState): AppState => ({
  ...state,
  schemaVersion: CURRENT_SCHEMA_VERSION,
  settings: { ...state.settings, ...seeded.settings, theme: state.settings.theme },
  incomeEntries: mergeById(seeded.incomeEntries, state.incomeEntries).map((entry) => ({
    ...entry,
    tags: simplifyEntryTags(entry.tags ?? []),
  })),
  expenseEntries: mergeById(seeded.expenseEntries, state.expenseEntries).map((entry) => ({
    ...entry,
    amountAdjustments: (entry.amountAdjustments ?? []).map((adjustment) => ({
      ...adjustment,
      amount: normalizeAmount(adjustment.amount),
    })),
    tags: simplifyEntryTags(entry.tags ?? []),
    review: entry.review ?? 'ok',
  })),
  categories: mergeById(seeded.categories, state.categories),
  tags: mergeById(
    seeded.tags,
    state.tags.filter((tag) => !legacyTagIds.has(tag.id) && !seeded.tags.some((base) => base.id === tag.id)),
  ),
  accounts: mergeById(seeded.accounts, state.accounts),
  accountTransfers: state.accountTransfers.map((transfer) => ({
    ...transfer,
    tags: transfer.tags?.length ? simplifyEntryTags(transfer.tags) : ['tag-eigenueberweisung'],
  })),
  budgets: mergeById(seeded.budgets, state.budgets),
  savingsGoals: (state.savingsGoals.length ? state.savingsGoals : seeded.savingsGoals).map((goal) => {
    const seededGoal = seeded.savingsGoals.find((item) => item.id === goal.id);
    return {
      ...goal,
      allocationPercentage: goal.allocationPercentage ?? seededGoal?.allocationPercentage,
    };
  }),
});

const mergeById = <T extends { id: string }>(base: T[], additions: T[]) => {
  const existing = new Set(base.map((item) => item.id));
  return [...base, ...additions.filter((item) => !existing.has(item.id))];
};

const legacyTagIds = new Set([
  'tag-papa',
  'tag-antonia',
  'tag-rueckzahlung',
  'tag-taschengeld',
  'tag-fahrschule',
  'tag-konzert',
  'tag-geschenke',
  'tag-essen',
  'tag-cafe',
  'tag-abo',
  'tag-parken',
  'tag-tickets',
  'tag-motorrad',
  'tag-drogerie',
  'tag-fitness',
  'tag-privatkonto',
  'tag-sparkonto',
]);

const tagMap: Record<string, string[]> = {
  'tag-konzert': ['tag-freizeit'],
  'tag-geschenke': ['tag-freizeit'],
  'tag-abo': ['tag-freizeit'],
  'tag-parken': ['tag-freizeit'],
  'tag-tickets': ['tag-freizeit'],
  'tag-motorrad': ['tag-freizeit'],
  'tag-drogerie': ['tag-freizeit'],
  'tag-fitness': ['tag-freizeit'],
  'tag-essen': ['tag-essen-trinken'],
  'tag-cafe': ['tag-essen-trinken'],
  'tag-kleidung': ['tag-kleidung'],
};

const allowedDefaultTagIds = new Set([
  'tag-arbeit',
  'tag-uni',
  'tag-freizeit',
  'tag-essen-trinken',
  'tag-kleidung',
  'tag-eigenueberweisung',
]);

const simplifyEntryTags = (tags: string[]) =>
  Array.from(
    new Set(
      tags.flatMap((tag) => {
        if (allowedDefaultTagIds.has(tag)) return [tag];
        if (!legacyTagIds.has(tag)) return [tag];
        return tagMap[tag] ?? [];
      }),
    ),
  );
