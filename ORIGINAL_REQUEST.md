# Original User Request

## 2026-09-23T08:38:58Z

The user requested: "Je souhaite néanmoins que tu créés des agents qui vont s'occuper des parties clés comme un orchestrateur, un developpeur (ou deux un pour front et un back), un testeur ainsi qu'un agent git pour scinder les tâches. L'orchestrateur c'est toi qui gère et délègues les agents et qui a la connaissance de tout le projet. Pour chaque modification tu peux faire un commit. Je souhaite que la branche principale soit la branche main, je n'ai pas encore de repos remote, je vais lre créer. Je n'ai pas encore généré le git avec git init, donc fais le. Tu as carte blanche et dis moi quand je peux le tester, ne lance pas npm start, je le ferais moi."

Application mobile React Native / Expo (Local-First) de gestion budgétaire personnelle basée sur la règle 50/30/20 (Besoins 50%, Envies 30%, Épargne 20%), avec saisie ultra-rapide sans friction, design épuré type Trade Republic aux teintes chaleureuses, et zéro dépendance cloud.

Working directory: c:\Users\AY030031\Documents\GestionApp
Integrity mode: development

## Team Structure & Roles
- **Orchestrateur (Lead)** : Supervision du projet, découpage des tâches, coordination des sous-agents, garantie du respect de la règle 50/30/20 et de l'architecture.
- **Agent Dev Backend / State & Local-First** : Modélisation des types TypeScript, service AsyncStorage, moteur de calcul 50/30/20, gestion des récurrences mensuelles, service d'export/import JSON hermétique.
- **Agent Dev Frontend / UI** : Implémentation Expo Router (app/(tabs)), design system sombre/clair avec tokens stricts, graphiques Donut interactifs, cartes piliers avec jauges, modal de saisie rapide ultra-fluide avec affectation immédiate (50/30/20).
- **Agent Testeur & QA** : Tests unitaires (Jest) sur les calculs budgétaires, tests des flux de données, validation de la compatibilité stricte Expo Go (aucune lib native non supportée).
- **Agent Git & CI/CD** : Initialisation du repo git avec branche main, commits atomiques conventionnels par étape (feat:, fix:, chore:), mise en place du workflow CI/CD GitHub Actions pour build APK et préparation du self-update.

## Requirements

### R1. Socle Technique & Compatibilité Expo Go
- Projet initialisé avec Expo SDK 54, React Native 0.81, React 19, TypeScript strict et expo-router.
- Compatibilité stricte avec Expo Go (uniquement des dépendances gérées par Expo Go, icônes lucide-react-native, pas de modules natifs non supportés).
- Support natif des thèmes Sombre & Clair avec palette apaisante (fond ardoise doux, touches sauge, terracotta, bleu indigo, cartes structurées à bordures 1px).

### R2. Moteur Budgétaire 50/30/20 & Gestion des Périodes
- Définition des revenus et calcul automatique des allocations : 50% Besoins, 30% Envies, 20% Épargne (ratios configurables).
- Suivi en temps réel de chaque pilier : Alloué, Dépensé, Reste disponible, avec détection des dépassements.
- Gestion d'une devise unique paramétrable (€ par défaut).
- Gestion des dépenses et revenus récurrents (loyer, abonnements, salaire) appliqués au cycle budgétaire.

### R3. Architecture Local-First & Performance de Saisie
- Stockage 100% hors-ligne dans AsyncStorage sans télémétrie ni serveur externe.
- Saisie des montants instantanée : découplage strict entre le state local de saisie et la persistance disque pour garantir 0ms de latence.
- Module de sauvegarde manuelle : export JSON complet et restauration / import JSON sans altération.

### R4. Interface & Ergonomie "Trade Republic Warm"
- 4 onglets principaux :
  1. Dashboard : Donut chart 50/30/20, cartes piliers avec jauges de progression, solde & reste à vivre, dernières transactions.
  2. Transactions : Historique chronologique, filtres rapides par pilier (50%, 30%, 20%), recherche.
  3. Récurrences : Charges et revenus fixes mensuels.
  4. Paramètres : Devise, personnalisation des ratios, export/import JSON, à propos / vérification de mise à jour.
- Modal de saisie rapide accessible depuis n'importe quel écran : montant + attribution 50/30/20 en 2 clics.

### R5. Gestion de Version & Git
- Dépôt Git initialisé sur main (git init -b main).
- Historique de commits conventionnels et atomiques pour chaque étape clé.
- Script / configuration GitHub Actions préparé pour la compilation d'APK et template du service updateService.ts.
- Important : Ne jamais lancer 'npm start' ou un serveur interactif en tâche bloquante. L'utilisateur le lancera lui-même quand tout sera prêt.

## Acceptance Criteria

### Calculs et Modèle 50/30/20
- [ ] Une suite de tests unitaires valide la répartition exacte des revenus en 50/30/20 et les déductions des dépenses.
- [ ] Les soldes restants se recalculent instantanément sans régression lors de l'ajout, modification ou suppression d'une transaction.

### Local-First & Persistance
- [ ] L'application conserve les données après redémarrage (état persistant dans AsyncStorage).
- [ ] L'export JSON produit un fichier structuré valide, et l'import JSON restaure fidèlement toutes les données existantes.

### Interface & Fluidité Expo Go
- [ ] L'application tourne sans erreur sous Expo Go (SDK 54).
- [ ] La navigation par onglets expo-router est fluide et le switch thème clair / sombre est fonctionnel.
- [ ] Le pavé ou formulaire de saisie ne provoque aucun gel de frame ou lag lors de la frappe.
