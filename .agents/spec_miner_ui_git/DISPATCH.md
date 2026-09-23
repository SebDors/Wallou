# Task Assignment: UI & Git/CI Spec Miner

## Objective
Extract exhaustive, unambiguous specifications for the Frontend UI and Git/CI layers from `ORIGINAL_REQUEST.md`.
Specifically detail:
1. UI & Ergonomics "Trade Republic Warm":
   - Visual tokens: Slate background, Sage, Terracotta, Indigo Blue accents, 1px card borders, typography, spacing.
   - Dark and Light theme specification.
   - 4 Tabs architecture with `expo-router` (`app/(tabs)`):
     * Dashboard: Donut chart (interactive/SVG compatible with Expo Go), gauges, balance/reste à vivre, recent transactions.
     * Transactions: Chronological list, quick filter pills (50%, 30%, 20%), search bar.
     * Recurrences: Monthly fixed incomes/expenses list & creation.
     * Settings: Currency selector, ratio customization, JSON export/import UI, about & update check.
   - Quick Entry Modal: 2-tap fast entry (amount + 50/30/20 attribution), zero frame lag.
   - Strict Expo Go compatibility (allowed libraries: lucide-react-native, react-native-svg if expo compatible, no native custom bridges).
2. Git & CI/CD:
   - Branch `main` initialization (`git init -b main`).
   - Conventional commit convention (`feat:`, `fix:`, `chore:`) per milestone.
   - GitHub Actions workflow for APK compilation (`.github/workflows/build-apk.yml`).
   - `updateService.ts` template for self-update / release checks.

## Files to Read
- `c:\Users\AY030031\Documents\GestionApp\.agents\ORIGINAL_REQUEST.md`

## Working Directory
`c:\Users\AY030031\Documents\GestionApp\.agents\spec_miner_ui_git`

## Output Requirements
Write your detailed report to `c:\Users\AY030031\Documents\GestionApp\.agents\spec_miner_ui_git\handoff.md`.

## 2026-09-23T08:40:55Z
You are the Frontend and Git Spec Miner. Your working directory is c:\Users\AY030031\Documents\GestionApp\.agents\spec_miner_ui_git.
Read your instructions in c:\Users\AY030031\Documents\GestionApp\.agents\spec_miner_ui_git\DISPATCH.md and c:\Users\AY030031\Documents\GestionApp\.agents\ORIGINAL_REQUEST.md.
Extract all precise specifications for the UI & Ergonomics ('Trade Republic Warm' palette, dark/light themes, 4 tabs in expo-router, Donut chart, gauges, 2-tap Quick Entry modal, strict Expo Go compatibility) and Git/CI (branch main, conventional atomic commits, GitHub Actions APK workflow, updateService.ts template).
Write your comprehensive specification report to c:\Users\AY030031\Documents\GestionApp\.agents\spec_miner_ui_git\handoff.md and report back when finished.
REMINDER: DO NOT run 'npm start' or any interactive/blocking development server.

