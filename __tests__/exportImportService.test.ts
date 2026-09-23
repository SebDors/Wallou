jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  createBackupPayload,
  validateAndSanitizeBackup,
} from '../src/services/exportImportService';
import { RecurringItem, Transaction, UserSettings } from '../src/types/budget';

describe('exportImportService', () => {
  const sampleSettings: UserSettings = {
    currency: '€',
    ratios: { needs: 50, wants: 30, savings: 20 },
    theme: 'dark',
    hasCompletedOnboarding: true,
  };

  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'income',
      amount: 2500,
      category: 'Salaire',
      title: 'Salaire',
      date: '2026-09-01T08:00:00.000Z',
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'tx-2',
      type: 'expense',
      amount: 750,
      pillarId: 'needs',
      category: 'Loyer',
      title: 'Loyer',
      date: '2026-09-02T10:00:00.000Z',
      createdAt: '2026-09-02T10:00:00.000Z',
      updatedAt: '2026-09-02T10:00:00.000Z',
    },
  ];

  const sampleRecurring: RecurringItem[] = [
    {
      id: 'rec-1',
      type: 'expense',
      amount: 750,
      pillarId: 'needs',
      category: 'Loyer',
      title: 'Loyer Mensuel',
      frequency: 'monthly',
      dayOfMonth: 2,
      startDate: '2026-01-01',
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  describe('createBackupPayload', () => {
    it('creates a compliant hermetic backup payload', () => {
      const payload = createBackupPayload(sampleTransactions, sampleRecurring, sampleSettings);

      expect(payload.version).toBe('1.0.0');
      expect(payload.appName).toBe('GestionApp');
      expect(payload.schemaVersion).toBe(1);
      expect(typeof payload.exportedAt).toBe('string');
      expect(payload.data.settings).toEqual(sampleSettings);
      expect(payload.data.transactions).toEqual(sampleTransactions);
      expect(payload.data.recurring).toEqual(sampleRecurring);
      expect(typeof payload.checksum).toBe('string');
    });
  });

  describe('validateAndSanitizeBackup', () => {
    it('validates a valid JSON backup string', () => {
      const payload = createBackupPayload(sampleTransactions, sampleRecurring, sampleSettings);
      const json = JSON.stringify(payload);

      const result = validateAndSanitizeBackup(json);
      expect(result.isValid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.data.transactions.length).toBe(2);
      expect(result.payload?.data.recurring.length).toBe(1);
      expect(result.payload?.data.settings.currency).toBe('€');
    });

    it('rejects invalid JSON syntax', () => {
      const result = validateAndSanitizeBackup('{ malformed json');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('INVALID_JSON');
    });

    it('rejects payload with wrong appName', () => {
      const payload = {
        version: '1.0.0',
        appName: 'WrongApp',
        schemaVersion: 1,
        data: { settings: sampleSettings, transactions: [], recurring: [] },
      };
      const result = validateAndSanitizeBackup(JSON.stringify(payload));
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('INVALID_APP');
    });

    it('rejects incompatible schema versions', () => {
      const payload = {
        version: '99.0.0',
        appName: 'GestionApp',
        schemaVersion: 99,
        data: { settings: sampleSettings, transactions: [], recurring: [] },
      };
      const result = validateAndSanitizeBackup(JSON.stringify(payload));
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('UNSUPPORTED_VERSION');
    });

    it('reverts corrupted ratios to default 50/30/20 during sanitization', () => {
      const payload = {
        version: '1.0.0',
        appName: 'GestionApp',
        schemaVersion: 1,
        data: {
          settings: {
            ...sampleSettings,
            ratios: { needs: 90, wants: 90, savings: 90 }, // Sum != 100
          },
          transactions: [],
          recurring: [],
        },
      };
      const result = validateAndSanitizeBackup(JSON.stringify(payload));
      expect(result.isValid).toBe(true);
      expect(result.payload?.data.settings.ratios).toEqual({
        needs: 50,
        wants: 30,
        savings: 20,
      });
    });

    it('filters out invalid transactions without valid amounts or pillars', () => {
      const payload = {
        version: '1.0.0',
        appName: 'GestionApp',
        schemaVersion: 1,
        data: {
          settings: sampleSettings,
          transactions: [
            // Valid expense
            {
              id: 'tx-ok',
              type: 'expense',
              amount: 50,
              pillarId: 'needs',
              date: '2026-09-01T00:00:00.000Z',
            },
            // Invalid expense: missing pillar
            {
              id: 'tx-bad-1',
              type: 'expense',
              amount: 50,
              date: '2026-09-01T00:00:00.000Z',
            },
            // Invalid amount: <= 0
            {
              id: 'tx-bad-2',
              type: 'expense',
              amount: -10,
              pillarId: 'needs',
              date: '2026-09-01T00:00:00.000Z',
            },
          ],
          recurring: [],
        },
      };
      const result = validateAndSanitizeBackup(JSON.stringify(payload));
      expect(result.isValid).toBe(true);
      expect(result.payload?.data.transactions.length).toBe(1);
      expect(result.payload?.data.transactions[0].id).toBe('tx-ok');
    });
  });
});
