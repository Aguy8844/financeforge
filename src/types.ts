export type Theme = 'dark' | 'light';
export type Currency = 'EUR';
export type EntryType = 'one-time' | 'recurring';
export type RecurrenceFrequency =
  | 'monthly'
  | 'biMonthly'
  | 'quarterly'
  | 'yearly'
  | 'custom';
export type CategoryType = 'income' | 'expense';
export type ExpenseReview = 'necessary' | 'ok' | 'unnecessary';
export type SavingsAllocationMode = 'proportional' | 'priority' | 'manual';
export type ViewKey =
  | 'dashboard'
  | 'income'
  | 'expenses'
  | 'budgets'
  | 'goals'
  | 'projection'
  | 'reminders'
  | 'settings';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  intervalMonths?: number;
}

export interface Settings {
  currency: Currency;
  language: 'de';
  theme: Theme;
  monthlyBudget: number;
  startBalance: number;
  defaultSavingsRate: number;
  futureCapitalEnabled: boolean;
  futureCapitalAmount: number;
  futureCapitalDate: string;
  annualInterestRate: number;
  withdrawableInterestPercentage: number;
  reinvestInterestPercentage: number;
  projectionUseManualValues: boolean;
  projectionMonthlyIncome: number;
  projectionMonthlyExpenses: number;
  savingsAllocationMode: SavingsAllocationMode;
  remindersEnabled: boolean;
  defaultView: ViewKey;
}

export interface IncomeEntry {
  id: string;
  date: string;
  name: string;
  amount: number;
  category: string;
  source?: string;
  accountId?: string;
  tags: string[];
  note?: string;
  type: EntryType;
  recurrenceRule?: RecurrenceRule;
  startDate?: string;
  endDate?: string;
  active: boolean;
  autoInclude: boolean;
}

export interface ExpenseEntry {
  id: string;
  date: string;
  name: string;
  amount: number;
  categoryId: string;
  accountId?: string;
  tags: string[];
  paymentMethod?: string;
  note?: string;
  type: EntryType;
  recurrenceRule?: RecurrenceRule;
  startDate?: string;
  endDate?: string;
  review?: ExpenseReview;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: 'income' | 'expense' | 'account' | 'general';
}

export interface AssetAccount {
  id: string;
  name: string;
  openingBalance: number;
  openingDate: string;
  color: string;
  icon: string;
  active: boolean;
  tagId?: string;
}

export interface AccountTransfer {
  id: string;
  date: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note?: string;
  tags: string[];
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  categoryId?: string;
  period: 'monthly';
  active: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  priority: number;
  targetDate: string;
  category: string;
  description: string;
  icon: string;
  allocationPercentage?: number;
  active: boolean;
}

export interface Reminder {
  id: string;
  type:
    | 'missing-income'
    | 'missing-expense'
    | 'stale-expenses'
    | 'monthly-close';
  enabled: boolean;
  lastTriggered?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'manual';
}

export interface MonthClosure {
  id: string;
  month: string;
  completedAt: string;
  note?: string;
}

export interface AppState {
  schemaVersion: number;
  settings: Settings;
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  categories: Category[];
  tags: Tag[];
  accounts: AssetAccount[];
  accountTransfers: AccountTransfer[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  reminders: Reminder[];
  monthClosures: MonthClosure[];
  updatedAt: string;
}

export interface CategoryTotal {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
  count: number;
}

export interface TagTotal {
  tagId: string;
  name: string;
  color: string;
  amount: number;
  count: number;
}

export interface AccountBalance {
  accountId: string;
  name: string;
  color: string;
  icon: string;
  balance: number;
  openingBalance: number;
}

export interface MonthlySummary {
  month: string;
  incomeTotal: number;
  expenseTotal: number;
  surplus: number;
  savingsRate: number;
  plannedSavingsRate: number;
  monthlyBudget: number;
  remainingBudget: number;
  dailyBudget: number;
  expenseProgress: number;
  idealBudgetUsage: number;
  isOverBudget: boolean;
  isSpendingTooFast: boolean;
  hasIncomeData: boolean;
  hasExpenseData: boolean;
  topCategories: CategoryTotal[];
  topTags: TagTotal[];
}

export interface ProjectionPoint {
  month: string;
  label: string;
  balance: number;
  balanceWithoutCapital: number;
  interest: number;
  withdrawableInterest: number;
  reinvestedInterest: number;
}
