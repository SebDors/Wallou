# Project: GestionApp (50/30/20 Personal Budget)

## Architecture
- **Platform**: Expo SDK 54, React Native 0.81, React 19, TypeScript strict, Expo Router (`app/(tabs)`).
- **Core Methodology**: Elizabeth Warren 50/30/20 Rule (50% Besoins, 30% Envies, 20% Épargne) with customizable ratios.
- **Data Flow & Decoupling**:
  - In-memory Master State (React Context) provides synchronous, 0ms input updates.
  - Asynchronous write-behind persistence queue to `@react-native-async-storage/async-storage` ensures 0 frame drops.
  - Hermetic JSON Export/Import provides full offline data sovereignty.
- **Visual Design**: "Trade Republic Warm" design system (Slate canvas, Sage, Terracotta, Indigo Blue accents, 1px card borders, tabular numerals, Dark/Light modes).
- **Git & CI/CD**: Branch `main`, conventional atomic commits, GitHub Actions APK compilation workflow, GitHub releases update service.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Transaction Ledger | Stores individual income/expense records with pillar affiliation | M2 | Survey / R2 |
| 2 | Configurable Ratios | Custom distribution for 50/30/20 rule (sum must equal 100) | M2 | Survey / R2 |
| 3 | Recurring Rule Model | Stores recurring monthly charges and incomes with execution day | M2 | Survey / R2 |
| 4 | User Settings Profile | Persists chosen currency, theme preference, and custom ratios | M2 | Survey / R2 |
| 5 | Income Pool Allocation | Partitions total income into the 3 pillars according to active ratios | M2 | Survey / R2 |
| 6 | Pillar Spend Aggregator | Sums expenses per pillar for a given YYYY-MM cycle | M2 | Survey / R2 |
| 7 | Remaining Balance Tracker | Computes remaining budget envelope per pillar (Allocated - Spent) | M2 | Survey / R2 |
| 8 | Real-Time Overrun Detector | Alerts: safe (<=80%), warning (80-100%), overrun (>100%) | M2 | Survey / R2 |
| 9 | "Reste à Vivre" Calculation | Uncommitted liquid funds remaining for living (Needs + Wants remaining) | M2 | Survey / R2 |
| 10 | Global Net Cashflow | Total income minus all expenses in period | M2 | Survey / R2 |
| 11 | Idempotent Rule Execution | Generates recurring transactions for a period only if not present | M2 | Survey / R2 |
| 12 | Month-End Day Clamping | Adjusts day 29, 30, or 31 for shorter months and leap years | M2 | Survey / R2 |
| 13 | Multi-Key Storage Hydration | Loads all collections on boot via single multiGet | M2 | Survey / R3 |
| 14 | Zero-Latency State Decoupling | In-memory synchronous dispatch + debounced background write | M2 | Survey / R3 |
| 15 | Hermetic JSON Export | Generates structured, versioned (1.0.0) backup payload string | M2 | Survey / R3 |
| 16 | Hermetic JSON Validation | Multi-phase defensive validation & sanitization before restore | M2 | Survey / R3 |
| 17 | Atomic Database Restore | Atomic write across all collections using multiSet | M2 | Survey / R3 |
| 18 | Currency Display Formatter | Formats amounts with symbol, space and thousand separators | M2 | Survey / R2 |
| 19 | Theme Tokens System | "Trade Republic Warm" palette (Dark & Light tokens, Slate, Sage, Terracotta, Indigo) | M3 | Survey / R1, R4 |
| 20 | ThemeContext & Persistence | Global React context providing current theme and toggle, persisted in storage | M3 | Survey / R1 |
| 21 | Expo Router Tab Bar | Custom 5-item bottom bar (Dashboard, Transactions, [+] Quick Entry, Recurrences, Settings) | M3 | Survey / R4 |
| 22 | Dashboard: Reste à Vivre Hero | Prominent real-time display of disposable income (34px tabular-nums) | M3 | Survey / R4 |
| 23 | Dashboard: SVG Donut Chart | 3-segment proportional Donut chart (react-native-svg) with center summary | M3 | Survey / R4 |
| 24 | Dashboard: Pillar Progress Gauges | Visual linear gauges for Besoins (50%), Envies (30%), Épargne (20%) | M3 | Survey / R4 |
| 25 | Dashboard: Recent Transactions | Preview of 4-5 most recent transactions with navigation link | M3 | Survey / R4 |
| 26 | Transactions: Chronological List | Date-grouped transaction list (Aujourd'hui, Hier, Cette semaine...) | M3 | Survey / R4 |
| 27 | Transactions: Search & Filters | Search by title/note and filter pills (Tous, 50%, 30%, 20%, Revenus) | M3 | Survey / R4 |
| 28 | Transactions: Item Actions | Tap to edit, swipe-to-delete with confirmation modal | M3 | Survey / R4 |
| 29 | Recurrences: Fixed Summary | Summary banner of monthly fixed expenses vs fixed income | M3 | Survey / R4 |
| 30 | Recurrences: List & Toggle | List of recurring items with active/inactive switch and execution day | M3 | Survey / R4 |
| 31 | Recurrences: Add/Edit Modal | Form to create/edit monthly recurring income/expense | M3 | Survey / R2 |
| 32 | Settings: Currency Selector | Configurable currency (€, $, £, CHF, CAD) across app | M3 | Survey / R4 |
| 33 | Settings: Custom Ratio Editor | Interactive steppers to customize allocation percentages (must sum to 100) | M3 | Survey / R4 |
| 34 | Settings: JSON Export UI | One-tap button to export data via expo-sharing share sheet | M3 | Survey / R4 |
| 35 | Settings: JSON Import UI | File picker and schema validation dialog to restore application data | M3 | Survey / R4 |
| 36 | Settings: Version & Update UI | Version display and button to check latest GitHub release | M3 | Survey / R4 |
| 37 | Quick Entry: 2-Tap Modal | Zero-lag numeric keypad + 3 pillar attribution buttons [50%] [30%] [20%] | M3 | Survey / R3, R4 |
| 38 | Quick Entry: Decoupled Input | Synchronous keystroke state + instant modal close (<50ms) + background flush | M3 | Survey / R3 |
| 39 | Compatibility: Strict Expo Go | Whitelist restricted to Expo Go SDK 54 bundled dependencies | M1, M3 | Survey / R1 |
| 40 | Git: Branch Main Initialization | Local Git repo initialized on branch `main` (`git init -b main`) | M1 | Survey / R5 |
| 41 | Git: Atomic Conventional Commits | Structured commits (`chore:`, `feat:`, `fix:`, `test:`, `ci:`) per milestone | M1-M5 | Survey / R5 |
| 42 | CI/CD: GitHub Actions APK Workflow | Automated Android APK compilation pipeline (`.github/workflows/build-apk.yml`) | M4 | Survey / R5 |
| 43 | CI/CD: Self-Update Service | Template `src/services/updateService.ts` querying GitHub Releases API | M4 | Survey / R5 |
| 44 | QA: Budget Math & Engine Tests | Jest unit tests for 50/30/20 calculations, allocations, and overrun detection | M5 | Survey / AC |
| 45 | QA: Recurrence Engine Tests | Jest unit tests for monthly generation, idempotency, and month-end day clamping | M5 | Survey / AC |
| 46 | QA: Storage & Backup Tests | Jest unit tests for AsyncStorage serialization, JSON backup creation, and validation | M5 | Survey / AC |
| 47 | QA: Update Service Semver Tests | Jest unit tests for semantic version comparison and release contract | M5 | Survey / AC |
| 48 | QA: Expo Go Compatibility Audit | Verification of dependencies, tsconfig strictness, and pure JS/SVG compliance | M5 | Survey / AC |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Git Init & Project Scaffolding | `git init -b main`, `.gitignore`, `package.json` (Expo SDK 54 / RN 0.81 / React 19), `tsconfig.json`, `app.json`, `npm.cmd install` | None | DONE |
| M2 | Backend Core & Engine | TypeScript models, 50/30/20 calculation engine, recurrence engine, AsyncStorage service, JSON export/import, BudgetContext | M1 | DONE |
| M3 | Frontend UI & Navigation | Theme tokens, ThemeContext, SVG Donut chart, Gauges, Quick Entry 2-tap modal, 4 tabs (Dashboard, Transactions, Recurrences, Settings) | M2 | IN_PROGRESS |
| M4 | CI/CD & Update Service | `.github/workflows/build-apk.yml` and `src/services/updateService.ts` | M1 | PLANNED |
| M5 | Comprehensive QA & Verification | Jest test suites (budget, recurrences, storage, backup, update), static typechecking (`npx.cmd tsc --noEmit`), Expo Go audit | M2, M3, M4 | PLANNED |

## Code Layout
```
c:\Users\AY030031\Documents\GestionApp\
├── .github/
│   └── workflows/
│       └── build-apk.yml
├── .gitignore
├── app.json
├── package.json
├── tsconfig.json
├── babel.config.js
├── jest.config.js
├── app/
│   ├── _layout.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── transactions.tsx
│       ├── recurrences.tsx
│       └── settings.tsx
├── src/
│   ├── types/
│   │   ├── budget.ts
│   │   └── storage.ts
│   ├── constants/
│   │   └── theme.ts
│   ├── context/
│   │   ├── BudgetContext.tsx
│   │   └── ThemeContext.tsx
│   ├── services/
│   │   ├── budgetEngine.ts
│   │   ├── recurrenceService.ts
│   │   ├── storageService.ts
│   │   ├── exportImportService.ts
│   │   └── updateService.ts
│   └── components/
│       ├── DonutChart.tsx
│       ├── PillarGauge.tsx
│       ├── QuickEntryModal.tsx
│       ├── NumericKeypad.tsx
│       ├── Card.tsx
│       ├── Header.tsx
│       └── Pill.tsx
└── __tests__/
    ├── budgetEngine.test.ts
    ├── recurrenceService.test.ts
    ├── exportImportService.test.ts
    └── updateService.test.ts
```

## Interface Contracts
### `src/services/budgetEngine.ts`
```typescript
export function validateRatios(ratios: BudgetRatios): { isValid: boolean; error?: string };
export function calculateAllocations(totalIncome: number, ratios: BudgetRatios): Record<PillarId, number>;
export function calculateBudgetPeriodSummary(transactions: Transaction[], ratios: BudgetRatios, periodKey: string): BudgetPeriodSummary;
export function formatCurrency(amount: number, currency?: string, locale?: string): string;
```

### `src/services/recurrenceService.ts`
```typescript
export function processRecurringTransactions(recurringItems: RecurringItem[], existingTransactions: Transaction[], periodKey: string): Transaction[];
```

### `src/services/storageService.ts`
```typescript
export function hydrateAll(): Promise<{ transactions: Transaction[]; recurring: RecurringItem[]; settings: UserSettings }>;
export function saveTransactions(transactions: Transaction[]): Promise<void>;
export function saveRecurring(recurring: RecurringItem[]): Promise<void>;
export function saveSettings(settings: UserSettings): Promise<void>;
export function clearAllStorage(): Promise<void>;
```

### `src/services/exportImportService.ts`
```typescript
export function createBackupPayload(transactions: Transaction[], recurring: RecurringItem[], settings: UserSettings): HermeticBackupPayload;
export function validateAndSanitizeBackup(rawJson: string): { isValid: boolean; payload?: HermeticBackupPayload; error?: string };
export function restoreFromBackup(payload: HermeticBackupPayload): Promise<void>;
```

### `src/services/updateService.ts`
```typescript
export function compareSemver(v1: string, v2: string): number;
export function checkForUpdate(currentVersion: string, repoOwner?: string, repoName?: string): Promise<ReleaseInfo>;
export function openDownloadPage(url: string): Promise<void>;
```
