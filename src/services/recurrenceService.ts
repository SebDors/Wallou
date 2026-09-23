import { RecurringItem, Transaction } from '../types/budget';

let idCounter = 0;

/**
 * Generates a unique transaction identifier.
 */
export function generateUniqueId(prefix: string = 'tx'): string {
  idCounter += 1;
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${idCounter}_${randomPart}`;
}

/**
 * Returns the number of days in a given calendar month for a specified year.
 * Handles leap years properly.
 * @param year e.g. 2026
 * @param month 1-based month (1 = January, 12 = December)
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Clamps target day of month to the maximum available day in the specified month.
 * e.g. Day 31 in February -> 28 (or 29 in leap year), Day 31 in April -> 30.
 */
export function clampDayOfMonth(day: number, year: number, month: number): number {
  const maxDays = getDaysInMonth(year, month);
  return Math.min(Math.max(1, day), maxDays);
}

/**
 * Evaluates active recurring items against a budget period (YYYY-MM)
 * and generates missing transactions idempotently.
 *
 * Invariants:
 * 1. Skips inactive recurring items (isActive === false).
 * 2. Honors startDate and endDate boundaries if provided.
 * 3. Idempotent: generates at most one transaction per recurringId per periodKey.
 * 4. Month-end clamping: safely clamps day 29, 30, 31 to month maximum.
 */
export function processRecurringTransactions(
  recurringItems: RecurringItem[],
  existingTransactions: Transaction[],
  periodKey: string
): Transaction[] {
  if (!periodKey || !/^\d{4}-\d{2}$/.test(periodKey)) {
    return [];
  }

  const [yearStr, monthStr] = periodKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return [];
  }

  const generatedTransactions: Transaction[] = [];
  const nowIso = new Date().toISOString();

  for (const item of recurringItems) {
    // 1. Check if active
    if (!item.isActive) {
      continue;
    }

    // 2. Check startDate boundary
    if (item.startDate) {
      const startPeriod = item.startDate.slice(0, 7);
      if (startPeriod > periodKey) {
        continue;
      }
    }

    // 3. Check endDate boundary
    if (item.endDate) {
      const endPeriod = item.endDate.slice(0, 7);
      if (endPeriod < periodKey) {
        continue;
      }
    }

    // 4. Check idempotency: already executed for this period?
    const isAlreadyGenerated = existingTransactions.some(
      (tx) => tx.recurringId === item.id && tx.date && tx.date.slice(0, 7) === periodKey
    );

    if (isAlreadyGenerated) {
      continue;
    }

    // 5. Compute clamped execution date
    const clampedDay = clampDayOfMonth(item.dayOfMonth, year, month);
    const dayStr = String(clampedDay).padStart(2, '0');
    const transactionDate = `${yearStr}-${monthStr}-${dayStr}T08:00:00.000Z`;

    // 6. Instantiate new transaction
    const newTx: Transaction = {
      id: generateUniqueId('rec_tx'),
      type: item.type,
      amount: item.amount,
      pillarId: item.pillarId,
      category: item.category,
      title: item.title,
      date: transactionDate,
      recurringId: item.id,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    generatedTransactions.push(newTx);
  }

  return generatedTransactions;
}
