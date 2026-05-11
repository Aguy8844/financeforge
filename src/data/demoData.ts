import type {
  AppState,
  AssetAccount,
  Category,
  ExpenseEntry,
  IncomeEntry,
  Settings,
  Tag,
} from '../types';

export const createId = (prefix: string) =>
  `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;

export const ACCOUNT_START_DATE = '2026-05-10';

export const defaultSettings: Settings = {
  currency: 'EUR',
  language: 'de',
  theme: 'dark',
  monthlyBudget: 600,
  startBalance: 0,
  defaultSavingsRate: 0,
  futureCapitalEnabled: false,
  futureCapitalAmount: 0,
  futureCapitalDate: '2026-07-01',
  annualInterestRate: 0,
  withdrawableInterestPercentage: 0,
  reinvestInterestPercentage: 0,
  projectionUseManualValues: false,
  projectionMonthlyIncome: 0,
  projectionMonthlyExpenses: 0,
  savingsAllocationMode: 'proportional',
  remindersEnabled: true,
  defaultView: 'dashboard',
};

export const defaultCategories: Category[] = [
  { id: 'income-salary', name: 'Nettoeinkommen', type: 'income', color: '#47D7AC', icon: 'wallet' },
  { id: 'income-family', name: 'Familie', type: 'income', color: '#38BDF8', icon: 'heart-handshake' },
  { id: 'income-capital', name: 'Kapitalertrag', type: 'income', color: '#A78BFA', icon: 'line-chart' },
  { id: 'income-other', name: 'Sonstiges', type: 'income', color: '#FBBF24', icon: 'plus-circle' },
  { id: 'expense-eating-out', name: 'Essen auswärts', type: 'expense', color: '#FB7185', icon: 'utensils' },
  { id: 'expense-groceries', name: 'Lebensmittel', type: 'expense', color: '#47D7AC', icon: 'shopping-basket' },
  { id: 'expense-transport', name: 'Transport', type: 'expense', color: '#38BDF8', icon: 'train' },
  { id: 'expense-leisure', name: 'Freizeit', type: 'expense', color: '#A78BFA', icon: 'sparkles' },
  { id: 'expense-tech', name: 'Technik', type: 'expense', color: '#60A5FA', icon: 'cpu' },
  { id: 'expense-motorcycle', name: 'Motorrad', type: 'expense', color: '#F97316', icon: 'bike' },
  { id: 'expense-car', name: 'Auto', type: 'expense', color: '#FBBF24', icon: 'car' },
  { id: 'expense-clothes', name: 'Kleidung', type: 'expense', color: '#EC4899', icon: 'shirt' },
  { id: 'expense-work', name: 'Uni/Arbeit', type: 'expense', color: '#14B8A6', icon: 'briefcase' },
  { id: 'expense-health', name: 'Gesundheit', type: 'expense', color: '#22C55E', icon: 'heart-pulse' },
  { id: 'expense-subscriptions', name: 'Abos', type: 'expense', color: '#818CF8', icon: 'repeat' },
  { id: 'expense-housing', name: 'Wohnen', type: 'expense', color: '#94A3B8', icon: 'home' },
  { id: 'expense-gifts', name: 'Geschenke', type: 'expense', color: '#F472B6', icon: 'gift' },
  { id: 'expense-drugstore', name: 'Drogerie', type: 'expense', color: '#34D399', icon: 'shopping-basket' },
  { id: 'expense-other', name: 'Sonstiges', type: 'expense', color: '#CBD5E1', icon: 'circle' },
];

export const defaultTags: Tag[] = [
  { id: 'tag-arbeit', name: 'Arbeit', color: '#38BDF8', icon: 'briefcase', type: 'general' },
  { id: 'tag-uni', name: 'Uni', color: '#14B8A6', icon: 'graduation-cap', type: 'general' },
  { id: 'tag-freizeit', name: 'Freizeit', color: '#A78BFA', icon: 'sparkles', type: 'general' },
  { id: 'tag-essen-trinken', name: 'Essen/Trinken', color: '#FB7185', icon: 'utensils', type: 'general' },
  { id: 'tag-kleidung', name: 'Kleidung', color: '#EC4899', icon: 'shirt', type: 'general' },
  { id: 'tag-eigenueberweisung', name: 'Eigenüberweisungen', color: '#47D7AC', icon: 'repeat', type: 'general' },
];

export const defaultAccounts: AssetAccount[] = [
  {
    id: 'account-private',
    name: 'Privatkonto',
    openingBalance: 0,
    openingDate: ACCOUNT_START_DATE,
    color: '#38BDF8',
    icon: 'wallet',
    active: true,
  },
  {
    id: 'account-savings',
    name: 'Sparkonto',
    openingBalance: 0,
    openingDate: ACCOUNT_START_DATE,
    color: '#47D7AC',
    icon: 'piggy-bank',
    active: true,
  },
];

export const defaultIncomeEntries: IncomeEntry[] = [];

export const defaultExpenseEntries: ExpenseEntry[] = [];

export const defaultSavingsGoals = [
  {
    id: 'goal-honda-cbr500r',
    name: 'Honda CBR500R',
    targetAmount: 0,
    currentAmount: 0,
    priority: 1,
    targetDate: '2027-06-01',
    category: 'Motorrad',
    description: 'Priorisiertes Sparziel. Betrag und Datum sind frei editierbar.',
    icon: 'bike',
    allocationPercentage: 50,
    active: true,
  },
  {
    id: 'goal-car-upgrade',
    name: 'Auto-Aufrüstung',
    targetAmount: 0,
    currentAmount: 0,
    priority: 2,
    targetDate: '2027-12-01',
    category: 'Auto',
    description: 'Budget für Verbesserungen, Wartung und Ausstattung.',
    icon: 'car',
    allocationPercentage: 30,
    active: true,
  },
  {
    id: 'goal-gaming-pc',
    name: 'Sehr starker Gaming-PC',
    targetAmount: 0,
    currentAmount: 0,
    priority: 3,
    targetDate: '2027-03-01',
    category: 'Technik',
    description: 'High-End-PC mit Spielraum für Komponentenpreise.',
    icon: 'cpu',
    allocationPercentage: 20,
    active: true,
  },
];

export const createDemoState = (): AppState => ({
  schemaVersion: 7,
  settings: { ...defaultSettings },
  incomeEntries: defaultIncomeEntries.map((entry) => ({ ...entry, tags: [...entry.tags] })),
  expenseEntries: defaultExpenseEntries.map((entry) => ({ ...entry, tags: [...entry.tags] })),
  categories: defaultCategories.map((category) => ({ ...category })),
  tags: defaultTags.map((tag) => ({ ...tag })),
  accounts: defaultAccounts.map((account) => ({ ...account })),
  accountTransfers: [],
  budgets: [
    {
      id: 'budget-monthly-default',
      name: 'Monatsbudget',
      amount: 600,
      period: 'monthly',
      active: true,
    },
  ],
  savingsGoals: defaultSavingsGoals.map((goal) => ({ ...goal })),
  reminders: [
    { id: 'reminder-income', type: 'missing-income', enabled: true, frequency: 'daily' },
    { id: 'reminder-expense', type: 'missing-expense', enabled: true, frequency: 'daily' },
    { id: 'reminder-stale-expenses', type: 'stale-expenses', enabled: true, frequency: 'daily' },
    { id: 'reminder-close', type: 'monthly-close', enabled: true, frequency: 'monthly' },
  ],
  monthClosures: [],
  updatedAt: new Date().toISOString(),
});
