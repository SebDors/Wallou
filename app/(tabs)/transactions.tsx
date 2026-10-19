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
  ScrollView,
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
  Tag,
  Calculator,
  Check,
  CheckSquare,
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
import { formatCurrency, round2 } from '../../src/services/budgetEngine';
import { PillarId, Transaction } from '../../src/types/budget';

type FilterType = 'all' | 'needs' | 'wants' | 'savings' | 'income';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ filter?: string }>();
  const { transactions, deleteTransaction, updateTransaction, settings, categories } = useBudget();
  const { openQuickEntry } = useQuickEntry();
  const { showConfirm, showError } = useDialog();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>(() => {
    if (params.filter && ['all', 'needs', 'wants', 'savings', 'income'].includes(params.filter)) {
      return params.filter as FilterType;
    }
    return 'all';
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [refundPercent, setRefundPercent] = useState('50');

  useEffect(() => {
    if (params.filter && ['all', 'needs', 'wants', 'savings', 'income'].includes(params.filter)) {
      setActiveFilter(params.filter as FilterType);
    }
  }, [params.filter]);

  const handleFilterPress = (filter: FilterType) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (filter === 'all' || activeFilter === filter) {
      setActiveFilter('all');
    } else {
      setActiveFilter(filter);
    }
  };

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [startEditing, setStartEditing] = useState(false);

  const currency = settings?.currency || '€';

  // Counts for pills (excluding phantom refund transactions)
  const counts = useMemo(() => {
    const valid = transactions.filter((t) => t.type !== 'refund');
    return {
      all: valid.length,
      needs: valid.filter((t) => t.pillarId === 'needs').length,
      wants: valid.filter((t) => t.pillarId === 'wants').length,
      savings: valid.filter((t) => t.pillarId === 'savings').length,
      income: valid.filter((t) => t.type === 'income').length,
    };
  }, [transactions]);

  // Available categories strictly matching user-defined categories from Settings
  const availableCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];

    let base = transactions.filter((t) => t.type !== 'refund');
    if (activeFilter === 'needs') {
      base = base.filter((t) => t.pillarId === 'needs');
    } else if (activeFilter === 'wants') {
      base = base.filter((t) => t.pillarId === 'wants');
    } else if (activeFilter === 'savings') {
      base = base.filter((t) => t.pillarId === 'savings');
    } else if (activeFilter === 'income') {
      base = base.filter((t) => t.type === 'income');
    }

    return categories
      .map((catName) => {
        const clean = (catName || '').trim();
        const count = base.filter(
          (t) => (t.category || '').toLowerCase().trim() === clean.toLowerCase()
        ).length;
        return { name: clean, count };
      })
      .filter((c) => c.name.length > 0);
  }, [categories, transactions, activeFilter]);

  // If selected category is no longer present in available categories, reset to all
  useEffect(() => {
    if (selectedCategory && !availableCategories.some((c) => c.name.toLowerCase() === selectedCategory.toLowerCase())) {
      setSelectedCategory(null);
    }
  }, [availableCategories, selectedCategory]);

  // Filtered transactions (excluding phantom refund transactions)
  const filteredTransactions = useMemo(() => {
    let result = transactions.filter((t) => t.type !== 'refund');

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

    // Filter by selected category
    if (selectedCategory) {
      result = result.filter(
        (t) => (t.category || '').toLowerCase().trim() === selectedCategory.toLowerCase().trim()
      );
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
  }, [transactions, activeFilter, selectedCategory, searchQuery]);

  // Group by date with future/upcoming distinction within 3 days and dual delimiters
  const groupedSections = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const dNow = new Date(todayStr + 'T00:00:00Z');

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    interface DateGroup {
      title: string;
      dateStr: string;
      isFuture: boolean;
      data: Transaction[];
    }

    const groupMap = new Map<string, DateGroup>();

    // Filter: include all past/today transactions, but only future transactions within 3 days
    const eligibleTransactions = filteredTransactions.filter((tx) => {
      const txDateStr = tx.date ? tx.date.slice(0, 10) : todayStr;
      if (txDateStr <= todayStr) return true;
      const dTarget = new Date(txDateStr + 'T00:00:00Z');
      const diffDays = Math.round((dTarget.getTime() - dNow.getTime()) / (24 * 3600 * 1000));
      return diffDays <= 3;
    });

    for (const tx of eligibleTransactions) {
      const txDateStr = tx.date ? tx.date.slice(0, 10) : todayStr;
      let label: string;
      const isFuture = txDateStr > todayStr;

      if (txDateStr === todayStr) {
        label = "Aujourd'hui";
      } else if (txDateStr === yesterdayStr) {
        label = 'Hier';
      } else {
        const d = new Date(txDateStr + 'T12:00:00Z');
        label = d.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }

      if (!groupMap.has(txDateStr)) {
        groupMap.set(txDateStr, {
          title: label,
          dateStr: txDateStr,
          isFuture,
          data: [],
        });
      }
      groupMap.get(txDateStr)!.data.push(tx);
    }

    const hasFuture = Array.from(groupMap.values()).some((g) => g.isFuture);
    let foundFirstFuture = false;
    let foundFirstNonFuture = false;

    const sections: {
      title: string;
      dateStr: string;
      isFuture: boolean;
      delimiterText?: string;
      data: Transaction[];
    }[] = [];

    for (const group of groupMap.values()) {
      let delimiterText: string | undefined;

      // 1. Delimiter above first future section
      if (group.isFuture && !foundFirstFuture) {
        delimiterText = 'Prochaines dépenses';
        foundFirstFuture = true;
      }

      // 2. Delimiter above first realized section (only if there are future sections)
      if (hasFuture && !group.isFuture && !foundFirstNonFuture) {
        delimiterText = 'Dépenses réalisées';
        foundFirstNonFuture = true;
      }

      sections.push({
        title: group.title,
        dateStr: group.dateStr,
        isFuture: group.isFuture,
        delimiterText,
        data: group.data,
      });
    }

    return sections;
  }, [filteredTransactions]);

  const toggleSelectMode = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setIsSelectMode((prev) => {
      if (prev) {
        setSelectedTxIds(new Set());
        setShowCalculatorModal(false);
      }
      return !prev;
    });
  };

  const toggleSelectTx = (id: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllExpenses = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const expenseIds = filteredTransactions
      .filter((t) => t.type === 'expense')
      .map((t) => t.id);
    setSelectedTxIds(new Set(expenseIds));
  };

  const handleDeselectAll = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedTxIds(new Set());
  };

  const selectedExpenses = useMemo(() => {
    return transactions.filter((t) => selectedTxIds.has(t.id) && t.type === 'expense');
  }, [transactions, selectedTxIds]);

  const totalSelectedAmount = useMemo(() => {
    return round2(selectedExpenses.reduce((sum, t) => sum + (t.amount || 0), 0));
  }, [selectedExpenses]);

  const parsedPercent = parseFloat(refundPercent.replace(',', '.')) || 0;
  const calculatedRefund = useMemo(() => {
    return round2(totalSelectedAmount * (parsedPercent / 100));
  }, [totalSelectedAmount, parsedPercent]);

  const calculatedRemaining = useMemo(() => {
    return round2(Math.max(0, totalSelectedAmount - calculatedRefund));
  }, [totalSelectedAmount, calculatedRefund]);

  const handleApplyBatchRefund = async () => {
    const pct = parseFloat(refundPercent.replace(',', '.')) || 0;
    if (pct < 0 || pct > 100) {
      showError('Pourcentage invalide', 'Veuillez saisir un pourcentage entre 0 et 100.');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const selectedList = transactions.filter((t) => selectedTxIds.has(t.id) && t.type === 'expense');
    for (const tx of selectedList) {
      const txRefund = round2(tx.amount * (pct / 100));
      await updateTransaction({
        ...tx,
        refundedAmount: txRefund,
      });
    }

    setShowCalculatorModal(false);
    setIsSelectMode(false);
    setSelectedTxIds(new Set());
  };

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
        <View style={styles.headerTitleRow}>
          <Text
            style={[
              theme.typography.title1,
              { color: theme.colors.text.primary },
            ]}
          >
            {isSelectMode ? `Sélection (${selectedTxIds.size})` : 'Opérations'}
          </Text>

          <Pressable
            onPress={toggleSelectMode}
            style={[
              styles.selectToggleBtn,
              {
                backgroundColor: isSelectMode
                  ? theme.colors.pillar.savings
                  : theme.colors.bg.surfaceSubtle,
                borderColor: isSelectMode
                  ? theme.colors.pillar.savings
                  : theme.colors.border.subtle,
                borderRadius: theme.radii.full,
              },
            ]}
          >
            <CheckSquare size={14} color={isSelectMode ? '#FFFFFF' : theme.colors.text.secondary} />
            <Text
              style={[
                theme.typography.caption,
                {
                  color: isSelectMode ? '#FFFFFF' : theme.colors.text.secondary,
                  fontWeight: '600',
                  marginLeft: 5,
                },
              ]}
            >
              {isSelectMode ? 'Terminer' : 'Sélectionner'}
            </Text>
          </Pressable>
        </View>

        {isSelectMode && (
          <View style={styles.selectActionsQuickRow}>
            <Pressable onPress={handleSelectAllExpenses} style={styles.quickSelectTextBtn}>
              <Text style={[theme.typography.caption, { color: theme.colors.pillar.savings, fontWeight: '600' }]}>
                Tout sélectionner
              </Text>
            </Pressable>
            <Text style={{ color: theme.colors.text.muted, marginHorizontal: 8 }}>•</Text>
            <Pressable onPress={handleDeselectAll} style={styles.quickSelectTextBtn}>
              <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, fontWeight: '500' }]}>
                Tout désélectionner
              </Text>
            </Pressable>
          </View>
        )}

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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Pill
              label="Tout"
              count={counts.all}
              isActive={activeFilter === 'all'}
              onPress={() => handleFilterPress('all')}
            />
            <Pill
              label="Besoins"
              count={counts.needs}
              isActive={activeFilter === 'needs'}
              accentColor={theme.colors.pillar.needs}
              onPress={() => handleFilterPress('needs')}
            />
            <Pill
              label="Envies"
              count={counts.wants}
              isActive={activeFilter === 'wants'}
              accentColor={theme.colors.pillar.wants}
              onPress={() => handleFilterPress('wants')}
            />
            <Pill
              label="Épargne"
              count={counts.savings}
              isActive={activeFilter === 'savings'}
              accentColor={theme.colors.pillar.savings}
              onPress={() => handleFilterPress('savings')}
            />
            <Pill
              label="Revenus"
              count={counts.income}
              isActive={activeFilter === 'income'}
              accentColor={theme.colors.status.income}
              onPress={() => handleFilterPress('income')}
            />
          </ScrollView>
        </View>

        {/* Category Filter Pills (Smaller, discreet secondary chips) */}
        {availableCategories.length > 0 && (
          <View style={styles.categoryFilterRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Pressable
                onPress={() => {
                  setSelectedCategory(null);
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                }}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor:
                      selectedCategory === null
                        ? theme.colors.pillar.savings
                        : theme.colors.bg.surfaceSubtle,
                    borderColor:
                      selectedCategory === null
                        ? theme.colors.pillar.savings
                        : theme.colors.border.subtle,
                    borderRadius: theme.radii.full,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    {
                      color:
                        selectedCategory === null
                          ? '#FFFFFF'
                          : theme.colors.text.secondary,
                      fontWeight: selectedCategory === null ? '700' : '500',
                    },
                  ]}
                >
                  Toutes
                </Text>
              </Pressable>

              {availableCategories.map((cat) => {
                const isSelected =
                  selectedCategory?.toLowerCase() === cat.name.toLowerCase();
                return (
                  <Pressable
                    key={cat.name}
                    onPress={() => {
                      setSelectedCategory(isSelected ? null : cat.name);
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      } catch {}
                    }}
                    style={[
                      styles.categoryPill,
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
                    <Tag
                      size={10}
                      color={isSelected ? '#FFFFFF' : theme.colors.text.muted}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.categoryPillText,
                        {
                          color: isSelected
                            ? '#FFFFFF'
                            : theme.colors.text.secondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {cat.name}
                    </Text>
                    <Text
                      style={[
                        styles.categoryPillCount,
                        {
                          color: isSelected
                            ? 'rgba(255,255,255,0.85)'
                            : theme.colors.text.muted,
                        },
                      ]}
                    >
                      {cat.count}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Grouped Chronological List */}
      <SectionList
        sections={groupedSections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: insets.bottom + (isSelectMode ? 140 : 80),
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => (
          <View style={{ backgroundColor: theme.colors.bg.canvas }}>
            {section.delimiterText && (
              <View style={styles.upcomingDelimiter}>
                <View style={[styles.delimiterLine, { backgroundColor: theme.colors.border.subtle }]} />
                <Text style={[styles.delimiterText, { color: theme.colors.text.secondary }]}>
                  {section.delimiterText}
                </Text>
                <View style={[styles.delimiterLine, { backgroundColor: theme.colors.border.subtle }]} />
              </View>
            )}
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  theme.typography.caption,
                  {
                    color: section.isFuture ? theme.colors.pillar.savings : theme.colors.text.secondary,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                  },
                ]}
              >
                {section.title}
              </Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => {
          const isIncome = item.type === 'income';
          const isRefund = item.type === 'refund';
          const hasRefund =
            item.type === 'expense' && Boolean(item.refundedAmount && item.refundedAmount > 0);
          const isSelected = selectedTxIds.has(item.id);

          return (
            <SwipeableTransactionRow
              disabled={isSelectMode}
              onPress={() => {
                if (isSelectMode) {
                  if (item.type === 'expense') {
                    toggleSelectTx(item.id);
                  }
                } else {
                  handleOpenDetail(item, false);
                }
              }}
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
                style={[
                  styles.txCard,
                  isSelectMode && isSelected && {
                    borderColor: theme.colors.pillar.savings,
                  },
                ]}
                padded={false}
              >
                <View style={styles.txRow}>
                  {isSelectMode && item.type === 'expense' && (
                    <Pressable
                      onPress={() => toggleSelectTx(item.id)}
                      hitSlop={8}
                      style={[
                        styles.checkbox,
                        {
                          borderColor: isSelected
                            ? theme.colors.pillar.savings
                            : theme.colors.border.subtle,
                          backgroundColor: isSelected
                            ? theme.colors.pillar.savings
                            : 'transparent',
                          borderRadius: theme.radii.sm,
                        },
                      ]}
                    >
                      {isSelected && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                    </Pressable>
                  )}

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
                            backgroundColor: theme.colors.bg.surfaceSubtle,
                            borderRadius: theme.radii.sm,
                          },
                        ]}
                      >
                        <RotateCcw size={10} color={theme.colors.text.secondary} style={{ marginRight: 4 }} />
                        <Text
                          style={[
                            theme.typography.caption,
                            theme.typography.tabularNums,
                            {
                              color: theme.colors.text.secondary,
                              fontWeight: '600',
                              fontSize: 11,
                            },
                          ]}
                        >
                          Remboursement : {formatCurrency(item.refundedAmount || 0, currency)} ({formatCurrency(Math.max(0, item.amount - (item.refundedAmount || 0)), currency)} restants)
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

      {/* Floating Bottom Selection Bar */}
      {isSelectMode && (
        <View
          style={[
            styles.bottomSelectionBar,
            {
              backgroundColor: theme.colors.bg.surface,
              borderColor: theme.colors.border.subtle,
              paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 16,
            },
          ]}
        >
          <View style={styles.bottomSelectionInfo}>
            <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>
              {selectedExpenses.length} dépense{selectedExpenses.length > 1 ? 's' : ''} • Cumul
            </Text>
            <Text
              style={[
                theme.typography.title2,
                theme.typography.tabularNums,
                { color: theme.colors.text.primary, fontWeight: '700' },
              ]}
            >
              {formatCurrency(totalSelectedAmount, currency)}
            </Text>
          </View>

          <Pressable
            disabled={selectedExpenses.length === 0}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setShowCalculatorModal(true);
            }}
            style={[
              styles.calcOpenBtn,
              {
                backgroundColor:
                  selectedExpenses.length > 0
                    ? theme.colors.pillar.savings
                    : theme.colors.bg.surfaceSubtle,
                opacity: selectedExpenses.length > 0 ? 1 : 0.5,
                borderRadius: theme.radii.full,
              },
            ]}
          >
            <Calculator size={18} color={selectedExpenses.length > 0 ? '#FFFFFF' : theme.colors.text.muted} />
            <Text
              style={[
                theme.typography.body,
                {
                  color: selectedExpenses.length > 0 ? '#FFFFFF' : theme.colors.text.muted,
                  fontWeight: '700',
                  marginLeft: 6,
                },
              ]}
            >
              Calculer
            </Text>
          </Pressable>
        </View>
      )}

      {/* Refund Calculator Modal */}
      <Modal
        visible={showCalculatorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalculatorModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.calcModalSheet,
              {
                backgroundColor: theme.colors.bg.surface,
                borderColor: theme.colors.border.subtle,
                borderTopLeftRadius: theme.radii.xl,
                borderTopRightRadius: theme.radii.xl,
                paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.calcModalHeader}>
              <View>
                <Text style={[theme.typography.title2, { color: theme.colors.text.primary }]}>
                  Calculateur de remboursement
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, marginTop: 2 }]}>
                  {selectedExpenses.length} dépense{selectedExpenses.length > 1 ? 's' : ''} sélectionnée{selectedExpenses.length > 1 ? 's' : ''}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowCalculatorModal(false)}
                style={styles.calcCloseBtn}
                hitSlop={8}
              >
                <X size={20} color={theme.colors.text.secondary} />
              </Pressable>
            </View>

            {/* Total Cumul Box */}
            <View
              style={[
                styles.calcSummaryBox,
                {
                  backgroundColor: theme.colors.bg.surfaceSubtle,
                  borderColor: theme.colors.border.subtle,
                  borderRadius: theme.radii.md,
                },
              ]}
            >
              <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>
                Montant total cumulé
              </Text>
              <Text
                style={[
                  theme.typography.title1,
                  theme.typography.tabularNums,
                  { color: theme.colors.text.primary, fontWeight: '700', marginTop: 2 },
                ]}
              >
                {formatCurrency(totalSelectedAmount, currency)}
              </Text>
            </View>

            {/* Percentage selector */}
            <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, marginTop: 14, marginBottom: 8 }]}>
              Pourcentage à rembourser
            </Text>
            <View style={styles.presetPercentRow}>
              {['50', '30', '25', '20', '100'].map((p) => {
                const isActive = refundPercent === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => {
                      setRefundPercent(p);
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      } catch {}
                    }}
                    style={[
                      styles.presetPercentChip,
                      {
                        backgroundColor: isActive
                          ? theme.colors.pillar.savings
                          : theme.colors.bg.surfaceSubtle,
                        borderColor: isActive
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
                          color: isActive ? '#FFFFFF' : theme.colors.text.secondary,
                          fontWeight: isActive ? '700' : '500',
                        },
                      ]}
                    >
                      {p}%
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Custom percent input */}
            <View
              style={[
                styles.customPercentInputRow,
                {
                  backgroundColor: theme.colors.bg.surfaceSubtle,
                  borderColor: theme.colors.border.subtle,
                  borderRadius: theme.radii.md,
                },
              ]}
            >
              <TextInput
                value={refundPercent}
                onChangeText={setRefundPercent}
                keyboardType="numeric"
                placeholder="50"
                placeholderTextColor={theme.colors.text.muted}
                style={[
                  styles.customPercentInput,
                  { color: theme.colors.text.primary },
                ]}
              />
              <Text style={[theme.typography.body, { color: theme.colors.text.secondary, fontWeight: '700', marginRight: 12 }]}>
                %
              </Text>
            </View>

            {/* Results Display */}
            <View
              style={[
                styles.calcResultCard,
                {
                  backgroundColor: theme.colors.pillar.savingsBg,
                  borderRadius: theme.radii.lg,
                  borderColor: theme.colors.border.subtle,
                },
              ]}
            >
              <View style={styles.calcResultRow}>
                <Text style={[theme.typography.caption, { color: theme.colors.pillar.savings, fontWeight: '600' }]}>
                  Montant à rembourser ({refundPercent || 0} %)
                </Text>
                <Text
                  style={[
                    theme.typography.title1,
                    theme.typography.tabularNums,
                    { color: theme.colors.pillar.savings, fontWeight: '800' },
                  ]}
                >
                  +{formatCurrency(calculatedRefund, currency)}
                </Text>
              </View>

              <View style={[styles.calcResultDivider, { backgroundColor: theme.colors.border.subtle }]} />

              <View style={styles.calcResultRow}>
                <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>
                  Reste à votre charge
                </Text>
                <Text
                  style={[
                    theme.typography.bodyLarge,
                    theme.typography.tabularNums,
                    { color: theme.colors.text.primary, fontWeight: '700' },
                  ]}
                >
                  {formatCurrency(calculatedRemaining, currency)}
                </Text>
              </View>
            </View>

            {/* Actions Buttons */}
            <View style={styles.calcModalActions}>
              <Pressable
                onPress={() => setShowCalculatorModal(false)}
                style={[
                  styles.calcActionBtn,
                  { backgroundColor: theme.colors.bg.surfaceSubtle, borderRadius: theme.radii.md },
                ]}
              >
                <Text style={[theme.typography.body, { color: theme.colors.text.secondary }]}>
                  Fermer
                </Text>
              </Pressable>

              <Pressable
                onPress={handleApplyBatchRefund}
                style={[
                  styles.calcActionBtn,
                  { backgroundColor: theme.colors.pillar.savings, borderRadius: theme.radii.md },
                ]}
              >
                <RotateCcw size={16} color="#FFFFFF" />
                <Text style={[theme.typography.body, { color: '#FFFFFF', fontWeight: '700', marginLeft: 6 }]}>
                  Appliquer aux opérations
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
    marginTop: 12,
  },
  pillsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
  },
  categoryFilterRow: {
    marginTop: 10,
    marginBottom: 4,
  },
  categoryScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 16,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 11,
  },
  categoryPillCount: {
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 8,
  },
  sectionHeader: {
    paddingVertical: 8,
    marginTop: 12,
  },
  upcomingDelimiter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  delimiterLine: {
    flex: 1,
    height: 1,
  },
  delimiterText: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
    borderWidth: 0,
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selectToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  selectActionsQuickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 2,
  },
  quickSelectTextBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bottomSelectionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  bottomSelectionInfo: {
    flex: 1,
  },
  calcOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  calcModalSheet: {
    padding: 20,
    borderTopWidth: 1,
  },
  calcModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calcCloseBtn: {
    padding: 6,
  },
  calcSummaryBox: {
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetPercentRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  presetPercentChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  customPercentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    height: 44,
    marginBottom: 16,
  },
  customPercentInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    fontSize: 16,
  },
  calcResultCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  calcResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calcResultDivider: {
    height: 1,
    marginVertical: 12,
  },
  calcModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  calcActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
});
