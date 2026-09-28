# 🚀 Wallou — Version 1.0.1

Bienvenue sur la version **1.0.1** de **Wallou**, l'application de finances personnelles et de gestion budgétaire **50/30/20**, pensée pour être ultra-fluide, sans publicité et **100% local-first** (vos données restent exclusivement sur votre appareil).

---

## 🌟 Nouveautés de la Version 1.0.1

### 📅 Cycle Budgétaire & Jour de Départ Personnalisable
* Vous pouvez désormais configurer le **jour de début de vos mois budgétaires** (ex: le 1er, le 3, le 25 ou le 28 du mois pour caler votre budget sur votre salaire).
* L'application ajuste automatiquement l'intervalle de calcul (ex: du 3 septembre au 2 octobre) et affiche la période exacte dans le tableau de bord et les graphiques.

### 📊 Navigation Graphique par Onglets
* Remplacement du défilement gestuel horizontal par un sélecteur d'onglets épuré **[ Répartition (50/30/20) | Évolution du solde ]**.
* Supprime tout conflit tactile : explorez la courbe financière au doigt (scrubbing tactile continu) avec une fluidité absolue.

### ✨ Expérience de Production Épurée & Nom Officiel
* Nom officiel de l'application : **Wallou**.
* Nettoyage intégral des données de démonstration en production : l'application démarre propre et vide pour chaque nouvel utilisateur.

---

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
