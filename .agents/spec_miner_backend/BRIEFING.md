# BRIEFING — 2026-09-23T10:41:35+02:00

## Mission
Extract exhaustive, unambiguous specifications for the Backend, 50/30/20 Budget Engine, Local-First AsyncStorage State Layer, and Hermetic JSON Export/Import.

## 🔒 My Identity
- Archetype: spec_miner
- Roles: spec_miner
- Working directory: c:\Users\AY030031\Documents\GestionApp\.agents\spec_miner_backend
- Original parent: a179ff01-e468-48ca-8d06-bf78e57342c4
- Milestone: Phase 0 - Survey & Specification Mining

## 🔒 Key Constraints
- Extract specifications exclusively from authoritative source: `ORIGINAL_REQUEST.md` and standard financial/architectural best practices.
- Do NOT implement code — read-only specification mining.
- Provide comprehensive tables: Features Discovered, Edge Cases.
- Deliver 5-component handoff report (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
- All communications to orchestrator must be sent via `send_message`.

## Current Parent
- Conversation ID: a179ff01-e468-48ca-8d06-bf78e57342c4
- Updated: 2026-09-23T10:41:35+02:00

## Task Summary
- **What to build**: Complete technical specification for 50/30/20 budget engine, data models, persistence/offline sync, recurring transactions, and export/import.
- **Success criteria**: Unambiguous data schemas (TypeScript interfaces), calculation formulas, error behaviors, edge cases, and storage serialization contracts.
- **Interface contracts**: Output written to `handoff.md` and communicated back via `send_message`.
- **Code layout**: Types and services specified for `src/types/`, `src/services/`, `src/context/` or `src/hooks/`.

## Key Decisions Made
- Map out mathematical definitions of 50/30/20 allocation, rest-to-live ("reste à vivre"), dynamic ratio adaptation, and pillar deficit absorption.
- Specify AsyncStorage key schemas, transaction atomicity, debounce/queueing for 0ms input lag.
- Specify Hermetic JSON schema with checksum, versioning, and validation rules.

## Loaded Skills
- None assigned.

## Artifact Index
- c:\Users\AY030031\Documents\GestionApp\.agents\spec_miner_backend\DISPATCH.md — Assignment
- c:\Users\AY030031\Documents\GestionApp\.agents\spec_miner_backend\BRIEFING.md — Situational awareness
- c:\Users\AY030031\Documents\GestionApp\.agents\spec_miner_backend\progress.md — Liveness & progress tracking
- c:\Users\AY030031\Documents\GestionApp\.agents\spec_miner_backend\handoff.md — Final specification report
