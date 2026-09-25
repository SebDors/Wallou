jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import React from 'react';
import { act, create } from 'react-test-renderer';
import { BudgetProvider, useBudget } from '../src/context/BudgetContext';
import { DEFAULT_TRANSACTIONS } from '../src/services/storageService';

let capturedContext: ReturnType<typeof useBudget> | null = null;

const TestConsumer: React.FC = () => {
  const budget = useBudget();
  capturedContext = budget;
  return null;
};

describe('BudgetContext', () => {
  beforeEach(() => {
    capturedContext = null;
    jest.clearAllMocks();
  });

  it('provides budget context and handles transaction lifecycle', async () => {
    await act(async () => {
      create(
        <BudgetProvider>
          <TestConsumer />
        </BudgetProvider>
      );
    });

    expect(capturedContext).not.toBeNull();
    expect(capturedContext?.isHydrated).toBe(true);
    expect(capturedContext?.transactions.length).toBe(DEFAULT_TRANSACTIONS.length);

    // 1. Add income transaction
    await act(async () => {
      await capturedContext?.addTransaction({
        type: 'income',
        amount: 2000,
        category: 'Salaire',
        title: 'Salaire Mensuel',
        date: `${capturedContext.currentPeriodKey}-01T10:00:00.000Z`,
      });
    });

    expect(capturedContext?.transactions.length).toBe(DEFAULT_TRANSACTIONS.length + 1);
    expect(capturedContext?.summary.totalIncome).toBe(2000);
    expect(capturedContext?.summary.pillars.needs.allocated).toBe(1000);
    expect(capturedContext?.summary.pillars.wants.allocated).toBe(600);
    expect(capturedContext?.summary.pillars.savings.allocated).toBe(400);
    expect(capturedContext?.summary.resteAVivre).toBe(1600); // 1000 needs + 600 wants

    // 2. Add expense transaction
    let expenseTxId = '';
    await act(async () => {
      const tx = await capturedContext?.addTransaction({
        type: 'expense',
        amount: 500,
        pillarId: 'needs',
        category: 'Loyer',
        title: 'Loyer partiel',
        date: `${capturedContext.currentPeriodKey}-05T10:00:00.000Z`,
      });
      if (tx) expenseTxId = tx.id;
    });

    expect(capturedContext?.transactions.length).toBe(DEFAULT_TRANSACTIONS.length + 2);
    expect(capturedContext?.summary.totalExpenses).toBe(500);
    expect(capturedContext?.summary.pillars.needs.spent).toBe(500);
    expect(capturedContext?.summary.pillars.needs.remaining).toBe(500);
    expect(capturedContext?.summary.resteAVivre).toBe(1100); // (1000 - 500) + 600

    // 3. Delete expense transaction
    await act(async () => {
      await capturedContext?.deleteTransaction(expenseTxId);
    });

    expect(capturedContext?.transactions.length).toBe(DEFAULT_TRANSACTIONS.length + 1);
    expect(capturedContext?.summary.totalExpenses).toBe(0);
    expect(capturedContext?.summary.pillars.needs.spent).toBe(0);
  });

  it('loads default August 2026 transactions upon initialization', async () => {
    await act(async () => {
      create(
        <BudgetProvider>
          <TestConsumer />
        </BudgetProvider>
      );
    });

    expect(capturedContext).not.toBeNull();
    const augTxs = capturedContext?.transactions.filter((t) => t.date.startsWith('2026-08'));
    expect(augTxs?.length).toBe(5);
    expect(augTxs?.map((t) => t.title)).toEqual(
      expect.arrayContaining(['Salaire', 'Loyer', 'Courses', 'Sorties', 'Épargne'])
    );
  });

  it('validates ratios when updating settings', async () => {
    await act(async () => {
      create(
        <BudgetProvider>
          <TestConsumer />
        </BudgetProvider>
      );
    });

    // Valid update
    await act(async () => {
      await capturedContext?.updateSettings({
        ratios: { needs: 60, wants: 20, savings: 20 },
      });
    });

    expect(capturedContext?.settings.ratios).toEqual({
      needs: 60,
      wants: 20,
      savings: 20,
    });

    // Invalid update should reject
    await expect(
      capturedContext?.updateSettings({
        ratios: { needs: 50, wants: 30, savings: 10 },
      })
    ).rejects.toThrow('RATIO_SUM_INVALID');
  });

  it('supports 100% user-defined categories (empty by default, add, delete)', async () => {
    await act(async () => {
      create(
        <BudgetProvider>
          <TestConsumer />
        </BudgetProvider>
      );
    });

    // Default categories is empty
    expect(capturedContext?.categories).toEqual([]);

    // Add custom category
    await act(async () => {
      await capturedContext?.addCategory('Courses');
    });

    expect(capturedContext?.categories).toContain('Courses');

    // Add second custom category
    await act(async () => {
      await capturedContext?.addCategory('Loisirs');
    });

    expect(capturedContext?.categories).toEqual(['Courses', 'Loisirs']);

    // Delete custom category
    await act(async () => {
      await capturedContext?.deleteCategory('Courses');
    });

    expect(capturedContext?.categories).toEqual(['Loisirs']);
  });
});
