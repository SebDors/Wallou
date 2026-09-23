// ==========================================
// 1. Core Domain Types & Constants
// ==========================================

export type PillarId = 'needs' | 'wants' | 'savings';
export type TransactionType = 'income' | 'expense';
export type RecurrenceFrequency = 'monthly';
export type PillarStatus = 'safe' | 'warning' | 'overrun';

export interface BudgetRatios {
  needs: number;   // default 50
  wants: number;   // default 30
  savings: number; // default 20
}

export const DEFAULT_RATIOS: BudgetRatios = {
  needs: 50,
  wants: 30,
  savings: 20,
};

export const PILLAR_NAMES: Record<PillarId, string> = {
  needs: 'Besoins',
  wants: 'Envies',
  savings: 'Épargne',
};

export interface Transaction {
  id: string;                    // UUID v4 or unique ID
  type: TransactionType;         // 'income' | 'expense'
  amount: number;                // strictly > 0, 2 decimals
  pillarId?: PillarId;           // mandatory for expense, optional for income
  category: string;              // e.g. "Loyer", "Courses", "Restaurant", "Salaire"
  title: string;                 // label or description
  date: string;                  // ISO 8601 date string (e.g. "2026-09-23T10:00:00.000Z")
  recurringId?: string;          // reference to RecurringItem.id if auto-generated
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}

export interface RecurringItem {
  id: string;                    // UUID v4
  type: TransactionType;         // 'income' | 'expense'
  amount: number;                // strictly > 0
  pillarId?: PillarId;           // mandatory for expense
  category: string;              // e.g. "Abonnement", "Loyer"
  title: string;
  frequency: RecurrenceFrequency;// 'monthly'
  dayOfMonth: number;            // 1 - 31
  startDate: string;             // ISO date "YYYY-MM-DD"
  endDate?: string;              // optional ISO date "YYYY-MM-DD"
  isActive: boolean;             // active toggle
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  currency: string;              // default '€'
  ratios: BudgetRatios;          // default { needs: 50, wants: 30, savings: 20 }
  theme: 'light' | 'dark' | 'system';
  hasCompletedOnboarding: boolean;
}

// ==========================================
// 2. Computed Summaries & Calculation Types
// ==========================================

export interface PillarSummary {
  pillarId: PillarId;
  name: string;                  // "Besoins", "Envies", "Épargne"
  ratio: number;                 // e.g. 50
  allocated: number;             // totalIncome * ratio / 100
  spent: number;                 // sum of expenses in this pillar
  remaining: number;             // allocated - spent
  percentSpent: number;          // (spent / allocated) * 100
  isOverBudget: boolean;         // spent > allocated
  overrunAmount: number;         // max(0, spent - allocated)
  status: PillarStatus;          // 'safe' (<=80%), 'warning' (>80% & <=100%), 'overrun' (>100%)
}

export interface BudgetPeriodSummary {
  periodKey: string;             // "YYYY-MM"
  totalIncome: number;           // sum of all incomes in period
  totalExpenses: number;         // sum of all expenses in period
  netBalance: number;            // totalIncome - totalExpenses
  resteAVivre: number;           // (allocatedNeeds - spentNeeds) + (allocatedWants - spentWants)
  pillars: Record<PillarId, PillarSummary>;
  transactions: Transaction[];   // transactions belonging to this period
}
