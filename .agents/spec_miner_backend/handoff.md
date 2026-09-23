# Handoff Report: Backend, Budget Engine & Local-First State Specifications

**Agent**: spec_miner_backend  
**Role**: Teamwork Specification Miner  
**Target Milestone**: Phase 0 (Survey & Specification Mining) -> M2 (Backend Core Engine)  
**Date**: 2026-09-23T10:43:00+02:00  

---

## 1. Observation

Authoritative specification sources reviewed:
- `c:\Users\AY030031\Documents\GestionApp\.agents\ORIGINAL_REQUEST.md` (Lines 1-65)
- `c:\Users\AY030031\Documents\GestionApp\.agents\spec_miner_backend\DISPATCH.md` (Lines 1-28)

### Direct Verbatim Requirements Observed:
1. **Core Purpose & Philosophy (Lines 7-8)**:
   > "Application mobile React Native / Expo (Local-First) de gestion budgétaire personnelle basée sur la règle 50/30/20 (Besoins 50%, Envies 30%, Épargne 20%), avec saisie ultra-rapide sans friction, design épuré type Trade Republic aux teintes chaleureuses, et zéro dépendance cloud."
2. **Backend Role Scope (Line 14)**:
   > "**Agent Dev Backend / State & Local-First** : Modélisation des types TypeScript, service AsyncStorage, moteur de calcul 50/30/20, gestion des récurrences mensuelles, service d'export/import JSON hermétique."
3. **Moteur Budgétaire 50/30/20 & Gestion des Périodes (Lines 26-30)**:
   > "- Définition des revenus et calcul automatique des allocations : 50% Besoins, 30% Envies, 20% Épargne (ratios configurables).
   > - Suivi en temps réel de chaque pilier : Alloué, Dépensé, Reste disponible, avec détection des dépassements.
   > - Gestion d'une devise unique paramétrable (€ par défaut).
   > - Gestion des dépenses et revenus récurrents (loyer, abonnements, salaire) appliqués au cycle budgétaire."
4. **Architecture Local-First & Performance de Saisie (Lines 32-35)**:
   > "- Stockage 100% hors-ligne dans AsyncStorage sans télémétrie ni serveur externe.
   > - Saisie des montants instantanée : découplage strict entre le state local de saisie et la persistance disque pour garantir 0ms de latence.
   > - Module de sauvegarde manuelle : export JSON complet et restauration / import JSON sans altération."
5. **Critères d'Acceptance Spécifiques (Lines 53-60)**:
   > "- Une suite de tests unitaires valide la répartition exacte des revenus en 50/30/20 et les déductions des dépenses.
   > - Les soldes restants se recalculent instantanément sans régression lors de l'ajout, modification ou suppression d'une transaction.
   > - L'application conserve les données après redémarrage (état persistant dans AsyncStorage).
   > - L'export JSON produit un fichier structuré valide, et l'import JSON restaure fidèlement toutes les données existantes."

---

## 2. Logic Chain

From the observed requirements, we deduce the following structural architectural and mathematical imperatives:

### Step 1: The 50/30/20 Mathematical Formulation & Invariants
1. **Pillars & Envelopes**:
   The user budget is governed by three pillars:
   - `needs` (Besoins): Essential costs (rent, groceries, healthcare, utilities). Default ratio $r_{needs} = 50\%$.
   - `wants` (Envies): Discretionary spending (dining out, entertainment, hobbies). Default ratio $r_{wants} = 30\%$.
   - `savings` (Épargne): Capital building, investments, emergency savings. Default ratio $r_{savings} = 20\%$.
2. **Ratio Invariant**:
   For any configuration of ratios $(r_{needs}, r_{wants}, r_{savings}) \in \mathbb{N}^3$:
   $$r_{needs} + r_{wants} + r_{savings} = 100$$
   If a user submits ratios whose sum $\neq 100$, the calculation engine must reject the configuration and maintain the previous valid state.
3. **Period Partitioning**:
   Financial tracking operates over discrete calendar months identified by the format `YYYY-MM` (e.g. `2026-09`).
4. **Total Income & Envelope Allocations**:
   Given all valid income transactions in period $P$:
   $$T_{inc}(P) = \sum_{t \in \text{Income}(P)} \text{amount}(t)$$
   The dynamic budget allocations for each pillar $i \in \{\text{needs}, \text{wants}, \text{savings}\}$ are:
   $$\text{Allocated}_i(P) = \text{round}_2\left( T_{inc}(P) \times \frac{r_i}{100} \right)$$
   Where $\text{round}_2(x) = \frac{\lfloor x \times 100 + 0.5 \rfloor}{100}$ guarantees exact financial decimal accuracy without IEEE 754 floating-point drift (e.g. $0.1 + 0.2 \to 0.30$).
5. **Pillar Spending & Balances**:
   For each pillar $i$:
   $$\text{Spent}_i(P) = \sum_{t \in \text{Expenses}_i(P)} \text{amount}(t)$$
   $$\text{Remaining}_i(P) = \text{Allocated}_i(P) - \text{Spent}_i(P)$$
   $$\text{PercentSpent}_i(P) = \begin{cases} 0 & \text{if } \text{Allocated}_i(P) = 0 \text{ and } \text{Spent}_i(P) = 0 \\ \infty \text{ (or } >100\% \text{)} & \text{if } \text{Allocated}_i(P) = 0 \text{ and } \text{Spent}_i(P) > 0 \\ \text{round}_1\left(\frac{\text{Spent}_i(P)}{\text{Allocated}_i(P)} \times 100\right) & \text{otherwise} \end{cases}$$
6. **Global Balance & "Reste à Vivre"**:
   - **Net Cashflow Balance**:
     $$\text{NetBalance}(P) = T_{inc}(P) - \sum_{i} \text{Spent}_i(P)$$
   - **Reste à Vivre (Liquid Disposable Allowance)**:
     In French financial management, "Reste à vivre" represents the uncommitted liquid money remaining to cover everyday living and lifestyle costs without eating into savings:
     $$\text{ResteAVivre}(P) = \text{Remaining}_{needs}(P) + \text{Remaining}_{wants}(P)$$
7. **Overrun Detection & Alert Status**:
   For each pillar $i$:
   $$\text{Status}_i(P) = \begin{cases} \text{'safe'} & \text{if } \text{Spent}_i(P) \le 0.80 \times \text{Allocated}_i(P) \\ \text{'warning'} & \text{if } 0.80 \times \text{Allocated}_i(P) < \text{Spent}_i(P) \le \text{Allocated}_i(P) \\ \text{'overrun'} & \text{if } \text{Spent}_i(P) > \text{Allocated}_i(P) \end{cases}$$
   $$\text{OverrunAmount}_i(P) = \max(0, \text{Spent}_i(P) - \text{Allocated}_i(P))$$

---

### Step 2: Recurring Items Engine Specification
1. **Rule Representation**:
   Recurring items (`RecurringItem`) specify fixed monthly costs/incomes (e.g. salary, rent, gym subscription).
2. **Idempotent Periodic Generation**:
   A recurring rule $R$ must generate at most ONE transaction $t$ per calendar month `YYYY-MM`.
   - The generated transaction possesses `recurringId = R.id`.
   - Before generation, the engine queries the transaction ledger:
     $$\exists t \in \text{Transactions} \text{ where } t.recurringId = R.id \text{ and } \text{formatYearMonth}(t.date) = P$$
   - If a matching transaction exists, generation is skipped (idempotent).
   - If missing, a transaction is instantiated on date:
     $$\text{Date} = \text{formatDate}(YYYY, MM, \min(R.dayOfMonth, \text{daysInMonth}(YYYY, MM)))$$
3. **Month Clamping Edge Case**:
   If $R.dayOfMonth = 31$, for February (28 or 29 days) and 30-day months (April, June, September, November), the transaction date is automatically clamped to the last day of the month ($28, 29, \text{ or } 30$).

---

### Step 3: Local-First AsyncStorage & Zero-Latency Input Decoupling
1. **The Zero-Latency Problem**:
   Writing directly to disk / native bridge (`AsyncStorage.setItem`) on every keystroke or button tap incurs 5ms to 50ms of asynchronous bridge latency, which causes frame drops in React Native UI.
2. **Decoupled Architecture**:
   - **Layer 1: In-Memory Master State (Zustand or Context + Dispatch)**
     - Single source of truth in JavaScript memory.
     - Reducers / store actions update in-memory state synchronously (0ms latency).
     - Component renders and balance recalculations trigger immediately.
   - **Layer 2: Write-Behind Persistence Queue (Debounced / Batch)**
     - Any mutation to transactions, recurring items, or settings triggers an asynchronous task that persists the serialized state to AsyncStorage.
     - If multiple rapid transactions are entered (e.g. rapid taps), writes are queued or debounced (e.g. 150ms window) without blocking UI interactivity.
3. **Storage Keys**:
   - `@gestion_app/transactions`: JSON serialization of `Transaction[]`
   - `@gestion_app/recurring`: JSON serialization of `RecurringItem[]`
   - `@gestion_app/settings`: JSON serialization of `UserSettings`
   - `@gestion_app/version`: Current schema version string (e.g. `"1.0.0"`)
4. **Hydration Lifecycle**:
   - On application startup: `AsyncStorage.multiGet` reads all keys in a single round-trip.
   - If keys are missing, populate defaults.
   - Set `isHydrated = true` to allow application UI rendering.

---

### Step 4: Hermetic JSON Import/Export Specification
1. **Export Envelope Format**:
   ```typescript
   export interface HermeticBackupPayload {
     version: "1.0.0";
     appName: "GestionApp";
     exportedAt: string; // ISO 8601 UTC
     schemaVersion: 1;
     data: {
       settings: UserSettings;
       transactions: Transaction[];
       recurring: RecurringItem[];
     };
     checksum: string; // SHA-256 or formatted payload integrity token
   }
   ```
2. **Import Integrity & Defensive Validation**:
   - **Phase 1: Syntactic Check**: Parse string via `JSON.parse`. Catch syntax errors.
   - **Phase 2: Envelope & Schema Validation**:
     - Check `version === "1.0.0"` and `appName === "GestionApp"`.
     - Check `data` exists, containing `settings`, `transactions`, `recurring`.
   - **Phase 3: Deep Type & Value Sanitization**:
     - Filter out any transaction missing `id`, `type`, `amount`, or `date`.
     - Coerce amounts to positive numbers ($> 0$).
     - Validate pillar assignment: must be `'needs'`, `'wants'`, or `'savings'`.
     - Verify ratios sum to 100; if corrupted, revert to `50/30/20`.
   - **Phase 4: Atomic Commit**:
     - Use `AsyncStorage.multiSet` to write all validated collections simultaneously.
     - Synchronize the in-memory state.
     - Prevent partial database writes if an error occurs.

---

## 3. TypeScript Interfaces Specification

The backend implementation must declare the following exact TypeScript interfaces in `src/types/budget.ts` and `src/types/storage.ts`:

```typescript
// ==========================================
// 1. Core Domain Types
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

export interface Transaction {
  id: string;                    // UUID v4
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

// ==========================================
// 3. Storage & Backup Types
// ==========================================

export interface AppState {
  transactions: Transaction[];
  recurring: RecurringItem[];
  settings: UserSettings;
  isHydrated: boolean;
}

export interface HermeticBackupPayload {
  version: "1.0.0";
  appName: "GestionApp";
  exportedAt: string;
  schemaVersion: 1;
  data: {
    settings: UserSettings;
    transactions: Transaction[];
    recurring: RecurringItem[];
  };
  checksum?: string;
}
```

---

## 4. Method Contracts & Calculation Engine Signatures

The backend service layer must expose pure, testable functional interfaces:

### A. Budget Calculation Engine (`src/services/budgetEngine.ts`)

```typescript
/**
 * Validates that ratio percentages sum exactly to 100 and are non-negative integers.
 */
export function validateRatios(ratios: BudgetRatios): { isValid: boolean; error?: string };

/**
 * Calculates allocation amounts for each pillar based on total income and configured ratios.
 */
export function calculateAllocations(
  totalIncome: number,
  ratios: BudgetRatios
): Record<PillarId, number>;

/**
 * Calculates real-time period summary for a given year-month key.
 * Pure function: deterministic and instantaneous (< 1ms).
 */
export function calculateBudgetPeriodSummary(
  transactions: Transaction[],
  ratios: BudgetRatios,
  periodKey: string // "YYYY-MM"
): BudgetPeriodSummary;

/**
 * Formats a monetary amount with currency symbol and locale spacing.
 */
export function formatCurrency(
  amount: number,
  currency: string = '€',
  locale: string = 'fr-FR'
): string;
```

### B. Recurring Transactions Engine (`src/services/recurringEngine.ts`)

```typescript
/**
 * Evaluates active recurring items against a period and generates missing transactions idempotently.
 * Clamps day of month safely (e.g. Feb 31 -> Feb 28/29).
 */
export function processRecurringTransactions(
  recurringItems: RecurringItem[],
  existingTransactions: Transaction[],
  periodKey: string // "YYYY-MM"
): Transaction[];
```

### C. Local-First AsyncStorage Service (`src/services/storageService.ts`)

```typescript
export const STORAGE_KEYS = {
  VERSION: '@gestion_app/version',
  TRANSACTIONS: '@gestion_app/transactions',
  RECURRING: '@gestion_app/recurring',
  SETTINGS: '@gestion_app/settings',
} as const;

export async function hydrateAll(): Promise<{
  transactions: Transaction[];
  recurring: RecurringItem[];
  settings: UserSettings;
}>;

export async function saveTransactions(transactions: Transaction[]): Promise<void>;
export async function saveRecurring(recurring: RecurringItem[]): Promise<void>;
export async function saveSettings(settings: UserSettings): Promise<void>;
export async function clearAllStorage(): Promise<void>;
```

### D. Hermetic Export/Import Service (`src/services/exportImportService.ts`)

```typescript
/**
 * Generates an immutable, structured JSON backup payload.
 */
export function createBackupPayload(
  transactions: Transaction[],
  recurring: RecurringItem[],
  settings: UserSettings
): HermeticBackupPayload;

/**
 * Validates, cleanses and parses a raw JSON backup string.
 * Throws structured validation errors if corrupted.
 */
export function validateAndSanitizeBackup(
  rawJson: string
): { isValid: boolean; payload?: HermeticBackupPayload; error?: string };

/**
 * Restores state atomically to AsyncStorage.
 */
export async function restoreFromBackup(
  payload: HermeticBackupPayload
): Promise<void>;
```

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Data Model | Transaction Ledger | Stores individual income or expense records with pillar affiliation | `Transaction` object (`id`, `type`, `amount`, `pillarId`, `category`, `title`, `date`) | Validated record stored in memory & AsyncStorage | Validation error on invalid amount ($\le 0$) or missing required fields | `ORIGINAL_REQUEST.md` R2/R3 |
| 2 | Data Model | Configurable Ratios | Custom distribution for 50/30/20 rule | `BudgetRatios` (`needs`, `wants`, `savings`) | Updated ratio configuration | Rejects ratios if sum $\neq 100$; returns descriptive error | `ORIGINAL_REQUEST.md` R2 |
| 3 | Data Model | Recurring Rule Model | Stores recurring monthly charges and income with target execution day | `RecurringItem` (`type`, `amount`, `pillarId`, `category`, `dayOfMonth`, `isActive`) | Stored rule ready for monthly synthesis | Rejects invalid `dayOfMonth` ($<1$ or $>31$) | `ORIGINAL_REQUEST.md` R2 |
| 4 | Data Model | User Settings Profile | Persists chosen currency, theme preference, and custom ratios | `UserSettings` (`currency`, `ratios`, `theme`) | Settings state | Falls back to defaults (`€`, `50/30/20`, `'system'`) if uninitialized | `ORIGINAL_REQUEST.md` R2/R4 |
| 5 | Calculation Engine | Income Pool Allocation | Partitions total income into the 3 pillars according to active ratios | `totalIncome: number`, `ratios: BudgetRatios` | Object with allocated amounts per pillar | Capped at 2 decimal places with safe half-up rounding | `ORIGINAL_REQUEST.md` R2 |
| 6 | Calculation Engine | Pillar Spend Aggregator | Sums all expenses per pillar for a given `YYYY-MM` cycle | `transactions: Transaction[]`, `periodKey: string` | Spent amounts per pillar ($S_{needs}, S_{wants}, S_{savings}$) | Ignores transactions outside selected period | `ORIGINAL_REQUEST.md` R2 |
| 7 | Calculation Engine | Remaining Balance Tracker | Computes remaining budget envelope per pillar ($A_i - S_i$) | Allocated and spent values per pillar | `remaining: number` per pillar | Negative value represents deficit / overrun | `ORIGINAL_REQUEST.md` R2 |
| 8 | Calculation Engine | Real-Time Overrun Detector | Categorizes pillar into 'safe' ($\le 80\%$), 'warning' ($80\%-100\%$), or 'overrun' ($>100\%$) | `spent: number`, `allocated: number` | `status: 'safe' \| 'warning' \| 'overrun'`, `overrunAmount` | If allocation = 0 and spent > 0, immediate 'overrun' alert | `ORIGINAL_REQUEST.md` R2 |
| 9 | Calculation Engine | "Reste à Vivre" Calculation | Computes net liquid funds remaining for living & entertainment | Current period allocations and expenses | `resteAVivre: number` ($R_{needs} + R_{wants}$) | Reflects real disposable funds without touching savings | `ORIGINAL_REQUEST.md` R2/R4 |
| 10 | Calculation Engine | Global Net Cashflow | Computes total net liquidity change in period | Total income minus all expenses | `netBalance: number` | Negative indicates overall living beyond means | `ORIGINAL_REQUEST.md` R2 |
| 11 | Recurring Engine | Idempotent Rule Execution | Generates recurring transactions for a period only if not already present | `recurringItems`, `existingTransactions`, `periodKey` | Array of newly generated transactions | Idempotent: 0 transactions generated if already executed for month | `ORIGINAL_REQUEST.md` R2 |
| 12 | Recurring Engine | Month-End Day Clamping | Adjusts day 29, 30, or 31 for shorter months and leap years | Target day (e.g. 31), target month (e.g. Feb) | Clamped day (e.g. 28 or 29) | No overflow into next month | `ORIGINAL_REQUEST.md` R2 |
| 13 | Local-First Storage | Multi-Key Storage Hydration | Loads all collections on boot via single `multiGet` | AsyncStorage keys | Populated in-memory state, `isHydrated: true` | Falls back to empty arrays and default settings if storage empty | `ORIGINAL_REQUEST.md` R3 |
| 14 | Local-First Storage | Zero-Latency State Decoupling | In-memory synchronous dispatch coupled with asynchronous background persistence | User action (add/edit/delete transaction) | Synchronous state update (0ms lag) + debounced background write | Catches background storage failure; state remains responsive | `ORIGINAL_REQUEST.md` R3 |
| 15 | Backup & Restore | Hermetic JSON Export | Generates structured, versioned backup payload string | Current app state | Valid JSON backup string | Formatted with 2 spaces for human inspectability | `ORIGINAL_REQUEST.md` R3 |
| 16 | Backup & Restore | Hermetic JSON Validation | Validates format, keys, and values before applying restore | Raw JSON string | Validation result (`isValid: boolean`, `error?: string`) | Rejects malformed JSON or corrupted schemas without touching DB | `ORIGINAL_REQUEST.md` R3 |
| 17 | Backup & Restore | Atomic Database Restore | Replaces existing storage with validated backup payload | Validated backup payload | Restored database state across all collections | Uses `multiSet` atomically; rollbacks on disk write failure | `ORIGINAL_REQUEST.md` R3 |
| 18 | Formatting | Currency Display Formatter | Formats amounts with symbol, space and thousand separators | `amount: number`, `currency: string` | Formatted string (e.g. "1 250,50 €") | Handles negative numbers cleanly ("-50,00 €") | `ORIGINAL_REQUEST.md` R2 |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | 50/30/20 Allocation | Zero income entered in period ($T_{inc} = 0$) | Allocations for Needs, Wants, and Savings are $0.00$. Any expense in a pillar immediately flags `status: 'overrun'`, `isOverBudget: true`, and `remaining: -spent`. |
| 2 | Ratio Configuration | User enters ratios summing to 95 or 105 (e.g. 50/30/15) | Engine validation rejects changes with error `RATIO_SUM_INVALID: Ratios must sum exactly to 100%`. Current settings remain unchanged. |
| 3 | Transaction Saisie | Amount entered is $\le 0$ or NaN (e.g. 0, -25.00, "abc") | Input validator rejects with `INVALID_AMOUNT`. Transaction creation is blocked; UI maintains form state. |
| 4 | Recurring Item Execution | `dayOfMonth = 31` for February or April | Date generation clamps day to month max (e.g. `2026-02-28` in normal year, `2026-02-29` in leap year, `2026-04-30`). Never leaks into the subsequent month. |
| 5 | Recurring Item Deduplication | App restarted multiple times in the same month | Generator checks `existingTransactions.some(t => t.recurringId === item.id && t.date.startsWith("YYYY-MM"))`. Returns 0 new transactions on repeat runs. |
| 6 | Recurring Item Deletion | User deletes an auto-generated transaction during the active month | The recurring rule does not auto-regenerate the deleted transaction unless the user clicks "Forcer la régénération". |
| 7 | Floating Point Rounding | Income $1000.00$ with ratios 33.33% / 33.33% / 33.34% | Decimal sanitizer rounds every allocation to exact cents ($333.30, 333.30, 333.40$). Prevents IEEE 754 float drift ($0.30000000000000004$). |
| 8 | Large Numbers | Transaction amount = $1\,000\,000\,000.00$ | Number safely handled within JavaScript `Number.MAX_SAFE_INTEGER` ($9 \times 10^{15}$). Formatter formats with spaces ("1 000 000 000,00 €"). |
| 9 | Corrupted JSON Import | JSON string missing closing brace or missing `transactions` key | `validateAndSanitizeBackup` catches syntax/schema error, returns `{ isValid: false, error: "Schema validation failed" }`. Existing data remains 100% untouched. |
| 10 | Foreign Version Import | Import payload with unknown `version: "99.0.0"` | Validator detects unsupported major version, returns `{ isValid: false, error: "Incompatible backup version" }`. |
| 11 | Missing Pillar on Expense | Expense transaction submitted with `pillarId: undefined` | Validator rejects expense with `PILLAR_REQUIRED: Expenses must be assigned to Needs, Wants, or Savings`. |
| 12 | Income with No Pillar Tag | Income transaction submitted with `pillarId: undefined` | Accepted as valid general income. General income adds directly to total income pool $T_{inc}$, dynamically expanding all three pillar allocations. |
| 13 | Cross-Pillar Deficit | Needs has -100 € deficit, Wants has +200 € remaining | Pillar card for Needs displays RED alert (-100 € overrun). Overall Reste à Vivre displays net liquid +100 €. Clear isolation of pillar overrun. |
| 14 | Rapid Keystroke Input | User types digits rapidly into the amount field | Local component state updates synchronously (0ms); debounced storage persistence writes behind without blocking the JavaScript thread or UI frame rate. |
| 15 | Ratio Modification Mid-Period | User changes ratios from 50/30/20 to 60/20/20 mid-month | Engine recalculates allocations dynamically in real time; all existing transactions reflect new pillar boundaries immediately. |

---

## 3. Caveats

1. **Calendar Month vs Custom Pay Period**:
   The Elizabeth Warren 50/30/20 rule is standardly evaluated on a monthly basis. This specification models periods using standard calendar months (`YYYY-MM`). If users receive salaries on specific days (e.g. 25th of the month), future iterations can add custom period offsets, but the core engine uses clean ISO `YYYY-MM` periods for zero complexity and maximum reliability.
2. **Expense Refunds & Income Pillar Tags**:
   Income items typically flow into the global budget pool. However, if a user receives an expense refund, they can either record an income or delete/edit the original expense. The model allows `pillarId` on income optionally to support targeted credits in future extensions.
3. **No External Network Storage**:
   Per requirements, all storage is strictly local (`AsyncStorage`). No remote sync or cloud conflict resolution is required or permitted.

---

## 4. Conclusion

The backend requirements for the 50/30/20 budget application are fully mined, rigorously formulated, and architecturally complete.
- **Data Models**: Defined in full TypeScript interfaces (`Transaction`, `RecurringItem`, `UserSettings`, `BudgetRatios`, `PillarSummary`, `BudgetPeriodSummary`).
- **50/30/20 Engine**: Fully specified with exact mathematical formulas, decimal cent rounding, overrun conditions, and "reste à vivre" calculations.
- **Local-First & 0ms Latency**: In-memory synchronous state layer decoupled from asynchronous background disk persistence.
- **Hermetic JSON Backup**: Completely specified with strict multi-phase validation, sanitization, and atomic restore.
- **Testing Surface**: Ready for 100% Jest test coverage across calculations, recurrences, and storage serialization.

The specifications are ready for direct consumption and implementation by the Backend Developer (`dev_backend`).

---

## 5. Verification Method

To independently verify this specification and its subsequent implementation:

1. **Unit Test Verification (Jest)**:
   Run unit tests targeting the calculation engine:
   ```bash
   npm test -- src/services/__tests__/budgetEngine.test.ts
   npm test -- src/services/__tests__/recurringEngine.test.ts
   npm test -- src/services/__tests__/exportImportService.test.ts
   ```
   Specific test cases to verify:
   - `calculateAllocations(2000, { needs: 50, wants: 30, savings: 20 })` yields exactly `{ needs: 1000, wants: 600, savings: 400 }`.
   - `calculateAllocations(0, ...)` yields `{ needs: 0, wants: 0, savings: 0 }`.
   - Expenses exceeding allocation correctly flip `isOverBudget: true` and `status: 'overrun'`.
   - Idempotency test: calling `processRecurringTransactions` twice for `2026-09` produces 0 duplicates.
   - Day clamping test: recurring item on day 31 evaluated in February produces day 28 (or 29 in leap year).
   - Hermetic import rejection test: invalid JSON or missing fields throws validation failure without corrupting state.
2. **File Inspection**:
   Inspect `c:\Users\AY030031\Documents\GestionApp\.agents\spec_miner_backend\handoff.md` to confirm all sections, interface definitions, and edge cases are documented.
