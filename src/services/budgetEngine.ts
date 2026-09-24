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

/**
 * Calculates real-time period summary for a given year-month key (YYYY-MM).
 * Pure function: deterministic, instantaneous (< 1ms).
 */
export function calculateBudgetPeriodSummary(
  transactions: Transaction[],
  ratios: BudgetRatios,
  periodKey: string
): BudgetPeriodSummary {
  const periodTransactions = transactions.filter(
    (t) => t.date && t.date.slice(0, 7) === periodKey
  );

  let totalIncome = 0;
  let totalExpenses = 0;
  const pillarExpenses: Record<PillarId, number> = {
    needs: 0,
    wants: 0,
    savings: 0,
  };

  for (const t of periodTransactions) {
    const amount = typeof t.amount === 'number' && !isNaN(t.amount) && t.amount > 0 ? t.amount : 0;
    if (t.type === 'income') {
      totalIncome += amount;
    } else if (t.type === 'expense') {
      totalExpenses += amount;
      if (t.pillarId && t.pillarId in pillarExpenses) {
        pillarExpenses[t.pillarId] += amount;
      }
    } else if (t.type === 'refund') {
      // Refunds decrease total expenses and reduce spent amount in the target pillar
      totalExpenses -= amount;
      if (t.pillarId && t.pillarId in pillarExpenses) {
        pillarExpenses[t.pillarId] = Math.max(0, pillarExpenses[t.pillarId] - amount);
      }
    }
  }

  totalIncome = round2(totalIncome);
  totalExpenses = round2(Math.max(0, totalExpenses));

  const allocations = calculateAllocations(totalIncome, ratios);

  const pillarKeys: PillarId[] = ['needs', 'wants', 'savings'];
  const pillars = {} as Record<PillarId, PillarSummary>;

  for (const key of pillarKeys) {
    const allocated = allocations[key];
    const spent = round2(pillarExpenses[key]);
    const remaining = round2(allocated - spent);
    const isOverBudget = spent > allocated;
    const overrunAmount = isOverBudget ? round2(spent - allocated) : 0;

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

  const netBalance = round2(totalIncome - totalExpenses);
  const resteAVivre = round2(pillars.needs.remaining + pillars.wants.remaining);

  return {
    periodKey,
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
