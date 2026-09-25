import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Trash2, Edit3, Home, Coffee, PiggyBank, ArrowUpCircle, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useBudget } from '../context/BudgetContext';
import { useDialog } from '../context/DialogContext';
import { formatCurrency } from '../services/budgetEngine';
import { PillarId, Transaction, PILLAR_NAMES } from '../types/budget';

export interface TransactionDetailModalProps {
  transaction: Transaction | null;
  visible: boolean;
  onClose: () => void;
  startEditing?: boolean;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  visible,
  onClose,
  startEditing = false,
}) => {
  const { theme } = useTheme();
  const { updateTransaction, deleteTransaction, settings } = useBudget();
  const { showConfirm, showError } = useDialog();

  const [isEditing, setIsEditing] = useState(startEditing);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editPillar, setEditPillar] = useState<PillarId>('needs');

  React.useEffect(() => {
    if (transaction) {
      setEditTitle(transaction.title);
      setEditAmount(String(transaction.amount));
      setEditPillar(transaction.pillarId || 'needs');
      setIsEditing(startEditing);
    }
  }, [transaction, startEditing, visible]);

  if (!transaction) return null;

  const currency = settings?.currency || '€';
  const isIncome = transaction.type === 'income';
  const isRefund = transaction.type === 'refund';

  const getPillarColor = () => {
    if (isIncome) return theme.colors.status.income;
    if (isRefund) return theme.colors.pillar.savings;
    switch (transaction.pillarId) {
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

  const getPillarIcon = () => {
    if (isIncome) return <ArrowUpCircle size={20} color={theme.colors.status.income} />;
    if (isRefund) return <RotateCcw size={20} color={theme.colors.pillar.savings} />;
    switch (transaction.pillarId) {
      case 'needs':
        return <Home size={20} color={theme.colors.pillar.needs} />;
      case 'wants':
        return <Coffee size={20} color={theme.colors.pillar.wants} />;
      case 'savings':
        return <PiggyBank size={20} color={theme.colors.pillar.savings} />;
      default:
        return <Home size={20} color={theme.colors.pillar.needs} />;
    }
  };

  const handleDelete = () => {
    showConfirm(
      'Supprimer cette opération ?',
      `Êtes-vous sûr de vouloir supprimer "${transaction.title}" (${formatCurrency(transaction.amount, currency)}) ?`,
      async () => {
        await deleteTransaction(transaction.id);
        onClose();
      },
      'Supprimer',
      true
    );
  };

  const handleSaveEdit = async () => {
    const parsed = parseFloat(editAmount.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      showError('Montant invalide', 'Veuillez saisir un montant positif.');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    await updateTransaction({
      ...transaction,
      title: editTitle.trim() || transaction.title,
      amount: parsed,
      pillarId: transaction.type !== 'income' ? editPillar : undefined,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
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
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={styles.headerTitleGroup}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: theme.colors.bg.surfaceSubtle, borderRadius: theme.radii.full },
                    ]}
                  >
                    {getPillarIcon()}
                  </View>
                  <Text style={[theme.typography.title2, { color: theme.colors.text.primary, marginLeft: 10 }]}>
                    {isEditing ? "Modifier l'opération" : "Détail de l'opération"}
                  </Text>
                </View>

                <Pressable onPress={onClose} style={styles.closeBtn}>
                  <X size={20} color={theme.colors.text.secondary} />
                </Pressable>
              </View>

              {!isEditing ? (
                /* View Mode */
                <View style={styles.content}>
                  <View style={styles.detailRow}>
                    <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>Titre</Text>
                    <Text style={[theme.typography.bodyLarge, { color: theme.colors.text.primary, fontWeight: '600' }]}>
                      {transaction.title}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>Montant</Text>
                    <Text
                      style={[
                        theme.typography.title1,
                        theme.typography.tabularNums,
                        {
                          color: isIncome
                            ? theme.colors.status.income
                            : isRefund
                            ? theme.colors.pillar.savings
                            : theme.colors.text.primary,
                        },
                      ]}
                    >
                      {isIncome || isRefund ? '+' : '-'}
                      {formatCurrency(transaction.amount, currency)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>Type / Pilier</Text>
                    <Text style={[theme.typography.body, { color: getPillarColor(), fontWeight: '600' }]}>
                      {isIncome
                        ? 'Revenu'
                        : isRefund
                        ? `Remboursement (${PILLAR_NAMES[transaction.pillarId || 'wants']})`
                        : transaction.pillarId === 'needs'
                        ? 'Besoins (50%)'
                        : transaction.pillarId === 'wants'
                        ? 'Envies (30%)'
                        : 'Épargne (20%)'}
                    </Text>
                  </View>

                  {/* If expense has a refund applied */}
                  {transaction.type === 'expense' && Boolean(transaction.refundedAmount && transaction.refundedAmount > 0) && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>Montant remboursé</Text>
                        <Text style={[theme.typography.body, { color: theme.colors.pillar.savings, fontWeight: '700' }]}>
                          +{formatCurrency(transaction.refundedAmount || 0, currency)}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>Reste à votre charge</Text>
                        <Text style={[theme.typography.bodyLarge, { color: theme.colors.text.primary, fontWeight: '700' }]}>
                          {formatCurrency(Math.max(0, transaction.amount - (transaction.refundedAmount || 0)), currency)}
                        </Text>
                      </View>
                    </>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>Date</Text>
                    <Text style={[theme.typography.body, { color: theme.colors.text.primary }]}>
                      {new Date(transaction.date).toLocaleString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  <View style={styles.actionsRow}>
                    <Pressable
                      onPress={() => setIsEditing(true)}
                      style={[
                        styles.actionButton,
                        { backgroundColor: theme.colors.bg.surfaceSubtle, borderRadius: theme.radii.md },
                      ]}
                    >
                      <Edit3 size={16} color={theme.colors.text.primary} />
                      <Text style={[theme.typography.body, { color: theme.colors.text.primary, fontWeight: '600', marginLeft: 6 }]}>
                        Modifier
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={handleDelete}
                      style={[
                        styles.actionButton,
                        { backgroundColor: theme.colors.status.overrunBg, borderRadius: theme.radii.md },
                      ]}
                    >
                      <Trash2 size={16} color={theme.colors.status.overrun} />
                      <Text style={[theme.typography.body, { color: theme.colors.status.overrun, fontWeight: '600', marginLeft: 6 }]}>
                        Supprimer
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                /* Edit Mode */
                <View style={styles.content}>
                  <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, marginBottom: 4 }]}>
                    Titre
                  </Text>
                  <TextInput
                    value={editTitle}
                    onChangeText={setEditTitle}
                    style={[
                      styles.input,
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
                    value={editAmount}
                    onChangeText={setEditAmount}
                    keyboardType="numeric"
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.bg.surfaceSubtle,
                        borderColor: theme.colors.border.subtle,
                        color: theme.colors.text.primary,
                        borderRadius: theme.radii.md,
                      },
                    ]}
                  />

                  {!isIncome && (
                    <>
                      <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, marginTop: 12, marginBottom: 6 }]}>
                        Pilier
                      </Text>
                      <View style={styles.pillarPickerRow}>
                        <Pressable
                          onPress={() => setEditPillar('needs')}
                          style={[
                            styles.pillarOption,
                            {
                              backgroundColor:
                                editPillar === 'needs' ? theme.colors.pillar.needs : theme.colors.bg.surfaceSubtle,
                              borderRadius: theme.radii.sm,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              theme.typography.caption,
                              { color: editPillar === 'needs' ? '#FFF' : theme.colors.text.secondary, fontWeight: '700' },
                            ]}
                          >
                            Besoins
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() => setEditPillar('wants')}
                          style={[
                            styles.pillarOption,
                            {
                              backgroundColor:
                                editPillar === 'wants' ? theme.colors.pillar.wants : theme.colors.bg.surfaceSubtle,
                              borderRadius: theme.radii.sm,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              theme.typography.caption,
                              { color: editPillar === 'wants' ? '#FFF' : theme.colors.text.secondary, fontWeight: '700' },
                            ]}
                          >
                            Envies
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() => setEditPillar('savings')}
                          style={[
                            styles.pillarOption,
                            {
                              backgroundColor:
                                editPillar === 'savings' ? theme.colors.pillar.savings : theme.colors.bg.surfaceSubtle,
                              borderRadius: theme.radii.sm,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              theme.typography.caption,
                              { color: editPillar === 'savings' ? '#FFF' : theme.colors.text.secondary, fontWeight: '700' },
                            ]}
                          >
                            Épargne
                          </Text>
                        </Pressable>
                      </View>
                    </>
                  )}

                  <View style={[styles.actionsRow, { marginTop: 20 }]}>
                    <Pressable
                      onPress={() => setIsEditing(false)}
                      style={[
                        styles.actionButton,
                        { backgroundColor: theme.colors.bg.surfaceSubtle, borderRadius: theme.radii.md },
                      ]}
                    >
                      <Text style={[theme.typography.body, { color: theme.colors.text.secondary }]}>Annuler</Text>
                    </Pressable>

                    <Pressable
                      onPress={handleSaveEdit}
                      style={[
                        styles.actionButton,
                        { backgroundColor: theme.colors.pillar.savings, borderRadius: theme.radii.md },
                      ]}
                    >
                      <Text style={[theme.typography.body, { color: '#FFF', fontWeight: '700' }]}>Enregistrer</Text>
                    </Pressable>
                  </View>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    padding: 20,
    borderTopWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 6,
  },
  content: {
    gap: 12,
  },
  detailRow: {
    paddingVertical: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  pillarPickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillarOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
});
