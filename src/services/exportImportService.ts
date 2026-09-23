import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecurringItem, Transaction, UserSettings, DEFAULT_RATIOS } from '../types/budget';
import { HermeticBackupPayload } from '../types/storage';
import { round2 } from './budgetEngine';
import { STORAGE_KEYS } from './storageService';

/**
 * Computes a fast, deterministic hash string over the backup data payload
 * without requiring native crypto modules.
 */
function computeDataChecksum(dataString: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < dataString.length; i++) {
    hash ^= dataString.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `h_${(hash >>> 0).toString(16)}`;
}

/**
 * Generates an immutable, structured JSON backup payload.
 */
export function createBackupPayload(
  transactions: Transaction[],
  recurring: RecurringItem[],
  settings: UserSettings
): HermeticBackupPayload {
  const data = {
    settings,
    transactions,
    recurring,
  };

  const checksum = computeDataChecksum(JSON.stringify(data));

  return {
    version: '1.0.0',
    appName: 'GestionApp',
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    data,
    checksum,
  };
}

/**
 * Validates, cleanses, and sanitizes a raw JSON backup string.
 * Rejects corrupt schemas and maintains database safety.
 */
export function validateAndSanitizeBackup(
  rawJson: string
): { isValid: boolean; payload?: HermeticBackupPayload; error?: string } {
  // Phase 1: Syntactic Parse Check
  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { isValid: false, error: 'INVALID_JSON: Malformed JSON syntax' };
  }

  // Phase 2: Envelope & Application Identity Check
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { isValid: false, error: 'INVALID_PAYLOAD: Backup root must be an object' };
  }

  if (parsed.appName !== 'GestionApp') {
    return {
      isValid: false,
      error: `INVALID_APP: Expected appName "GestionApp", got "${parsed.appName}"`,
    };
  }

  if (parsed.version !== '1.0.0' && parsed.schemaVersion !== 1) {
    return {
      isValid: false,
      error: `UNSUPPORTED_VERSION: Incompatible backup version "${parsed.version}"`,
    };
  }

  if (!parsed.data || typeof parsed.data !== 'object') {
    return { isValid: false, error: 'MISSING_DATA: Backup payload is missing data object' };
  }

  // Phase 3: Settings Sanitization
  const rawSettings = parsed.data.settings;
  if (!rawSettings || typeof rawSettings !== 'object') {
    return { isValid: false, error: 'INVALID_SETTINGS: Settings object is missing or invalid' };
  }

  const currency =
    typeof rawSettings.currency === 'string' && rawSettings.currency.trim().length > 0
      ? rawSettings.currency.trim()
      : '€';

  let ratios = { ...DEFAULT_RATIOS };
  if (rawSettings.ratios && typeof rawSettings.ratios === 'object') {
    const { needs, wants, savings } = rawSettings.ratios;
    if (
      typeof needs === 'number' &&
      typeof wants === 'number' &&
      typeof savings === 'number' &&
      needs >= 0 &&
      wants >= 0 &&
      savings >= 0 &&
      Math.round((needs + wants + savings) * 100) / 100 === 100
    ) {
      ratios = { needs, wants, savings };
    }
  }

  const theme: 'light' | 'dark' | 'system' = ['light', 'dark', 'system'].includes(rawSettings.theme)
    ? rawSettings.theme
    : 'system';

  const hasCompletedOnboarding = Boolean(rawSettings.hasCompletedOnboarding);

  const sanitizedSettings: UserSettings = {
    currency,
    ratios,
    theme,
    hasCompletedOnboarding,
  };

  // Phase 4: Transactions Sanitization
  if (!Array.isArray(parsed.data.transactions)) {
    return { isValid: false, error: 'INVALID_TRANSACTIONS: Transactions collection must be an array' };
  }

  const sanitizedTransactions: Transaction[] = [];
  for (const item of parsed.data.transactions) {
    if (!item || typeof item !== 'object') continue;
    if (!item.id || typeof item.id !== 'string') continue;
    if (item.type !== 'income' && item.type !== 'expense') continue;

    const amount = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount);
    if (isNaN(amount) || amount <= 0) continue;
    if (!item.date || typeof item.date !== 'string') continue;

    const pillarId =
      item.pillarId === 'needs' || item.pillarId === 'wants' || item.pillarId === 'savings'
        ? item.pillarId
        : undefined;

    // Expenses must be associated with a valid pillar
    if (item.type === 'expense' && !pillarId) {
      continue;
    }

    sanitizedTransactions.push({
      id: String(item.id),
      type: item.type,
      amount: round2(amount),
      pillarId,
      category: typeof item.category === 'string' && item.category ? item.category : 'Général',
      title: typeof item.title === 'string' ? item.title : '',
      date: item.date,
      recurringId: typeof item.recurringId === 'string' ? item.recurringId : undefined,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
      updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
    });
  }

  // Phase 5: Recurring Items Sanitization
  if (!Array.isArray(parsed.data.recurring)) {
    return { isValid: false, error: 'INVALID_RECURRING: Recurring collection must be an array' };
  }

  const sanitizedRecurring: RecurringItem[] = [];
  for (const item of parsed.data.recurring) {
    if (!item || typeof item !== 'object') continue;
    if (!item.id || typeof item.id !== 'string') continue;
    if (item.type !== 'income' && item.type !== 'expense') continue;

    const amount = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount);
    if (isNaN(amount) || amount <= 0) continue;

    const dayOfMonth =
      typeof item.dayOfMonth === 'number'
        ? Math.min(Math.max(1, Math.floor(item.dayOfMonth)), 31)
        : 1;

    const pillarId =
      item.pillarId === 'needs' || item.pillarId === 'wants' || item.pillarId === 'savings'
        ? item.pillarId
        : undefined;

    sanitizedRecurring.push({
      id: String(item.id),
      type: item.type,
      amount: round2(amount),
      pillarId,
      category: typeof item.category === 'string' && item.category ? item.category : 'Abonnement',
      title: typeof item.title === 'string' ? item.title : '',
      frequency: 'monthly',
      dayOfMonth,
      startDate:
        typeof item.startDate === 'string'
          ? item.startDate
          : new Date().toISOString().slice(0, 10),
      endDate: typeof item.endDate === 'string' ? item.endDate : undefined,
      isActive: item.isActive !== false,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
      updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
    });
  }

  return {
    isValid: true,
    payload: {
      version: '1.0.0',
      appName: 'GestionApp',
      exportedAt:
        typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
      schemaVersion: 1,
      data: {
        settings: sanitizedSettings,
        transactions: sanitizedTransactions,
        recurring: sanitizedRecurring,
      },
      checksum: typeof parsed.checksum === 'string' ? parsed.checksum : undefined,
    },
  };
}

/**
 * Restores state atomically to AsyncStorage using multiSet.
 */
export async function restoreFromBackup(payload: HermeticBackupPayload): Promise<void> {
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.TRANSACTIONS, JSON.stringify(payload.data.transactions)],
    [STORAGE_KEYS.RECURRING, JSON.stringify(payload.data.recurring)],
    [STORAGE_KEYS.SETTINGS, JSON.stringify(payload.data.settings)],
    [STORAGE_KEYS.VERSION, payload.version],
  ]);
}
