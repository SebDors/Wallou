import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { X, ArrowDownCircle, ArrowUpCircle, Plus, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useBudget } from '../context/BudgetContext';
import { PillarId, TransactionType, PILLAR_NAMES } from '../types/budget';
import { NumericKeypad } from './NumericKeypad';

export interface QuickEntryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const {
    addTransaction,
    settings,
    categories,
    addCategory,
    transactions,
    currentPeriodKey,
  } = useBudget();

  const [amountStr, setAmountStr] = useState<string>('0');
  const [title, setTitle] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const lastSubmitTimeRef = useRef<number>(0);

  const resetForm = useCallback(() => {
    setAmountStr('0');
    setTitle('');
    setSelectedCategory('');
    setIsAddingCategory(false);
    setNewCategoryName('');
    setTxType('expense');
    setErrorMessage(null);
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleKeyPress = (key: string) => {
    setErrorMessage(null);
    setAmountStr((prev) => {
      // Decimal point handling
      if (key === '.') {
        if (prev.includes('.')) return prev;
        return prev + '.';
      }

      // If currently '0', replace with pressed digit
      if (prev === '0') {
        return key;
      }

      // Check decimal places constraint (max 2 decimals)
      if (prev.includes('.')) {
        const parts = prev.split('.');
        if (parts[1] && parts[1].length >= 2) {
          return prev;
        }
      } else {
        // Max 7 integer digits before decimal
        if (prev.length >= 7) {
          return prev;
        }
      }

      return prev + key;
    });
  };

  const handleBackspace = () => {
    setErrorMessage(null);
    setAmountStr((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setErrorMessage(null);
    setAmountStr('0');
  };

  const handleSubmit = async (pillar?: PillarId) => {
    const now = Date.now();
    // Debounce guard: 300ms
    if (now - lastSubmitTimeRef.current < 300) {
      return;
    }
    lastSubmitTimeRef.current = now;

    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Veuillez saisir un montant supérieur à 0');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {}
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const nowIso = new Date().toISOString();
    const finalTitle =
      title.trim() ||
      (txType === 'income'
        ? 'Revenu'
        : txType === 'refund'
        ? `Remboursement ${PILLAR_NAMES[pillar || 'needs']}`
        : 'Dépense rapide');

    const effectivePillar: PillarId | undefined =
      txType === 'income'
        ? undefined
        : pillar || 'needs';

    const finalCategory =
      selectedCategory.trim() ||
      (txType === 'refund'
        ? 'Remboursement'
        : effectivePillar === 'needs'
        ? 'Besoins'
        : effectivePillar === 'wants'
        ? 'Envies'
        : effectivePillar === 'savings'
        ? 'Épargne'
        : 'Revenu');

    // Instant modal dismiss (< 50ms)
    handleClose();

    // Async add to ledger (in-memory update is synchronous inside addTransaction)
    addTransaction({
      type: txType,
      amount: parsedAmount,
      pillarId: effectivePillar,
      category: finalCategory,
      title: finalTitle,
      date: nowIso,
    }).catch((err) => {
      console.error('Failed to add transaction from QuickEntryModal:', err);
    });
  };

  const currencySymbol = settings?.currency || '€';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[
                styles.sheet,
                {
                  backgroundColor: theme.colors.bg.surface,
                  borderColor: theme.colors.border.subtle,
                  borderTopLeftRadius: theme.radii.xl,
                  borderTopRightRadius: theme.radii.xl,
                },
              ]}
            >
              {/* Drag Handle & Close Row */}
              <View style={styles.topBar}>
                <View
                  style={[
                    styles.handle,
                    { backgroundColor: theme.colors.border.subtle, borderRadius: theme.radii.full },
                  ]}
                />
                <Pressable
                  onPress={handleClose}
                  style={({ pressed }) => [
                    styles.closeBtn,
                    {
                      backgroundColor: theme.colors.bg.surfaceSubtle,
                      borderRadius: theme.radii.full,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <X size={18} color={theme.colors.text.secondary} />
                </Pressable>
              </View>

              {/* Type Switcher: Dépense vs Revenu vs Remboursement */}
              <View
                style={[
                  styles.typeSwitcher,
                  {
                    backgroundColor: theme.colors.bg.surfaceSubtle,
                    borderRadius: theme.radii.full,
                  },
                ]}
              >
                <Pressable
                  onPress={() => {
                    setTxType('expense');
                    setSelectedExpenseIds([]);
                  }}
                  style={[
                    styles.typeTab,
                    txType === 'expense' && {
                      backgroundColor: theme.colors.bg.surface,
                      borderRadius: theme.radii.full,
                      shadowColor: '#000',
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    },
                  ]}
                >
                  <ArrowDownCircle
                    size={14}
                    color={
                      txType === 'expense'
                        ? theme.colors.status.overrun
                        : theme.colors.text.muted
                    }
                  />
                  <Text
                    style={[
                      theme.typography.caption,
                      {
                        color:
                          txType === 'expense'
                            ? theme.colors.text.primary
                            : theme.colors.text.muted,
                        fontWeight: '600',
                        marginLeft: 4,
                        fontSize: 12,
                      },
                    ]}
                  >
                    Dépense
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setTxType('income');
                    setSelectedExpenseIds([]);
                  }}
                  style={[
                    styles.typeTab,
                    txType === 'income' && {
                      backgroundColor: theme.colors.bg.surface,
                      borderRadius: theme.radii.full,
                      shadowColor: '#000',
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    },
                  ]}
                >
                  <ArrowUpCircle
                    size={14}
                    color={
                      txType === 'income'
                        ? theme.colors.status.income
                        : theme.colors.text.muted
                    }
                  />
                  <Text
                    style={[
                      theme.typography.caption,
                      {
                        color:
                          txType === 'income'
                            ? theme.colors.text.primary
                            : theme.colors.text.muted,
                        fontWeight: '600',
                        marginLeft: 4,
                        fontSize: 12,
                      },
                    ]}
                  >
                    Revenu
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setTxType('refund')}
                  style={[
                    styles.typeTab,
                    txType === 'refund' && {
                      backgroundColor: theme.colors.bg.surface,
                      borderRadius: theme.radii.full,
                      shadowColor: '#000',
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    },
                  ]}
                >
                  <RotateCcw
                    size={14}
                    color={
                      txType === 'refund'
                        ? theme.colors.pillar.savings
                        : theme.colors.text.muted
                    }
                  />
                  <Text
                    style={[
                      theme.typography.caption,
                      {
                        color:
                          txType === 'refund'
                            ? theme.colors.text.primary
                            : theme.colors.text.muted,
                        fontWeight: '600',
                        marginLeft: 4,
                        fontSize: 12,
                      },
                    ]}
                  >
                    Remboursement
                  </Text>
                </Pressable>
              </View>

              {/* Displayed Amount */}
              <View style={styles.amountContainer}>
                <Text
                  style={[
                    theme.typography.display,
                    theme.typography.tabularNums,
                    {
                      color:
                        txType === 'income'
                          ? theme.colors.status.income
                          : txType === 'refund'
                          ? theme.colors.pillar.savings
                          : theme.colors.text.primary,
                      fontSize: 40,
                      fontWeight: '800',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {txType === 'refund' ? '+' : ''}{amountStr} {currencySymbol}
                </Text>
                {errorMessage ? (
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.status.overrun, marginTop: 4 },
                    ]}
                  >
                    {errorMessage}
                  </Text>
                ) : null}
              </View>

              {/* Optional Title / Note Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Note (ex: Monoprix, Restaurant...)"
                  placeholderTextColor={theme.colors.text.muted}
                  style={[
                    styles.titleInput,
                    {
                      color: theme.colors.text.primary,
                      backgroundColor: theme.colors.bg.surfaceSubtle,
                      borderColor: theme.colors.border.subtle,
                      borderRadius: theme.radii.md,
                    },
                  ]}
                />
              </View>

              {/* Category Selector Chips */}
              <View style={styles.categorySection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setSelectedCategory(isSelected ? '' : cat)}
                        style={[
                          styles.categoryChip,
                          {
                            backgroundColor: isSelected
                              ? theme.colors.pillar.savings
                              : theme.colors.bg.surfaceSubtle,
                            borderColor: isSelected
                              ? theme.colors.pillar.savings
                              : theme.colors.border.subtle,
                            borderRadius: theme.radii.full,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            theme.typography.caption,
                            {
                              color: isSelected ? '#FFFFFF' : theme.colors.text.secondary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })}

                  {/* Add custom category chip */}
                  {isAddingCategory ? (
                    <View style={styles.inlineAddCat}>
                      <TextInput
                        value={newCategoryName}
                        onChangeText={setNewCategoryName}
                        placeholder="Nom..."
                        placeholderTextColor={theme.colors.text.muted}
                        autoFocus
                        style={[
                          styles.inlineAddCatInput,
                          {
                            color: theme.colors.text.primary,
                            borderColor: theme.colors.border.subtle,
                            borderRadius: theme.radii.full,
                            backgroundColor: theme.colors.bg.surfaceSubtle,
                          },
                        ]}
                      />
                      <Pressable
                        onPress={async () => {
                          const trimmed = newCategoryName.trim();
                          if (trimmed) {
                            await addCategory(trimmed);
                            setSelectedCategory(trimmed);
                          }
                          setNewCategoryName('');
                          setIsAddingCategory(false);
                        }}
                        style={[
                          styles.inlineAddCatBtn,
                          {
                            backgroundColor: theme.colors.pillar.savings,
                            borderRadius: theme.radii.full,
                          },
                        ]}
                      >
                        <Plus size={14} color="#FFFFFF" />
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setNewCategoryName('');
                          setIsAddingCategory(false);
                        }}
                        style={[
                          styles.inlineAddCatCancelBtn,
                          {
                            backgroundColor: theme.colors.bg.surfaceSubtle,
                            borderRadius: theme.radii.full,
                          },
                        ]}
                      >
                        <X size={14} color={theme.colors.text.muted} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => setIsAddingCategory(true)}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: theme.colors.bg.surfaceSubtle,
                          borderColor: theme.colors.border.subtle,
                          borderRadius: theme.radii.full,
                          flexDirection: 'row',
                          alignItems: 'center',
                        },
                      ]}
                    >
                      <Plus size={12} color={theme.colors.text.secondary} style={{ marginRight: 4 }} />
                      <Text
                        style={[
                          theme.typography.caption,
                          { color: theme.colors.text.secondary, fontWeight: '600' },
                        ]}
                      >
                        Ajouter
                      </Text>
                    </Pressable>
                  )}
                </ScrollView>
              </View>

              {/* Custom Numeric Keypad (Tap 1) */}
              <View style={styles.keypadWrapper}>
                <NumericKeypad
                  onKeyPress={handleKeyPress}
                  onBackspace={handleBackspace}
                  onClear={handleClear}
                />
              </View>

              {/* 2nd Tap Attribution Buttons */}
              {txType === 'expense' ? (
                <View style={styles.pillarActionsRow}>
                  <Pressable
                    onPress={() => handleSubmit('needs')}
                    style={({ pressed }) => [
                      styles.pillarButton,
                      {
                        backgroundColor: theme.colors.pillar.needs,
                        borderRadius: theme.radii.lg,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.pillarBtnPercent}>
                      {settings?.ratios?.needs ?? 50}%
                    </Text>
                    <Text style={styles.pillarBtnLabel}>Besoins</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleSubmit('wants')}
                    style={({ pressed }) => [
                      styles.pillarButton,
                      {
                        backgroundColor: theme.colors.pillar.wants,
                        borderRadius: theme.radii.lg,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.pillarBtnPercent}>
                      {settings?.ratios?.wants ?? 30}%
                    </Text>
                    <Text style={styles.pillarBtnLabel}>Envies</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleSubmit('savings')}
                    style={({ pressed }) => [
                      styles.pillarButton,
                      {
                        backgroundColor: theme.colors.pillar.savings,
                        borderRadius: theme.radii.lg,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.pillarBtnPercent}>
                      {settings?.ratios?.savings ?? 20}%
                    </Text>
                    <Text style={styles.pillarBtnLabel}>Épargne</Text>
                  </Pressable>
                </View>
              ) : txType === 'refund' ? (
                <View style={styles.pillarActionsRow}>
                  <Pressable
                    onPress={() => handleSubmit('needs')}
                    style={({ pressed }) => [
                      styles.pillarButton,
                      {
                        backgroundColor: theme.colors.pillar.needs,
                        borderRadius: theme.radii.lg,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <RotateCcw size={16} color="#FFFFFF" />
                    <Text style={[styles.pillarBtnLabel, { marginTop: 4 }]}>Besoins</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleSubmit('wants')}
                    style={({ pressed }) => [
                      styles.pillarButton,
                      {
                        backgroundColor: theme.colors.pillar.wants,
                        borderRadius: theme.radii.lg,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <RotateCcw size={16} color="#FFFFFF" />
                    <Text style={[styles.pillarBtnLabel, { marginTop: 4 }]}>Envies</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleSubmit('savings')}
                    style={({ pressed }) => [
                      styles.pillarButton,
                      {
                        backgroundColor: theme.colors.pillar.savings,
                        borderRadius: theme.radii.lg,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <RotateCcw size={16} color="#FFFFFF" />
                    <Text style={[styles.pillarBtnLabel, { marginTop: 4 }]}>Épargne</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.singleActionRow}>
                  <Pressable
                    onPress={() => handleSubmit(undefined)}
                    style={({ pressed }) => [
                      styles.incomeButton,
                      {
                        backgroundColor: theme.colors.status.income,
                        borderRadius: theme.radii.lg,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.incomeBtnText}>Enregistrer le revenu</Text>
                  </Pressable>
                </View>
              )}
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 28,
  },
  handle: {
    width: 36,
    height: 4,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSwitcher: {
    flexDirection: 'row',
    alignSelf: 'center',
    padding: 3,
    marginTop: 8,
    width: 330,
    maxWidth: '100%',
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  amountContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  inputContainer: {
    marginBottom: 10,
  },
  titleInput: {
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 14,
  },
  keypadWrapper: {
    marginBottom: 14,
  },
  pillarActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillarButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarBtnPercent: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  pillarBtnLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  singleActionRow: {
    width: '100%',
  },
  incomeButton: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  categorySection: {
    marginBottom: 10,
    height: 36,
  },
  categoryScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineAddCat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineAddCatInput: {
    height: 32,
    paddingHorizontal: 10,
    fontSize: 12,
    borderWidth: 1,
    minWidth: 90,
  },
  inlineAddCatBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineAddCatCancelBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
