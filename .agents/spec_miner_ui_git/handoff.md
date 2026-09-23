# Handoff Report — Frontend UI & Ergonomics, Git & CI/CD Specification

**Agent**: `spec_miner_ui_git`  
**Date**: 2026-09-23T08:44:00Z  
**Working Directory**: `c:\Users\AY030031\Documents\GestionApp\.agents\spec_miner_ui_git`  
**Target Milestone**: M1 (Specification & Exploration) -> M2-M5 Implementation  

---

## 1. Observation

Direct observations from the project workspace and authoritative requirement sources:

1. **Workspace State**:
   - Running `git status` in `c:\Users\AY030031\Documents\GestionApp` returned:
     > `fatal: not a git repository (or any of the parent directories): .git`
   - The workspace contains only `.agents/` and `ORIGINAL_REQUEST.md` (no `package.json`, `app/`, `src/`, or `.git` yet).
   - The environment is Windows with PowerShell, Node.js installed, and React Native / Expo Go targeted.

2. **Authoritative Requirements in `ORIGINAL_REQUEST.md`**:
   - Line 5: `"Pour chaque modification tu peux faire un commit. Je souhaite que la branche principale soit la branche main, je n'ai pas encore de repos remote, je vais le créer. Je n'ai pas encore généré le git avec git init, donc fais le. Tu as carte blanche et dis moi quand je peux le tester, ne lance pas npm start, je le ferais moi."`
   - Line 7: `"Application mobile React Native / Expo (Local-First) de gestion budgétaire personnelle basée sur la règle 50/30/20 (Besoins 50%, Envies 30%, Épargne 20%), avec saisie ultra-rapide sans friction, design épuré type Trade Republic aux teintes chaleureuses, et zéro dépendance cloud."`
   - Line 15 (Frontend UI Agent): `"Implémentation Expo Router (app/(tabs)), design system sombre/clair avec tokens stricts, graphiques Donut interactifs, cartes piliers avec jauges, modal de saisie rapide ultra-fluide avec affectation immédiate (50/30/20)."`
   - Line 17 (Git & CI/CD Agent): `"Initialisation du repo git avec branche main, commits atomiques conventionnels par étape (feat:, fix:, chore:), mise en place du workflow CI/CD GitHub Actions pour build APK et préparation du self-update."`
   - Line 22-24 (R1 Socle Technique): `"Projet initialisé avec Expo SDK 54, React Native 0.81, React 19, TypeScript strict et expo-router. Compatibilité stricte avec Expo Go (uniquement des dépendances gérées par Expo Go, icônes lucide-react-native, pas de modules natifs non supportés). Support natif des thèmes Sombre & Clair avec palette apaisante (fond ardoise doux, touches sauge, terracotta, bleu indigo, cartes structurées à bordures 1px)."`
   - Line 38-44 (R4 Interface & Ergonomie):
     - `"4 onglets principaux : 1. Dashboard, 2. Transactions, 3. Récurrences, 4. Paramètres."`
     - `"Modal de saisie rapide accessible depuis n'importe quel écran : montant + attribution 50/30/20 en 2 clics."`
   - Line 46-49 (R5 Gestion de Version & Git):
     - `"Dépôt Git initialisé sur main (git init -b main). Historique de commits conventionnels et atomiques pour chaque étape clé. Script / configuration GitHub Actions préparé pour la compilation d'APK et template du service updateService.ts. Ne jamais lancer 'npm start'."`

3. **Authoritative Dispatch Directives in `DISPATCH.md`**:
   - Detailed requirements for:
     1. Visual tokens (Slate background, Sage, Terracotta, Indigo Blue accents, 1px card borders, typography, spacing).
     2. Dark and Light theme specification.
     3. 4 Tabs in `app/(tabs)` (Dashboard, Transactions, Recurrences, Settings).
     4. Interactive SVG Donut chart & gauges compatible with Expo Go.
     5. 2-tap fast entry modal (amount + pillar attribution) with zero frame lag.
     6. Strict Expo Go compatibility whitelist.
     7. Git branching (`main`), conventional commits, GitHub Actions APK workflow, `updateService.ts`.

---

## 2. Logic Chain

1. **Design System ("Trade Republic Warm")**:
   - *Premise*: The user requested a "Trade Republic" style interface with "warm tones" and "1px card borders" with dark/light theme support.
   - *Deduction*: Standard Trade Republic UI is minimalist, monochrome-dominant, with crisp 1px borders, bold tabular numerals, and soft pill accents. To impart the "warmth", the dark theme cannot be cold pitch black (`#000000`), but rather a warm slate/charcoal (`#111622` / `#161B26`), and the light theme must be a soft eggshell/warm slate (`#F8F9FA` / `#F3F4F6`).
   - *Deduction*: The 50/30/20 financial rule naturally maps to three harmonious warm accent colors:
     - **Besoins (50%)**: Warm Sage Green (`#4E9F6E` dark / `#3B8356` light) representing essentials and vitality.
     - **Envies (30%)**: Warm Terracotta / Coral (`#E07A5F` dark / `#C85A3D` light) representing discretionary enjoyment.
     - **Épargne (20%)**: Warm Indigo Blue (`#5C7CFA` dark / `#4263EB` light) representing security and future savings.
   - *Contrast & Readability*: All text tokens must satisfy WCAG AA (minimum 4.5:1 for body, 3:1 for large display figures).

2. **Navigation & Screen Hierarchy (`app/(tabs)`)**:
   - *Premise*: 4 primary tabs requested: Dashboard, Transactions, Recurrences, Settings, plus a globally accessible 2-tap Quick Entry modal.
   - *Deduction*: In `expo-router`, this maps directly to:
     - Root layout: `app/_layout.tsx` (ThemeProvider, SafeAreaProvider, Global quick-entry modal host).
     - Tabs layout: `app/(tabs)/_layout.tsx` with a custom bottom tab bar.
     - Centered Quick Entry button: Positioned prominently (either floating action button or central elevated button in tab bar) ensuring 1-tap thumb reach.
     - Tab 1: `app/(tabs)/index.tsx` (Dashboard).
     - Tab 2: `app/(tabs)/transactions.tsx` (Transactions history & filters).
     - Tab 3: `app/(tabs)/recurrences.tsx` (Monthly fixed charges & incomes).
     - Tab 4: `app/(tabs)/settings.tsx` (Currency, ratios, theme, JSON backup, update check).

3. **Donut Chart & Progress Gauges on Expo Go**:
   - *Premise*: Must run on Expo Go without native custom bridges or incompatible heavy charting packages.
   - *Deduction*: `react-native-svg` is officially bundled in Expo Go SDK 54. A custom SVG Donut component built with `<Circle strokeDasharray="..." strokeDashoffset="..." />` delivers instant rendering, zero lag, precise segment stroke gaps, and zero external dependency risk.
   - *Deduction*: Gauges for the 3 pillars are built as lightweight horizontal progress tracks with percentage labels, overbudget warning thresholds, and clean micro-indicators.

4. **2-Tap Fast Entry Modal (Zero Frame Lag)**:
   - *Premise*: Requirement R3 & R4 demand 0ms perceived latency and immediate pillar attribution in 2 taps.
   - *Deduction*: Keystrokes must update local React state synchronously (`useState`) without triggering any disk write or database lock. The commit action occurs on the pillar tap:
     - Tap 1: User types digits (or confirms default/suggested amount).
     - Tap 2: User taps [Besoins 50%] / [Envies 30%] / [Épargne 20%].
     - The modal immediately triggers an in-memory dispatch to the global state, provides optional light haptic feedback (`expo-haptics`), and closes immediately (<50ms).
     - Persistence to `AsyncStorage` is scheduled asynchronously in the background.

5. **Git & CI/CD Pipeline**:
   - *Premise*: The repository must start on branch `main`, use conventional commits, prepare GitHub Actions for APK compilation, and include `updateService.ts`.
   - *Deduction*:
     - Git init must explicitly use `git init -b main`.
     - Standard `.gitignore` must ignore `node_modules`, `.expo`, `dist`, and Android/iOS build artifacts.
     - GitHub Actions workflow (`.github/workflows/build-apk.yml`) can build a standalone Android APK via `npx expo prebuild --platform android` and Gradle `assembleRelease` or `assembleDebug` without requiring paid cloud EAS services.
     - `updateService.ts` interfaces with GitHub Releases API (`GET /repos/{owner}/{repo}/releases/latest`) to inform users of new releases and link directly to the APK asset.

---

## 3. Specifications Catalog

### 3.1 Design System & Visual Tokens ("Trade Republic Warm")

#### Color Palette Tokens
| Token Key | Dark Mode Value | Light Mode Value | Semantic Role |
|-----------|-----------------|------------------|---------------|
| `bg.canvas` | `#0E121A` (Deep Slate) | `#F8F9FA` (Warm Off-White) | App root background |
| `bg.surface` | `#161B26` (Warm Charcoal Slate) | `#FFFFFF` (Pure White) | Card & Sheet background |
| `bg.surfaceSubtle` | `#1E2534` (Elevated Slate) | `#F1F3F5` (Subtle Warm Gray) | Input fields, gauge tracks, inactive pills |
| `border.subtle` | `rgba(255, 255, 255, 0.08)` / `#262F42` | `rgba(0, 0, 0, 0.08)` / `#E5E7EB` | 1px card borders, dividers |
| `border.focus` | `#5C7CFA` | `#4263EB` | Active input border |
| `text.primary` | `#F8FAFC` (Crisp White-Slate) | `#0F172A` (Deep Charcoal) | Primary balances, headlines |
| `text.secondary` | `#94A3B8` (Muted Slate) | `#64748B` (Medium Slate) | Labels, timestamps, descriptions |
| `text.muted` | `#64748B` | `#94A3B8` | Hints, placeholders, disabled text |
| `pillar.needs` | `#4E9F6E` (Warm Sage Green) | `#3B8356` (Deep Sage Green) | Besoins 50% pillar accent |
| `pillar.needsBg` | `rgba(78, 159, 110, 0.15)` | `rgba(59, 131, 86, 0.12)` | Besoins badge / card tint |
| `pillar.wants` | `#E07A5F` (Warm Terracotta) | `#C85A3D` (Deep Terracotta) | Envies 30% pillar accent |
| `pillar.wantsBg` | `rgba(224, 122, 95, 0.15)` | `rgba(200, 90, 61, 0.12)` | Envies badge / card tint |
| `pillar.savings` | `#5C7CFA` (Warm Indigo Blue) | `#4263EB` (Deep Indigo Blue) | Épargne 20% pillar accent |
| `pillar.savingsBg` | `rgba(92, 124, 250, 0.15)` | `rgba(66, 99, 235, 0.12)` | Épargne badge / card tint |
| `status.income` | `#34D399` (Mint Green) | `#10B981` (Emerald) | Positive cash flow / income |
| `status.overrun` | `#F87171` (Warm Crimson) | `#EF4444` (Crimson Alert) | Budget overage / warning |

#### Typography Scale
- **Font Family**: System sans-serif (`SF Pro Text` / `Inter` / `Roboto`).
- **Tabular Numerals**: Numeric balance amounts MUST specify `fontVariant: ['tabular-nums']` to prevent layout jitter when values change.
- **Sizes & Weights**:
  - `display`: `34px`, `fontWeight: '700'`, `lineHeight: 40px` (Hero balance / reste à vivre).
  - `title1`: `24px`, `fontWeight: '700'`, `lineHeight: 30px` (Screen headers).
  - `title2`: `18px`, `fontWeight: '600'`, `lineHeight: 24px` (Card titles, section headers).
  - `bodyLarge`: `16px`, `fontWeight: '500'`, `lineHeight: 22px` (Transaction descriptions, keypad numbers).
  - `body`: `14px`, `fontWeight: '400'`, `lineHeight: 20px` (Standard labels, table rows).
  - `caption`: `12px`, `fontWeight: '500'`, `lineHeight: 16px` (Pillar tags, dates, mini percentages).

#### Spacing & Layout Tokens
- **Spacing Scale**:
  - `xs`: `4px`
  - `sm`: `8px`
  - `md`: `12px`
  - `lg`: `16px`
  - `xl`: `20px`
  - `2xl`: `24px`
  - `3xl`: `32px`
- **Border Radii**:
  - `sm`: `8px` (Tags, small buttons)
  - `md`: `12px` (Inputs, keypad keys)
  - `lg`: `16px` (Pillar cards, modals)
  - `xl`: `24px` (Hero cards, bottom sheets)
  - `full`: `9999px` (Pills, circular buttons)
- **Borders & Shadows**:
  - Strict `borderWidth: 1`, color `border.subtle`.
  - Minimal flat shadows to preserve the clean Trade Republic aesthetic.

---

### 3.2 Navigation Architecture (`app/(tabs)`)

```
app/
├── _layout.tsx                     # Global Root: ThemeProvider, BudgetProvider, Modal host
└── (tabs)/
    ├── _layout.tsx                 # 4-Tab Bar configuration + Central Quick Entry button
    ├── index.tsx                   # Tab 1: Dashboard (Donut, Gauges, Balance, Recent Tx)
    ├── transactions.tsx            # Tab 2: Chronological transactions, search, filters
    ├── recurrences.tsx             # Tab 3: Monthly recurring incomes & expenses
    └── settings.tsx                # Tab 4: Currency, ratios, theme, JSON backup, CI/update
```

#### Bottom Tab Bar Specification
- **Height**: `64px` (+ safe area bottom inset).
- **Style**: Floating or docked with `borderTopWidth: 1`, `borderTopColor: border.subtle`, background `bg.surface`.
- **Items**:
  1. **Dashboard**: Icon `PieChart` (lucide), label `"Aperçu"`.
  2. **Transactions**: Icon `ArrowLeftRight` (lucide), label `"Opérations"`.
  3. **[ + ] Quick Entry**: Center button, elevated circular container (`width: 48px, height: 48px, borderRadius: 24`), background `pillar.savings` or `text.primary`, icon `Plus` (`color: #FFF`). On press: triggers `QuickEntryModal` directly without route change.
  4. **Recurrences**: Icon `Repeat` (lucide), label `"Fixes"`.
  5. **Settings**: Icon `Settings` (lucide), label `"Réglages"`.

---

### 3.3 Screen Specifications

#### Screen 1: Dashboard (`app/(tabs)/index.tsx`)
1. **Header Component**:
   - Current Period Display (e.g. `"Septembre 2026"`).
   - Quick cycle status badge (e.g. `"J-8 avant paie"` or `"Jour 22/30"`).
2. **Hero Card: Reste à Vivre & Net Balance**:
   - Primary metric: `Reste à Vivre` in large tabular numbers (`34px bold`).
   - Secondary metric: `Dépensé ce mois` vs `Revenu total`.
   - Daily allowance indicator: `Reste par jour : 24,50 € / j`.
3. **Interactive SVG Donut Chart**:
   - Diameter: `200px`, stroke width: `18px`.
   - 3 colored segments:
     - Sage Green arc = Besoins (50% target).
     - Terracotta arc = Envies (30% target).
     - Indigo Blue arc = Épargne (20% target).
   - Center View: Displays total spent or remaining balance with currency sign.
   - On tap on segment or legend: highlights the corresponding pillar card below.
4. **3 Pillar Cards with Gauges**:
   - **Card 1: Besoins (50%)**:
     - Header: Icon `Home` / `Shield`, title `"Besoins"`, badge `"50%"`.
     - Gauge: Horizontal bar showing `% consommé`.
     - Subtext: `${spent} € / ${allocated} €` · `${remaining} € restant`.
     - Alert: If `spent > allocated`, bar turns `status.overrun`, badge displays `+${overrun} € dépassé`.
   - **Card 2: Envies (30%)**:
     - Header: Icon `Coffee` / `Sparkles`, title `"Envies"`, badge `"30%"`.
     - Gauge: Horizontal bar in Terracotta.
     - Subtext: `${spent} € / ${allocated} €`.
   - **Card 3: Épargne (20%)**:
     - Header: Icon `PiggyBank` / `TrendingUp`, title `"Épargne"`, badge `"20%"`.
     - Gauge: Horizontal bar in Indigo.
     - Subtext: `${saved} € / ${target} €`.
5. **Recent Transactions Preview**:
   - Title: `"Dernières opérations"` with `"Voir tout"` link (switches to Tab 2).
   - Displays 4 most recent transactions with pillar colored dot, title, date, signed amount.

#### Screen 2: Transactions (`app/(tabs)/transactions.tsx`)
1. **Search Bar**:
   - Search input with `Search` icon and clear `X` button.
   - Filters transactions by description or amount in real time.
2. **Quick Filter Pills**:
   - Horizontal pill selector:
     - `Tous`
     - `Besoins (50%)` (Sage)
     - `Envies (30%)` (Terracotta)
     - `Épargne (20%)` (Indigo)
     - `Revenus` (Mint Green)
   - Active pill highlighted with solid theme fill and count badge (e.g. `Besoins (14)`).
3. **Chronological Grouped List**:
   - Group headers: `"Aujourd'hui"`, `"Hier"`, `"Cette semaine"`, `"Août 2026"`.
   - Each item row:
     - Pillar icon / colored pill badge.
     - Title (e.g. `"Courses Monoprix"`).
     - Category / Note (e.g. `"Alimentation"`).
     - Formatted signed amount: `-42,50 €` in red/neutral or `+2 400,00 €` in green.
   - Swipe-to-delete or tap to open Edit / Delete confirmation bottom sheet.
4. **Empty State**:
   - If no transactions found: Clean minimalist icon `Receipt`, message `"Aucune opération trouvée"`, button `"Ajouter une dépense"`.

#### Screen 3: Recurrences (`app/(tabs)/recurrences.tsx`)
1. **Summary Banner Card**:
   - Total fixed charges per month (e.g. `-1 150 € / mois`).
   - Total fixed income per month (e.g. `+2 800 € / mois`).
   - Net fixed commitments ratio (e.g. `41% des revenus fixes`).
2. **Tab / Filter**:
   - Toggle between `Dépenses Fixes` and `Revenus Fixes`.
3. **Recurring Items List**:
   - Items: Loyer, Électricité, Internet, Salle de sport, Salaire, etc.
   - Card details:
     - Title & pillar badge (`Besoins`, `Envies`, `Épargne`).
     - Day of execution (e.g. `"Le 5 du mois"`).
     - Amount (`-750,00 €`).
     - Status toggle switch (Active / Inactive).
     - Execution status for current month (`"Appliqué"` vs `"En attente"`).
4. **Add / Edit Recurring Modal**:
   - Form fields: Title, Type (Dépense / Revenu), Amount, Pillar, Day of Month (slider or input 1-31), Active toggle.

#### Screen 4: Settings (`app/(tabs)/settings.tsx`)
1. **Appearance Section**:
   - Theme Selector: Segmented control `[ ☀️ Clair | 🌙 Sombre | ⚙️ Système ]`.
2. **Budget Ratios & Devise**:
   - Currency Picker: Modal / picker for `EUR (€)`, `USD ($)`, `GBP (£)`, `CHF (CHF)`, `CAD ($)`.
   - 50/30/20 Ratio Sliders:
     - Steppers or sliders for Besoins %, Envies %, Épargne %.
     - Real-time sum validation: Must equal `100%`. If != 100%, button disabled and error badge shown.
   - Budget Cycle Definition:
     - Selector: `Mois civil (1er au 31)` vs `Jour personnalisé (ex: 25 au 24)`.
3. **Data Management (Local-First Hermetic)**:
   - `Exporter les données (JSON)`: Calls export service, opens native share sheet via `expo-sharing` or saves to file.
   - `Importer une sauvegarde (JSON)`: Opens file picker via `expo-document-picker` or text paste modal, validates schema, shows summary dialog (`"Restaurer 48 transactions et 5 récurrences ?"`), atomic overwrite.
   - `Réinitialiser l'application`: Danger button with double confirmation prompt.
4. **Application & CI/CD Information**:
   - Version display: `Version 1.0.0 (Build 1)`.
   - `Vérifier les mises à jour`: Calls `updateService.checkForUpdate()`.
     - If up to date: Toast / alert `"Vous utilisez la dernière version"`.
     - If new version: Dialog showing release notes, version tag, and button `"Télécharger la mise à jour (APK)"` (opens browser via `Linking.openURL`).
   - GitHub Repository link.

---

### 3.4 Quick Entry Modal Specification (2-Tap Ultra-Fast Input)

```
+------------------------------------------+
|                 [ — ]                    |
|                                          |
|                45,80 €                   |
|           "Courses de la semaine"        |
|                                          |
|  [ 1 ]            [ 2 ]            [ 3 ] |
|  [ 4 ]            [ 5 ]            [ 6 ] |
|  [ 7 ]            [ 8 ]            [ 9 ] |
|  [ , ]            [ 0 ]            [ ⌫ ] |
|                                          |
|  +------------------------------------+  |
|  |  [ 🟢 50% ]    [ 🟠 30% ]    [ 🔵 20% ]  |
|  |   Besoins        Envies        Épargne   |
|  +------------------------------------+  |
|               (Tap = Enregistré)         |
+------------------------------------------+
```

#### 2-Tap Mechanics & Architecture
1. **Tap 1**: Enter the amount using the custom zero-lag numeric pad.
   - Keypad buttons are pure native `Pressable` with instant feedback.
   - Keystrokes modify local string `amountStr` in `useState` (no async disk calls).
   - Validates format: handles comma/dot, max 2 decimal places, max 7 digits before decimal.
2. **Tap 2**: Tap one of the 3 large attribution buttons:
   - `[ 🟢 Besoins (50%) ]`
   - `[ 🟠 Envies (30%) ]`
   - `[ 🔵 Épargne (20%) ]`
3. **Commit & Dismissal Sequence (< 50ms)**:
   - Validate `amount > 0`.
   - Dispatch `addTransaction({ amount, pillar, date: new Date().toISOString(), title: title || 'Dépense rapide' })` to React Context.
   - Trigger `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`.
   - Dismiss modal immediately (`setVisible(false)` or `router.back()`).
   - Asynchronous background task flushes updated state to `AsyncStorage`.
   - Result: 0 frame drops, 0 perceptible latency, instant budget recalculation on Dashboard.

---

### 3.5 Donut Chart & Gauges Implementation Specification

#### Donut Chart (Pure `react-native-svg`)
- **Math & Geometry**:
  - Size $S = 200$, Radius $R = 80$, StrokeWidth $W = 16$.
  - Center $C_x = 100, C_y = 100$.
  - Circumference $P = 2 \times \pi \times R \approx 502.65$.
  - For segments with percentages $p_1, p_2, p_3$ (where $p_1 + p_2 + p_3 = 100$):
    - Segment length: $L_i = (p_i / 100) \times P$.
    - Gap between segments: $G = 4\text{px}$.
    - StrokeDasharray: `${L_i - G} ${P - (L_i - G)}`.
    - StrokeDashoffset: `-accumulatedOffset`.
    - Rotation: `-90deg` around center to start at 12 o'clock.
- **Center Overlay**:
  - Positioned absolutely inside the SVG bounding box:
    ```tsx
    <View style={styles.centerContainer}>
      <Text style={styles.centerLabel}>Reste à vivre</Text>
      <Text style={styles.centerAmount}>{formatCurrency(resteAVivre)}</Text>
    </View>
    ```

#### Linear Gauges
- Container: `height: 8px`, `borderRadius: 4px`, `backgroundColor: bg.surfaceSubtle`.
- Active Bar: `width: ${Math.min(ratio, 1) * 100}%`, `backgroundColor: pillarColor`, `borderRadius: 4px`.
- Overrun State: If `ratio > 1.0`, background changes to `status.overrun`, with subtle warning badge.

---

### 3.6 Strict Expo Go Compatibility Specification

To guarantee 100% flawless execution in Expo Go without native build failures:

#### Allowed Dependencies Whitelist
| Package | Version Range | Purpose | Expo Go Support |
|---------|---------------|---------|-----------------|
| `expo` | `~54.0.0` | Core SDK platform | Native bundled |
| `react` | `19.0.0` | React core | Supported |
| `react-native` | `0.81.x` | React Native framework | Supported |
| `expo-router` | `~4.0.0` | File-based routing | Official Expo package |
| `react-native-svg` | `~15.x` | Donut & gauge rendering | Bundled in Expo Go |
| `lucide-react-native` | `^0.475.x` or latest | SVG icons (pure JS wrapper around react-native-svg) | Supported |
| `@react-native-async-storage/async-storage` | `~2.1.x` | Local offline persistence | Bundled in Expo Go |
| `expo-haptics` | `~14.x` | Tactile feedback | Bundled in Expo Go |
| `expo-sharing` | `~13.x` | JSON export sharing | Bundled in Expo Go |
| `expo-file-system` | `~18.x` | File read/write for backup | Bundled in Expo Go |
| `expo-document-picker` | `~13.x` | JSON file import picker | Bundled in Expo Go |
| `expo-constants` | `~17.x` | App version & manifest access | Bundled in Expo Go |

#### Strictly Forbidden Libraries
- ❌ Custom native modules requiring `react-native link` or custom Gradle/Podfile modifications.
- ❌ `realm` or `react-native-sqlite-storage` (unsupported in managed Expo Go; `expo-sqlite` or `@react-native-async-storage` must be used).
- ❌ Heavy charting packages requiring custom native bridges (`victory-native` older versions, `react-native-charts-wrapper`).
- ❌ Firebase / Cloud SDKs with native dependencies (Local-First requirement anyway).

---

### 3.7 Git Repository & Conventional Commits Specification

#### 1. Git Initialization Command
```bash
git init -b main
```

#### 2. `.gitignore` Specification
```gitignore
# Node dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Expo / React Native
.expo/
dist/
web-build/

# Native build artifacts (if prebuild is executed in CI)
android/
ios/

# OS metadata
.DS_Store
Thumbs.db

# Environment variables
.env*.local
.env

# Agent internal metadata (optional exclusion or tracking per project convention)
# .agents/
```

#### 3. Conventional Commit Milestone Plan
The commit history must follow Conventional Commits v1.0.0 (`type(scope): description`):

| Milestone | Commit Message | Scope | Included Changes |
|-----------|----------------|-------|------------------|
| **M1** | `chore(init): initialize Expo SDK 54 project on branch main` | Project root | `package.json`, `tsconfig.json`, `app.json`, `.gitignore` |
| **M2** | `feat(engine): add 50/30/20 calculation engine and asyncstorage models` | Backend & Engine | Data types, budget calculation engine, recurrence manager, storage service |
| **M3** | `feat(theme): implement trade republic warm design tokens and theme context` | Theme & Design | Dark & Light tokens, color palettes, ThemeContext, typography |
| **M4** | `feat(components): implement svg donut chart, gauges and 2-tap quick entry modal` | UI Components | DonutChart, PillarGauge, QuickEntryModal, NumericKeypad |
| **M5** | `feat(tabs): build 4-tab expo router navigation and screens` | Screens & Routing | `app/_layout.tsx`, `(tabs)/_layout.tsx`, dashboard, transactions, recurrences, settings |
| **M6** | `test: add unit tests for 50/30/20 budget calculations, recurrences and storage` | Testing & QA | Jest tests covering ratios, edge cases, overrun detection, JSON export/import |
| **M7** | `ci: add github actions apk workflow and updateservice template` | CI/CD & Updates | `.github/workflows/build-apk.yml`, `src/services/updateService.ts` |

---

### 3.8 GitHub Actions APK Build Workflow (`.github/workflows/build-apk.yml`)

The workflow allows building a test/release APK directly in GitHub Actions without EAS cloud fees:

```yaml
name: Build Android APK

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  test-and-lint:
    name: Run Tests & Typecheck
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript typecheck
        run: npx tsc --noEmit

      - name: Run unit tests
        run: npm test -- --watchAll=false

  build-apk:
    name: Build Android Standalone APK
    needs: test-and-lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Setup Java JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: 17

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Install dependencies
        run: npm ci

      - name: Generate Android native project (Expo Prebuild)
        run: npx expo prebuild --platform android --clean

      - name: Build Android APK (Release or Debug)
        working-directory: android
        run: |
          chmod +x gradlew
          ./gradlew assembleRelease --no-daemon || ./gradlew assembleDebug --no-daemon

      - name: Locate & Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: gestionapp-android-apk
          path: android/app/build/outputs/apk/**/*.apk
          retention-days: 14
```

---

### 3.9 Self-Update Service Specification (`src/services/updateService.ts`)

#### TypeScript Interface Contract
```typescript
export interface ReleaseInfo {
  version: string;
  releaseNotes: string;
  publishedAt: string;
  downloadUrl: string;
  isAvailable: boolean;
}

export interface UpdateServiceContract {
  checkForUpdate(currentVersion: string, repoOwner: string, repoName: string): Promise<ReleaseInfo>;
  openDownloadPage(url: string): Promise<void>;
}
```

#### Complete Template Code for `src/services/updateService.ts`
```typescript
import { Linking } from 'react-native';

export interface ReleaseInfo {
  version: string;
  releaseNotes: string;
  publishedAt: string;
  downloadUrl: string;
  isAvailable: boolean;
}

/**
 * Pure JavaScript semantic version comparison.
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export function compareSemver(v1: string, v2: string): number {
  const clean = (v: string) => v.replace(/^v/, '').trim();
  const p1 = clean(v1).split('.').map(n => parseInt(n, 10) || 0);
  const p2 = clean(v2).split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(p1.length, p2.length);

  for (let i = 0; i < len; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * Queries GitHub Releases API for latest published release APK.
 */
export async function checkForUpdate(
  currentVersion: string,
  repoOwner: string = 'user',
  repoName: string = 'GestionApp'
): Promise<ReleaseInfo> {
  const defaultResult: ReleaseInfo = {
    version: currentVersion,
    releaseNotes: '',
    publishedAt: '',
    downloadUrl: '',
    isAvailable: false,
  };

  try {
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'GestionApp-Mobile',
      },
    });

    if (!response.ok) {
      // 404 if no releases yet, or 403 if rate limited
      return defaultResult;
    }

    const data = await response.json();
    const latestVersion = (data.tag_name || '').replace(/^v/, '');
    const isAvailable = compareSemver(latestVersion, currentVersion) > 0;

    // Find APK asset in release assets, fallback to release HTML url
    let downloadUrl = data.html_url || '';
    if (Array.isArray(data.assets)) {
      const apkAsset = data.assets.find((a: any) => a.name?.endsWith('.apk'));
      if (apkAsset && apkAsset.browser_download_url) {
        downloadUrl = apkAsset.browser_download_url;
      }
    }

    return {
      version: latestVersion || currentVersion,
      releaseNotes: data.body || 'Nouvelle mise à jour disponible.',
      publishedAt: data.published_at || '',
      downloadUrl,
      isAvailable,
    };
  } catch (error) {
    // Offline or network error: return safe fallback without crash
    return defaultResult;
  }
}

/**
 * Opens external URL in user's browser to download APK or read notes.
 */
export async function openDownloadPage(url: string): Promise<void> {
  if (!url) return;
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  }
}
```

---

## 4. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Design System | Theme Tokens System | Palette "Trade Republic Warm" (Dark & Light modes), Slate background, Sage, Terracotta, Indigo Blue accents, 1px card borders | Active theme mode (`'dark' \| 'light' \| 'system'`) | Structured theme object with semantic colors, typography, radii, spacing | Falls back to Dark theme if invalid input | `ORIGINAL_REQUEST.md` R1, R4 |
| 2 | Design System | ThemeContext & Persistence | Global React context providing current theme and toggle function, persisted in AsyncStorage | User toggle event / system color scheme change | Active theme, dynamic style re-render | Graceful default to system preference if storage read fails | `ORIGINAL_REQUEST.md` R1 |
| 3 | Navigation | Expo Router Tab Bar | Custom 5-item bottom bar (Dashboard, Transactions, [+] Quick Entry, Recurrences, Settings) | User tab press | Screen transition or Quick Entry modal reveal | Default to Dashboard screen if invalid route | `ORIGINAL_REQUEST.md` R4 |
| 4 | Dashboard | Reste à Vivre Hero Metric | Prominent real-time display of remaining disposable income and daily burn rate | Income, allocated ratios, total expenses | Formatted currency string (`34px tabular-nums`) + daily remaining amount | Shows `0,00 €` with warning color if negative | `ORIGINAL_REQUEST.md` R2, R4 |
| 5 | Dashboard | SVG Donut Chart | 3-segment proportional Donut chart (Needs/Wants/Savings) with center summary | Allocations and spent amounts per pillar | Interactive SVG graphic with segment press handlers | Clamps negative or 0 values to full empty ring | `ORIGINAL_REQUEST.md` R4 |
| 6 | Dashboard | Pillar Progress Gauges | Visual linear gauges for Besoins (50%), Envies (30%), Épargne (20%) | Spent vs Allocated amounts per pillar | Progress bar width %, remaining balance, overrun badge | Changes to crimson alert color when ratio > 100% | `ORIGINAL_REQUEST.md` R2, R4 |
| 7 | Dashboard | Recent Transactions List | Quick preview of the 4-5 most recent transactions with navigation link | Transaction store array | Rendered list items with pillar dots and signed values | Renders empty state card if no transactions | `ORIGINAL_REQUEST.md` R4 |
| 8 | Transactions | Chronological Grouped List | Date-grouped transaction list (Aujourd'hui, Hier, Cette semaine...) | Transactions sorted by timestamp | SectionList with sticky date headers | Empty placeholder illustration if list is empty | `ORIGINAL_REQUEST.md` R4 |
| 9 | Transactions | Search & Filter Bar | Real-time text search by title/note and filter pills (Tous, 50%, 30%, 20%, Revenus) | Search query string, active filter pill | Filtered array of transactions | Shows "No results matching '...'" message | `ORIGINAL_REQUEST.md` R4 |
| 10 | Transactions | Transaction Item Actions | Tap to view/edit details, swipe-to-delete with confirmation alert | Item press or swipe event | Action sheet / modal or deletion dispatch | Cancel action leaves data unchanged | `ORIGINAL_REQUEST.md` R4 |
| 11 | Recurrences | Fixed Commitments Summary | Card summarizing total monthly fixed expenses vs monthly fixed income | Recurrence array | Net fixed commitments total and percentage of income | Shows 0 € if no recurrences configured | `ORIGINAL_REQUEST.md` R2, R4 |
| 12 | Recurrences | Recurring Items List & Toggle | List of monthly recurring items with active/inactive switch and execution day | Recurrence items | Visual card with status badge and due day (e.g. "Le 5 du mois") | Inactive items are excluded from monthly projections | `ORIGINAL_REQUEST.md` R2, R4 |
| 13 | Recurrences | Add/Edit Recurring Modal | Form to create or modify monthly recurring income/expense | Title, Type, Amount, Pillar, Day of Month (1-31) | Created / updated recurrence object | Form validation blocks submission if amount <= 0 or title empty | `ORIGINAL_REQUEST.md` R2 |
| 14 | Settings | Currency Selector | Single configurable currency (€, $, £, CHF, CAD) across the entire app | Currency selection | App-wide formatted currency symbol and placement | Defaults to Euro (€) | `ORIGINAL_REQUEST.md` R2, R4 |
| 15 | Settings | 50/30/20 Custom Ratio Editor | Interactive steppers / sliders to customize allocation percentages | Needs %, Wants %, Savings % inputs | Updated ratio configuration | Validation blocks save if sum != 100% with error banner | `ORIGINAL_REQUEST.md` R2, R4 |
| 16 | Settings | JSON Export UI | One-tap button to export all local data to a formatted JSON file | Export button press | Triggers `expo-sharing` share sheet or local save | Alert toast if file write fails | `ORIGINAL_REQUEST.md` R3, R4 |
| 17 | Settings | JSON Import UI | File picker and schema validation dialog to restore application data | User selected JSON file | Confirmation dialog with item count preview, atomic restore | Rejects invalid JSON/schema without mutating existing data | `ORIGINAL_REQUEST.md` R3, R4 |
| 18 | Settings | Version & Update Checker UI | Displays current app version, button to check latest GitHub release | Button press | Triggers `updateService.checkForUpdate()`, shows update modal | Friendly alert if offline or already on latest version | `ORIGINAL_REQUEST.md` R4, R5 |
| 19 | Quick Entry | Zero-Lag 2-Tap Modal | Instant modal with custom numeric pad and 3 pillar buttons [50%] [30%] [20%] | Digits tapped + 1 pillar button tapped | Synchronous state commit, haptic feedback, instant modal close | Shakes input if amount is 0; prevents invalid decimals | `ORIGINAL_REQUEST.md` R3, R4 |
| 20 | Quick Entry | State Decoupling | Decouples local typing state from disk persistence to guarantee 0ms latency | Keystroke events | Instant UI text update; async non-blocking AsyncStorage queue | Disk write failure logged; in-memory state preserved | `ORIGINAL_REQUEST.md` R3 |
| 21 | Compatibility | Strict Expo Go Manifest | Package configuration restricted to Expo Go SDK 54 bundled libraries | `package.json` dependencies | App runs natively in Expo Go without native build | Build-time linting catches unsupported native modules | `ORIGINAL_REQUEST.md` R1 |
| 22 | Git/CI | Branch Main Initialization | Initializes local Git repository on `main` branch with clean `.gitignore` | `git init -b main` | Repository ready for commits and remote addition | Error handled if git directory already exists | `ORIGINAL_REQUEST.md` R5 |
| 23 | Git/CI | Atomic Conventional Commits | Structured commit messages (`feat:`, `fix:`, `chore:`) mapped to project milestones | Project changes per milestone | Clean, traceable Git commit history | Pre-commit checks ensure commit message compliance | `ORIGINAL_REQUEST.md` R5 |
| 24 | Git/CI | GitHub Actions APK Workflow | Automated CI pipeline compiling standalone Android APK (`build-apk.yml`) | Push or PR to `main` branch, or manual dispatch | Downloadable APK artifact in GitHub Actions artifacts | Step fails with build logs if compilation errors occur | `ORIGINAL_REQUEST.md` R5 |
| 25 | Git/CI | Self-Update Service (`updateService.ts`)| Service querying GitHub Releases API and comparing semantic versions | Current app version, repo owner/name | `ReleaseInfo` object + `openDownloadPage` launcher | Fails silently to fallback when network is unavailable | `ORIGINAL_REQUEST.md` R5 |

---

## 5. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Quick Entry Modal | Amount = `0` or empty, user taps `[Besoins 50%]` | Submission rejected; amount input displays subtle shake animation and hint `"Saisissez un montant"`; modal stays open. |
| 2 | Quick Entry Modal | User types multiple decimal points (`"12.3.4"`) | Keypad logic ignores redundant dot; input remains `"12.34"`. |
| 3 | Quick Entry Modal | User types number exceeding 7 integer digits (`> 9 999 999 €`) | Keypad caps input length at 7 digits before decimal to avoid overflow. |
| 4 | Quick Entry Modal | Rapid double-tap on pillar button | Debounce guard ignores second tap within 300ms, preventing duplicate transaction creation. |
| 5 | Donut Chart | Total budget = `0 €` (no income recorded yet) | Donut chart renders a continuous neutral subtle gray ring (`bg.surfaceSubtle`), center displays `"0,00 €"`; no division by zero error (`NaN`). |
| 6 | Donut Chart | Total spent exceeds total budget (> 100%) | Donut chart displays full ring with overrun pillar highlighted; central label displays negative reste à vivre with `status.overrun` color. |
| 7 | Pillar Gauges | Spent = `1 200 €`, Allocated = `1 000 €` (120%) | Gauge fills 100% of track in alert crimson (`status.overrun`); text shows `"+200 € (120%)"`. |
| 8 | Ratio Customizer | User sets ratios to `50% / 30% / 30%` (Sum = `110%`) | "Enregistrer" button is disabled; warning banner indicates `"Total : 110% (doit être égal à 100%)"`. |
| 9 | JSON Import | User selects non-JSON file or corrupted JSON | Import service rejects file with error dialog `"Fichier invalide ou corrompu"`; existing state is completely preserved without mutation. |
| 10 | JSON Import | Valid JSON with older schema version or missing fields | Schema validator applies backward-compatible defaults; missing recurrences initialized as `[]`. |
| 11 | Recurrences | Recurrence set on day `31`, current month is February (28 days) | Recurrence engine clamps trigger date to the last day of the month (Feb 28/29); no skipped month. |
| 12 | Theme Switcher | System switches from Light to Dark mode while app is running | Theme listener updates theme tokens instantly without page reload or state loss. |
| 13 | Search Filter | Search query contains regex special characters (`"[Courses]*"`) | Search treats query as literal escaped text; filters accurately without regex parse crash. |
| 14 | Update Service | GitHub API returns HTTP 403 (Rate limit exceeded) | `updateService` catches error and returns fallback `isAvailable: false`; user notified `"Impossible de vérifier les mises à jour pour le moment"`. |
| 15 | Update Service | Latest GitHub release contains no `.apk` asset | `updateService` falls back to `data.html_url` (GitHub release page) so user can view release in browser. |
| 16 | Git Init | User runs `git init -b main` in existing git repository | Safe re-initialization or branch check; does not destroy existing commits. |

---

## 6. Caveats

1. **Expo Go Native Limitations**:
   - `expo-sharing` and `expo-file-system` work seamlessly in Expo Go for JSON export/import. However, saving directly to arbitrary root device folders requires storage permissions; using the standard system share sheet via `expo-sharing` is the safest, most portable cross-platform approach.
2. **GitHub Actions APK Compilation**:
   - Compiling a standalone APK in GitHub Actions via `npx expo prebuild` + `./gradlew assembleRelease` produces an unsigned APK by default unless release keystore secrets (`ANDROID_KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, etc.) are configured.
   - For immediate testing without signing configuration, `./gradlew assembleDebug` produces an installable debug APK artifact.
3. **No Blocking Server Rule**:
   - The user strictly requested NOT to run `npm start` or any interactive/blocking development server. All verification must be performed via non-blocking commands (typechecks, test runs, static linters).

---

## 7. Conclusion

The UI & Ergonomics and Git/CI layers have been exhaustively specified and documented.
- The visual identity translates the "Trade Republic Warm" aesthetic into concrete design tokens, high-contrast dark and light modes, and lightweight SVG charting compatible with Expo Go.
- The 4-tab Expo Router architecture and 2-tap Quick Entry modal provide a zero-friction local-first experience.
- The Git structure on `main`, atomic conventional commit milestone mapping, GitHub Actions APK build workflow, and `updateService.ts` provide a robust, production-ready engineering foundation.
- Downstream workers (Frontend Dev, Backend Dev, QA Tester) have unambiguous contracts to implement against without guesswork.

---

## 8. Verification Method

To independently verify these specifications and the resulting implementation:

1. **Typecheck & Linting Verification**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected*: 0 TypeScript errors across theme tokens, components, tabs, and `updateService.ts`.

2. **Semantic Versioning Logic Verification (Jest)**:
   ```bash
   npm test -- src/services/updateService.test.ts
   ```
   *Expected*: Tests pass for `compareSemver('1.1.0', '1.0.0') === 1`, `compareSemver('1.0.0', '1.0.1') === -1`, and identical versions.

3. **Git Initialization Verification**:
   ```bash
   git status
   git branch --show-current
   ```
   *Expected*: Shows branch `main`, clean working tree.

4. **GitHub Actions Workflow Syntax Verification**:
   - Inspect `.github/workflows/build-apk.yml` against GitHub Actions schema.
   - Verify triggers, runner versions, JDK 17, and artifact paths.

5. **Expo Go Compatibility Audit**:
   - Inspect `package.json` to verify that no forbidden native unmanaged libraries are installed.
   - All icons are imported from `lucide-react-native`.
   - All charts use pure `react-native-svg`.
