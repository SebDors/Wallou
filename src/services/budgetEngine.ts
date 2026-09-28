import {
  BudgetPeriodSummary,
  BudgetRatios,
  PillarId,
  PillarStatus,
  PillarSummary,
  PILLAR_NAMES,
  Transaction,
} from '../types/budget';

/**
 * Rounds a number to exactly two decimal places, preventing floating-point inaccuracies
 * using symmetrical financial half-up rounding.
 */
export function round2(value: number): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  const sign = value < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(value) * 100 + Number.EPSILON)) / 100;
}

/**
 * Validates that ratio percentages sum exactly to 100 and are non-negative.
 */
export function validateRatios(ratios: BudgetRatios): { isValid: boolean; error?: string } {
  if (
    typeof ratios?.needs !== 'number' ||
    typeof ratios?.wants !== 'number' ||
    typeof ratios?.savings !== 'number' ||
    isNaN(ratios.needs) ||
    isNaN(ratios.wants) ||
    isNaN(ratios.savings)
  ) {
    return { isValid: false, error: 'INVALID_RATIOS: All ratios must be valid numbers' };
  }

  if (ratios.needs < 0 || ratios.wants < 0 || ratios.savings < 0) {
    return { isValid: false, error: 'NEGATIVE_RATIOS: Ratios must be non-negative' };
  }

  const sum = round2(ratios.needs + ratios.wants + ratios.savings);
  if (sum !== 100) {
    return {
      isValid: false,
      error: `RATIO_SUM_INVALID: Ratios must sum exactly to 100% (currently ${sum}%)`,
    };
  }

  return { isValid: true };
}

/**
 * Calculates allocation amounts for each pillar based on total income and configured ratios.
 */
export function calculateAllocations(
  totalIncome: number,
  ratios: BudgetRatios
): Record<PillarId, number> {
  if (totalIncome <= 0 || isNaN(totalIncome)) {
    return {
      needs: 0,
      wants: 0,
      savings: 0,
    };
  }

  return {
    needs: round2(totalIncome * (ratios.needs / 100)),
    wants: round2(totalIncome * (ratios.wants / 100)),
    savings: round2(totalIncome * (ratios.savings / 100)),
  };
}

import { getDaysInMonth } from './recurrenceService';

const MONTH_ABBR_FR = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'
];

/**
 * Returns the exact start and end Date objects for a budget period key (YYYY-MM) and startDayOfMonth (1-31).
 */
export function getPeriodDateBounds(
  periodKey: string,
  startDayOfMonth: number = 1
): { startDate: Date; endDate: Date } {
  const [yearStr, monthStr] = (periodKey || '').split('-');
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const month = parseInt(monthStr, 10) || new Date().getMonth() + 1;

  const effectiveStartDay = Math.min(Math.max(1, startDayOfMonth), getDaysInMonth(year, month));

  if (effectiveStartDay <= 1) {
    const totalDays = getDaysInMonth(year, month);
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month - 1, totalDays, 23, 59, 59, 999));
    return { startDate, endDate };
  }

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const effectiveNextStartDay = Math.min(Math.max(1, startDayOfMonth), getDaysInMonth(nextYear, nextMonth));

  const startDate = new Date(Date.UTC(year, month - 1, effectiveStartDay, 0, 0, 0, 0));
  const nextPeriodStartDate = new Date(Date.UTC(nextYear, nextMonth - 1, effectiveNextStartDay, 0, 0, 0, 0));
  const endDate = new Date(nextPeriodStartDate.getTime() - 1);

  return { startDate, endDate };
}

/**
 * Checks if a transaction date string belongs to the specified periodKey with startDayOfMonth.
 */
export function isDateInPeriod(
  dateIsoOrStr: string,
  periodKey: string,
  startDayOfMonth: number = 1
): boolean {
  if (!dateIsoOrStr) return false;
  if (startDayOfMonth <= 1) {
    return dateIsoOrStr.slice(0, 7) === periodKey;
  }
  const tTime = new Date(dateIsoOrStr).getTime();
  if (isNaN(tTime)) return false;

  const { startDate, endDate } = getPeriodDateBounds(periodKey, startDayOfMonth);
  return tTime >= startDate.getTime() && tTime <= endDate.getTime();
}

/**
 * Returns a human-readable sub-label for the period date range (e.g. "3 sept. - 2 oct.").
 */
export function formatPeriodSubLabel(
  periodKey: string,
  startDayOfMonth: number = 1
): string {
  const { startDate, endDate } = getPeriodDateBounds(periodKey, startDayOfMonth);
  const startD = startDate.getUTCDate();
  const startM = MONTH_ABBR_FR[startDate.getUTCMonth()];
  const endD = endDate.getUTCDate();
  const endM = MONTH_ABBR_FR[endDate.getUTCMonth()];

  return `${startD} ${startM} - ${endD} ${endM}`;
}

/**
 * Returns the current periodKey for a given date according to startDayOfMonth.
 */
export function getCurrentPeriodKeyForDay(
  startDayOfMonth: number = 1,
  currentDate: Date = new Date()
): string {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const day = currentDate.getDate();

  if (startDayOfMonth <= 1 || day >= startDayOfMonth) {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  const prevDate = new Date(year, month - 2, 1);
  return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Calculates real-time period summary for a given year-month key (YYYY-MM).
 * Pure function: deterministic, instantaneous (< 1ms).
 */
export function calculateBudgetPeriodSummary(
  transactions: Transaction[],
  ratios: BudgetRatios,
  periodKey: string,
  startingBalance: number = 0,
  startDayOfMonth: number = 1
): BudgetPeriodSummary {
  const periodTransactions = transactions.filter(
    (t) => t.date && isDateInPeriod(t.date, periodKey, startDayOfMonth)
  );

  let totalIncome = 0;
  let rawExpenses = 0;
  let rawRefunds = 0;
  const pillarExpenses: Record<PillarId, number> = {
    needs: 0,
    wants: 0,
    savings: 0,
  };
  const pillarRefunds: Record<PillarId, number> = {
    needs: 0,
    wants: 0,
    savings: 0,
  };

  const expenseMap = new Map<string, Transaction>();
  for (const t of periodTransactions) {
    if (t.type === 'expense') {
      expenseMap.set(t.id, t);
    }
  }

  for (const t of periodTransactions) {
    const amount = typeof t.amount === 'number' && !isNaN(t.amount) && t.amount > 0 ? t.amount : 0;
    if (t.type === 'income') {
      totalIncome += amount;
    } else if (t.type === 'expense') {
      const refunded = typeof t.refundedAmount === 'number' && !isNaN(t.refundedAmount) && t.refundedAmount > 0
        ? Math.min(amount, t.refundedAmount)
        : 0;
      const netExpense = Math.max(0, amount - refunded);
      rawExpenses += netExpense;
      if (t.pillarId && t.pillarId in pillarExpenses) {
        pillarExpenses[t.pillarId] += netExpense;
      }
    } else if (t.type === 'refund') {
      // If legacy refund is already tracked on targetExpense.refundedAmount, avoid double deduction
      let alreadyDeductedOnExpense = false;
      if (t.targetExpenseIds && t.targetExpenseIds.length > 0) {
        alreadyDeductedOnExpense = t.targetExpenseIds.some((targetId) => {
          const target = expenseMap.get(targetId);
          return Boolean(target && typeof target.refundedAmount === 'number' && target.refundedAmount > 0);
        });
      }

      if (!alreadyDeductedOnExpense) {
        rawRefunds += amount;
        if (t.pillarId && t.pillarId in pillarRefunds) {
          pillarRefunds[t.pillarId] += amount;
        }
      }
    }
  }

  totalIncome = round2(totalIncome);
  const totalExpenses = round2(Math.max(0, rawExpenses - rawRefunds));

  const allocations = calculateAllocations(totalIncome, ratios);

  const pillarKeys: PillarId[] = ['needs', 'wants', 'savings'];
  const pillars = {} as Record<PillarId, PillarSummary>;

  for (const key of pillarKeys) {
    const allocated = allocations[key];
    const exp = pillarExpenses[key];
    const ref = pillarRefunds[key];
    const spent = round2(Math.max(0, exp - ref));
    const remaining = round2(allocated - exp + ref);
    const isOverBudget = remaining < 0;
    const overrunAmount = isOverBudget ? round2(Math.abs(remaining)) : 0;

    let percentSpent: number;
    let status: PillarStatus;

    if (allocated === 0) {
      if (spent > 0) {
        percentSpent = 100;
        status = 'overrun';
      } else {
        percentSpent = 0;
        status = 'safe';
      }
    } else {
      percentSpent = Math.round((spent / allocated) * 1000) / 10;
      if (spent > allocated) {
        status = 'overrun';
      } else if (spent > 0.8 * allocated) {
        status = 'warning';
      } else {
        status = 'safe';
      }
    }

    pillars[key] = {
      pillarId: key,
      name: PILLAR_NAMES[key],
      ratio: ratios[key],
      allocated,
      spent,
      remaining,
      percentSpent,
      isOverBudget,
      overrunAmount,
      status,
    };
  }

  const safeStartingBalance = isNaN(startingBalance) ? 0 : round2(startingBalance);
  const netBalance = round2(safeStartingBalance + totalIncome - (rawExpenses - rawRefunds));
  const resteAVivre = round2(safeStartingBalance + pillars.needs.remaining + pillars.wants.remaining);

  return {
    periodKey,
    startingBalance: safeStartingBalance,
    totalIncome,
    totalExpenses,
    netBalance,
    resteAVivre,
    pillars,
    transactions: periodTransactions,
  };
}

/**
 * Formats a monetary amount with currency symbol and locale spacing.
 */
export function formatCurrency(
  amount: number,
  currency: string = '€',
  locale: string = 'fr-FR'
): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);

  if (currency === '$' && locale.startsWith('en')) {
    return safeAmount < 0
      ? `-$${formattedNumber.replace('-', '')}`
      : `$${formattedNumber}`;
  }

  return `${formattedNumber} ${currency}`;
}
