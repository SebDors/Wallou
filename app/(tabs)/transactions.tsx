import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TextInput,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  X,
  Receipt,
  Trash2,
  Edit3,
  PlusCircle,
  Home,
  Coffee,
  PiggyBank,
  ArrowUpCircle,
  RotateCcw,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useBudget } from '../../src/context/BudgetContext';
import { useQuickEntry } from '../../src/context/QuickEntryContext';
import { useLocalSearchParams } from 'expo-router';
import { Pill } from '../../src/components/Pill';
import { Card } from '../../src/components/Card';
import { SwipeableTransactionRow } from '../../src/components/SwipeableTransactionRow';
import { TransactionDetailModal } from '../../src/components/TransactionDetailModal';
import { useDialog } from '../../src/context/DialogContext';
import { formatCurrency } from '../../src/services/budgetEngine';
import { PillarId, Transaction } from '../../src/types/budget';

type FilterType = 'all' | 'needs' | 'wants' | 'savings' | 'income';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ filter?: string }>();
  const { transactions, deleteTransaction, updateTransaction, settings } = useBudget();
  const { openQuickEntry } = useQuickEntry();
  const { showConfirm } = useDialog();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>(() => {
    if (params.filter && ['all', 'needs', 'wants', 'savings', 'income'].includes(params.filter)) {
      return params.filter as FilterType;
    }
    return 'all';
  });

  useEffect(() => {
    if (params.filter && ['all', 'needs', 'wants', 'savings', 'income'].includes(params.filter)) {
      setActiveFilter(params.filter as FilterType);
    }
  }, [params.filter]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [startEditing, setStartEditing] = useState(false);

  const currency = settings?.currency || '€';

  // Counts for pills
  const counts = useMemo(() => {
    return {
      all: transactions.length,
      needs: transactions.filter((t) => t.pillarId === 'needs').length,
      wants: transactions.filter((t) => t.pillarId === 'wants').length,
      savings: transactions.filter((t) => t.pillarId === 'savings').length,
      income: transactions.filter((t) => t.type === 'income').length,
    };
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Filter by type / pillar
    if (activeFilter === 'needs') {
      result = result.filter((t) => t.pillarId === 'needs');
    } else if (activeFilter === 'wants') {
      result = result.filter((t) => t.pillarId === 'wants');
    } else if (activeFilter === 'savings') {
      result = result.filter((t) => t.pillarId === 'savings');
    } else if (activeFilter === 'income') {
      result = result.filter((t) => t.type === 'income');
    }

    // Filter by search query (safe case-insensitive match)
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          String(t.amount).includes(q)
      );
    }

    // Chronological order: newest first
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, activeFilter, searchQuery]);

  // Group by date
  const groupedSections = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const groupMap = new Map<string, Transaction[]>();

    for (const tx of filteredTransactions) {
      const txDateStr = tx.date ? tx.date.slice(0, 10) : todayStr;
      let label: string;

      if (txDateStr === todayStr) {
        label = "Aujourd'hui";
      } else if (txDateStr === yesterdayStr) {
        label = 'Hier';
      } else {
        const d = new Date(txDateStr);
        label = d.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }

      if (!groupMap.has(label)) {
        groupMap.set(label, []);
      }
      groupMap.get(label)!.push(tx);
    }

    const sections: { title: string; data: Transaction[] }[] = [];
    for (const [title, data] of groupMap.entries()) {
      sections.push({ title, data });
    }
    return sections;
  }, [filteredTransactions]);

  const handleOpenDetail = (tx: Transaction, editMode = false) => {
    setSelectedTx(tx);
    setStartEditing(editMode);
  };

  const getPillarIcon = (tx: Transaction) => {
    if (tx.type === 'income') {
      return <ArrowUpCircle size={18} color={theme.colors.status.income} />;
    }
    if (tx.type === 'refund') {
      return <RotateCcw size={18} color={theme.colors.pillar.savings} />;
    }
    switch (tx.pillarId) {
      case 'needs':
        return <Home size={18} color={theme.colors.pillar.needs} />;
      case 'wants':
        return <Coffee size={18} color={theme.colors.pillar.wants} />;
      case 'savings':
        return <PiggyBank size={18} color={theme.colors.pillar.savings} />;
      default:
        return <Home size={18} color={theme.colors.pillar.needs} />;
    }
  };

  const getPillarColor = (tx: Transaction) => {
    if (tx.type === 'income') return theme.colors.status.income;
    if (tx.type === 'refund') return theme.colors.pillar.savings;
    switch (tx.pillarId) {
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
    <View style={[styles.container, { backgroundColor: theme.colors.bg.canvas }]}>
      {/* Top Header & Search Bar */}
      <View
        style={[
          styles.topContainer,
          {
            paddingTop: insets.top + theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
      >
        <Text
          style={[
            theme.typography.title1,
            { color: theme.colors.text.primary, marginBottom: theme.spacing.md },
          ]}
        >
          Opérations
        </Text>

        {/* Search Input */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.colors.bg.surfaceSubtle,
              borderColor: theme.colors.border.subtle,
              borderRadius: theme.radii.md,
            },
          ]}
        >
          <Search size={18} color={theme.colors.text.muted} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher une opération..."
            placeholderTextColor={theme.colors.text.muted}
            style={[
              styles.searchInput,
              { color: theme.colors.text.primary },
            ]}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <X size={16} color={theme.colors.text.muted} />
            </Pressable>
          )}
        </View>

        {/* Filter Pills Scroll */}
        <View style={styles.pillsRow}>
          <Pill
            label="Tous"
            count={counts.all}
            isActive={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
          />
          <Pill
            label="Besoins (50%)"
            count={counts.needs}
            isActive={activeFilter === 'needs'}
            accentColor={theme.colors.pillar.needs}
            onPress={() => setActiveFilter('needs')}
          />
          <Pill
            label="Envies (30%)"
            count={counts.wants}
            isActive={activeFilter === 'wants'}
            accentColor={theme.colors.pillar.wants}
            onPress={() => setActiveFilter('wants')}
          />
          <Pill
            label="Épargne (20%)"
            count={counts.savings}
            isActive={activeFilter === 'savings'}
            accentColor={theme.colors.pillar.savings}
            onPress={() => setActiveFilter('savings')}
          />
          <Pill
            label="Revenus"
            count={counts.income}
            isActive={activeFilter === 'income'}
            accentColor={theme.colors.status.income}
            onPress={() => setActiveFilter('income')}
          />
        </View>
      </View>

      {/* Grouped Chronological List */}
      <SectionList
        sections={groupedSections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: insets.bottom + 80,
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section: { title } }) => (
          <View
            style={[
              styles.sectionHeader,
              { backgroundColor: theme.colors.bg.canvas },
            ]}
          >
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.text.secondary, fontWeight: '700', textTransform: 'uppercase' },
              ]}
            >
              {title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const isIncome = item.type === 'income';
          const isRefund = item.type === 'refund';
          const hasRefund =
            item.type === 'expense' && Boolean(item.refundedAmount && item.refundedAmount > 0);

          return (
            <SwipeableTransactionRow
              onPress={() => handleOpenDetail(item, false)}
              onSwipeRightEdit={() => handleOpenDetail(item, true)}
              onSwipeLeftDelete={() => {
                showConfirm(
                  'Supprimer cette opération ?',
                  `Êtes-vous sûr de vouloir supprimer "${item.title}" (${formatCurrency(item.amount, currency)}) ?`,
                  async () => {
                    await deleteTransaction(item.id);
                  },
                  'Supprimer',
                  true
                );
              }}
            >
              <Card
                style={styles.txCard}
                padded={false}
              >
                <View style={styles.txRow}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: theme.colors.bg.surfaceSubtle,
                        borderRadius: theme.radii.sm,
                      },
                    ]}
                  >
                    {getPillarIcon(item)}
                  </View>

                  <View style={styles.txInfo}>
                    <Text
                      style={[
                        theme.typography.body,
                        { color: theme.colors.text.primary, fontWeight: '600' },
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    {item.type === 'expense' && Boolean(item.refundedAmount && item.refundedAmount > 0) && (
                      <View
                        style={[
                          styles.refundBadge,
                          {
                            backgroundColor: theme.colors.pillar.savingsBg,
                            borderColor: theme.colors.pillar.savings,
                            borderRadius: theme.radii.sm,
                          },
                        ]}
                      >
                        <RotateCcw size={10} color={theme.colors.pillar.savings} style={{ marginRight: 4 }} />
                        <Text
                          style={[
                            theme.typography.caption,
                            theme.typography.tabularNums,
                            {
                              color: theme.colors.pillar.savings,
                              fontWeight: '600',
                              fontSize: 11,
                            },
                          ]}
                        >
                          Remboursé : {formatCurrency(item.refundedAmount || 0, currency)} (net : {formatCurrency(Math.max(0, item.amount - (item.refundedAmount || 0)), currency)})
                        </Text>
                      </View>
                    )}
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.text.secondary, marginTop: 2 },
                      ]}
                    >
                      {isRefund ? `Remboursement • ${item.category}` : item.category}
                    </Text>
                  </View>

                  <Text
                    style={[
                      theme.typography.bodyLarge,
                      theme.typography.tabularNums,
                      {
                        color: isIncome
                          ? theme.colors.status.income
                          : isRefund
                          ? theme.colors.pillar.savings
                          : theme.colors.text.primary,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {isIncome || isRefund ? '+' : '-'}
                    {formatCurrency(item.amount, currency)}
                  </Text>
                </View>
              </Card>
            </SwipeableTransactionRow>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Receipt size={48} color={theme.colors.text.muted} />
            <Text
              style={[
                theme.typography.title2,
                { color: theme.colors.text.primary, marginTop: 12 },
              ]}
            >
              Aucune opération trouvée
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.text.secondary, marginTop: 4, textAlign: 'center' },
              ]}
            >
              {searchQuery
                ? `Aucun résultat pour "${searchQuery}"`
                : 'Ajoutez une opération pour commencer votre suivi.'}
            </Text>
            <Pressable
              onPress={openQuickEntry}
              style={[
                styles.emptyActionBtn,
                {
                  backgroundColor: theme.colors.pillar.savings,
                  borderRadius: theme.radii.full,
                  marginTop: theme.spacing.lg,
                },
              ]}
            >
              <PlusCircle size={18} color="#FFFFFF" />
              <Text
                style={[
                  theme.typography.body,
                  { color: '#FFFFFF', fontWeight: '700', marginLeft: 8 },
                ]}
              >
                Ajouter une dépense
              </Text>
            </Pressable>
          </View>
        }
      />

      {/* Transaction Details / Edit Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        visible={Boolean(selectedTx)}
        startEditing={startEditing}
        onClose={() => {
          setSelectedTx(null);
          setStartEditing(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topContainer: {
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  clearBtn: {
    padding: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  listContent: {
    paddingTop: 8,
  },
  sectionHeader: {
    paddingVertical: 8,
    marginTop: 12,
  },
  txCard: {
    marginVertical: 0,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  refundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    marginTop: 3,
    marginBottom: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  detailSheet: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    padding: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailContent: {
    gap: 12,
  },
  detailRow: {
    gap: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  editBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editInput: {
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 15,
  },
  pillarPickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillarPickOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
