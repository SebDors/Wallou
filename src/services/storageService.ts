import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecurringItem, Transaction, UserSettings } from '../types/budget';

export const STORAGE_KEYS = {
  VERSION: '@gestion_app/version',
  TRANSACTIONS: '@gestion_app/transactions',
  RECURRING: '@gestion_app/recurring',
  SETTINGS: '@gestion_app/settings',
} as const;

export const SCHEMA_VERSION = '1.0.0';

export const DEFAULT_SETTINGS: UserSettings = {
  currency: '€',
  ratios: {
    needs: 50,
    wants: 30,
    savings: 20,
  },
  theme: 'system',
  hasCompletedOnboarding: false,
};

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'seed-tx-2026-08-01-salaire',
    type: 'income',
    amount: 2300,
    category: 'Salaire',
    title: 'Salaire',
    date: '2026-08-01T08:00:00.000Z',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-01T08:00:00.000Z',
  },
  {
    id: 'seed-tx-2026-08-05-loyer',
    type: 'expense',
    amount: 375,
    pillarId: 'needs',
    category: 'Loyer',
    title: 'Loyer',
    date: '2026-08-05T08:00:00.000Z',
    createdAt: '2026-08-05T08:00:00.000Z',
    updatedAt: '2026-08-05T08:00:00.000Z',
  },
  {
    id: 'seed-tx-2026-08-10-courses',
    type: 'expense',
    amount: 210,
    pillarId: 'needs',
    category: 'Courses',
    title: 'Courses',
    date: '2026-08-10T10:00:00.000Z',
    createdAt: '2026-08-10T10:00:00.000Z',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'seed-tx-2026-08-18-sorties',
    type: 'expense',
    amount: 85,
    pillarId: 'wants',
    category: 'Sorties',
    title: 'Sorties',
    date: '2026-08-18T19:00:00.000Z',
    createdAt: '2026-08-18T19:00:00.000Z',
    updatedAt: '2026-08-18T19:00:00.000Z',
  },
  {
    id: 'seed-tx-2026-08-25-epargne',
    type: 'expense',
    amount: 250,
    pillarId: 'savings',
    category: 'Épargne',
    title: 'Épargne',
    date: '2026-08-25T09:00:00.000Z',
    createdAt: '2026-08-25T09:00:00.000Z',
    updatedAt: '2026-08-25T09:00:00.000Z',
  },
];

/**
 * Loads all state collections on boot via a single multiGet request.
 * Falls back safely to empty arrays and default settings if uninitialized or corrupted.
 */
export async function hydrateAll(): Promise<{
  transactions: Transaction[];
  recurring: RecurringItem[];
  settings: UserSettings;
}> {
  try {
    const keys = [
      STORAGE_KEYS.TRANSACTIONS,
      STORAGE_KEYS.RECURRING,
      STORAGE_KEYS.SETTINGS,
    ];
    const pairs = await AsyncStorage.multiGet(keys);
    const map = new Map<string, string | null>(pairs);

    let transactions: Transaction[] = [...DEFAULT_TRANSACTIONS];
    const rawTx = map.get(STORAGE_KEYS.TRANSACTIONS);
    if (rawTx) {
      try {
        const parsed = JSON.parse(rawTx);
        if (Array.isArray(parsed)) {
          transactions = parsed;
        }
      } catch (err) {
        console.warn('Storage corrupted for transactions, resetting to defaults', err);
      }
    }

    let recurring: RecurringItem[] = [];
    const rawRec = map.get(STORAGE_KEYS.RECURRING);
    if (rawRec) {
      try {
        const parsed = JSON.parse(rawRec);
        if (Array.isArray(parsed)) {
          recurring = parsed;
        }
      } catch (err) {
        console.warn('Storage corrupted for recurring items, resetting to []', err);
      }
    }

    let settings: UserSettings = { ...DEFAULT_SETTINGS };
    const rawSettings = map.get(STORAGE_KEYS.SETTINGS);
    if (rawSettings) {
      try {
        const parsed = JSON.parse(rawSettings);
        if (parsed && typeof parsed === 'object') {
          settings = {
            ...DEFAULT_SETTINGS,
            ...parsed,
            ratios: parsed.ratios
              ? { ...DEFAULT_SETTINGS.ratios, ...parsed.ratios }
              : DEFAULT_SETTINGS.ratios,
          };
        }
      } catch (err) {
        console.warn('Storage corrupted for settings, resetting to defaults', err);
      }
    }

    return { transactions, recurring, settings };
  } catch (error) {
    console.error('Failed to hydrate storage:', error);
    return {
      transactions: [...DEFAULT_TRANSACTIONS],
      recurring: [],
      settings: { ...DEFAULT_SETTINGS },
    };
  }
}

/**
 * Persists transactions collection to AsyncStorage.
 */
export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

/**
 * Persists recurring items collection to AsyncStorage.
 */
export async function saveRecurring(recurring: RecurringItem[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(recurring));
}

/**
 * Persists user settings to AsyncStorage.
 */
export async function saveSettings(settings: UserSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

/**
 * Clears all application data from AsyncStorage.
 */
export async function clearAllStorage(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.TRANSACTIONS,
    STORAGE_KEYS.RECURRING,
    STORAGE_KEYS.SETTINGS,
    STORAGE_KEYS.VERSION,
  ]);
}
