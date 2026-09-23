# Task Assignment: Backend & State Spec Miner

## 2026-09-23T08:40:55Z

## Objective
Extract exhaustive, unambiguous specifications for the Backend, Calculation Engine, and Local-First State layer from `ORIGINAL_REQUEST.md`.
Specifically detail:
1. 50/30/20 Budget Engine:
   - Data models: Income, Expense, Category/Pillar (Besoins 50%, Envies 30%, Épargne 20%), Recurring Items (frequency, next run, status).
   - Configurable ratios: default 50/30/20, dynamic recalculation when modified.
   - Real-time balance & "reste à vivre" calculations.
   - Overrun detection and alert conditions per pillar.
2. Local-First AsyncStorage:
   - Offline-first persistence architecture.
   - Zero-latency input decoupling (state vs persistence).
   - Storage schema and versioning.
3. Hermetic JSON Import/Export:
   - Complete export format.
   - Import validation, sanitization, error handling, atomic restore.

## Files to Read
- `c:\Users\AY030031\Documents\GestionApp\.agents\ORIGINAL_REQUEST.md`

## Working Directory
`c:\Users\AY030031\Documents\GestionApp\.agents\spec_miner_backend`

## Output Requirements
Write your detailed report to `c:\Users\AY030031\Documents\GestionApp\.agents\spec_miner_backend\handoff.md`.
Include precise interface types, method contracts, error behaviors, and edge cases.
