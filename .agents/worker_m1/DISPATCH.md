# Task Assignment: Milestone 1 — Git Init & Project Scaffolding

## Role
Worker (Agent Git & Scaffolding)

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objective
Initialize the project repository with Git on branch `main`, configure `.gitignore`, scaffold Expo SDK 54 with React Native 0.81, React 19, TypeScript strict, and install all required dependencies. Then create an atomic conventional commit.

## Detailed Tasks
1. **Git Initialization**:
   - Run `git init -b main` in `c:\Users\AY030031\Documents\GestionApp`.
   - Verify active branch is `main`.
2. **Configuration & Scaffolding Files**:
   - Create `.gitignore`:
     ```gitignore
     node_modules/
     .expo/
     dist/
     npm-debug.*
     yarn-debug.*
     yarn-error.*
     android/
     ios/
     web-build/
     .env*
     .DS_Store
     Thumbs.db
     ```
   - Create `package.json` with exact versions specified in `PROJECT.md` and `c:\Users\AY030031\Documents\GestionApp\.agents\explorer_survey_1\handoff.md`:
     - name: `gestion-app`
     - version: `1.0.0`
     - main: `expo-router/entry`
     - scripts: `start`: `expo start`, `test`: `jest`, `typecheck`: `tsc --noEmit`
     - dependencies: `expo`: `~54.0.36`, `expo-constants`: `~18.0.13`, `expo-font`: `~14.0.12`, `expo-linking`: `~8.0.12`, `expo-router`: `~6.0.24`, `expo-splash-screen`: `~31.0.13`, `expo-status-bar`: `~3.0.9`, `react`: `19.1.0`, `react-dom`: `19.1.0`, `react-native`: `0.81.5`, `react-native-safe-area-context`: `~5.6.0`, `react-native-screens`: `~4.16.0`, `react-native-svg`: `~15.11.2`, `lucide-react-native`: `^1.47.0`, `@react-native-async-storage/async-storage`: `^2.1.2`, `@react-navigation/native`: `^7.1.8`, `expo-haptics`: `~14.1.2`, `expo-sharing`: `~13.1.2`, `expo-file-system`: `~18.1.3`, `expo-document-picker`: `~13.1.2`
     - devDependencies: `@types/react`: `~19.1.0`, `@types/jest`: `^29.5.14`, `jest`: `^29.7.0`, `jest-expo`: `~54.0.18`, `typescript`: `~5.9.2`
   - Create `tsconfig.json`:
     - extends: `expo/tsconfig.base`
     - compilerOptions: `strict: true`, `baseUrl: "."`, `paths: { "@/*": ["./*"] }`
   - Create `app.json`:
     - name: `GestionApp`, slug: `gestion-app`, version: `1.0.0`, orientation: `portrait`, scheme: `gestionapp`, userInterfaceStyle: `automatic`, newArchEnabled: `true`, plugins: `["expo-router"]`
   - Create `babel.config.js`:
     ```javascript
     module.exports = function (api) {
       api.cache(true);
       return {
         presets: ['babel-preset-expo'],
       };
     };
     ```
   - Create minimal placeholder asset directory `assets/` (e.g. dummy icon or touch placeholder).
3. **Dependency Installation**:
   - IMPORTANT: In Windows PowerShell, bare `npm` invokes `npm.ps1` which fails under language constraint. You MUST execute `npm.cmd install` (or `npm.cmd install --legacy-peer-deps` if peer warnings occur).
   - DO NOT run `npm start` or any blocking dev server! The user explicitly commanded: "ne lance pas npm start, je le ferais moi."
4. **Initial Atomic Commit**:
   - `git add .`
   - `git commit -m "chore(init): initialize Expo SDK 54 project on branch main"`
   - Verify `git log -1` and `git status`.

## Working Directory
`c:\Users\AY030031\Documents\GestionApp\.agents\worker_m1`

## Output Requirements
Write `c:\Users\AY030031\Documents\GestionApp\.agents\worker_m1\handoff.md` with:
- Files created
- Commands executed and outputs
- Git status and commit hash
- Readiness for Milestone 2

## 2026-09-23T08:46:10Z
You are the Worker for Milestone 1 (Agent Git & Scaffolding).
Your working directory is c:\Users\AY030031\Documents\GestionApp\.agents\worker_m1.
MANDATORY: Read c:\Users\AY030031\Documents\GestionApp\.agents\ORIGINAL_REQUEST.md and c:\Users\AY030031\Documents\GestionApp\.agents\worker_m1\DISPATCH.md before starting.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

CRITICAL REMINDER: DO NOT run 'npm start' or any interactive/blocking development server.
Always use 'npm.cmd' and 'npx.cmd' instead of bare npm/npx.

Execute all steps in DISPATCH.md (git init -b main, .gitignore, package.json, tsconfig.json, app.json, babel.config.js, npm.cmd install, and git commit).
Document your results in c:\Users\AY030031\Documents\GestionApp\.agents\worker_m1\handoff.md and report back via send_message when finished.

