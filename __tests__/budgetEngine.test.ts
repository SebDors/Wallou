import {
  calculateAllocations,
  calculateBudgetPeriodSummary,
  formatCurrency,
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
