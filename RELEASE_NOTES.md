# 🚀 Wallou — Version 1.1.0

Bienvenue sur la version **1.1.0** de **Wallou**, l'application de finances personnelles et de gestion budgétaire **50/30/20**, pensée pour être ultra-fluide, sans publicité et **100% local-first** (vos données restent exclusivement sur votre appareil).

---

## 🌟 Nouveautés de la Version 1.1.0

### 📈 Tolérance Gestuelle et Scrubbing Fluide sur la Courbe Financière
* Amélioration majeure du comportement tactile lors de l'exploration au doigt de la courbe d'évolution du solde (`MonthlySpendingCurveChart`).
* Les micro-dérives verticales du doigt ne viennent plus interrompre ou faire glitcher le slide horizontal : la capture gestuelle (`PanResponder`) assure un scrubbing ininterrompu et continu sur l'ensemble du cycle budgétaire.

### 🏷️ Ajout Direct et Fluide des Catégories
* Suppression de la modale de validation bloquante lors de l'ajout d'une nouvelle catégorie dans les Réglages.
* L'ajout est instantané avec un retour haptique subtil de succès.

### 🎨 Nouvelle Icône Officielle Wallou
* Déploiement de l'icône haute résolution de l'application (adaptive icon Android, splash screen et favicon).

---

## 🌟 Historique des Versions

### Version 1.0.1
* Cycle budgétaire et jour de départ personnalisable (ex: du 3 au 3 mois+1).
* Navigation graphique par onglets dédiés [Répartition | Évolution du solde].
* Initialisation propre sans données de démonstration.

## 🌟 Fonctionnalités Principales

### 🎯 La Méthode Budgétaire 50/30/20 Intelligente
* **Répartition automatique des revenus** :
  * 🟢 **50% Besoins** : Loyer, factures, courses, santé, charges fixes indispensables.
  * 🟠 **30% Envies** : Sorties, loisirs, restaurants, shopping, plaisirs du quotidien.
  * 🔵 **20% Épargne** : Sanctuarisation de votre épargne et investissements.
* Ratios entièrement personnalisables dans les Paramètres selon votre situation.

### 📈 Graphiques Financiers Interactifs
* **Camembert 50/30/20 (`DonutChart`)** :
  * Détection tactile angulaire sur chaque pilier (partie dépensée et allouée).
  * Infobulle dynamique affichant les montants `{dépensé} / {alloué} €`.
* **Courbe d'évolution du solde (`MonthlySpendingCurveChart`)** :
  * Visualisation continue du solde net au fil des jours du cycle.
  * **Scrubbing tactile continu au doigt** : faites glisser votre doigt sur la courbe pour inspecter le solde et les opérations jour par jour avec retour haptique.

### 💰 Reste à Vivre & Prochaine Dépense à Venir
* **Reste à vivre opérationnel** : Affiche en grand ce qu'il vous reste pour vos dépenses de consommation courante (Besoins + Envies).
* **Décomposition avec épargne** : Indication secondaire discrète du montant restant incluant l'épargne.
* **Bulle d'aide explicative `(i)`** : Dialogue contextuel clair expliquant les calculs du reste à vivre.
* **Carte « Prochaine dépense à venir »** : Identifie l'échéance récurrente la plus proche, son montant, et calcule le reste à vivre prévisionnel après son passage.

### ⚡ Saisie Ultra-Rapide (Modale QuickEntry)
* Pavé numérique tactile personnalisé pour saisir un montant instantanément.
* **Pavé numérique figé** : Le clavier virtuel natif vient recouvrir le pavé numérique pour la saisie des notes et du titre sans faire remonter la feuille modale.
* Gestion des catégories à la volée avec création directe dans la puce de sélection.

### 🔄 Remboursements Intégrés Directement
* Action **Rembourser** sur n'importe quelle dépense dans sa vue détaillée.
* Le remboursement est rattaché à l'objet de la transaction : la dépense nette est recalculée instantanément (`dépense = montant - remboursé`).
* Badge épuré et discret sur la carte : `Remboursement : XX,XX € (XX,XX € restants)`.
* Montant remboursé modifiable ou réinitialisable à tout moment.

### ⚙️ Gestion du Changement de Mois & Trésorerie
* Trois modes au choix dans les Paramètres :
  1. **Remise à zéro chaque mois** *(par défaut)* : Chaque mois est indépendant selon les flux réels du mois.
  2. **Reporter le solde du mois précédent** : Le solde net de fin de mois est automatiquement reporté au 1er jour du mois suivant.
  3. **Liquidité fixe de départ** : Démarrer chaque mois avec un montant de trésorerie prédéfini (ex: 500 € ou 1 000 €).

### 🔒 Confidentialité & Sauvegarde Hermétique
* **Zéro pub, zéro pistage** : Données stockées localement via AsyncStorage sécurisé.
* **Sauvegarde & Restauration JSON** : Exportez et importez l'intégralité de vos comptes et configurations en un clic.

---

### 📱 Installation de l'APK Android
Téléchargez le fichier `Wallou-v1.0.1.apk` ci-dessous et installez-le directement sur votre smartphone Android.
