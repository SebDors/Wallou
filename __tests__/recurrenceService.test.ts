import {
  clampDayOfMonth,
  computeRecurringDateInPeriod,
  getDaysInMonth,
  processRecurringTransactions,
} from '../src/services/recurrenceService';
import { RecurringItem, Transaction } from '../src/types/budget';

describe('recurrenceService', () => {
  describe('getDaysInMonth & clampDayOfMonth', () => {
    it('returns 28 days for February in non-leap year', () => {
      expect(getDaysInMonth(2026, 2)).toBe(28);
      expect(clampDayOfMonth(31, 2026, 2)).toBe(28);
    });

    it('returns 29 days for February in leap year', () => {
      expect(getDaysInMonth(2024, 2)).toBe(29);
      expect(clampDayOfMonth(31, 2024, 2)).toBe(29);
    });

    it('returns 30 days for April', () => {
      expect(getDaysInMonth(2026, 4)).toBe(30);
      expect(clampDayOfMonth(31, 2026, 4)).toBe(30);
    });

    it('returns 31 days for January and keeps day 15 unchanged', () => {
      expect(getDaysInMonth(2026, 1)).toBe(31);
      expect(clampDayOfMonth(15, 2026, 1)).toBe(15);
    });
  });

  describe('computeRecurringDateInPeriod', () => {
    it('computes correct dates for calendar month when startDayOfMonth is 1', () => {
      expect(computeRecurringDateInPeriod(2, '2026-09', 1)).toBe('2026-09-02T08:00:00.000Z');
      expect(computeRecurringDateInPeriod(29, '2026-09', 1)).toBe('2026-09-29T08:00:00.000Z');
      expect(computeRecurringDateInPeriod(30, '2026-09', 1)).toBe('2026-09-30T08:00:00.000Z');
    });

    it('computes correct dates when startDayOfMonth is 29 (cycle: Sept 29 - Oct 28)', () => {
      // Day 29 and 30 are in September 2026
      expect(computeRecurringDateInPeriod(29, '2026-09', 29)).toBe('2026-09-29T08:00:00.000Z');
      expect(computeRecurringDateInPeriod(30, '2026-09', 29)).toBe('2026-09-30T08:00:00.000Z');
      // Day 2 is in October 2026 (following month in cycle)
      expect(computeRecurringDateInPeriod(2, '2026-09', 29)).toBe('2026-10-02T08:00:00.000Z');
    });

    it('handles year transition for December cycle (Dec 29 - Jan 28)', () => {
      expect(computeRecurringDateInPeriod(29, '2026-12', 29)).toBe('2026-12-29T08:00:00.000Z');
      expect(computeRecurringDateInPeriod(5, '2026-12', 29)).toBe('2027-01-05T08:00:00.000Z');
    });
  });

  describe('processRecurringTransactions', () => {
    const periodKey = '2026-09';
    const recurringItems: RecurringItem[] = [
      {
        id: 'rec-1',
        type: 'expense',
        amount: 800,
        pillarId: 'needs',
        category: 'Logement',
        title: 'Loyer mensuel',
        frequency: 'monthly',
        dayOfMonth: 5,
        startDate: '2026-01-01',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'rec-2',
        type: 'expense',
        amount: 15,
        pillarId: 'wants',
        category: 'Streaming',
        title: 'Netflix',
        frequency: 'monthly',
        dayOfMonth: 31,
        startDate: '2026-01-01',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'rec-3',
        type: 'income',
        amount: 2500,
        category: 'Emploi',
        title: 'Salaire',
        frequency: 'monthly',
        dayOfMonth: 28,
        startDate: '2026-01-01',
        isActive: false, // Inactive
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'rec-4',
        type: 'expense',
        amount: 50,
        pillarId: 'needs',
        category: 'Transport',
        title: 'Pass Navigo',
        frequency: 'monthly',
        dayOfMonth: 1,
        startDate: '2026-10-01', // Future start date
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    it('generates transactions for active items within validity period', () => {
      const existingTransactions: Transaction[] = [];
      const generated = processRecurringTransactions(recurringItems, existingTransactions, periodKey);

      // rec-3 is inactive, rec-4 starts in 2026-10 -> only rec-1 and rec-2 generated
      expect(generated.length).toBe(2);

      const loyerTx = generated.find((t) => t.recurringId === 'rec-1');
      expect(loyerTx).toBeDefined();
      expect(loyerTx?.amount).toBe(800);
      expect(loyerTx?.pillarId).toBe('needs');
      expect(loyerTx?.date).toBe('2026-09-05T08:00:00.000Z');

      const netflixTx = generated.find((t) => t.recurringId === 'rec-2');
      expect(netflixTx).toBeDefined();
      // September has 30 days -> day 31 clamped to 30
      expect(netflixTx?.date).toBe('2026-09-30T08:00:00.000Z');
    });

    it('generates transactions correctly for custom startDayOfMonth = 29', () => {
      const customItems: RecurringItem[] = [
        {
          id: 'rec-salaire',
          type: 'income',
          amount: 1749.5,
          category: 'Salaire',
          title: 'Salaire',
          frequency: 'monthly',
          dayOfMonth: 29,
          startDate: '2026-01-01',
          isActive: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'rec-loyer',
          type: 'expense',
          amount: 375,
          pillarId: 'needs',
          category: 'Loyer',
          title: 'Loyer',
          frequency: 'monthly',
          dayOfMonth: 30,
          startDate: '2026-01-01',
          isActive: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'rec-trade',
          type: 'expense',
          amount: 360,
          pillarId: 'savings',
          category: 'Épargne',
          title: 'Trade Republic',
          frequency: 'monthly',
          dayOfMonth: 2,
          startDate: '2026-01-01',
          isActive: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ];

      const generated = processRecurringTransactions(customItems, [], '2026-09', 29);

      expect(generated.length).toBe(3);

      const salaire = generated.find((t) => t.recurringId === 'rec-salaire');
      expect(salaire?.date).toBe('2026-09-29T08:00:00.000Z');

      const loyer = generated.find((t) => t.recurringId === 'rec-loyer');
      expect(loyer?.date).toBe('2026-09-30T08:00:00.000Z');

      const trade = generated.find((t) => t.recurringId === 'rec-trade');
      // Crucial: Trade Republic on day 2 occurs on October 2, 2026, not September 2!
      expect(trade?.date).toBe('2026-10-02T08:00:00.000Z');
    });

    it('is strictly idempotent and generates 0 duplicates if already present in period', () => {
      const existingTransactions: Transaction[] = [
        {
          id: 'tx-already-here',
          type: 'expense',
          amount: 800,
          pillarId: 'needs',
          category: 'Logement',
          title: 'Loyer mensuel',
          date: '2026-09-05T08:00:00.000Z',
          recurringId: 'rec-1',
          createdAt: '2026-09-05T08:00:00.000Z',
          updatedAt: '2026-09-05T08:00:00.000Z',
        },
      ];

      const generated = processRecurringTransactions(recurringItems, existingTransactions, periodKey);

      // rec-1 is already present, so only rec-2 is generated
      expect(generated.length).toBe(1);
      expect(generated[0].recurringId).toBe('rec-2');
    });

    it('correctly clamps day 31 to 28 for February 2026', () => {
      const generated = processRecurringTransactions(
        [recurringItems[1]], // Netflix day 31
        [],
        '2026-02'
      );

      expect(generated.length).toBe(1);
      expect(generated[0].date).toBe('2026-02-28T08:00:00.000Z');
    });

    it('returns empty array for invalid period format', () => {
      expect(processRecurringTransactions(recurringItems, [], 'invalid')).toEqual([]);
      expect(processRecurringTransactions(recurringItems, [], '')).toEqual([]);
    });
  });
});
