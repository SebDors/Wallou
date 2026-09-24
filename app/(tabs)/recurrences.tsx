import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus,
  Repeat,
  TrendingDown,
  TrendingUp,
  X,
  Trash2,
  Edit3,
  Calendar,
  CheckCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useBudget } from '../../src/context/BudgetContext';
import { useDialog } from '../../src/context/DialogContext';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { formatCurrency } from '../../src/services/budgetEngine';
import { PillarId, RecurringItem, TransactionType } from '../../src/types/budget';

type TabFilter = 'all' | 'expense' | 'income';

export default function RecurrencesScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const {
    recurring,
    addRecurringItem,
    updateRecurringItem,
    deleteRecurringItem,
    processRecurring,
    settings,
  } = useBudget();
  const { showConfirm, showError, showSuccess } = useDialog();

  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formType, setFormType] = useState<TransactionType>('expense');
  const [formPillar, setFormPillar] = useState<PillarId>('needs');
  const [formDay, setFormDay] = useState('5');
  const [formCategory, setFormCategory] = useState('');

  const currency = settings?.currency || '€';

  // Summary Banner metrics
  const summaryMetrics = useMemo(() => {
    let fixedIncome = 0;
    let fixedExpenses = 0;

    for (const item of recurring) {
      if (!item.isActive) continue;
      if (item.type === 'income') {
        fixedIncome += item.amount;
      } else {
        fixedExpenses += item.amount;
      }
    }

    const netFixed = fixedIncome - fixedExpenses;
    const ratioCommitment =
      fixedIncome > 0 ? Math.round((fixedExpenses / fixedIncome) * 100) : 0;

    return { fixedIncome, fixedExpenses, netFixed, ratioCommitment };
  }, [recurring]);

  // Filtered recurring items
  const filteredItems = useMemo(() => {
    let result = [...recurring];
    if (activeTab === 'expense') {
      result = result.filter((r) => r.type === 'expense');
    } else if (activeTab === 'income') {
      result = result.filter((r) => r.type === 'income');
    }
    return result.sort((a, b) => a.dayOfMonth - b.dayOfMonth);
  }, [recurring, activeTab]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormAmount('');
    setFormType('expense');
    setFormPillar('needs');
    setFormDay('5');
    setFormCategory('');
    setModalVisible(true);
  };

  const openEditModal = (item: RecurringItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormAmount(String(item.amount));
    setFormType(item.type);
    setFormPillar(item.pillarId || 'needs');
    setFormDay(String(item.dayOfMonth));
    setFormCategory(item.category);
    setModalVisible(true);
  };

  const handleToggleActive = async (item: RecurringItem, value: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    await updateRecurringItem({
      ...item,
      isActive: value,
    });
  };

  const handleDelete = (item: RecurringItem) => {
    showConfirm(
      'Supprimer la récurrence',
      `Voulez-vous vraiment supprimer "${item.title}" ?`,
      async () => {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        await deleteRecurringItem(item.id);
        if (editingItem?.id === item.id) {
          setModalVisible(false);
        }
      },
      'Supprimer',
      true
    );
  };

  const handleSaveForm = async () => {
    const parsedAmount = parseFloat(formAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showError('Montant invalide', 'Veuillez saisir un montant supérieur à 0.');
      return;
    }

    if (!formTitle.trim()) {
      showError('Titre requis', 'Veuillez renseigner un titre pour cette charge.');
      return;
    }

    const dayNum = parseInt(formDay, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      showError('Jour invalide', 'Le jour du mois doit être compris entre 1 et 31.');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const nowIso = new Date().toISOString();

    if (editingItem) {
      await updateRecurringItem({
        ...editingItem,
        title: formTitle.trim(),
        amount: parsedAmount,
        type: formType,
        pillarId: formType === 'expense' ? formPillar : undefined,
        dayOfMonth: dayNum,
        category: formCategory.trim() || (formType === 'expense' ? 'Charge fixe' : 'Revenu fixe'),
      });
    } else {
      await addRecurringItem({
        title: formTitle.trim(),
        amount: parsedAmount,
        type: formType,
        pillarId: formType === 'expense' ? formPillar : undefined,
        dayOfMonth: dayNum,
        category: formCategory.trim() || (formType === 'expense' ? 'Charge fixe' : 'Revenu fixe'),
        frequency: 'monthly',
        startDate: nowIso.slice(0, 10),
        isActive: true,
      });
    }

    setModalVisible(false);
  };

  const handleApplyNow = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    await processRecurring();
    showSuccess(
      'Opérations générées',
      'Les charges fixes prévues pour ce mois ont été vérifiées et appliquées au grand livre.'
    );
  };

  const getPillarColor = (pillarId?: PillarId) => {
    switch (pillarId) {
      case 'needs':
        return theme.colors.pillar.needs;
      case 'wants':
        return theme.colors.pillar.wants;
      case 'savings':
        return theme.colors.pillar.savings;
      default:
        return theme.colors.text.secondary;
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
      {/* Screen Title & Add Button */}
      <View style={styles.topRow}>
        <Text style={[theme.typography.title1, { color: theme.colors.text.primary }]}>
          Charges Fixes
        </Text>
        <Pressable
          onPress={openAddModal}
          style={({ pressed }) => [
            styles.addTopBtn,
            {
              backgroundColor: theme.colors.pillar.savings,
              borderRadius: theme.radii.full,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Plus size={18} color="#FFF" />
          <Text style={[theme.typography.caption, { color: '#FFF', fontWeight: '700', marginLeft: 4 }]}>
            Nouveau
          </Text>
        </Pressable>
      </View>

      {/* 1. Summary Banner Card */}
      <Card style={styles.summaryCard}>
        <Text
          style={[
            theme.typography.caption,
            {
              color: theme.colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontWeight: '600',
            },
          ]}
        >
          Engagements mensuels fixes
        </Text>

        <View style={styles.summaryColumns}>
          <View style={styles.summaryCol}>
            <View style={styles.summaryLabelRow}>
              <TrendingDown size={14} color={theme.colors.status.overrun} />
              <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, marginLeft: 4 }]}>
                Dépenses fixes
              </Text>
            </View>
            <Text
              style={[
                theme.typography.title2,
                theme.typography.tabularNums,
                { color: theme.colors.status.overrun, fontWeight: '700', marginTop: 2 },
              ]}
            >
              -{formatCurrency(summaryMetrics.fixedExpenses, currency)}
            </Text>
          </View>

          <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border.subtle }]} />

          <View style={styles.summaryCol}>
            <View style={styles.summaryLabelRow}>
              <TrendingUp size={14} color={theme.colors.status.income} />
              <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, marginLeft: 4 }]}>
                Revenus fixes
              </Text>
            </View>
            <Text
              style={[
                theme.typography.title2,
                theme.typography.tabularNums,
                { color: theme.colors.status.income, fontWeight: '700', marginTop: 2 },
              ]}
            >
              +{formatCurrency(summaryMetrics.fixedIncome, currency)}
            </Text>
          </View>
        </View>

        {summaryMetrics.fixedIncome > 0 && (
          <View
            style={[
              styles.ratioBanner,
              {
                backgroundColor: theme.colors.bg.surfaceSubtle,
                borderRadius: theme.radii.sm,
                marginTop: theme.spacing.md,
              },
            ]}
          >
            <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>
              Part des revenus engagée :{' '}
              <Text style={{ color: theme.colors.text.primary, fontWeight: '700' }}>
                {summaryMetrics.ratioCommitment}%
              </Text>
            </Text>
          </View>
        )}
      </Card>

      {/* Manual Process Button */}
      <Pressable
        onPress={handleApplyNow}
        style={({ pressed }) => [
          styles.applyBtn,
          {
            backgroundColor: theme.colors.bg.surfaceSubtle,
            borderColor: theme.colors.border.subtle,
            borderRadius: theme.radii.md,
            opacity: pressed ? 0.8 : 1,
            marginVertical: theme.spacing.md,
          },
        ]}
      >
        <CheckCircle size={16} color={theme.colors.pillar.savings} />
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.text.primary, fontWeight: '600', marginLeft: 8 },
          ]}
        >
          Appliquer les récurrences au mois en cours
        </Text>
      </Pressable>

      {/* Filter Tabs */}
      <View style={styles.filterTabsRow}>
        <Pill
          label="Toutes"
          count={recurring.length}
          isActive={activeTab === 'all'}
          onPress={() => setActiveTab('all')}
        />
        <Pill
          label="Dépenses fixes"
          count={recurring.filter((r) => r.type === 'expense').length}
          isActive={activeTab === 'expense'}
          accentColor={theme.colors.status.overrun}
          onPress={() => setActiveTab('expense')}
        />
        <Pill
          label="Revenus fixes"
          count={recurring.filter((r) => r.type === 'income').length}
          isActive={activeTab === 'income'}
          accentColor={theme.colors.status.income}
          onPress={() => setActiveTab('income')}
        />
      </View>

      {/* Recurring Items List */}
      {filteredItems.length === 0 ? (
        <Card style={styles.emptyCard} variant="subtle">
          <Repeat size={40} color={theme.colors.text.muted} />
          <Text
            style={[
              theme.typography.title2,
              { color: theme.colors.text.primary, marginTop: 12 },
            ]}
          >
            Aucune récurrence configurée
          </Text>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.text.secondary, marginTop: 4, textAlign: 'center' },
            ]}
          >
            Ajoutez vos abonnements, loyer, factures ou salaire pour automatiser votre gestion budgétaire.
          </Text>
        </Card>
      ) : (
        <View style={styles.itemsList}>
          {filteredItems.map((item) => {
            const isIncome = item.type === 'income';

            return (
              <Card
                key={item.id}
                onPress={() => openEditModal(item)}
                style={styles.itemCard}
                padded={false}
              >
                <View style={styles.itemContent}>
                  <View style={styles.itemLeft}>
                    <View style={styles.itemTitleRow}>
                      <Text
                        style={[
                          theme.typography.bodyLarge,
                          {
                            color: item.isActive
                              ? theme.colors.text.primary
                              : theme.colors.text.muted,
                            fontWeight: '600',
                          },
                        ]}
                      >
                        {item.title}
                      </Text>

                      {!isIncome && item.pillarId && (
                        <View
                          style={[
                            styles.miniPillarBadge,
                            {
                              backgroundColor: getPillarColor(item.pillarId),
                              borderRadius: theme.radii.full,
                            },
                          ]}
                        >
                          <Text style={styles.miniPillarText}>
                            {item.pillarId === 'needs'
                              ? 'Besoins'
                              : item.pillarId === 'wants'
                              ? 'Envies'
                              : 'Épargne'}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.itemSubtitleRow}>
                      <Calendar size={12} color={theme.colors.text.secondary} />
                      <Text
                        style={[
                          theme.typography.caption,
                          { color: theme.colors.text.secondary, marginLeft: 4 },
                        ]}
                      >
                        Le {item.dayOfMonth} du mois · {item.category}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemRight}>
                    <Text
                      style={[
                        theme.typography.bodyLarge,
                        theme.typography.tabularNums,
                        {
                          color: isIncome
                            ? theme.colors.status.income
                            : theme.colors.text.primary,
                          fontWeight: '700',
                          opacity: item.isActive ? 1 : 0.4,
                        },
                      ]}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(item.amount, currency)}
                    </Text>

                    <Switch
                      value={item.isActive}
                      onValueChange={(val) => handleToggleActive(item, val)}
                      trackColor={{
                        false: theme.colors.border.subtle,
                        true: theme.colors.pillar.savings,
                      }}
                      thumbColor="#FFFFFF"
                      style={styles.switch}
                    />
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* Add / Edit Recurrence Modal */}
      {modalVisible && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
            <Pressable
              style={[
                styles.formSheet,
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
                  {editingItem ? 'Modifier la charge' : 'Nouvelle récurrence'}
                </Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <X size={20} color={theme.colors.text.secondary} />
                </Pressable>
              </View>

              {/* Type Switcher */}
              <View style={styles.typeRow}>
                <Pressable
                  onPress={() => setFormType('expense')}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor:
                        formType === 'expense'
                          ? theme.colors.status.overrun
                          : theme.colors.bg.surfaceSubtle,
                      borderRadius: theme.radii.md,
                    },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: formType === 'expense' ? '#FFF' : theme.colors.text.secondary, fontWeight: '700' },
                    ]}
                  >
                    Dépense fixe
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setFormType('income')}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor:
                        formType === 'income'
                          ? theme.colors.status.income
                          : theme.colors.bg.surfaceSubtle,
                      borderRadius: theme.radii.md,
                    },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: formType === 'income' ? '#FFF' : theme.colors.text.secondary, fontWeight: '700' },
                    ]}
                  >
                    Revenu fixe
                  </Text>
                </Pressable>
              </View>

              {/* Form Inputs */}
              <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, marginTop: 12, marginBottom: 4 }]}>
                Titre
              </Text>
              <TextInput
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="ex: Loyer, Spotify, Salaire..."
                placeholderTextColor={theme.colors.text.muted}
                style={[
                  styles.formInput,
                  {
                    backgroundColor: theme.colors.bg.surfaceSubtle,
                    borderColor: theme.colors.border.subtle,
                    color: theme.colors.text.primary,
                    borderRadius: theme.radii.md,
                  },
                ]}
              />

              <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, marginTop: 12, marginBottom: 4 }]}>
                Montant ({currency})
              </Text>
              <TextInput
                value={formAmount}
                onChangeText={setFormAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={theme.colors.text.muted}
                style={[
                  styles.formInput,
                  {
                    backgroundColor: theme.colors.bg.surfaceSubtle,
                    borderColor: theme.colors.border.subtle,
                    color: theme.colors.text.primary,
                    borderRadius: theme.radii.md,
                  },
                ]}
              />

              <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, marginTop: 12, marginBottom: 4 }]}>
                Jour de prélèvement / versement (1 - 31)
              </Text>
              <TextInput
                value={formDay}
                onChangeText={setFormDay}
                keyboardType="number-pad"
                placeholder="5"
                placeholderTextColor={theme.colors.text.muted}
                style={[
                  styles.formInput,
                  {
                    backgroundColor: theme.colors.bg.surfaceSubtle,
                    borderColor: theme.colors.border.subtle,
                    color: theme.colors.text.primary,
                    borderRadius: theme.radii.md,
                  },
                ]}
              />

              {formType === 'expense' && (
                <>
                  <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, marginTop: 12, marginBottom: 6 }]}>
                    Pilier 50/30/20
                  </Text>
                  <View style={styles.pillarRow}>
                    <Pressable
                      onPress={() => setFormPillar('needs')}
                      style={[
                        styles.pillarChoice,
                        {
                          backgroundColor:
                            formPillar === 'needs'
                              ? theme.colors.pillar.needs
                              : theme.colors.bg.surfaceSubtle,
                          borderRadius: theme.radii.sm,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          theme.typography.caption,
                          { color: formPillar === 'needs' ? '#FFF' : theme.colors.text.secondary, fontWeight: '700' },
                        ]}
                      >
                        Besoins
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setFormPillar('wants')}
                      style={[
                        styles.pillarChoice,
                        {
                          backgroundColor:
                            formPillar === 'wants'
                              ? theme.colors.pillar.wants
                              : theme.colors.bg.surfaceSubtle,
                          borderRadius: theme.radii.sm,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          theme.typography.caption,
                          { color: formPillar === 'wants' ? '#FFF' : theme.colors.text.secondary, fontWeight: '700' },
                        ]}
                      >
                        Envies
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setFormPillar('savings')}
                      style={[
                        styles.pillarChoice,
                        {
                          backgroundColor:
                            formPillar === 'savings'
                              ? theme.colors.pillar.savings
                              : theme.colors.bg.surfaceSubtle,
                          borderRadius: theme.radii.sm,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          theme.typography.caption,
                          { color: formPillar === 'savings' ? '#FFF' : theme.colors.text.secondary, fontWeight: '700' },
                        ]}
                      >
                        Épargne
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                {editingItem && (
                  <Pressable
                    onPress={() => handleDelete(editingItem)}
                    style={[
                      styles.modalDeleteBtn,
                      {
                        backgroundColor: theme.colors.status.overrunBg,
                        borderRadius: theme.radii.md,
                      },
                    ]}
                  >
                    <Trash2 size={18} color={theme.colors.status.overrun} />
                  </Pressable>
                )}

                <Pressable
                  onPress={handleSaveForm}
                  style={[
                    styles.modalSaveBtn,
                    {
                      backgroundColor: theme.colors.pillar.savings,
                      borderRadius: theme.radii.md,
                    },
                  ]}
                >
                  <Text style={[theme.typography.body, { color: '#FFF', fontWeight: '700' }]}>
                    {editingItem ? 'Mettre à jour' : 'Ajouter'}
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  summaryCard: {
    marginBottom: 12,
  },
  summaryColumns: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    marginHorizontal: 16,
  },
  ratioBanner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
    flexWrap: 'wrap',
  },
  itemsList: {
    gap: 8,
  },
  itemCard: {
    marginVertical: 2,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  itemLeft: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniPillarBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  miniPillarText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  itemSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginTop: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  formSheet: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formInput: {
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 15,
  },
  pillarRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  pillarChoice: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalDeleteBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtn: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
