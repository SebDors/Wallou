import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { X, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useBudget } from '../context/BudgetContext';
import { calculateBudgetPeriodSummary, formatCurrency } from '../services/budgetEngine';
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
  const { transactions, settings, currentPeriodKey } = useBudget();

  const currency = settings?.currency || '€';
  const ratios = settings?.ratios || { needs: 50, wants: 30, savings: 20 };

  // Generate list of months (last 6 months up to current period)
  const monthlyData = useMemo(() => {
    // Find all distinct months from transactions
    const periodSet = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        periodSet.add(tx.date.slice(0, 7));
      }
    });
    periodSet.add(currentPeriodKey);

    // Also include the last 6 calendar months
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      periodSet.add(key);
    }

    const sortedKeys = Array.from(periodSet).sort();

    return sortedKeys.map((key) => {
      const summary = calculateBudgetPeriodSummary(transactions, ratios, key);
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
        netCashflow: summary.netCashflow,
        needsSpent: summary.pillars.needs.spent,
        wantsSpent: summary.pillars.wants.spent,
        savingsSpent: summary.pillars.savings.spent,
        needsAllocated: summary.pillars.needs.allocated,
        wantsAllocated: summary.pillars.wants.allocated,
        savingsAllocated: summary.pillars.savings.allocated,
      };
    });
  }, [transactions, ratios, currentPeriodKey]);

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

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
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
                >
                  <X size={18} color={theme.colors.text.secondary} />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* 1. Bar Chart Comparison */}
                <Card style={styles.chartCard} padded>
                  <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 }]}>
                    Graphique comparatif des mois
                  </Text>

                  {/* Horizontal Scrollable Bar Chart */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chartScrollContainer}
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

                {monthlyData
                  .slice()
                  .reverse()
                  .map((m) => {
                    const isSelected = m.key === currentPeriodKey;
                    return (
                      <Pressable
                        key={m.key}
                        onPress={() => {
                          onSelectPeriod(m.key);
                          onClose();
                        }}
                      >
                        <Card
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
                            <View style={{ flex: 1 }}>
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
                            </View>

                            <ChevronRight size={18} color={theme.colors.text.muted} />
                          </View>

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
                                Solde
                              </Text>
                              <Text
                                style={[
                                  theme.typography.body,
                                  theme.typography.tabularNums,
                                  {
                                    color:
                                      m.netCashflow >= 0
                                        ? theme.colors.status.income
                                        : theme.colors.status.overrun,
                                    fontWeight: '700',
                                  },
                                ]}
                              >
                                {m.netCashflow >= 0 ? '+' : ''}
                                {formatCurrency(m.netCashflow, currency)}
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
                        </Card>
                      </Pressable>
                    );
                  })}
              </ScrollView>
            </View>
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
    maxHeight: '90%',
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
  scrollContent: {
    paddingBottom: 40,
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
