jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearAllStorage,
  DEFAULT_SETTINGS,
  hydrateAll,
  saveRecurring,
  saveSettings,
  saveTransactions,
  STORAGE_KEYS,
} from '../src/services/storageService';
import { RecurringItem, Transaction, UserSettings } from '../src/types/budget';

describe('storageService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('hydrates with default values when storage is empty', async () => {
    const data = await hydrateAll();
    expect(data.transactions).toEqual([]);
    expect(data.recurring).toEqual([]);
    expect(data.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('persists and hydrates transactions, recurring items, and settings', async () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        type: 'income',
        amount: 2000,
        category: 'Salaire',
        title: 'Salaire',
        date: '2026-09-01T00:00:00.000Z',
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      },
    ];

    const recurring: RecurringItem[] = [
      {
        id: 'rec-1',
        type: 'expense',
        amount: 500,
        pillarId: 'needs',
        category: 'Loyer',
        title: 'Loyer',
        frequency: 'monthly',
        dayOfMonth: 5,
        startDate: '2026-01-01',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    const settings: UserSettings = {
      currency: '$',
      ratios: { needs: 60, wants: 20, savings: 20 },
      theme: 'dark',
      hasCompletedOnboarding: true,
    };

    await saveTransactions(transactions);
    await saveRecurring(recurring);
    await saveSettings(settings);

    const hydrated = await hydrateAll();
    expect(hydrated.transactions).toEqual(transactions);
    expect(hydrated.recurring).toEqual(recurring);
    expect(hydrated.settings).toEqual(settings);
  });

  it('clears all storage keys on clearAllStorage', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, '[]');
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, '{}');

    await clearAllStorage();

    const transactions = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    expect(transactions).toBeNull();
    expect(settings).toBeNull();
  });
});
