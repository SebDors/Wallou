import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  Receipt,
  ArrowRight,
  BarChart3,
} from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useBudget } from '../../src/context/BudgetContext';
import { useQuickEntry } from '../../src/context/QuickEntryContext';
import { DonutChart } from '../../src/components/DonutChart';
import { PillarGauge } from '../../src/components/PillarGauge';
import { Card } from '../../src/components/Card';
import { TransactionDetailModal } from '../../src/components/TransactionDetailModal';
import { MonthlyOverviewModal } from '../../src/components/MonthlyOverviewModal';
import { formatCurrency } from '../../src/services/budgetEngine';
import { PillarId, Transaction } from '../../src/types/budget';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const router = useRouter();
  const {
    summary,
    currentPeriodKey,
    setPeriodKey,
    settings,
    refreshCalculations,
  } = useBudget();
  const { openQuickEntry } = useQuickEntry();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showMonthlyOverview, setShowMonthlyOverview] = useState(false);

  const currency = settings?.currency || '€';

  // Period parsing & month navigation
  const [yearStr, monthStr] = currentPeriodKey.split('-');
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const month = parseInt(monthStr, 10) || new Date().getMonth() + 1;

  const handlePrevMonth = () => {
    const prevDate = new Date(year, month - 2, 1);
    const newKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setPeriodKey(newKey);
  };

  const handleNextMonth = () => {
    const nextDate = new Date(year, month, 1);
    const newKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setPeriodKey(newKey);
  };

  const periodDate = new Date(year, month - 1, 1);
  const monthNameRaw = periodDate.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
  const formattedPeriod = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1);

  // Cycle status calculation
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const currentDay = isCurrentMonth ? now.getDate() : totalDaysInMonth;
  const daysLeft = Math.max(1, totalDaysInMonth - currentDay + 1);
  const dailyAllowance = Math.max(0, summary.resteAVivre / daysLeft);

  const onRefresh = async () => {
    setRefreshing(true);
    refreshCalculations();
    setTimeout(() => setRefreshing(false), 300);
  };

  // Recent transactions preview (most recent 4-5)
  const recentTransactions = [...summary.transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getPillarColor = (pillarId?: PillarId) => {
    if (!pillarId) return theme.colors.status.income;
    switch (pillarId) {
      case 'needs':
        return theme.colors.pillar.needs;
      case 'wants':
        return theme.colors.pillar.wants;
      case 'savings':
        return theme.colors.pillar.savings;
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
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.text.secondary}
        />
      }
    >
      {/* 1. Header with Period Navigator & Cycle Status */}
      <View style={styles.headerRow}>
        <View style={styles.periodNavigator}>
          <Pressable
            onPress={handlePrevMonth}
            style={({ pressed }) => [
              styles.navArrow,
              {
                backgroundColor: theme.colors.bg.surfaceSubtle,
                borderRadius: theme.radii.full,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <ChevronLeft size={18} color={theme.colors.text.primary} />
          </Pressable>

          <Text
            style={[
              theme.typography.title2,
              { color: theme.colors.text.primary, marginHorizontal: theme.spacing.sm },
            ]}
          >
            {formattedPeriod}
          </Text>

          <Pressable
            onPress={handleNextMonth}
            style={({ pressed }) => [
              styles.navArrow,
              {
                backgroundColor: theme.colors.bg.surfaceSubtle,
                borderRadius: theme.radii.full,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <ChevronRight size={18} color={theme.colors.text.primary} />
          </Pressable>
        </View>

        <View style={styles.headerRightGroup}>
          <View
            style={[
              styles.cycleBadge,
              {
                backgroundColor: theme.colors.bg.surfaceSubtle,
                borderRadius: theme.radii.full,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.caption,
                theme.typography.tabularNums,
                { color: theme.colors.text.secondary, fontWeight: '600' },
              ]}
            >
              {isCurrentMonth ? `Jour ${currentDay}/${totalDaysInMonth}` : 'Mois clos'}
            </Text>
          </View>

          {/* Monthly Comparison Analytics Button */}
          <Pressable
            onPress={() => setShowMonthlyOverview(true)}
            style={({ pressed }) => [
              styles.analyticsBtn,
              {
                backgroundColor: theme.colors.bg.surfaceSubtle,
                borderRadius: theme.radii.full,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <BarChart3 size={17} color={theme.colors.pillar.savings} />
          </Pressable>
        </View>
      </View>

      {/* 2. Hero Card: Reste à Vivre & Net Cashflow */}
      <Card style={styles.heroCard}>
        <View style={styles.heroMainRow}>
          {/* Left: Reste à vivre */}
          <View style={styles.heroLeftCol}>
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
              Reste à vivre (B+E)
            </Text>

            <Text
              style={[
                theme.typography.display,
                theme.typography.tabularNums,
                {
                  color:
                    summary.resteAVivre < 0
                      ? theme.colors.status.overrun
                      : theme.colors.text.primary,
                  marginTop: 2,
                  fontSize: 26,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(summary.resteAVivre, currency)}
            </Text>
          </View>

          {/* Right: Budget journalier disponible */}
          <View
            style={[
              styles.dailyBadgeRight,
              {
                backgroundColor: theme.colors.bg.surfaceSubtle,
                borderColor: theme.colors.border.subtle,
                borderRadius: theme.radii.md,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.caption,
                {
                  color: theme.colors.text.secondary,
                  textTransform: 'uppercase',
                  fontSize: 10,
                  letterSpacing: 0.4,
                  fontWeight: '600',
                },
              ]}
            >
              Dispo / jour
            </Text>
            <Text
              style={[
                theme.typography.body,
                theme.typography.tabularNums,
                {
                  color: theme.colors.text.primary,
                  fontWeight: '700',
                  marginTop: 1,
                },
              ]}
              numberOfLines={1}
            >
              {formatCurrency(dailyAllowance, currency)}
            </Text>
            <Text
              style={[
                theme.typography.caption,
                theme.typography.tabularNums,
                {
                  color: theme.colors.text.muted,
                  fontSize: 10,
                  marginTop: 1,
                },
              ]}
            >
              {daysLeft}j restants
            </Text>
          </View>
        </View>

        {/* Income vs Expenses summary strip */}
        <View
          style={[
            styles.heroStrip,
            {
              borderTopColor: theme.colors.border.subtle,
              marginTop: theme.spacing.lg,
              paddingTop: theme.spacing.md,
            },
          ]}
        >
          <View style={styles.heroStripItem}>
            <View style={styles.stripLabelRow}>
              <TrendingUp size={14} color={theme.colors.status.income} />
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.text.secondary, marginLeft: 4 },
                ]}
              >
                Revenus
              </Text>
            </View>
            <Text
              style={[
                theme.typography.body,
                theme.typography.tabularNums,
                { color: theme.colors.text.primary, fontWeight: '600', marginTop: 2 },
              ]}
            >
              {formatCurrency(summary.totalIncome, currency)}
            </Text>
          </View>

          <View style={[styles.stripDivider, { backgroundColor: theme.colors.border.subtle }]} />

          <View style={styles.heroStripItem}>
            <View style={styles.stripLabelRow}>
              <TrendingDown size={14} color={theme.colors.status.overrun} />
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.text.secondary, marginLeft: 4 },
                ]}
              >
                Dépenses
              </Text>
            </View>
            <Text
              style={[
                theme.typography.body,
                theme.typography.tabularNums,
                { color: theme.colors.text.primary, fontWeight: '600', marginTop: 2 },
              ]}
            >
              {formatCurrency(summary.totalExpenses, currency)}
            </Text>
          </View>
        </View>
      </Card>

      {/* 3. Donut Chart Section */}
      <View style={[styles.chartSection, { marginVertical: theme.spacing.lg }]}>
        <DonutChart
          needsSpent={summary.pillars.needs.spent}
          wantsSpent={summary.pillars.wants.spent}
          savingsSpent={summary.pillars.savings.spent}
          needsAllocated={summary.pillars.needs.allocated}
          wantsAllocated={summary.pillars.wants.allocated}
          savingsAllocated={summary.pillars.savings.allocated}
          ratios={settings?.ratios || { needs: 50, wants: 30, savings: 20 }}
          centerLabel="Dépenses totales"
          centerValue={formatCurrency(summary.totalExpenses, currency)}
          currency={currency}
        />

        {/* 3 Pillar Legends (single line, non-clickable) */}
        <View style={styles.legendRow}>
          <View
            style={[
              styles.legendItem,
              { backgroundColor: theme.colors.bg.surfaceSubtle },
            ]}
          >
            <View
              style={[
                styles.legendDot,
                { backgroundColor: theme.colors.pillar.needs },
              ]}
            />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.text.primary, fontWeight: '600' },
              ]}
            >
              Besoins {summary.pillars.needs.ratio}%
            </Text>
          </View>

          <View
            style={[
              styles.legendItem,
              { backgroundColor: theme.colors.bg.surfaceSubtle },
            ]}
          >
            <View
              style={[
                styles.legendDot,
                { backgroundColor: theme.colors.pillar.wants },
              ]}
            />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.text.primary, fontWeight: '600' },
              ]}
            >
              Envies {summary.pillars.wants.ratio}%
            </Text>
          </View>

          <View
            style={[
              styles.legendItem,
              { backgroundColor: theme.colors.bg.surfaceSubtle },
            ]}
          >
            <View
              style={[
                styles.legendDot,
                { backgroundColor: theme.colors.pillar.savings },
              ]}
            />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.text.primary, fontWeight: '600' },
              ]}
            >
              Épargne {summary.pillars.savings.ratio}%
            </Text>
          </View>
        </View>
      </View>

      {/* 4. 3 Pillar Progress Gauges */}
      <View style={styles.sectionHeader}>
        <Text style={[theme.typography.title2, { color: theme.colors.text.primary }]}>
          Piliers {summary.pillars.needs.ratio} / {summary.pillars.wants.ratio} / {summary.pillars.savings.ratio}
        </Text>
      </View>

      <PillarGauge
        pillarId="needs"
        name={summary.pillars.needs.name}
        ratio={summary.pillars.needs.ratio}
        spent={summary.pillars.needs.spent}
        allocated={summary.pillars.needs.allocated}
        remaining={summary.pillars.needs.remaining}
        isOverBudget={summary.pillars.needs.isOverBudget}
        overrunAmount={summary.pillars.needs.overrunAmount}
        currency={currency}
        onPress={() => router.push({ pathname: '/(tabs)/transactions', params: { filter: 'needs' } })}
      />

      <PillarGauge
        pillarId="wants"
        name={summary.pillars.wants.name}
        ratio={summary.pillars.wants.ratio}
        spent={summary.pillars.wants.spent}
        allocated={summary.pillars.wants.allocated}
        remaining={summary.pillars.wants.remaining}
        isOverBudget={summary.pillars.wants.isOverBudget}
        overrunAmount={summary.pillars.wants.overrunAmount}
        currency={currency}
        onPress={() => router.push({ pathname: '/(tabs)/transactions', params: { filter: 'wants' } })}
      />

      <PillarGauge
        pillarId="savings"
        name={summary.pillars.savings.name}
        ratio={summary.pillars.savings.ratio}
        spent={summary.pillars.savings.spent}
        allocated={summary.pillars.savings.allocated}
        remaining={summary.pillars.savings.remaining}
        isOverBudget={summary.pillars.savings.isOverBudget}
        overrunAmount={summary.pillars.savings.overrunAmount}
        currency={currency}
        onPress={() => router.push({ pathname: '/(tabs)/transactions', params: { filter: 'savings' } })}
      />

      {/* 5. Recent Transactions Preview */}
      <View style={[styles.sectionHeader, { marginTop: theme.spacing.xl }]}>
        <Text style={[theme.typography.title2, { color: theme.colors.text.primary }]}>
          Dernières opérations
        </Text>
        <Pressable
          onPress={() => router.push('/(tabs)/transactions')}
          style={styles.seeAllButton}
        >
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.pillar.savings, fontWeight: '600' },
            ]}
          >
            Voir tout
          </Text>
          <ArrowRight size={14} color={theme.colors.pillar.savings} />
        </Pressable>
      </View>

      {recentTransactions.length === 0 ? (
        <Card style={styles.emptyCard} variant="subtle">
          <Receipt size={32} color={theme.colors.text.muted} />
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.text.secondary, marginTop: 8 },
            ]}
          >
            Aucune opération ce mois-ci
          </Text>
          <Pressable
            onPress={openQuickEntry}
            style={[
              styles.quickAddButton,
              {
                backgroundColor: theme.colors.pillar.savings,
                borderRadius: theme.radii.full,
                marginTop: theme.spacing.md,
              },
            ]}
          >
            <PlusCircle size={16} color="#FFFFFF" />
            <Text
              style={[
                theme.typography.caption,
                { color: '#FFFFFF', fontWeight: '700', marginLeft: 6 },
              ]}
            >
              Ajouter une dépense
            </Text>
          </Pressable>
        </Card>
      ) : (
        <Card style={styles.transactionsCard} padded={false}>
          {recentTransactions.map((tx, index) => {
            const isLast = index === recentTransactions.length - 1;
            const dateStr = new Date(tx.date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            });
            const isIncome = tx.type === 'income';
            const isRefund = tx.type === 'refund';
            const hasRefund =
              tx.type === 'expense' && Boolean(tx.refundedAmount && tx.refundedAmount > 0);

            return (
              <Pressable
                key={tx.id}
                onPress={() => setSelectedTx(tx)}
                style={({ pressed }) => [
                  styles.txItem,
                  { opacity: pressed ? 0.7 : 1 },
                  !isLast && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border.subtle,
                  },
                ]}
              >
                <View
                  style={[
                    styles.txDot,
                    {
                      backgroundColor: isRefund
                        ? theme.colors.pillar.savings
                        : getPillarColor(tx.pillarId),
                      borderRadius: theme.radii.full,
                    },
                  ]}
                />
                <View style={styles.txMain}>
                  <Text
                    style={[
                      theme.typography.body,
                      { color: theme.colors.text.primary, fontWeight: '500' },
                    ]}
                    numberOfLines={1}
                  >
                    {tx.title}
                  </Text>
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.text.secondary, marginTop: 2 },
                    ]}
                  >
                    {isRefund ? `Remboursement · ` : ''}{tx.category} · {dateStr}
                    {hasRefund ? ` · Remboursé ${formatCurrency(tx.refundedAmount || 0, currency)}` : ''}
                  </Text>
                </View>
                <Text
                  style={[
                    theme.typography.body,
                    theme.typography.tabularNums,
                    {
                      color: isIncome
                        ? theme.colors.status.income
                        : isRefund
                        ? theme.colors.pillar.savings
                        : theme.colors.text.primary,
                      fontWeight: '600',
                    },
                  ]}
                >
                  {isIncome || isRefund ? '+' : '-'}
                  {formatCurrency(tx.amount, currency)}
                </Text>
              </Pressable>
            );
          })}
        </Card>
      )}

      {/* Transaction Detail & Edit Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        visible={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
      />

      {/* Monthly Overview Modal */}
      <MonthlyOverviewModal
        visible={showMonthlyOverview}
        onClose={() => setShowMonthlyOverview(false)}
        onSelectPeriod={(key) => setPeriodKey(key)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  periodNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navArrow: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  analyticsBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    marginBottom: 12,
  },
  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroLeftCol: {
    flex: 1,
  },
  dailyBadgeRight: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'flex-end',
    borderWidth: 1,
    minWidth: 110,
  },
  dailyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  heroStripItem: {
    flex: 1,
  },
  stripLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stripDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 16,
  },
  chartSection: {
    alignItems: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    flexWrap: 'nowrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  legendDot: {
    width: 8,
    height: 8,
    marginRight: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  transactionsCard: {
    marginBottom: 12,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  txDot: {
    width: 10,
    height: 10,
    marginRight: 12,
  },
  txMain: {
    flex: 1,
  },
});
