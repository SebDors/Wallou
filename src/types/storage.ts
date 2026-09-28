import { Transaction, RecurringItem, UserSettings } from './budget';

// ==========================================
// Storage & Persistence Models
// ==========================================

export interface AppState {
  transactions: Transaction[];
  recurring: RecurringItem[];
  settings: UserSettings;
  isHydrated: boolean;
}

export interface HermeticBackupPayload {
  version: '1.0.0';
  appName: 'GestionApp';
  exportedAt: string;
  schemaVersion: 1;
  data: {
    settings: UserSettings;
    transactions: Transaction[];
    recurring: RecurringItem[];
  };
  checksum?: string;
}
