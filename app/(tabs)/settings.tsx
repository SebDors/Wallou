import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Sun,
  Moon,
  Smartphone,
  Sliders,
  Coins,
  Download,
  Upload,
  AlertOctagon,
  RefreshCw,
  ExternalLink,
  Check,
  X,
  Copy,
  Tag,
  FolderPlus,
  Trash2,
  Calendar,
  Repeat,
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useBudget } from '../../src/context/BudgetContext';
import { useDialog } from '../../src/context/DialogContext';
import { Card } from '../../src/components/Card';
import { validateRatios } from '../../src/services/budgetEngine';
import { validateAndSanitizeBackup } from '../../src/services/exportImportService';
import { checkForUpdate, openDownloadPage } from '../../src/services/updateService';
import { BudgetRatios, RolloverMode } from '../../src/types/budget';

const CURRENCIES = [
  { label: 'Euro (€)', symbol: '€' },
  { label: 'Dollar ($)', symbol: '$' },
  { label: 'Livre Sterling (£)', symbol: '£' },
  { label: 'Franc Suisse (CHF)', symbol: 'CHF' },
  { label: 'Dollar Canadien (CAD $)', symbol: 'CAD' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, themeMode, setThemeMode } = useTheme();
  const {
    settings,
    updateSettings,
    categories,
    addCategory,
    deleteCategory,
    exportData,
    importData,
    resetAllData,
  } = useBudget();
  const { showSuccess, showError, showConfirm, showDialog } = useDialog();

  // Category input state
  const [newCatInput, setNewCatInput] = useState('');

  // Custom Ratios State
  const [needsRatio, setNeedsRatio] = useState<string>(
    String(settings?.ratios?.needs ?? 50)
  );
  const [wantsRatio, setWantsRatio] = useState<string>(
    String(settings?.ratios?.wants ?? 30)
  );
  const [savingsRatio, setSavingsRatio] = useState<string>(
    String(settings?.ratios?.savings ?? 20)
  );
  const [ratioError, setRatioError] = useState<string | null>(null);

  // JSON Paste Modal State
  const [pasteModalVisible, setPasteModalVisible] = useState(false);
  const [rawJsonInput, setRawJsonInput] = useState('');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  // Rollover Mode & Starting Liquidity State
  const [rolloverMode, setRolloverMode] = useState<RolloverMode>(
    settings?.rolloverMode || 'reset'
  );
  const [startingLiquidityInput, setStartingLiquidityInput] = useState<string>(
    String(settings?.startingLiquidity ?? 0)
  );

  // Sync settings when loaded
  useEffect(() => {
    if (settings) {
      if (settings.ratios) {
        setNeedsRatio(String(settings.ratios.needs));
        setWantsRatio(String(settings.ratios.wants));
        setSavingsRatio(String(settings.ratios.savings));
      }
      if (settings.rolloverMode) {
        setRolloverMode(settings.rolloverMode);
      }
      if (settings.startingLiquidity !== undefined) {
        setStartingLiquidityInput(String(settings.startingLiquidity));
      }
    }
  }, [settings?.ratios, settings?.rolloverMode, settings?.startingLiquidity]);

  const handleSelectRolloverMode = async (mode: RolloverMode) => {
    setRolloverMode(mode);
    try {
      Haptics.selectionAsync();
    } catch {}
    await updateSettings({ rolloverMode: mode });
  };

  const handleSaveStartingLiquidity = async () => {
    const parsed = parseFloat(startingLiquidityInput.replace(',', '.'));
    if (isNaN(parsed) || parsed < 0) {
      showError('Montant invalide', 'Veuillez saisir un montant de liquidité valide.');
      return;
    }
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    await updateSettings({ startingLiquidity: Number(parsed.toFixed(2)) });
    showSuccess(
      'Liquidité enregistrée',
      `La liquidité mensuelle initiale est fixée à ${parsed} ${settings?.currency || '€'}.`
    );
  };

  // Real-time ratio validation
  const currentTotalRatio =
    (parseInt(needsRatio, 10) || 0) +
    (parseInt(wantsRatio, 10) || 0) +
    (parseInt(savingsRatio, 10) || 0);

  const isRatioValid = currentTotalRatio === 100;

  const handleSaveRatios = async () => {
    const n = parseInt(needsRatio, 10);
    const w = parseInt(wantsRatio, 10);
    const s = parseInt(savingsRatio, 10);

    const newRatios: BudgetRatios = {
      needs: n,
      wants: w,
      savings: s,
    };

    const validation = validateRatios(newRatios);
    if (!validation.isValid) {
      setRatioError(validation.error || 'Total doit être égal à 100%');
      showError('Ratios invalides', validation.error || 'La somme des ratios doit être égale à 100%.');
      return;
    }

    await updateSettings({ ratios: newRatios });
    setRatioError(null);
    showSuccess('Règles mises à jour', 'Vos ratios 50/30/20 ont été enregistrés.');
  };

  const handleSelectCurrency = async (curr: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    await updateSettings({ currency: curr });
  };

  const handleExportJSON = async () => {
    try {
      const payload = exportData();
      const jsonString = JSON.stringify(payload, null, 2);

      const isShareAvailable = await Sharing.isAvailableAsync().catch(() => false);
      const cacheDir = FileSystem.cacheDirectory;

      if (cacheDir && isShareAvailable) {
        const fileUri = `${cacheDir}gestionapp-backup-${Date.now()}.json`;
        await FileSystem.writeAsStringAsync(fileUri, jsonString, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Exporter ma sauvegarde GestionApp',
          UTI: 'public.json',
        });
      } else {
        // Fallback: show json modal
        setRawJsonInput(jsonString);
        setPasteModalVisible(true);
      }
    } catch (err: any) {
      console.error('Export failed:', err);
      showError('Erreur d’export', err?.message || 'Impossible d’exporter les données.');
    }
  };

  const handleImportFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const validation = validateAndSanitizeBackup(content);
      if (!validation.isValid || !validation.payload) {
        showError('Sauvegarde invalide', validation.error || 'Le fichier JSON est incorrect.');
        return;
      }

      const txCount = validation.payload.data.transactions.length;
      const recCount = validation.payload.data.recurring.length;

      showConfirm(
        'Confirmer la restauration',
        `Restaurer ${txCount} opérations et ${recCount} récurrences ? Toutes les données actuelles seront remplacées.`,
        async () => {
          const res = await importData(content);
          if (res.success) {
            showSuccess('Sauvegarde restaurée', 'Vos données ont été restaurées avec succès.');
          } else {
            showError('Erreur', res.error || 'Échec de la restauration.');
          }
        },
        'Restaurer',
        true
      );
    } catch (err: any) {
      console.error('Import failed:', err);
      showError('Erreur d’importation', err?.message || 'Impossible de lire le fichier.');
    }
  };

  const handleImportPastedJSON = async () => {
    if (!rawJsonInput.trim()) {
      showError('Texte vide', 'Veuillez coller le JSON de sauvegarde.');
      return;
    }

    const validation = validateAndSanitizeBackup(rawJsonInput);
    if (!validation.isValid || !validation.payload) {
      showError('Format invalide', validation.error || 'Le contenu n’est pas un JSON valide.');
      return;
    }

    const txCount = validation.payload.data.transactions.length;
    const recCount = validation.payload.data.recurring.length;

    showConfirm(
      'Confirmer la restauration',
      `Restaurer ${txCount} opérations et ${recCount} récurrences ?`,
      async () => {
        const res = await importData(rawJsonInput);
        if (res.success) {
          setPasteModalVisible(false);
          setRawJsonInput('');
          showSuccess('Sauvegarde restaurée', 'Vos données ont été restaurées avec succès.');
        } else {
          showError('Erreur', res.error || 'Échec de la restauration.');
        }
      },
      'Restaurer',
      true
    );
  };

  const handleResetData = () => {
    showConfirm(
      'Zone de danger',
      'Voulez-vous réinitialiser toutes les données ? Toutes vos transactions et récurrences seront effacées définitivement.',
      async () => {
        await resetAllData();
        showSuccess('Données effacées', 'L’application a été réinitialisée.');
      },
      'Tout supprimer',
      true
    );
  };

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    try {
      const release = await checkForUpdate('1.0.0');
      if (release.isAvailable && release.downloadUrl) {
        showDialog({
          title: 'Mise à jour disponible !',
          message: `Version ${release.version}\n\n${release.releaseNotes}`,
          variant: 'info',
          buttons: [
            { text: 'Plus tard', style: 'cancel' },
            {
              text: 'Télécharger',
              style: 'default',
              onPress: () => openDownloadPage(release.downloadUrl),
            },
          ],
        });
      } else {
        showSuccess(
          'À jour',
          'Vous utilisez déjà la dernière version de Wallou (1.0.0).'
        );
      }
    } catch {
      showSuccess(
        'Information',
        'Wallou est à jour (Version 1.0.0).'
      );
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.bg.canvas }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + theme.spacing.md,
          paddingBottom: insets.bottom + 80,
          paddingHorizontal: theme.spacing.lg,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={[
          theme.typography.title1,
          { color: theme.colors.text.primary, marginBottom: theme.spacing.lg },
        ]}
      >
        Réglages
      </Text>

      {/* 1. Appearance / Theme */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
        Apparence
      </Text>
      <Card style={styles.cardSection}>
        <View
          style={[
            styles.themeSegment,
            {
              backgroundColor: theme.colors.bg.surfaceSubtle,
              borderRadius: theme.radii.full,
            },
          ]}
        >
          <Pressable
            onPress={() => setThemeMode('light')}
            style={[
              styles.themeOption,
              themeMode === 'light' && {
                backgroundColor: theme.colors.bg.surface,
                borderRadius: theme.radii.full,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              },
            ]}
          >
            <Sun
              size={16}
              color={
                themeMode === 'light'
                  ? theme.colors.text.primary
                  : theme.colors.text.muted
              }
            />
            <Text
              style={[
                theme.typography.caption,
                {
                  color:
                    themeMode === 'light'
                      ? theme.colors.text.primary
                      : theme.colors.text.muted,
                  fontWeight: '600',
                  marginLeft: 6,
                },
              ]}
            >
              Clair
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setThemeMode('dark')}
            style={[
              styles.themeOption,
              themeMode === 'dark' && {
                backgroundColor: theme.colors.bg.surface,
                borderRadius: theme.radii.full,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              },
            ]}
          >
            <Moon
              size={16}
              color={
                themeMode === 'dark'
                  ? theme.colors.text.primary
                  : theme.colors.text.muted
              }
            />
            <Text
              style={[
                theme.typography.caption,
                {
                  color:
                    themeMode === 'dark'
                      ? theme.colors.text.primary
                      : theme.colors.text.muted,
                  fontWeight: '600',
                  marginLeft: 6,
                },
              ]}
            >
              Sombre
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setThemeMode('system')}
            style={[
              styles.themeOption,
              themeMode === 'system' && {
                backgroundColor: theme.colors.bg.surface,
                borderRadius: theme.radii.full,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              },
            ]}
          >
            <Smartphone
              size={16}
              color={
                themeMode === 'system'
                  ? theme.colors.text.primary
                  : theme.colors.text.muted
              }
            />
            <Text
              style={[
                theme.typography.caption,
                {
                  color:
                    themeMode === 'system'
                      ? theme.colors.text.primary
                      : theme.colors.text.muted,
                  fontWeight: '600',
                  marginLeft: 6,
                },
              ]}
            >
              Système
            </Text>
          </Pressable>
        </View>
      </Card>

      {/* 2. Devise */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary, marginTop: 16 }]}>
        Devise
      </Text>
      <Card style={styles.cardSection}>
        <View style={styles.currencyRow}>
          {CURRENCIES.map((c) => {
            const isSelected = (settings?.currency || '€') === c.symbol;
            return (
              <Pressable
                key={c.symbol}
                onPress={() => handleSelectCurrency(c.symbol)}
                style={[
                  styles.currencyBtn,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.pillar.savings
                      : theme.colors.bg.surfaceSubtle,
                    borderRadius: theme.radii.md,
                  },
                ]}
              >
                <Text
                  style={[
                    theme.typography.caption,
                    {
                      color: isSelected ? '#FFFFFF' : theme.colors.text.primary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {c.symbol}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* 3. Budget Ratios Customizer (50/30/20) */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary, marginTop: 16 }]}>
        Règle d'allocation budgétaire
      </Text>
      <Card style={styles.cardSection}>
        <View style={styles.ratiosInputsRow}>
          <View style={styles.ratioInputCol}>
            <Text style={[theme.typography.caption, { color: theme.colors.pillar.needs, fontWeight: '700' }]}>
              Besoins
            </Text>
            <TextInput
              value={needsRatio}
              onChangeText={setNeedsRatio}
              keyboardType="number-pad"
              style={[
                styles.ratioInput,
                {
                  backgroundColor: theme.colors.bg.surfaceSubtle,
                  borderColor: theme.colors.border.subtle,
                  color: theme.colors.text.primary,
                  borderRadius: theme.radii.md,
                },
              ]}
            />
            <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, textAlign: 'center', marginTop: 2 }]}>
              %
            </Text>
          </View>

          <View style={styles.ratioInputCol}>
            <Text style={[theme.typography.caption, { color: theme.colors.pillar.wants, fontWeight: '700' }]}>
              Envies
            </Text>
            <TextInput
              value={wantsRatio}
              onChangeText={setWantsRatio}
              keyboardType="number-pad"
              style={[
                styles.ratioInput,
                {
                  backgroundColor: theme.colors.bg.surfaceSubtle,
                  borderColor: theme.colors.border.subtle,
                  color: theme.colors.text.primary,
                  borderRadius: theme.radii.md,
                },
              ]}
            />
            <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, textAlign: 'center', marginTop: 2 }]}>
              %
            </Text>
          </View>

          <View style={styles.ratioInputCol}>
            <Text style={[theme.typography.caption, { color: theme.colors.pillar.savings, fontWeight: '700' }]}>
              Épargne
            </Text>
            <TextInput
              value={savingsRatio}
              onChangeText={setSavingsRatio}
              keyboardType="number-pad"
              style={[
                styles.ratioInput,
                {
                  backgroundColor: theme.colors.bg.surfaceSubtle,
                  borderColor: theme.colors.border.subtle,
                  color: theme.colors.text.primary,
                  borderRadius: theme.radii.md,
                },
              ]}
            />
            <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, textAlign: 'center', marginTop: 2 }]}>
              %
            </Text>
          </View>
        </View>

        {/* Real-time sum badge */}
        <View
          style={[
            styles.totalBadge,
            {
              backgroundColor: isRatioValid
                ? theme.colors.pillar.needsBg
                : theme.colors.status.overrunBg,
              borderRadius: theme.radii.sm,
              marginTop: 12,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.caption,
              {
                color: isRatioValid
                  ? theme.colors.pillar.needs
                  : theme.colors.status.overrun,
                fontWeight: '700',
              },
            ]}
          >
            Total : {currentTotalRatio}% {isRatioValid ? '✓ (Égal à 100%)' : '✗ (Doit être égal à 100%)'}
          </Text>
        </View>

        {ratioError ? (
          <Text style={[theme.typography.caption, { color: theme.colors.status.overrun, marginTop: 4 }]}>
            {ratioError}
          </Text>
        ) : null}

        <Pressable
          onPress={handleSaveRatios}
          disabled={!isRatioValid}
          style={({ pressed }) => [
            styles.saveRatiosBtn,
            {
              backgroundColor: isRatioValid
                ? theme.colors.pillar.savings
                : theme.colors.bg.surfaceSubtle,
              borderRadius: theme.radii.md,
              opacity: pressed && isRatioValid ? 0.8 : 1,
              marginTop: 12,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.body,
              {
                color: isRatioValid ? '#FFFFFF' : theme.colors.text.muted,
                fontWeight: '700',
              },
            ]}
          >
            Enregistrer les ratios
          </Text>
        </Pressable>
      </Card>

      {/* 4. Changement de mois & Liquidité */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary, marginTop: 16 }]}>
        Changement de mois & Liquidité
      </Text>
      <Card style={styles.cardSection}>
        <View style={styles.rolloverOptionsList}>
          {/* Option 1: Reset */}
          <Pressable
            onPress={() => handleSelectRolloverMode('reset')}
            style={[
              styles.rolloverOptionItem,
              {
                borderColor: rolloverMode === 'reset' ? theme.colors.pillar.savings : theme.colors.border.subtle,
                backgroundColor: rolloverMode === 'reset' ? theme.colors.bg.surfaceSubtle : theme.colors.bg.surface,
                borderRadius: theme.radii.md,
              },
            ]}
          >
            <View style={styles.rolloverRadioRow}>
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: rolloverMode === 'reset' ? theme.colors.pillar.savings : theme.colors.border.subtle },
                ]}
              >
                {rolloverMode === 'reset' && (
                  <View style={[styles.radioInner, { backgroundColor: theme.colors.pillar.savings }]} />
                )}
              </View>
              <View style={styles.rolloverTextCol}>
                <Text style={[theme.typography.body, { color: theme.colors.text.primary, fontWeight: '700' }]}>
                  Repartir à zéro (Reset)
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, marginTop: 2 }]}>
                  Chaque mois est indépendant (recommandé 50/30/20)
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Option 2: Previous balance */}
          <Pressable
            onPress={() => handleSelectRolloverMode('previous_balance')}
            style={[
              styles.rolloverOptionItem,
              {
                borderColor: rolloverMode === 'previous_balance' ? theme.colors.pillar.savings : theme.colors.border.subtle,
                backgroundColor: rolloverMode === 'previous_balance' ? theme.colors.bg.surfaceSubtle : theme.colors.bg.surface,
                borderRadius: theme.radii.md,
              },
            ]}
          >
            <View style={styles.rolloverRadioRow}>
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: rolloverMode === 'previous_balance' ? theme.colors.pillar.savings : theme.colors.border.subtle },
                ]}
              >
                {rolloverMode === 'previous_balance' && (
                  <View style={[styles.radioInner, { backgroundColor: theme.colors.pillar.savings }]} />
                )}
              </View>
              <View style={styles.rolloverTextCol}>
                <Text style={[theme.typography.body, { color: theme.colors.text.primary, fontWeight: '700' }]}>
                  Reporter le solde précédent
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, marginTop: 2 }]}>
                  Le solde restant du mois N-1 est automatiquement reporté au 1er jour
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Option 3: Fixed liquidity */}
          <Pressable
            onPress={() => handleSelectRolloverMode('fixed_liquidity')}
            style={[
              styles.rolloverOptionItem,
              {
                borderColor: rolloverMode === 'fixed_liquidity' ? theme.colors.pillar.savings : theme.colors.border.subtle,
                backgroundColor: rolloverMode === 'fixed_liquidity' ? theme.colors.bg.surfaceSubtle : theme.colors.bg.surface,
                borderRadius: theme.radii.md,
              },
            ]}
          >
            <View style={styles.rolloverRadioRow}>
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: rolloverMode === 'fixed_liquidity' ? theme.colors.pillar.savings : theme.colors.border.subtle },
                ]}
              >
                {rolloverMode === 'fixed_liquidity' && (
                  <View style={[styles.radioInner, { backgroundColor: theme.colors.pillar.savings }]} />
                )}
              </View>
              <View style={styles.rolloverTextCol}>
                <Text style={[theme.typography.body, { color: theme.colors.text.primary, fontWeight: '700' }]}>
                  Liquidité fixe de départ
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, marginTop: 2 }]}>
                  Démarrer chaque mois avec une somme prédéfinie
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Starting liquidity input when fixed_liquidity is active */}
        {rolloverMode === 'fixed_liquidity' && (
          <View style={[styles.startingLiquidityBox, { borderTopColor: theme.colors.border.subtle }]}>
            <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, marginBottom: 6 }]}>
              Montant de départ mensuel ({settings?.currency || '€'})
            </Text>
            <View style={styles.startingLiquidityInputRow}>
              <TextInput
                value={startingLiquidityInput}
                onChangeText={setStartingLiquidityInput}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={theme.colors.text.muted}
                style={[
                  styles.startingLiquidityInput,
                  {
                    backgroundColor: theme.colors.bg.surfaceSubtle,
                    borderColor: theme.colors.border.subtle,
                    color: theme.colors.text.primary,
                    borderRadius: theme.radii.md,
                  },
                ]}
              />
              <Pressable
                onPress={handleSaveStartingLiquidity}
                style={({ pressed }) => [
                  styles.saveLiquidityBtn,
                  {
                    backgroundColor: theme.colors.pillar.savings,
                    borderRadius: theme.radii.md,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={[theme.typography.body, { color: '#FFFFFF', fontWeight: '700' }]}>
                  Valider
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </Card>

      {/* 4. Gestion des Catégories */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary, marginTop: 16 }]}>
        Catégories d'opérations
      </Text>
      <Card style={styles.cardSection}>
        {/* Add Category Input */}
        <View style={styles.addCategoryRow}>
          <TextInput
            value={newCatInput}
            onChangeText={setNewCatInput}
            placeholder="Nouvelle catégorie..."
            placeholderTextColor={theme.colors.text.muted}
            style={[
              styles.addCatInput,
              {
                backgroundColor: theme.colors.bg.surfaceSubtle,
                borderColor: theme.colors.border.subtle,
                color: theme.colors.text.primary,
                borderRadius: theme.radii.md,
              },
            ]}
          />
          <Pressable
            onPress={async () => {
              if (!newCatInput.trim()) return;
              await addCategory(newCatInput.trim());
              setNewCatInput('');
              showSuccess('Catégorie ajoutée', `"${newCatInput.trim()}" est disponible.`);
            }}
            style={({ pressed }) => [
              styles.addCatBtn,
              {
                backgroundColor: theme.colors.pillar.savings,
                borderRadius: theme.radii.md,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <FolderPlus size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Categories Chips */}
        <View style={styles.categoriesList}>
          {categories.length === 0 ? (
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.text.muted, fontStyle: 'italic', paddingVertical: 6 },
              ]}
            >
              Aucune catégorie. Créez vos propres catégories personnalisées ci-dessus.
            </Text>
          ) : (
            categories.map((cat) => (
              <View
                key={cat}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: theme.colors.bg.surfaceSubtle,
                    borderColor: theme.colors.border.subtle,
                    borderRadius: theme.radii.full,
                  },
                ]}
              >
                <Tag size={13} color={theme.colors.text.secondary} />
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.text.primary, marginLeft: 6 },
                  ]}
                >
                  {cat}
                </Text>
                <Pressable
                  onPress={() => {
                    showConfirm(
                      'Supprimer cette catégorie ?',
                      `Voulez-vous supprimer "${cat}" ?`,
                      async () => {
                        await deleteCategory(cat);
                      },
                      'Supprimer',
                      true
                    );
                  }}
                  style={styles.chipDeleteBtn}
                >
                  <Trash2 size={13} color={theme.colors.status.overrun} />
                </Pressable>
              </View>
            ))
          )}
        </View>
      </Card>

      {/* 4. Données & Sauvegardes (Local-First) */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary, marginTop: 16 }]}>
        Sauvegarde & Données (100% Hors-Ligne)
      </Text>
      <Card style={styles.cardSection}>
        <Pressable
          onPress={handleExportJSON}
          style={({ pressed }) => [
            styles.actionRow,
            {
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border.subtle,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View style={styles.actionLeft}>
            <Download size={18} color={theme.colors.pillar.savings} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[theme.typography.body, { color: theme.colors.text.primary, fontWeight: '600' }]}>
                Exporter les données (JSON)
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>
                Sauvegarde hermétique et partageable
              </Text>
            </View>
          </View>
        </Pressable>

        <Pressable
          onPress={handleImportFile}
          style={({ pressed }) => [
            styles.actionRow,
            {
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border.subtle,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View style={styles.actionLeft}>
            <Upload size={18} color={theme.colors.pillar.needs} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[theme.typography.body, { color: theme.colors.text.primary, fontWeight: '600' }]}>
                Importer une sauvegarde (Fichier)
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>
                Sélectionnez un fichier JSON de sauvegarde
              </Text>
            </View>
          </View>
        </Pressable>

        <Pressable
          onPress={() => {
            setRawJsonInput('');
            setPasteModalVisible(true);
          }}
          style={({ pressed }) => [
            styles.actionRow,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={styles.actionLeft}>
            <Copy size={18} color={theme.colors.pillar.wants} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[theme.typography.body, { color: theme.colors.text.primary, fontWeight: '600' }]}>
                Coller / Visualiser le JSON
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>
                Import textuel direct sans passer par les fichiers
              </Text>
            </View>
          </View>
        </Pressable>
      </Card>

      {/* 5. Zone de Danger */}
      <Text style={[styles.sectionTitle, { color: theme.colors.status.overrun, marginTop: 16 }]}>
        Zone de danger
      </Text>
      <Card style={styles.cardSection}>
        <Pressable
          onPress={handleResetData}
          style={({ pressed }) => [
            styles.actionRow,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={styles.actionLeft}>
            <AlertOctagon size={18} color={theme.colors.status.overrun} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[theme.typography.body, { color: theme.colors.status.overrun, fontWeight: '700' }]}>
                Réinitialiser l'application
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>
                Efface toutes les opérations, récurrences et paramètres
              </Text>
            </View>
          </View>
        </Pressable>
      </Card>

      {/* 6. À Propos & Mises à Jour */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary, marginTop: 16 }]}>
        À propos
      </Text>
      <Card style={styles.cardSection}>
        <View style={styles.aboutRow}>
          <Text style={[theme.typography.body, { color: theme.colors.text.primary, fontWeight: '600' }]}>
            GestionApp
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>
            v1.0.0 (Build 1)
          </Text>
        </View>

        <Pressable
          onPress={handleCheckUpdate}
          disabled={isCheckingUpdate}
          style={({ pressed }) => [
            styles.updateBtn,
            {
              backgroundColor: theme.colors.bg.surfaceSubtle,
              borderRadius: theme.radii.md,
              opacity: pressed ? 0.7 : 1,
              marginTop: 12,
            },
          ]}
        >
          <RefreshCw
            size={16}
            color={theme.colors.text.primary}
            style={isCheckingUpdate ? { transform: [{ rotate: '45deg' }] } : undefined}
          />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.text.primary, fontWeight: '600', marginLeft: 8 },
            ]}
          >
            {isCheckingUpdate ? 'Vérification...' : 'Vérifier les mises à jour'}
          </Text>
        </Pressable>
      </Card>

      {/* JSON Import/Export Modal */}
      {pasteModalVisible && (
        <Modal
          visible={pasteModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setPasteModalVisible(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setPasteModalVisible(false)}
          >
            <Pressable
              style={[
                styles.pasteSheet,
                {
                  backgroundColor: theme.colors.bg.surface,
                  borderColor: theme.colors.border.subtle,
                  borderRadius: theme.radii.xl,
                },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={[theme.typography.title2, { color: theme.colors.text.primary }]}>
                  Données JSON de sauvegarde
                </Text>
                <Pressable onPress={() => setPasteModalVisible(false)}>
                  <X size={20} color={theme.colors.text.secondary} />
                </Pressable>
              </View>

              <TextInput
                value={rawJsonInput}
                onChangeText={setRawJsonInput}
                multiline
                placeholder="Collez ici votre JSON de sauvegarde..."
                placeholderTextColor={theme.colors.text.muted}
                style={[
                  styles.pasteInput,
                  {
                    backgroundColor: theme.colors.bg.surfaceSubtle,
                    borderColor: theme.colors.border.subtle,
                    color: theme.colors.text.primary,
                    borderRadius: theme.radii.md,
                  },
                ]}
              />

              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setPasteModalVisible(false)}
                  style={[
                    styles.cancelBtn,
                    {
                      backgroundColor: theme.colors.bg.surfaceSubtle,
                      borderRadius: theme.radii.md,
                    },
                  ]}
                >
                  <Text style={[theme.typography.body, { color: theme.colors.text.secondary }]}>
                    Fermer
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleImportPastedJSON}
                  style={[
                    styles.confirmBtn,
                    {
                      backgroundColor: theme.colors.pillar.savings,
                      borderRadius: theme.radii.md,
                    },
                  ]}
                >
                  <Text style={[theme.typography.body, { color: '#FFF', fontWeight: '700' }]}>
                    Restaurer
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {},
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardSection: {
    marginBottom: 8,
  },
  themeSegment: {
    flexDirection: 'row',
    padding: 3,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  currencyBtn: {
    flex: 1,
    minWidth: 50,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratiosInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ratioInputCol: {
    flex: 1,
    alignItems: 'center',
  },
  ratioInput: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  totalBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  saveRatiosBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  pasteSheet: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pasteInput: {
    height: 200,
    padding: 12,
    borderWidth: 1,
    fontSize: 12,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  addCatInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 14,
  },
  addCatBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  chipDeleteBtn: {
    marginLeft: 8,
    padding: 2,
  },
  rolloverOptionsList: {
    gap: 10,
  },
  rolloverOptionItem: {
    padding: 12,
    borderWidth: 1.5,
  },
  rolloverRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rolloverTextCol: {
    flex: 1,
  },
  startingLiquidityBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  startingLiquidityInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  startingLiquidityInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 15,
  },
  saveLiquidityBtn: {
    paddingHorizontal: 18,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
