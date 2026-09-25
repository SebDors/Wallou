import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Transaction } from '../types/budget';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../services/budgetEngine';

const MONTH_NAMES_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

export interface MonthlySpendingCurveChartProps {
  transactions: Transaction[];
  totalIncome: number;
  periodKey: string;
  currency?: string;
  width?: number;
  height?: number;
  onScrubbingChange?: (isScrubbing: boolean) => void;
}

export const MonthlySpendingCurveChart: React.FC<MonthlySpendingCurveChartProps> = ({
  transactions,
  totalIncome,
  periodKey,
  currency = '€',
  width = 330,
  height = 220,
  onScrubbingChange,
}) => {
  const { theme } = useTheme();

  // Parsing period
  const [yearStr, monthStr] = periodKey.split('-');
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const month = parseInt(monthStr, 10) || new Date().getMonth() + 1;
  const totalDays = new Date(year, month, 0).getDate();

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const currentDay = isCurrentMonth ? Math.min(now.getDate(), totalDays) : totalDays;
  const daysLimit = isCurrentMonth ? currentDay : totalDays;

  // Scrubbing & selection state
  const [scrubbingDay, setScrubbingDay] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const lastHapticDay = useRef<number | null>(null);

  // Compute daily transactions and running net balance:
  // Starts with income at beginning of month, decreases with expenses, increases with new incomes
  const { balanceByDay, dayTransactionsMap, latestBalance } = useMemo(() => {
    const txByDay: Record<number, Transaction[]> = {};
    for (let d = 1; d <= totalDays; d++) {
      txByDay[d] = [];
    }

    for (const t of transactions) {
      if (!t.date || t.date.slice(0, 7) !== periodKey) continue;
      const day = new Date(t.date).getDate();
      if (day >= 1 && day <= totalDays) {
        txByDay[day].push(t);
      }
    }

    const balances: Record<number, number> = {};
    let running = 0;

    for (let d = 1; d <= totalDays; d++) {
      const dayTxs = txByDay[d];
      for (const t of dayTxs) {
        const amt = typeof t.amount === 'number' && !isNaN(t.amount) ? t.amount : 0;
        if (t.type === 'income') {
          running += amt;
        } else if (t.type === 'expense') {
          const refunded = typeof t.refundedAmount === 'number' ? Math.min(amt, t.refundedAmount) : 0;
          running -= (amt - refunded);
        } else if (t.type === 'refund') {
          if (!t.targetExpenseIds || t.targetExpenseIds.length === 0) {
            running += amt;
          }
        }
      }
      balances[d] = Number(running.toFixed(2));
    }

    return {
      balanceByDay: balances,
      dayTransactionsMap: txByDay,
      latestBalance: balances[daysLimit] ?? 0,
    };
  }, [transactions, periodKey, totalDays, daysLimit]);

  // Chart layout geometry
  const paddingLeft = 14;
  const paddingRight = 14;
  const paddingTop = 16;
  const paddingBottom = 24;

  const chartWidth = Math.max(10, width - paddingLeft - paddingRight);
  const chartHeight = Math.max(10, height - paddingTop - paddingBottom);

  const activeBalances = Object.entries(balanceByDay)
    .filter(([d]) => parseInt(d, 10) <= daysLimit)
    .map(([, val]) => val);

  const minVal = Math.min(0, ...activeBalances);
  const maxVal = Math.max(totalIncome, 100, ...activeBalances);
  const range = maxVal - minVal || 1;
  const maxY = maxVal + range * 0.08;
  const minY = Math.min(0, minVal - range * 0.05);

  const getX = (day: number) => paddingLeft + ((day - 1) / Math.max(1, totalDays - 1)) * chartWidth;
  const getY = (val: number) =>
    paddingTop + chartHeight - ((val - minY) / Math.max(1, maxY - minY)) * chartHeight;

  // Build points array for days 1 .. daysLimit
  const points = useMemo(() => {
    const pts: { day: number; balance: number; x: number; y: number }[] = [];
    for (let d = 1; d <= daysLimit; d++) {
      const bal = balanceByDay[d] ?? 0;
      pts.push({
        day: d,
        balance: bal,
        x: getX(d),
        y: getY(bal),
      });
    }
    return pts;
  }, [daysLimit, balanceByDay, chartWidth, chartHeight, maxY, minY]);

  // Build smooth bezier line path
  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  }, [points]);

  const zeroBaselineY = getY(0);

  const areaPath = useMemo(() => {
    if (points.length < 2 || !linePath) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const bottomY = Math.min(paddingTop + chartHeight, zeroBaselineY).toFixed(1);
    return `${linePath} L ${last.x.toFixed(1)} ${bottomY} L ${first.x.toFixed(1)} ${bottomY} Z`;
  }, [points, linePath, paddingTop, chartHeight, zeroBaselineY]);

  // Trade Republic continuous finger scrubbing handlers
  const updateScrubbingPosition = (event: GestureResponderEvent) => {
    const locX = event.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, (locX - paddingLeft) / chartWidth));
    const day = Math.max(1, Math.min(daysLimit, Math.round(1 + ratio * (totalDays - 1))));

    if (day !== lastHapticDay.current) {
      lastHapticDay.current = day;
      try {
        Haptics.selectionAsync();
      } catch {}
    }

    setScrubbingDay(day);
    setSelectedDay(day);
  };

  const handleGrant = (event: GestureResponderEvent) => {
    onScrubbingChange?.(true);
    updateScrubbingPosition(event);
  };

  const handleMove = (event: GestureResponderEvent) => {
    updateScrubbingPosition(event);
  };

  const handleRelease = () => {
    onScrubbingChange?.(false);
    setScrubbingDay(null);
  };

  // Active day info displayed in header & tooltip
  const activeDay = scrubbingDay ?? selectedDay ?? (isCurrentMonth ? currentDay : totalDays);
  const activePoint = points.find((p) => p.day === activeDay) || points[points.length - 1] || null;
  const activeBalance = activePoint ? activePoint.balance : latestBalance;

  // Format date & operations for active day
  const formattedDate = useMemo(() => {
    const monthName = MONTH_NAMES_FR[month - 1] || '';
    if (activeDay === 1) return `1er ${monthName}`;
    return `${activeDay} ${monthName}`;
  }, [activeDay, month]);

  const operationsSummary = useMemo(() => {
    const txs = dayTransactionsMap[activeDay] || [];
    if (txs.length === 0) {
      return 'Aucune opération ce jour';
    }

    return txs
      .map((t) => {
        const isInc = t.type === 'income';
        const sign = isInc ? '+' : '-';
        const netAmt = t.type === 'expense' && t.refundedAmount
          ? Math.max(0, t.amount - t.refundedAmount)
          : t.amount;
        return `${sign}${formatCurrency(netAmt, currency)} ${t.title || t.category}`;
      })
      .join(' • ');
  }, [activeDay, dayTransactionsMap, currency]);

  const isScrubbingActive = scrubbingDay !== null;
  const balanceColor = activeBalance >= 0 ? theme.colors.status.income : theme.colors.status.overrun;

  return (
    <View style={[styles.container, { width }]}>
      {/* 1. Trade Republic Interactive Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text
            style={[
              theme.typography.caption,
              { color: isScrubbingActive ? theme.colors.text.primary : theme.colors.text.secondary, fontWeight: '600' },
            ]}
          >
            {isScrubbingActive ? `Solde au ${formattedDate}` : `Solde disponible (${formattedDate})`}
          </Text>

          {isScrubbingActive && (
            <View
              style={[
                styles.liveBadge,
                { backgroundColor: theme.colors.bg.surfaceSubtle, borderRadius: theme.radii.full },
              ]}
            >
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.text.secondary, fontSize: 10, fontWeight: '700' },
                ]}
              >
                SCRUB
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[
            theme.typography.title1,
            theme.typography.tabularNums,
            { color: balanceColor, fontWeight: '800', fontSize: 24, marginTop: 1 },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatCurrency(activeBalance, currency)}
        </Text>

        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.text.secondary, fontSize: 11, marginTop: 2 },
          ]}
          numberOfLines={1}
        >
          {operationsSummary}
        </Text>
      </View>

      {/* 2. Interactive SVG Curve with Gesture Responder */}
      <View
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={handleGrant}
        onResponderMove={handleMove}
        onResponderRelease={handleRelease}
        onResponderTerminate={handleRelease}
        style={{ width, height, position: 'relative' }}
      >
        <Svg width={width} height={height} pointerEvents="none">
          <Defs>
            <LinearGradient id="trBalanceGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={theme.colors.status.income} stopOpacity={0.32} />
              <Stop offset="80%" stopColor={theme.colors.status.income} stopOpacity={0.04} />
              <Stop offset="100%" stopColor={theme.colors.status.income} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* Zero baseline */}
          <Line
            x1={paddingLeft}
            y1={zeroBaselineY}
            x2={paddingLeft + chartWidth}
            y2={zeroBaselineY}
            stroke={theme.colors.border.subtle}
            strokeWidth={1}
            strokeDasharray="4 4"
          />

          {/* Gradient Area under balance curve */}
          {areaPath.length > 0 && <Path d={areaPath} fill="url(#trBalanceGradient)" />}

          {/* Main Net Balance Curve */}
          {linePath.length > 0 && (
            <Path
              d={linePath}
              stroke={theme.colors.status.income}
              strokeWidth={2.75}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Vertical cursor & active point on curve */}
          {activePoint && (
            <>
              <Line
                x1={activePoint.x}
                y1={paddingTop}
                x2={activePoint.x}
                y2={paddingTop + chartHeight}
                stroke={theme.colors.text.secondary}
                strokeWidth={1.5}
                strokeDasharray="3 3"
                opacity={0.8}
              />
              <Circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={7}
                fill={theme.colors.status.income}
                fillOpacity={0.25}
              />
              <Circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={4}
                fill={theme.colors.bg.surface}
                stroke={theme.colors.status.income}
                strokeWidth={2.5}
              />
            </>
          )}
        </Svg>

        {/* Floating Tooltip indicator on active point */}
        {activePoint && (isScrubbingActive || selectedDay !== null) && (
          <View
            pointerEvents="none"
            style={[
              styles.tooltip,
              {
                backgroundColor: theme.colors.bg.surface,
                borderColor: theme.colors.border.subtle,
                left: Math.max(8, Math.min(width - 110, activePoint.x - 50)),
                top: Math.max(0, activePoint.y - 42),
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 6,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.text.secondary, fontSize: 10, fontWeight: '600' },
              ]}
            >
              {formattedDate}
            </Text>
            <Text
              style={[
                theme.typography.caption,
                theme.typography.tabularNums,
                { color: balanceColor, fontWeight: '700', fontSize: 12 },
              ]}
            >
              {formatCurrency(activePoint.balance, currency)}
            </Text>
          </View>
        )}
      </View>

      {/* 3. X-Axis Day Markers */}
      <View style={[styles.xAxisRow, { paddingHorizontal: paddingLeft }]}>
        <Text style={[theme.typography.caption, { color: theme.colors.text.muted, fontSize: 10 }]}>
          J 1
        </Text>
        <Text style={[theme.typography.caption, { color: theme.colors.text.muted, fontSize: 10 }]}>
          J 10
        </Text>
        <Text style={[theme.typography.caption, { color: theme.colors.text.muted, fontSize: 10 }]}>
          J 20
        </Text>
        <Text style={[theme.typography.caption, { color: theme.colors.text.muted, fontSize: 10 }]}>
          J {totalDays}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  header: {
    width: '100%',
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tooltip: {
    position: 'absolute',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 85,
    zIndex: 20,
  },
  xAxisRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
});
