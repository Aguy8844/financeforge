import {
  addMonths,
  currentMonthKey,
  daysInMonth,
  elapsedDaysInMonth,
  formatMonth,
  isSameMonth,
  isoToday,
  monthDiff,
  monthKeyFromDate,
  monthStartDate,
  remainingDaysInMonth,
} from './date';
import type {
  AccountBalance,
  AppState,
  Category,
  ExpenseEntry,
  IncomeEntry,
  MonthlySummary,
  ProjectionPoint,
  RecurrenceRule,
  SavingsGoal,
  TagTotal,
} from '../types';

const clampValue = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const recurrenceInterval = (rule?: RecurrenceRule) => {
  if (!rule) return 1;
  if (rule.frequency === 'monthly') return 1;
  if (rule.frequency === 'biMonthly') return 2;
  if (rule.frequency === 'quarterly') return 3;
  if (rule.frequency === 'yearly') return 12;
  return Math.max(1, rule.intervalMonths ?? 1);
};

const recurringApplies = (
  startDate: string | undefined,
  endDate: string | undefined,
  rule: RecurrenceRule | undefined,
  monthKey: string,
) => {
  const startMonth = monthKeyFromDate(startDate ?? monthStartDate(monthKey));
  const endMonth = endDate ? monthKeyFromDate(endDate) : undefined;
  if (monthKey < startMonth) return false;
  if (endMonth && monthKey > endMonth) return false;
  return monthDiff(startMonth, monthKey) % recurrenceInterval(rule) === 0;
};

export const incomeOccursInMonth = (entry: IncomeEntry, monthKey: string) => {
  if (!entry.active) return false;
  if (entry.type === 'one-time') return isSameMonth(entry.date, monthKey);
  if (!entry.autoInclude) return false;
  return recurringApplies(entry.startDate ?? entry.date, entry.endDate, entry.recurrenceRule, monthKey);
};

export const expenseOccursInMonth = (entry: ExpenseEntry, monthKey: string) => {
  if (!entry.active) return false;
  if (entry.type === 'one-time') return isSameMonth(entry.date, monthKey);
  return recurringApplies(entry.startDate ?? entry.date, entry.endDate, entry.recurrenceRule, monthKey);
};

export const getCategory = (categories: Category[], id: string) =>
  categories.find((category) => category.id === id);

export const getTag = (state: AppState, id: string) =>
  state.tags.find((tag) => tag.id === id);

export const getMonthlySummary = (state: AppState, monthKey = currentMonthKey()): MonthlySummary => {
  const incomeTotal = state.incomeEntries
    .filter((entry) => incomeOccursInMonth(entry, monthKey))
    .reduce((sum, entry) => sum + entry.amount, 0);

  const monthExpenses = state.expenseEntries.filter((entry) => expenseOccursInMonth(entry, monthKey));
  const expenseTotal = monthExpenses.reduce((sum, entry) => sum + entry.amount, 0);
  const monthlyBudget =
    state.budgets.find((budget) => budget.active && !budget.categoryId)?.amount ??
    state.settings.monthlyBudget;
  const surplus = incomeTotal - expenseTotal;
  const savingsRate = incomeTotal > 0 ? (surplus / incomeTotal) * 100 : 0;
  const remainingBudget = monthlyBudget - expenseTotal;
  const dailyBudget = remainingDaysInMonth(monthKey) > 0 ? remainingBudget / remainingDaysInMonth(monthKey) : 0;
  const expenseProgress = monthlyBudget > 0 ? (expenseTotal / monthlyBudget) * 100 : 0;
  const idealBudgetUsage =
    monthlyBudget * (elapsedDaysInMonth(monthKey) / Math.max(1, daysInMonth(monthKey)));

  const topCategories = Object.values(
    monthExpenses.reduce<Record<string, { categoryId: string; name: string; color: string; amount: number; count: number }>>(
      (acc, expense) => {
        const category = getCategory(state.categories, expense.categoryId);
        const id = expense.categoryId || 'unknown';
        acc[id] ??= {
          categoryId: id,
          name: category?.name ?? 'Ohne Kategorie',
          color: category?.color ?? '#CBD5E1',
          amount: 0,
          count: 0,
        };
        acc[id].amount += expense.amount;
        acc[id].count += 1;
        return acc;
      },
      {},
    ),
  ).sort((a, b) => b.amount - a.amount);

  const topTags = getExpenseTagTotals(state, monthKey);

  return {
    month: monthKey,
    incomeTotal,
    expenseTotal,
    surplus,
    savingsRate,
    plannedSavingsRate: state.settings.defaultSavingsRate,
    monthlyBudget,
    remainingBudget,
    dailyBudget,
    expenseProgress,
    idealBudgetUsage,
    isOverBudget: monthlyBudget > 0 && expenseTotal > monthlyBudget,
    isSpendingTooFast: monthlyBudget > 0 && expenseTotal > idealBudgetUsage && monthKey <= currentMonthKey(),
    hasIncomeData: state.incomeEntries.some((entry) => incomeOccursInMonth(entry, monthKey)),
    hasExpenseData: monthExpenses.length > 0,
    topCategories,
    topTags,
  };
};

export const getExpenseTagTotals = (state: AppState, monthKey = currentMonthKey()): TagTotal[] => {
  const monthExpenses = state.expenseEntries.filter((entry) => expenseOccursInMonth(entry, monthKey));
  return Object.values(
    monthExpenses.reduce<Record<string, TagTotal>>((acc, expense) => {
      expense.tags
        .filter((tagId) => getTag(state, tagId)?.type !== 'account')
        .forEach((tagId) => {
          const tag = getTag(state, tagId);
          acc[tagId] ??= {
            tagId,
            name: tag?.name ?? tagId,
            color: tag?.color ?? '#CBD5E1',
            amount: 0,
            count: 0,
          };
          acc[tagId].amount += expense.amount;
          acc[tagId].count += 1;
        });
      return acc;
    }, {}),
  ).sort((a, b) => b.amount - a.amount);
};

export const getIncomeTagTotals = (state: AppState, monthKey = currentMonthKey()): TagTotal[] => {
  const monthIncome = state.incomeEntries.filter((entry) => incomeOccursInMonth(entry, monthKey));
  return Object.values(
    monthIncome.reduce<Record<string, TagTotal>>((acc, income) => {
      income.tags
        .filter((tagId) => getTag(state, tagId)?.type !== 'account')
        .forEach((tagId) => {
          const tag = getTag(state, tagId);
          acc[tagId] ??= {
            tagId,
            name: tag?.name ?? tagId,
            color: tag?.color ?? '#CBD5E1',
            amount: 0,
            count: 0,
          };
          acc[tagId].amount += income.amount;
          acc[tagId].count += 1;
        });
      return acc;
    }, {}),
  ).sort((a, b) => b.amount - a.amount);
};

const occurrenceDateForMonth = (entryDate: string, monthKey: string) => {
  const day = Number(entryDate.slice(8, 10)) || 1;
  const maxDay = daysInMonth(monthKey);
  return `${monthKey}-${String(Math.min(day, maxDay)).padStart(2, '0')}`;
};

const incomeOccurrencesUntilToday = (entry: IncomeEntry, openingDate: string, today = isoToday()) => {
  if (!entry.active || !entry.accountId) return [];
  if (entry.type === 'one-time') {
    return entry.date > openingDate && entry.date <= today ? [entry.date] : [];
  }
  const startMonth = monthKeyFromDate(entry.startDate ?? entry.date);
  const endMonth = monthKeyFromDate(today);
  const months = Math.max(0, monthDiff(startMonth, endMonth) + 1);
  return Array.from({ length: months }, (_, index) => addMonths(startMonth, index))
    .filter((month) => incomeOccursInMonth(entry, month))
    .map((month) => occurrenceDateForMonth(entry.date, month))
    .filter((date) => date > openingDate && date <= today);
};

const expenseOccurrencesUntilToday = (entry: ExpenseEntry, openingDate: string, today = isoToday()) => {
  if (!entry.active || !entry.accountId) return [];
  if (entry.type === 'one-time') {
    return entry.date > openingDate && entry.date <= today ? [entry.date] : [];
  }
  const startMonth = monthKeyFromDate(entry.startDate ?? entry.date);
  const endMonth = monthKeyFromDate(today);
  const months = Math.max(0, monthDiff(startMonth, endMonth) + 1);
  return Array.from({ length: months }, (_, index) => addMonths(startMonth, index))
    .filter((month) => expenseOccursInMonth(entry, month))
    .map((month) => occurrenceDateForMonth(entry.date, month))
    .filter((date) => date > openingDate && date <= today);
};

export const getAccountBalances = (state: AppState, today = isoToday()): AccountBalance[] =>
  state.accounts
    .filter((account) => account.active)
    .map((account) => {
      let balance = account.openingBalance;
      state.incomeEntries
        .filter((entry) => entry.accountId === account.id)
        .forEach((entry) => {
          balance += incomeOccurrencesUntilToday(entry, account.openingDate, today).length * entry.amount;
        });
      state.expenseEntries
        .filter((entry) => entry.accountId === account.id)
        .forEach((entry) => {
          balance -= expenseOccurrencesUntilToday(entry, account.openingDate, today).length * entry.amount;
        });
      state.accountTransfers
        .filter((transfer) => transfer.date > account.openingDate && transfer.date <= today)
        .forEach((transfer) => {
          if (transfer.fromAccountId === account.id) balance -= transfer.amount;
          if (transfer.toAccountId === account.id) balance += transfer.amount;
        });
      return {
        accountId: account.id,
        name: account.name,
        color: account.color,
        icon: account.icon,
        balance,
        openingBalance: account.openingBalance,
      };
    });

export const getTotalAccountBalance = (state: AppState) =>
  getAccountBalances(state).reduce((sum, account) => sum + account.balance, 0);

export const getAccountBalanceById = (state: AppState, accountId: string) =>
  getAccountBalances(state).find((account) => account.accountId === accountId)?.balance ?? 0;

export const getSavingsGoalAllocations = (state: AppState) => {
  const goals = [...state.savingsGoals]
    .filter((goal) => goal.active)
    .sort((a, b) => a.priority - b.priority);
  const savingsPool = getAccountBalanceById(state, 'account-savings');
  const totalTarget = goals.reduce((sum, goal) => sum + Math.max(0, goal.targetAmount), 0);
  const mode = state.settings.savingsAllocationMode ?? 'proportional';
  let remainingPriorityPool = savingsPool;
  const manualPercentTotal = goals.reduce((sum, goal) => sum + Math.max(0, goal.allocationPercentage ?? 0), 0);
  const allocations = goals.map((goal) => {
    let rawShare = 0;
    if (mode === 'priority') {
      rawShare = Math.min(Math.max(0, goal.targetAmount), Math.max(0, remainingPriorityPool));
      remainingPriorityPool -= rawShare;
    } else if (mode === 'manual' && manualPercentTotal > 0) {
      rawShare = savingsPool * ((goal.allocationPercentage ?? 0) / 100);
    } else {
      rawShare = totalTarget > 0 ? savingsPool * (Math.max(0, goal.targetAmount) / totalTarget) : 0;
    }
    const savingsShare = Math.max(0, Math.min(goal.targetAmount, rawShare));
    const effectiveCurrent = Math.max(0, Math.min(goal.targetAmount, goal.currentAmount + savingsShare));
    const progress = goal.targetAmount > 0 ? (effectiveCurrent / goal.targetAmount) * 100 : 0;
    return {
      goal,
      savingsShare,
      manualAmount: goal.currentAmount,
      effectiveCurrent,
      progress,
      remaining: Math.max(0, goal.targetAmount - effectiveCurrent),
    };
  });
  return {
    mode,
    savingsPool,
    totalTarget,
    totalCovered: allocations.reduce((sum, item) => sum + item.effectiveCurrent, 0),
    coverage: totalTarget > 0 ? (savingsPool / totalTarget) * 100 : 0,
    manualPercentTotal,
    allocations,
  };
};

export const getDailyMonthSeries = (state: AppState, monthKey = currentMonthKey()) => {
  const summary = getMonthlySummary(state, monthKey);
  const dayCount = daysInMonth(monthKey);
  const series = Array.from({ length: dayCount }, (_, index) => {
    const day = index + 1;
    const date = `${monthKey}-${String(day).padStart(2, '0')}`;
    return {
      date,
      day,
      label: String(day).padStart(2, '0'),
      Einnahmen: 0,
      Ausgaben: 0,
      Sparen: 0,
      Netto: 0,
      'Kumulierte Ausgaben': 0,
      'Budget-Grenze': summary.monthlyBudget * (day / Math.max(1, dayCount)),
    };
  });
  const byDate = new Map(series.map((point) => [point.date, point]));

  const add = (date: string, key: 'Einnahmen' | 'Ausgaben' | 'Sparen', amount: number) => {
    if (!isSameMonth(date, monthKey)) return;
    const point = byDate.get(date);
    if (point) point[key] += amount;
  };

  state.incomeEntries
    .filter((entry) => incomeOccursInMonth(entry, monthKey))
    .forEach((entry) => {
      const date = entry.type === 'one-time' ? entry.date : occurrenceDateForMonth(entry.date, monthKey);
      add(date, 'Einnahmen', entry.amount);
    });

  state.expenseEntries
    .filter((entry) => expenseOccursInMonth(entry, monthKey))
    .forEach((entry) => {
      const date = entry.type === 'one-time' ? entry.date : occurrenceDateForMonth(entry.date, monthKey);
      add(date, 'Ausgaben', entry.amount);
    });

  state.accountTransfers
    .filter((transfer) => isSameMonth(transfer.date, monthKey))
    .forEach((transfer) => {
      if (transfer.toAccountId === 'account-savings') add(transfer.date, 'Sparen', transfer.amount);
      if (transfer.fromAccountId === 'account-savings') add(transfer.date, 'Sparen', -transfer.amount);
    });

  let cumulativeExpenses = 0;
  return series.map((point) => {
    cumulativeExpenses += point.Ausgaben;
    return {
      ...point,
      Netto: point.Einnahmen - point.Ausgaben,
      'Kumulierte Ausgaben': cumulativeExpenses,
    };
  });
};

export const getDailyAccountBalanceSeries = (state: AppState, monthKey = currentMonthKey()) =>
  Array.from({ length: daysInMonth(monthKey) }, (_, index) => {
    const day = index + 1;
    const date = `${monthKey}-${String(day).padStart(2, '0')}`;
    const balances = getAccountBalances(state, date);
    const privateBalance = balances.find((account) => account.accountId === 'account-private')?.balance ?? 0;
    const savingsBalance = balances.find((account) => account.accountId === 'account-savings')?.balance ?? 0;
    return {
      date,
      day,
      label: String(day).padStart(2, '0'),
      Privatkonto: privateBalance,
      Sparkonto: savingsBalance,
      Gesamt: balances.reduce((sum, account) => sum + account.balance, 0),
    };
  });

export const getWeeklyMonthSeries = (state: AppState, monthKey = currentMonthKey()) => {
  const daily = getDailyMonthSeries(state, monthKey);
  const weeks = new Map<number, { week: number; label: string; Einnahmen: number; Ausgaben: number; Sparen: number; Netto: number }>();
  daily.forEach((day) => {
    const week = Math.floor((day.day - 1) / 7) + 1;
    const current = weeks.get(week) ?? {
      week,
      label: `Woche ${week}`,
      Einnahmen: 0,
      Ausgaben: 0,
      Sparen: 0,
      Netto: 0,
    };
    current.Einnahmen += day.Einnahmen;
    current.Ausgaben += day.Ausgaben;
    current.Sparen += day.Sparen;
    current.Netto += day.Netto;
    weeks.set(week, current);
  });
  return [...weeks.values()];
};

export const getExpenseModeTotals = (state: AppState, monthKey = currentMonthKey()) => {
  const expenses = state.expenseEntries.filter((entry) => expenseOccursInMonth(entry, monthKey));
  const fixed = expenses
    .filter((entry) => entry.type === 'recurring')
    .reduce((sum, entry) => sum + entry.amount, 0);
  const variable = expenses
    .filter((entry) => entry.type === 'one-time')
    .reduce((sum, entry) => sum + entry.amount, 0);
  return {
    fixed,
    variable,
    total: fixed + variable,
    fixedShare: fixed + variable > 0 ? (fixed / (fixed + variable)) * 100 : 0,
  };
};

export const getExpenseReviewStats = (state: AppState, monthKey = currentMonthKey()) => {
  const expenses = state.expenseEntries.filter((entry) => expenseOccursInMonth(entry, monthKey));
  const stats = expenses.reduce(
    (acc, entry) => {
      const review = entry.review ?? 'ok';
      acc[review] += entry.amount;
      acc.total += entry.amount;
      return acc;
    },
    { necessary: 0, ok: 0, unnecessary: 0, total: 0 },
  );
  return {
    ...stats,
    unnecessaryShare: stats.total > 0 ? (stats.unnecessary / stats.total) * 100 : 0,
  };
};

export const getTodayAllowance = (state: AppState, monthKey = currentMonthKey()) => {
  const summary = getMonthlySummary(state, monthKey);
  const today = isoToday();
  const daily = getDailyMonthSeries(state, monthKey);
  const point = daily.find((day) => day.date === today);
  return {
    date: today,
    allowedToday: summary.dailyBudget,
    spentToday: point?.Ausgaben ?? 0,
    incomeToday: point?.Einnahmen ?? 0,
    savedToday: point?.Sparen ?? 0,
    remainingToday: summary.dailyBudget - (point?.Ausgaben ?? 0),
  };
};

export const getSpendingScore = (state: AppState, monthKey = currentMonthKey()) => {
  const summary = getMonthlySummary(state, monthKey);
  const daily = getDailyMonthSeries(state, monthKey);
  const review = getExpenseReviewStats(state, monthKey);
  const quietDays = daily.filter((day) => day.Ausgaben === 0).length;
  const flexibleSpend = summary.topTags
    .filter((tag) => ['Freizeit', 'Essen/Trinken'].includes(tag.name))
    .reduce((sum, tag) => sum + tag.amount, 0);
  const budgetTempoScore =
    summary.monthlyBudget > 0
      ? clampValue(100 - (Math.max(0, summary.expenseTotal - summary.idealBudgetUsage) / summary.monthlyBudget) * 160)
      : 75;
  const budgetScore = summary.monthlyBudget > 0 ? clampValue(110 - summary.expenseProgress) : 75;
  const noSpendScore = daily.length > 0 ? clampValue((quietDays / daily.length) * 100) : 75;
  const flexibleScore =
    summary.monthlyBudget > 0 ? clampValue(100 - (flexibleSpend / summary.monthlyBudget) * 120) : 75;
  const savingsScore = clampValue(50 + summary.savingsRate);
  const reviewScore = review.total > 0 ? clampValue(100 - (review.unnecessary / review.total) * 180) : 100;
  const score = Math.round(
    budgetTempoScore * 0.25 +
      budgetScore * 0.2 +
      noSpendScore * 0.15 +
      flexibleScore * 0.15 +
      savingsScore * 0.15 +
      reviewScore * 0.1,
  );
  return {
    score,
    label: score >= 85 ? 'stark' : score >= 70 ? 'stabil' : score >= 50 ? 'angespannt' : 'kritisch',
    tone: score >= 70 ? 'mint' : score >= 50 ? 'amber' : 'rose',
    factors: {
      budgetTempoScore,
      budgetScore,
      noSpendScore,
      flexibleScore,
      savingsScore,
      reviewScore,
    },
  };
};

export const getMonthSeries = (state: AppState, startMonth: string, count: number) =>
  Array.from({ length: count }, (_, index) => {
    const month = addMonths(startMonth, index);
    const summary = getMonthlySummary(state, month);
    return {
      month,
      label: formatMonth(month).replace(' ', '\n'),
      Einnahmen: summary.incomeTotal,
      Ausgaben: summary.expenseTotal,
      Überschuss: summary.surplus,
    };
  });

export const getAverageMonthlyExpenses = (state: AppState, months = 6) => {
  const start = addMonths(currentMonthKey(), -months + 1);
  const summaries = Array.from({ length: months }, (_, index) => getMonthlySummary(state, addMonths(start, index)));
  return summaries.reduce((sum, summary) => sum + summary.expenseTotal, 0) / Math.max(1, months);
};

export const getHighestExpenses = (state: AppState, limit = 5) =>
  [...state.expenseEntries]
    .filter((entry) => entry.active)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);

export const getGoalMetrics = (
  goal: SavingsGoal,
  monthlyContribution: number,
  currentAmount = goal.currentAmount,
) => {
  const remaining = Math.max(0, goal.targetAmount - currentAmount);
  const progress = goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0;
  const targetMonth = monthKeyFromDate(goal.targetDate);
  const monthsUntilTarget = Math.max(1, monthDiff(currentMonthKey(), targetMonth));
  const requiredMonthly = remaining / monthsUntilTarget;
  const monthsAtCurrentRate =
    monthlyContribution > 0 ? Math.ceil(remaining / monthlyContribution) : Number.POSITIVE_INFINITY;
  const reachableMonth = Number.isFinite(monthsAtCurrentRate)
    ? addMonths(currentMonthKey(), monthsAtCurrentRate)
    : undefined;
  return {
    remaining,
    progress,
    monthsUntilTarget,
    requiredMonthly,
    monthsAtCurrentRate,
    reachableMonth,
    realistic: monthlyContribution >= requiredMonthly,
  };
};

export const buildProjection = (
  state: AppState,
  months: number,
  annualInterestRate = state.settings.annualInterestRate,
): ProjectionPoint[] => {
  const startMonth = currentMonthKey();
  const startingBalance = state.accounts.length ? getTotalAccountBalance(state) : state.settings.startBalance;
  let balance = startingBalance;
  let balanceWithoutCapital = startingBalance;
  let capitalApplied = false;
  const futureCapitalMonth = monthKeyFromDate(state.settings.futureCapitalDate);

  return Array.from({ length: months }, (_, index) => {
    const month = addMonths(startMonth, index);
    const summary = state.settings.projectionUseManualValues
      ? {
          surplus:
            state.settings.projectionMonthlyIncome - state.settings.projectionMonthlyExpenses,
        }
      : getMonthlySummary(state, month);
    const monthlyRate = annualInterestRate / 100 / 12;

    if (
      state.settings.futureCapitalEnabled &&
      !capitalApplied &&
      state.settings.futureCapitalAmount > 0 &&
      month >= futureCapitalMonth
    ) {
      balance += state.settings.futureCapitalAmount;
      capitalApplied = true;
    }

    const interest = balance * monthlyRate;
    const withdrawableInterest = interest * (state.settings.withdrawableInterestPercentage / 100);
    const reinvestedInterest = interest * (state.settings.reinvestInterestPercentage / 100);

    balance += summary.surplus + reinvestedInterest;
    balanceWithoutCapital += summary.surplus + balanceWithoutCapital * monthlyRate;

    return {
      month,
      label: formatMonth(month),
      balance,
      balanceWithoutCapital,
      interest,
      withdrawableInterest,
      reinvestedInterest,
    };
  });
};

export const buildMonthlyComment = (summary: MonthlySummary) => {
  const top = summary.topCategories[0]?.name ?? 'keine Kategorie';
  const budgetUsed = Math.min(999, summary.expenseProgress);
  return `Du hast diesen Monat ${budgetUsed.toFixed(0).replace('.', ',')} % deines Budgets verwendet. Deine höchste Kategorie war ${top}. Deine Sparquote liegt bei ${summary.savingsRate.toFixed(0).replace('.', ',')} %.`;
};

export const getReminderMessages = (state: AppState, monthKey = currentMonthKey()) => {
  if (!state.settings.remindersEnabled) return [];
  const messages: { id: string; title: string; body: string; severity: 'info' | 'warning' | 'critical' }[] = [];
  const isEnabled = (type: string) =>
    state.reminders.find((reminder) => reminder.type === type)?.enabled ?? true;
  const summary = getMonthlySummary(state, monthKey);
  const monthClosed = state.monthClosures.some((closure) => closure.month === monthKey);
  const latestExpense = [...state.expenseEntries]
    .filter((entry) => entry.active)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const daysSinceExpense = latestExpense
    ? Math.floor((Date.now() - new Date(`${latestExpense.date}T12:00:00`).getTime()) / 86400000)
    : Number.POSITIVE_INFINITY;

  if (!summary.hasIncomeData && isEnabled('missing-income')) {
    messages.push({
      id: 'missing-income',
      title: 'Keine Einnahmen im aktuellen Monat',
      body: 'Trage Einnahmen ein oder aktiviere wiederkehrende Einnahmen.',
      severity: 'warning',
    });
  }
  if (!summary.hasExpenseData && isEnabled('missing-expense')) {
    messages.push({
      id: 'missing-expense',
      title: 'Keine Ausgaben im aktuellen Monat',
      body: 'Erfasse deine Ausgaben, damit Budget und Tagesbudget stimmen.',
      severity: 'info',
    });
  }
  if (daysSinceExpense > 7 && isEnabled('stale-expenses')) {
    messages.push({
      id: 'stale-expenses',
      title: 'Seit mehr als 7 Tagen keine Ausgabe erfasst',
      body: 'Eine kurze Aktualisierung hält deine Auswertung realistisch.',
      severity: 'warning',
    });
  }
  if (!monthClosed && monthKey < currentMonthKey() && isEnabled('monthly-close')) {
    messages.push({
      id: 'monthly-close',
      title: 'Monatsabschluss fehlt',
      body: 'Schließe den vergangenen Monat ab, um deine Historie sauber zu halten.',
      severity: 'critical',
    });
  }
  if (summary.isOverBudget) {
    messages.push({
      id: 'over-budget',
      title: 'Budget überschritten',
      body: 'Deine Ausgaben liegen über dem geplanten Monatsbudget.',
      severity: 'critical',
    });
  }
  if (summary.isSpendingTooFast && !summary.isOverBudget) {
    messages.push({
      id: 'too-fast',
      title: 'Ausgaben liegen über dem idealen Tagesverlauf',
      body: 'Du gibst schneller aus als dein Monatsbudget es vorsieht.',
      severity: 'warning',
    });
  }

  return messages;
};
