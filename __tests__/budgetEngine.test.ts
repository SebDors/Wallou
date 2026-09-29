import {
  calculateAllocations,
  calculateBudgetPeriodSummary,
  formatCurrency,
  formatPeriodSubLabel,
  getCurrentPeriodKeyForDay,
  getPeriodDateBounds,
  isDateInPeriod,
  round2,
  validateRatios,
} from '../src/services/budgetEngine';
import { Transaction } from '../src/types/budget';

describe('budgetEngine', () => {
  describe('round2', () => {
    it('rounds numbers to two decimals correctly', () => {
      expect(round2(10.555)).toBe(10.56);
      expect(round2(10.554)).toBe(10.55);
      expect(round2(0)).toBe(0);
      expect(round2(-25.505)).toBe(-25.51);
    });
  });

  describe('validateRatios', () => {
    it('accepts valid 50/30/20 ratios', () => {
      const result = validateRatios({ needs: 50, wants: 30, savings: 20 });
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts custom ratios summing to 100', () => {
      const result = validateRatios({ needs: 60, wants: 20, savings: 20 });
      expect(result.isValid).toBe(true);
    });

    it('rejects ratios not summing to 100', () => {
      const result = validateRatios({ needs: 50, wants: 30, savings: 15 });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('RATIO_SUM_INVALID');
    });

    it('rejects negative ratios', () => {
      const result = validateRatios({ needs: -10, wants: 60, savings: 50 });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('NEGATIVE_RATIOS');
    });
  });

  describe('calculateAllocations', () => {
    it('correctly allocates 2000 € income with 50/30/20 ratios', () => {
      const allocations = calculateAllocations(2000, { needs: 50, wants: 30, savings: 20 });
      expect(allocations).toEqual({
        needs: 1000,
        wants: 600,
        savings: 400,
      });
    });

    it('returns zero allocations when income is 0 or negative', () => {
      expect(calculateAllocations(0, { needs: 50, wants: 30, savings: 20 })).toEqual({
        needs: 0,
        wants: 0,
        savings: 0,
      });
      expect(calculateAllocations(-500, { needs: 50, wants: 30, savings: 20 })).toEqual({
        needs: 0,
        wants: 0,
        savings: 0,
      });
    });

    it('handles decimal income with safe rounding', () => {
      const allocations = calculateAllocations(1000, { needs: 33.33, wants: 33.33, savings: 33.34 });
      expect(allocations.needs).toBe(333.3);
      expect(allocations.wants).toBe(333.3);
      expect(allocations.savings).toBe(333.4);
    });
  });

  describe('calculateBudgetPeriodSummary', () => {
    const ratios = { needs: 50, wants: 30, savings: 20 };
    const periodKey = '2026-09';

    it('correctly aggregates income, expenses, and computes reste à vivre', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          type: 'income',
          amount: 3000,
          category: 'Salaire',
          title: 'Salaire Septembre',
          date: '2026-09-01T09:00:00.000Z',
          createdAt: '2026-09-01T09:00:00.000Z',
          updatedAt: '2026-09-01T09:00:00.000Z',
        },
        {
          id: '2',
          type: 'expense',
          amount: 800,
          pillarId: 'needs',
          category: 'Loyer',
          title: 'Loyer',
          date: '2026-09-05T10:00:00.000Z',
          createdAt: '2026-09-05T10:00:00.000Z',
          updatedAt: '2026-09-05T10:00:00.000Z',
        },
        {
          id: '3',
          type: 'expense',
          amount: 300,
          pillarId: 'wants',
          category: 'Resto',
          title: 'Sorties',
          date: '2026-09-10T20:00:00.000Z',
          createdAt: '2026-09-10T20:00:00.000Z',
          updatedAt: '2026-09-10T20:00:00.000Z',
        },
        {
          id: '4',
          type: 'expense',
          amount: 200,
          pillarId: 'savings',
          category: 'Épargne',
          title: 'Virement Livret A',
          date: '2026-09-15T10:00:00.000Z',
          createdAt: '2026-09-15T10:00:00.000Z',
          updatedAt: '2026-09-15T10:00:00.000Z',
        },
        // Transaction outside period
        {
          id: '5',
          type: 'expense',
          amount: 500,
          pillarId: 'needs',
          category: 'Autre',
          title: 'Août',
          date: '2026-08-25T10:00:00.000Z',
          createdAt: '2026-08-25T10:00:00.000Z',
          updatedAt: '2026-08-25T10:00:00.000Z',
        },
      ];

      const summary = calculateBudgetPeriodSummary(transactions, ratios, periodKey);

      expect(summary.totalIncome).toBe(3000);
      expect(summary.totalExpenses).toBe(1300);
      expect(summary.netBalance).toBe(1700);

      // Allocations: 3000 * 50% = 1500; 3000 * 30% = 900; 3000 * 20% = 600
      expect(summary.pillars.needs.allocated).toBe(1500);
      expect(summary.pillars.needs.spent).toBe(800);
      expect(summary.pillars.needs.remaining).toBe(700);
      expect(summary.pillars.needs.status).toBe('safe');

      expect(summary.pillars.wants.allocated).toBe(900);
      expect(summary.pillars.wants.spent).toBe(300);
      expect(summary.pillars.wants.remaining).toBe(600);
      expect(summary.pillars.wants.status).toBe('safe');

      expect(summary.pillars.savings.allocated).toBe(600);
      expect(summary.pillars.savings.spent).toBe(200);
      expect(summary.pillars.savings.remaining).toBe(400);

      // Reste à vivre = remaining needs (700) + remaining wants (600) = 1300
      expect(summary.resteAVivre).toBe(1300);
    });

    it('correctly detects overrun when expenses exceed allocation', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          type: 'income',
          amount: 1000,
          category: 'Salaire',
          title: 'Salaire',
          date: '2026-09-01T09:00:00.000Z',
          createdAt: '2026-09-01T09:00:00.000Z',
          updatedAt: '2026-09-01T09:00:00.000Z',
        },
        {
          id: '2',
          type: 'expense',
          amount: 600, // Allocated is 1000 * 50% = 500
          pillarId: 'needs',
          category: 'Loyer',
          title: 'Loyer cher',
          date: '2026-09-02T10:00:00.000Z',
          createdAt: '2026-09-02T10:00:00.000Z',
          updatedAt: '2026-09-02T10:00:00.000Z',
        },
      ];

      const summary = calculateBudgetPeriodSummary(transactions, ratios, periodKey);

      expect(summary.pillars.needs.allocated).toBe(500);
      expect(summary.pillars.needs.spent).toBe(600);
      expect(summary.pillars.needs.remaining).toBe(-100);
      expect(summary.pillars.needs.isOverBudget).toBe(true);
      expect(summary.pillars.needs.overrunAmount).toBe(100);
      expect(summary.pillars.needs.status).toBe('overrun');
    });

    it('detects warning status when spent is between 80% and 100% of allocation', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          type: 'income',
          amount: 1000,
          category: 'Salaire',
          title: 'Salaire',
          date: '2026-09-01T09:00:00.000Z',
          createdAt: '2026-09-01T09:00:00.000Z',
          updatedAt: '2026-09-01T09:00:00.000Z',
        },
        {
          id: '2',
          type: 'expense',
          amount: 450, // Allocated is 500. 450/500 = 90% (>80% and <= 100%)
          pillarId: 'needs',
          category: 'Loyer',
          title: 'Loyer',
          date: '2026-09-02T10:00:00.000Z',
          createdAt: '2026-09-02T10:00:00.000Z',
          updatedAt: '2026-09-02T10:00:00.000Z',
        },
      ];

      const summary = calculateBudgetPeriodSummary(transactions, ratios, periodKey);

      expect(summary.pillars.needs.status).toBe('warning');
      expect(summary.pillars.needs.isOverBudget).toBe(false);
    });

    it('correctly deducts refund from totalExpenses and target pillar without altering other pillars', () => {
      const ratios = { needs: 50, wants: 30, savings: 20 };
      const periodKey = '2026-09';
      const transactions: Transaction[] = [
        {
          id: '1',
          type: 'income',
          amount: 2000,
          category: 'Salaire',
          title: 'Salaire',
          date: '2026-09-01T09:00:00.000Z',
          createdAt: '2026-09-01T09:00:00.000Z',
          updatedAt: '2026-09-01T09:00:00.000Z',
        },
        {
          id: '2',
          type: 'expense',
          amount: 100,
          pillarId: 'wants',
          category: 'Restaurant',
          title: 'Dîner entre amis',
          date: '2026-09-05T19:00:00.000Z',
          createdAt: '2026-09-05T19:00:00.000Z',
          updatedAt: '2026-09-05T19:00:00.000Z',
        },
        {
          id: '3',
          type: 'refund',
          amount: 30,
          pillarId: 'wants',
          category: 'Remboursement',
          title: 'Part ami dîner',
          targetExpenseIds: ['2'],
          date: '2026-09-06T10:00:00.000Z',
          createdAt: '2026-09-06T10:00:00.000Z',
          updatedAt: '2026-09-06T10:00:00.000Z',
        },
      ];

      const summary = calculateBudgetPeriodSummary(transactions, ratios, periodKey);

      // Income remains 2000
      expect(summary.totalIncome).toBe(2000);
      // Total expenses: 100 - 30 = 70
      expect(summary.totalExpenses).toBe(70);
      // Wants: allocated 600, spent 70, remaining 530
      expect(summary.pillars.wants.spent).toBe(70);
      expect(summary.pillars.wants.remaining).toBe(530);
      // Needs: allocated 1000, spent 0, remaining 1000
      expect(summary.pillars.needs.spent).toBe(0);
      expect(summary.pillars.needs.remaining).toBe(1000);
      // Savings: allocated 400, spent 0, remaining 400
      expect(summary.pillars.savings.spent).toBe(0);
      expect(summary.pillars.savings.remaining).toBe(400);
      // Reste à vivre: 1000 + 530 = 1530
      expect(summary.resteAVivre).toBe(1530);
    });

    it('handles refund when refund transaction appears before expense (newest-first ordering)', () => {
      const ratios = { needs: 50, wants: 30, savings: 20 };
      const periodKey = '2026-09';
      const transactions: Transaction[] = [
        // Refund appears first in array
        {
          id: 'refund-1',
          type: 'refund',
          amount: 50,
          pillarId: 'needs',
          category: 'Remboursement',
          title: 'Remboursement mutuelle',
          date: '2026-09-10T12:00:00.000Z',
          createdAt: '2026-09-10T12:00:00.000Z',
          updatedAt: '2026-09-10T12:00:00.000Z',
        },
        // Expense appears second
        {
          id: 'exp-1',
          type: 'expense',
          amount: 200,
          pillarId: 'needs',
          category: 'Santé',
          title: 'Médecin',
          date: '2026-09-05T10:00:00.000Z',
          createdAt: '2026-09-05T10:00:00.000Z',
          updatedAt: '2026-09-05T10:00:00.000Z',
        },
        {
          id: 'inc-1',
          type: 'income',
          amount: 2000,
          category: 'Salaire',
          title: 'Salaire',
          date: '2026-09-01T09:00:00.000Z',
          createdAt: '2026-09-01T09:00:00.000Z',
          updatedAt: '2026-09-01T09:00:00.000Z',
        },
      ];

      const summary = calculateBudgetPeriodSummary(transactions, ratios, periodKey);
      // Total expenses: 200 - 50 = 150
      expect(summary.totalExpenses).toBe(150);
      // Needs: allocated 1000, spent 150, remaining 850
      expect(summary.pillars.needs.spent).toBe(150);
      expect(summary.pillars.needs.remaining).toBe(850);
      // Reste à vivre: needs (850) + wants (600) = 1450
      expect(summary.resteAVivre).toBe(1450);
    });

    it('correctly boosts remaining and reste à vivre when refund has no prior expense', () => {
      const ratios = { needs: 50, wants: 30, savings: 20 };
      const periodKey = '2026-09';
      const transactions: Transaction[] = [
        {
          id: 'inc-1',
          type: 'income',
          amount: 2000,
          category: 'Salaire',
          title: 'Salaire',
          date: '2026-09-01T09:00:00.000Z',
          createdAt: '2026-09-01T09:00:00.000Z',
          updatedAt: '2026-09-01T09:00:00.000Z',
        },
        {
          id: 'refund-1',
          type: 'refund',
          amount: 100,
          pillarId: 'needs',
          category: 'Remboursement',
          title: 'Remboursement',
          date: '2026-09-05T10:00:00.000Z',
          createdAt: '2026-09-05T10:00:00.000Z',
          updatedAt: '2026-09-05T10:00:00.000Z',
        },
      ];

      const summary = calculateBudgetPeriodSummary(transactions, ratios, periodKey);
      expect(summary.totalExpenses).toBe(0);
      expect(summary.pillars.needs.spent).toBe(0);
      expect(summary.pillars.needs.remaining).toBe(1100); // 1000 allocated + 100 refund
      expect(summary.pillars.wants.remaining).toBe(600);
      expect(summary.resteAVivre).toBe(1700); // 1100 + 600
    });

    it('incorporates positive startingBalance into netBalance and resteAVivre', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          type: 'income',
          amount: 2000,
          category: 'Salaire',
          title: 'Salaire',
          date: '2026-09-01T09:00:00.000Z',
          createdAt: '2026-09-01T09:00:00.000Z',
          updatedAt: '2026-09-01T09:00:00.000Z',
        },
        {
          id: '2',
          type: 'expense',
          amount: 500,
          pillarId: 'needs',
          category: 'Loyer',
          title: 'Loyer',
          date: '2026-09-05T09:00:00.000Z',
          createdAt: '2026-09-05T09:00:00.000Z',
          updatedAt: '2026-09-05T09:00:00.000Z',
        },
      ];

      const summary = calculateBudgetPeriodSummary(transactions, ratios, periodKey, 300);
      expect(summary.startingBalance).toBe(300);
      // netBalance = 300 + 2000 - 500 = 1800
      expect(summary.netBalance).toBe(1800);
      // needs: 2000 * 50% = 1000 - 500 = 500 remaining
      // wants: 2000 * 30% = 600 remaining
      // resteAVivre = 300 + 500 + 600 = 1400
      expect(summary.resteAVivre).toBe(1400);
    });

    it('incorporates negative startingBalance into netBalance and resteAVivre', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          type: 'income',
          amount: 2000,
          category: 'Salaire',
          title: 'Salaire',
          date: '2026-09-01T09:00:00.000Z',
          createdAt: '2026-09-01T09:00:00.000Z',
          updatedAt: '2026-09-01T09:00:00.000Z',
        },
      ];

      const summary = calculateBudgetPeriodSummary(transactions, ratios, periodKey, -150);
      expect(summary.startingBalance).toBe(-150);
      // netBalance = -150 + 2000 = 1850
      expect(summary.netBalance).toBe(1850);
      // resteAVivre = -150 + 1000 + 600 = 1450
      expect(summary.resteAVivre).toBe(1450);
    });

    it('filters transactions accurately according to startDayOfMonth cycle', () => {
      const transactions: Transaction[] = [
        {
          id: 'early-tx',
          type: 'expense',
          amount: 50,
          pillarId: 'needs',
          category: 'Courses',
          title: 'Courses 2 sept (avant le cycle)',
          date: '2026-09-02T10:00:00.000Z',
          createdAt: '2026-09-02T10:00:00.000Z',
          updatedAt: '2026-09-02T10:00:00.000Z',
        },
        {
          id: 'in-cycle-1',
          type: 'income',
          amount: 2500,
          category: 'Salaire',
          title: 'Salaire du 3 sept',
          date: '2026-09-03T08:00:00.000Z',
          createdAt: '2026-09-03T08:00:00.000Z',
          updatedAt: '2026-09-03T08:00:00.000Z',
        },
        {
          id: 'in-cycle-2',
          type: 'expense',
          amount: 100,
          pillarId: 'wants',
          category: 'Sorties',
          title: 'Sortie du 1er oct (dans le cycle)',
          date: '2026-10-01T20:00:00.000Z',
          createdAt: '2026-10-01T20:00:00.000Z',
          updatedAt: '2026-10-01T20:00:00.000Z',
        },
        {
          id: 'next-cycle',
          type: 'expense',
          amount: 70,
          pillarId: 'wants',
          category: 'Sorties',
          title: 'Sortie du 3 oct (cycle suivant)',
          date: '2026-10-03T10:00:00.000Z',
          createdAt: '2026-10-03T10:00:00.000Z',
          updatedAt: '2026-10-03T10:00:00.000Z',
        },
      ];

      // With startDayOfMonth = 3, cycle 2026-09 goes from 2026-09-03 to 2026-10-02
      const summary = calculateBudgetPeriodSummary(transactions, ratios, '2026-09', 0, 3);
      expect(summary.totalIncome).toBe(2500);
      expect(summary.totalExpenses).toBe(100); // Only in-cycle-2 is included, early-tx and next-cycle are excluded
      expect(summary.transactions.length).toBe(2);
      expect(summary.transactions.map((t) => t.id)).toEqual(['in-cycle-1', 'in-cycle-2']);
    });

    it('excludes future planned transactions from live spent and resteAVivre when asOfDateIso is set', () => {
      const transactions: Transaction[] = [
        {
          id: 'salary',
          type: 'income',
          amount: 1749.5,
          category: 'Salaire',
          title: 'Salaire',
          date: '2026-09-29T08:00:00.000Z',
          createdAt: '2026-09-29T08:00:00.000Z',
          updatedAt: '2026-09-29T08:00:00.000Z',
        },
        {
          id: 'loyer-tomorrow',
          type: 'expense',
          amount: 375,
          pillarId: 'needs',
          category: 'Loyer',
          title: 'Loyer',
          date: '2026-09-30T08:00:00.000Z', // Tomorrow
          createdAt: '2026-09-29T08:00:00.000Z',
          updatedAt: '2026-09-29T08:00:00.000Z',
        },
        {
          id: 'trade-future',
          type: 'expense',
          amount: 360,
          pillarId: 'savings',
          category: 'Épargne',
          title: 'Trade Republic',
          date: '2026-10-02T08:00:00.000Z', // In 3 days
          createdAt: '2026-09-29T08:00:00.000Z',
          updatedAt: '2026-09-29T08:00:00.000Z',
        },
      ];

      // On 2026-09-29: Loyer (Sept 30) and Trade (Oct 2) must NOT be counted yet in actual live spent
      const summaryToday = calculateBudgetPeriodSummary(
        transactions,
        ratios,
        '2026-09',
        0,
        29,
        '2026-09-29'
      );

      expect(summaryToday.totalIncome).toBe(1749.5);
      expect(summaryToday.totalExpenses).toBe(0); // 0 spent so far!
      expect(summaryToday.pillars.needs.spent).toBe(0);
      expect(summaryToday.pillars.savings.spent).toBe(0);
      // Reste à vivre intact: needs (1749.5 * 50% = 874.75) + wants (1749.5 * 30% = 524.85) = 1399.60 €
      expect(summaryToday.resteAVivre).toBe(1399.6);
      // But period transactions still preserves all 3 transactions for forecast/display
      expect(summaryToday.transactions.length).toBe(3);

      // On 2026-09-30: Loyer is now passed, Trade Republic is still future
      const summaryTomorrow = calculateBudgetPeriodSummary(
        transactions,
        ratios,
        '2026-09',
        0,
        29,
        '2026-09-30'
      );
      expect(summaryTomorrow.totalExpenses).toBe(375);
      expect(summaryTomorrow.pillars.needs.spent).toBe(375);
      expect(summaryTomorrow.pillars.savings.spent).toBe(0); // Trade Republic not spent yet
      expect(summaryTomorrow.resteAVivre).toBe(1024.6);
    });
  });

  describe('Cycle Date & Bounds Helpers', () => {
    it('returns exact calendar month bounds when startDayOfMonth is 1', () => {
      const bounds = getPeriodDateBounds('2026-09', 1);
      expect(bounds.startDate.getUTCFullYear()).toBe(2026);
      expect(bounds.startDate.getUTCMonth()).toBe(8); // September (0-indexed)
      expect(bounds.startDate.getUTCDate()).toBe(1);
      expect(bounds.endDate.getUTCDate()).toBe(30);
    });

    it('returns custom offset cycle bounds when startDayOfMonth is 3', () => {
      const bounds = getPeriodDateBounds('2026-09', 3);
      expect(bounds.startDate.getUTCDate()).toBe(3);
      expect(bounds.startDate.getUTCMonth()).toBe(8); // September
      expect(bounds.endDate.getUTCDate()).toBe(2);
      expect(bounds.endDate.getUTCMonth()).toBe(9); // October
    });

    it('checks date membership with isDateInPeriod', () => {
      expect(isDateInPeriod('2026-09-02T23:59:59.000Z', '2026-09', 3)).toBe(false);
      expect(isDateInPeriod('2026-09-03T00:00:00.000Z', '2026-09', 3)).toBe(true);
      expect(isDateInPeriod('2026-10-02T23:00:00.000Z', '2026-09', 3)).toBe(true);
      expect(isDateInPeriod('2026-10-03T00:00:00.000Z', '2026-09', 3)).toBe(false);
    });

    it('formats period sub-labels clearly', () => {
      const label1 = formatPeriodSubLabel('2026-09', 1);
      expect(label1).toBe('1 sept. - 30 sept.');

      const label3 = formatPeriodSubLabel('2026-09', 3);
      expect(label3).toBe('3 sept. - 2 oct.');
    });

    it('determines current period key for date according to start day', () => {
      const dateSept2 = new Date(2026, 8, 2); // 2 Sept
      const dateSept3 = new Date(2026, 8, 3); // 3 Sept
      expect(getCurrentPeriodKeyForDay(3, dateSept2)).toBe('2026-08');
      expect(getCurrentPeriodKeyForDay(3, dateSept3)).toBe('2026-09');
    });
  });

  describe('formatCurrency', () => {
    it('formats positive and negative amounts with currency symbol', () => {
      const formattedPos = formatCurrency(1250.5, '€', 'fr-FR');
      expect(formattedPos).toContain('1');
      expect(formattedPos).toContain('250,50');
      expect(formattedPos).toContain('€');

      const formattedNeg = formatCurrency(-50, '€', 'fr-FR');
      expect(formattedNeg).toContain('-50,00');
      expect(formattedNeg).toContain('€');
    });
  });
});
