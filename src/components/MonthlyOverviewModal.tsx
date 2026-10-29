import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { X, TrendingUp, TrendingDown, ChevronRight, Trash2, RotateCcw } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useBudget } from '../context/BudgetContext';
import { calculateBudgetPeriodSummary, formatCurrency, getCurrentPeriodKeyForDay } from '../services/budgetEngine';
import { Card } from './Card';
import { PILLAR_NAMES } from '../types/budget';

export interface MonthlyOverviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPeriod: (periodKey: string) => void;
}

export const MonthlyOverviewModal: React.FC<MonthlyOverviewModalProps> = ({
  visible,
  onClose,
  onSelectPeriod,
}) => {
  const { theme } = useTheme();
  const { transactions, settings, currentPeriodKey, hidePeriod, resetHiddenPeriods } = useBudget();

  const currency = settings?.currency || '€';
  const ratios = settings?.ratios || { needs: 50, wants: 30, savings: 20 };
  const hiddenPeriods = useMemo(() => settings?.hiddenPeriods || [], [settings?.hiddenPeriods]);

  const chartScrollRef = useRef<ScrollView>(null);

  // Generate list of months (only months from transactions + current period, excluding hidden ones)
  const monthlyData = useMemo(() => {
    const startDay = settings?.startDayOfMonth || 1;
    // Find all distinct months from transactions
    const periodSet = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date) {
        periodSet.add(getCurrentPeriodKeyForDay(startDay, new Date(tx.date)));
      }
    });
    periodSet.add(currentPeriodKey);

    const sortedKeys = Array.from(periodSet)
      .filter((key) => !hiddenPeriods.includes(key))
      .sort();

    return sortedKeys.map((key) => {
      const summary = calculateBudgetPeriodSummary(transactions, ratios, key, 0, startDay);
      const [yearStr, monthStr] = key.split('-');
      const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
      const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short' });
      const fullLabel = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      const capitalizedFull = fullLabel.charAt(0).toUpperCase() + fullLabel.slice(1);

      return {
        key,
        monthLabel,
        fullLabel: capitalizedFull,
        summary,
        totalIncome: summary.totalIncome,
        totalExpenses: summary.totalExpenses,
        netBalance: summary.netBalance,
        resteAVivre: summary.resteAVivre,
        needsSpent: summary.pillars.needs.spent,
        wantsSpent: summary.pillars.wants.spent,
        savingsSpent: summary.pillars.savings.spent,
        needsAllocated: summary.pillars.needs.allocated,
        wantsAllocated: summary.pillars.wants.allocated,
        savingsAllocated: summary.pillars.savings.allocated,
      };
    });
  }, [transactions, ratios, currentPeriodKey, settings?.startDayOfMonth, hiddenPeriods]);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        chartScrollRef.current?.scrollToEnd({ animated: false });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [visible, monthlyData]);

  // Find max value to normalize bar heights
  const maxVal = useMemo(() => {
    let max = 1;
    for (const m of monthlyData) {
      if (m.totalIncome > max) max = m.totalIncome;
      if (m.totalExpenses > max) max = m.totalExpenses;
    }
    return max;
  }, [monthlyData]);

  const CHART_BAR_HEIGHT = 130;

  const handleHidePeriod = useCallback(
    (key: string) => {
      hidePeriod(key);
    },
    [hidePeriod]
  );

  const handleResetHidden = useCallback(() => {
    resetHiddenPeriods();
  }, [resetHiddenPeriods]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Backdrop overlay - tap outside to close */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
        />

        <View
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
            <View>
              <Text style={[theme.typography.title1, { color: theme.colors.text.primary }]}>
                Aperçu Mensuel
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, marginTop: 2 }]}>
                Revenus et dépenses par pilier au fil des mois
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                {
                  backgroundColor: theme.colors.bg.surfaceSubtle,
                  borderRadius: theme.radii.full,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Fermer la modal"
            >
              <X size={18} color={theme.colors.text.secondary} />
            </Pressable>
          </View>

          {/* Main Scrollable Content */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* 1. Bar Chart Comparison */}
            {monthlyData.length > 0 && (
              <Card style={styles.chartCard} padded>
                <Text
                  style={[
                    theme.typography.caption,
                    {
                      color: theme.colors.text.secondary,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      marginBottom: 12,
                    },
                  ]}
                >
                  Graphique comparatif des mois
                </Text>

                {/* Horizontal Scrollable Bar Chart */}
                <ScrollView
                  ref={chartScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  contentContainerStyle={styles.chartScrollContainer}
                  onContentSizeChange={() => {
                    chartScrollRef.current?.scrollToEnd({ animated: false });
                  }}
                >
                  {monthlyData.map((m) => {
                    const isCurrent = m.key === currentPeriodKey;
                    const incomeBarH = Math.max(4, Math.round((m.totalIncome / maxVal) * CHART_BAR_HEIGHT));
                    const expenseTotal = m.totalExpenses;
                    const expenseBarH = Math.max(4, Math.round((expenseTotal / maxVal) * CHART_BAR_HEIGHT));

                    // Pillar segment fractions inside expense bar
                    const needsFrac = expenseTotal > 0 ? m.needsSpent / expenseTotal : 0;
                    const wantsFrac = expenseTotal > 0 ? m.wantsSpent / expenseTotal : 0;
                    const savingsFrac = expenseTotal > 0 ? m.savingsSpent / expenseTotal : 0;

                    const needsH = Math.round(expenseBarH * needsFrac);
                    const wantsH = Math.round(expenseBarH * wantsFrac);
                    const savingsH = Math.max(0, expenseBarH - needsH - wantsH);

                    return (
                      <Pressable
                        key={m.key}
                        onPress={() => {
                          onSelectPeriod(m.key);
                          onClose();
                        }}
                        style={[
                          styles.chartMonthColumn,
                          isCurrent && {
                            backgroundColor: theme.colors.bg.surfaceSubtle,
                            borderRadius: theme.radii.md,
                          },
                        ]}
                      >
                        {/* Bars container */}
                        <View style={[styles.barsWrapper, { height: CHART_BAR_HEIGHT }]}>
                          {/* Income Bar */}
                          <View style={styles.singleBarCol}>
                            <View
                              style={[
                                styles.bar,
                                {
                                  height: incomeBarH,
                                  backgroundColor: theme.colors.status.income,
                                  borderTopLeftRadius: 4,
                                  borderTopRightRadius: 4,
                                },
                              ]}
                            />
                          </View>

                          {/* Expense Stacked Bar (Needs, Wants, Savings) */}
                          <View style={styles.singleBarCol}>
                            <View
                              style={[
                                styles.stackedBarContainer,
                                {
                                  height: expenseBarH,
                                  borderTopLeftRadius: 4,
                                  borderTopRightRadius: 4,
                                  overflow: 'hidden',
                                },
                              ]}
                            >
                              {needsH > 0 && (
                                <View
                                  style={{
                                    height: needsH,
                                    backgroundColor: theme.colors.pillar.needs,
                                  }}
                                />
                              )}
                              {wantsH > 0 && (
                                <View
                                  style={{
                                    height: wantsH,
                                    backgroundColor: theme.colors.pillar.wants,
                                  }}
                                />
                              )}
                              {savingsH > 0 && (
                                <View
                                  style={{
                                    height: savingsH,
                                    backgroundColor: theme.colors.pillar.savings,
                                  }}
                                />
                              )}
                            </View>
                          </View>
                        </View>

                        {/* Month Label */}
                        <Text
                          style={[
                            theme.typography.caption,
                            {
                              color: isCurrent ? theme.colors.pillar.savings : theme.colors.text.secondary,
                              fontWeight: isCurrent ? '700' : '500',
                              marginTop: 6,
                              textTransform: 'capitalize',
                            },
                          ]}
                        >
                          {m.monthLabel}
                        </Text>
                        {isCurrent && (
                          <View
                            style={[
                              styles.activeDot,
                              { backgroundColor: theme.colors.pillar.savings },
                            ]}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Chart Legend */}
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.colors.status.income }]} />
                    <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, fontSize: 11 }]}>
                      Revenus
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.colors.pillar.needs }]} />
                    <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, fontSize: 11 }]}>
                      Besoins
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.colors.pillar.wants }]} />
                    <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, fontSize: 11 }]}>
                      Envies
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.colors.pillar.savings }]} />
                    <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, fontSize: 11 }]}>
                      Épargne
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            {/* Hidden Periods Recovery Banner */}
            {hiddenPeriods.length > 0 && (
              <View
                style={[
                  styles.hiddenBanner,
                  {
                    backgroundColor: theme.colors.bg.surfaceSubtle,
                    borderColor: theme.colors.border.subtle,
                  },
                ]}
              >
                <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>
                  {hiddenPeriods.length} mois masqué{hiddenPeriods.length > 1 ? 's' : ''}
                </Text>
                <Pressable
                  onPress={handleResetHidden}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.resetHiddenBtn,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Tout réafficher"
                >
                  <RotateCcw size={13} color={theme.colors.pillar.savings} />
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.pillar.savings, fontWeight: '700' },
                    ]}
                  >
                    Tout réafficher
                  </Text>
                </Pressable>
              </View>
            )}

            {/* 2. Detailed Cards by Month */}
            <Text
              style={[
                theme.typography.caption,
                {
                  color: theme.colors.text.secondary,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  marginTop: 18,
                  marginBottom: 8,
                },
              ]}
            >
              Détail par mois
            </Text>

            {monthlyData.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={[theme.typography.body, { color: theme.colors.text.secondary, textAlign: 'center' }]}>
                  Tous les mois sont actuellement masqués.
                </Text>
              </View>
            )}

            {monthlyData
              .slice()
              .reverse()
              .map((m) => {
                const isSelected = m.key === currentPeriodKey;
                return (
                  <Card
                    key={m.key}
                    style={[
                      styles.monthCard,
                      isSelected && {
                        borderColor: theme.colors.pillar.savings,
                        borderWidth: 1.5,
                      },
                    ]}
                    padded
                  >
                    {/* Card Header */}
                    <View style={styles.cardHeaderRow}>
                      <Pressable
                        style={{ flex: 1 }}
                        onPress={() => {
                          onSelectPeriod(m.key);
                          onClose();
                        }}
                      >
                        <View style={styles.titleWithBadge}>
                          <Text
                            style={[
                              theme.typography.title2,
                              { color: theme.colors.text.primary },
                            ]}
                          >
                            {m.fullLabel}
                          </Text>
                          {isSelected && (
                            <View
                              style={[
                                styles.selectedBadge,
                                { backgroundColor: theme.colors.pillar.savings + '22' },
                              ]}
                            >
                              <Text
                                style={[
                                  theme.typography.caption,
                                  { color: theme.colors.pillar.savings, fontWeight: '700', fontSize: 10 },
                                ]}
                              >
                                Affiché
                              </Text>
                            </View>
                          )}
                        </View>
                      </Pressable>

                      {/* Right Action Icons: Delete/Hide Button & Chevron */}
                      <View style={styles.cardHeaderActions}>
                        <Pressable
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          onPress={() => handleHidePeriod(m.key)}
                          style={({ pressed }) => [
                            styles.actionBtn,
                            {
                              backgroundColor: theme.colors.bg.surfaceSubtle,
                              borderColor: theme.colors.border.subtle,
                              opacity: pressed ? 0.6 : 1,
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Masquer le mois ${m.fullLabel}`}
                        >
                          <Trash2 size={15} color={theme.colors.status.overrun} />
                        </Pressable>

                        <Pressable
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          onPress={() => {
                            onSelectPeriod(m.key);
                            onClose();
                          }}
                          style={({ pressed }) => [
                            styles.actionBtn,
                            {
                              opacity: pressed ? 0.6 : 1,
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Sélectionner le mois ${m.fullLabel}`}
                        >
                          <ChevronRight size={18} color={theme.colors.text.muted} />
                        </Pressable>
                      </View>
                    </View>

                    {/* Card Body - clickable to select the period */}
                    <Pressable
                      onPress={() => {
                        onSelectPeriod(m.key);
                        onClose();
                      }}
                    >
                      {/* Cashflow Row */}
                      <View
                        style={[
                          styles.cashflowRow,
                          {
                            backgroundColor: theme.colors.bg.surfaceSubtle,
                            borderRadius: theme.radii.md,
                          },
                        ]}
                      >
                        <View style={styles.cashflowItem}>
                          <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>
                            Revenus
                          </Text>
                          <Text
                            style={[
                              theme.typography.body,
                              theme.typography.tabularNums,
                              { color: theme.colors.status.income, fontWeight: '700' },
                            ]}
                          >
                            {formatCurrency(m.totalIncome, currency)}
                          </Text>
                        </View>

                        <View style={[styles.divider, { backgroundColor: theme.colors.border.subtle }]} />

                        <View style={styles.cashflowItem}>
                          <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>
                            Dépenses
                          </Text>
                          <Text
                            style={[
                              theme.typography.body,
                              theme.typography.tabularNums,
                              { color: theme.colors.status.overrun, fontWeight: '700' },
                            ]}
                          >
                            {formatCurrency(m.totalExpenses, currency)}
                          </Text>
                        </View>

                        <View style={[styles.divider, { backgroundColor: theme.colors.border.subtle }]} />

                        <View style={styles.cashflowItem}>
                          <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>
                            Restant
                          </Text>
                          <Text
                            style={[
                              theme.typography.body,
                              theme.typography.tabularNums,
                              {
                                color:
                                  m.netBalance >= 0
                                    ? theme.colors.status.income
                                    : theme.colors.status.overrun,
                                fontWeight: '700',
                              },
                            ]}
                          >
                            {m.netBalance >= 0 ? '+' : ''}
                            {formatCurrency(m.netBalance, currency)}
                          </Text>
                        </View>
                      </View>

                      {/* 3 Pillars Progress */}
                      <View style={styles.pillarsBreakdown}>
                        {/* Besoins */}
                        <View style={styles.pillarRow}>
                          <View style={styles.pillarLabelCol}>
                            <Text
                              style={[
                                theme.typography.caption,
                                { color: theme.colors.pillar.needs, fontWeight: '600' },
                              ]}
                            >
                              Besoins ({ratios.needs}%)
                            </Text>
                            <Text
                              style={[
                                theme.typography.caption,
                                theme.typography.tabularNums,
                                { color: theme.colors.text.secondary, fontSize: 11 },
                              ]}
                            >
                              {formatCurrency(m.needsSpent, currency)} / {formatCurrency(m.needsAllocated, currency)}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.progressBarBg,
                              { backgroundColor: theme.colors.bg.surfaceSubtle },
                            ]}
                          >
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  backgroundColor: theme.colors.pillar.needs,
                                  width: `${Math.min(100, m.needsAllocated > 0 ? (m.needsSpent / m.needsAllocated) * 100 : 0)}%`,
                                },
                              ]}
                            />
                          </View>
                        </View>

                        {/* Envies */}
                        <View style={styles.pillarRow}>
                          <View style={styles.pillarLabelCol}>
                            <Text
                              style={[
                                theme.typography.caption,
                                { color: theme.colors.pillar.wants, fontWeight: '600' },
                              ]}
                            >
                              Envies ({ratios.wants}%)
                            </Text>
                            <Text
                              style={[
                                theme.typography.caption,
                                theme.typography.tabularNums,
                                { color: theme.colors.text.secondary, fontSize: 11 },
                              ]}
                            >
                              {formatCurrency(m.wantsSpent, currency)} / {formatCurrency(m.wantsAllocated, currency)}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.progressBarBg,
                              { backgroundColor: theme.colors.bg.surfaceSubtle },
                            ]}
                          >
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  backgroundColor: theme.colors.pillar.wants,
                                  width: `${Math.min(100, m.wantsAllocated > 0 ? (m.wantsSpent / m.wantsAllocated) * 100 : 0)}%`,
                                },
                              ]}
                            />
                          </View>
                        </View>

                        {/* Épargne */}
                        <View style={styles.pillarRow}>
                          <View style={styles.pillarLabelCol}>
                            <Text
                              style={[
                                theme.typography.caption,
                                { color: theme.colors.pillar.savings, fontWeight: '600' },
                              ]}
                            >
                              Épargne ({ratios.savings}%)
                            </Text>
                            <Text
                              style={[
                                theme.typography.caption,
                                theme.typography.tabularNums,
                                { color: theme.colors.text.secondary, fontSize: 11 },
                              ]}
                            >
                              {formatCurrency(m.savingsSpent, currency)} / {formatCurrency(m.savingsAllocated, currency)}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.progressBarBg,
                              { backgroundColor: theme.colors.bg.surfaceSubtle },
                            ]}
                          >
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  backgroundColor: theme.colors.pillar.savings,
                                  width: `${Math.min(100, m.savingsAllocated > 0 ? (m.savingsSpent / m.savingsAllocated) * 100 : 0)}%`,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  </Card>
                );
              })}
          </ScrollView>
        </View>
      </View>
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
    height: '92%',
    maxHeight: '94%',
    borderTopWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  chartCard: {
    marginBottom: 8,
  },
  chartScrollContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  chartMonthColumn: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  barsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    width: 32,
    justifyContent: 'center',
  },
  singleBarCol: {
    width: 12,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
  },
  stackedBarContainer: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  hiddenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 12,
  },
  resetHiddenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  monthCard: {
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashflowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  cashflowItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 24,
  },
  pillarsBreakdown: {
    gap: 10,
  },
  pillarRow: {
    gap: 4,
  },
  pillarLabelCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
