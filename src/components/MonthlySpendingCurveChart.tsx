import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, GestureResponderEvent } from 'react-native';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Transaction } from '../types/budget';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../services/budgetEngine';

export interface MonthlySpendingCurveChartProps {
  transactions: Transaction[];
  totalIncome: number;
  periodKey: string;
  currency?: string;
  width?: number;
  height?: number;
}

export const MonthlySpendingCurveChart: React.FC<MonthlySpendingCurveChartProps> = ({
  transactions,
  totalIncome,
  periodKey,
  currency = '€',
  width = 330,
  height = 200,
}) => {
  const { theme } = useTheme();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [yearStr, monthStr] = periodKey.split('-');
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const month = parseInt(monthStr, 10) || new Date().getMonth() + 1;
  const totalDays = new Date(year, month, 0).getDate();

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const currentDay = isCurrentMonth ? Math.min(now.getDate(), totalDays) : totalDays;
  const daysLimit = isCurrentMonth ? currentDay : totalDays;

  // Compute daily cumulative spending
  const { cumulativeByDay, totalSpent } = useMemo(() => {
    const dailyNet: Record<number, number> = {};
    for (const t of transactions) {
      if (!t.date || t.date.slice(0, 7) !== periodKey) continue;
      const day = new Date(t.date).getDate();
      if (t.type === 'expense') {
        dailyNet[day] = (dailyNet[day] || 0) + (t.amount || 0);
      } else if (t.type === 'refund') {
        dailyNet[day] = (dailyNet[day] || 0) - (t.amount || 0);
      }
    }

    const cumulative: Record<number, number> = {};
    let rolling = 0;
    for (let d = 1; d <= totalDays; d++) {
      rolling += dailyNet[d] || 0;
      cumulative[d] = Math.max(0, rolling);
    }

    const spent = cumulative[daysLimit] || 0;
    return { cumulativeByDay: cumulative, totalSpent: spent };
  }, [transactions, periodKey, totalDays, daysLimit]);

  // Chart layout geometry
  const paddingLeft = 14;
  const paddingRight = 14;
  const paddingTop = 24;
  const paddingBottom = 28;

  const chartWidth = Math.max(10, width - paddingLeft - paddingRight);
  const chartHeight = Math.max(10, height - paddingTop - paddingBottom);

  const maxSpent = Math.max(...Object.values(cumulativeByDay), 0);
  const maxY = Math.max(totalIncome, maxSpent, 100) * 1.12;

  const getX = (day: number) => paddingLeft + ((day - 1) / Math.max(1, totalDays - 1)) * chartWidth;
  const getY = (val: number) => paddingTop + chartHeight - (Math.max(0, val) / maxY) * chartHeight;

  // Build points array for days 1 .. daysLimit
  const points = useMemo(() => {
    const pts: { day: number; spent: number; x: number; y: number }[] = [];
    for (let d = 1; d <= daysLimit; d++) {
      const spent = cumulativeByDay[d] || 0;
      pts.push({
        day: d,
        spent,
        x: getX(d),
        y: getY(spent),
      });
    }
    return pts;
  }, [daysLimit, cumulativeByDay, chartWidth, chartHeight, maxY]);

  // Build smooth bezier path
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

  const areaPath = useMemo(() => {
    if (points.length < 2 || !linePath) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const bottomY = (paddingTop + chartHeight).toFixed(1);
    return `${linePath} L ${last.x.toFixed(1)} ${bottomY} L ${first.x.toFixed(1)} ${bottomY} Z`;
  }, [points, linePath, paddingTop, chartHeight]);

  // Touch handler to detect selected day
  const handleTouch = (event: GestureResponderEvent) => {
    const locX = event.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, (locX - paddingLeft) / chartWidth));
    const day = Math.max(1, Math.min(daysLimit, Math.round(1 + ratio * (totalDays - 1))));
    setSelectedDay((prev) => (prev === day ? null : day));
  };

  const selectedPoint = useMemo(() => {
    if (selectedDay === null) return null;
    return points.find((p) => p.day === selectedDay) || null;
  }, [selectedDay, points]);

  const todayPoint = useMemo(() => {
    if (!isCurrentMonth) return null;
    return points.find((p) => p.day === currentDay) || null;
  }, [isCurrentMonth, currentDay, points]);

  const yIncome = totalIncome > 0 ? getY(totalIncome) : null;
  const spendingColor = theme.colors.pillar.wants;
  const incomeColor = theme.colors.status.income;

  return (
    <View style={[styles.container, { width }]}>
      {/* Interactive Touch Container for Chart */}
      <Pressable onPress={handleTouch} style={{ width, height, position: 'relative' }}>
        <Svg width={width} height={height} pointerEvents="none">
          <Defs>
            <LinearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={spendingColor} stopOpacity={0.28} />
              <Stop offset="80%" stopColor={spendingColor} stopOpacity={0.03} />
              <Stop offset="100%" stopColor={spendingColor} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* Bottom baseline */}
          <Line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={paddingLeft + chartWidth}
            y2={paddingTop + chartHeight}
            stroke={theme.colors.border.subtle}
            strokeWidth={1}
          />

          {/* Income Ceiling Reference Line */}
          {yIncome !== null && (
            <Line
              x1={paddingLeft}
              y1={yIncome}
              x2={paddingLeft + chartWidth}
              y2={yIncome}
              stroke={incomeColor}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          )}

          {/* Gradient Area under curve */}
          {areaPath.length > 0 && <Path d={areaPath} fill="url(#spendingGradient)" />}

          {/* Spending Curve */}
          {linePath.length > 0 && (
            <Path
              d={linePath}
              stroke={spendingColor}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Current Day Marker (if current month) */}
          {todayPoint && (
            <>
              <Circle
                cx={todayPoint.x}
                cy={todayPoint.y}
                r={7}
                fill={spendingColor}
                fillOpacity={0.25}
              />
              <Circle
                cx={todayPoint.x}
                cy={todayPoint.y}
                r={4}
                fill={spendingColor}
                stroke="#FFFFFF"
                strokeWidth={1.5}
              />
            </>
          )}

          {/* Selected Day Cursor Line & Point */}
          {selectedPoint && (
            <>
              <Line
                x1={selectedPoint.x}
                y1={paddingTop}
                x2={selectedPoint.x}
                y2={paddingTop + chartHeight}
                stroke={theme.colors.text.muted}
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.8}
              />
              <Circle
                cx={selectedPoint.x}
                cy={selectedPoint.y}
                r={5.5}
                fill={theme.colors.bg.surface}
                stroke={spendingColor}
                strokeWidth={2.5}
              />
            </>
          )}
        </Svg>

        {/* Floating Tooltip when day is touched */}
        {selectedPoint && (
          <View
            pointerEvents="none"
            style={[
              styles.tooltip,
              {
                backgroundColor: theme.colors.bg.surface,
                borderColor: theme.colors.border.subtle,
                left: Math.max(8, Math.min(width - 120, selectedPoint.x - 55)),
                top: Math.max(2, selectedPoint.y - 48),
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 5,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.text.secondary, fontSize: 10, fontWeight: '600' },
              ]}
            >
              Jour {selectedPoint.day}
            </Text>
            <Text
              style={[
                theme.typography.caption,
                theme.typography.tabularNums,
                { color: theme.colors.text.primary, fontWeight: '700', fontSize: 12 },
              ]}
            >
              {formatCurrency(selectedPoint.spent, currency)}
            </Text>
          </View>
        )}
      </Pressable>

      {/* X-Axis day markers */}
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

      {/* Clean Legends Row */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLineDashed, { borderColor: incomeColor }]} />
          <Text
            style={[
              theme.typography.caption,
              theme.typography.tabularNums,
              { color: theme.colors.text.secondary, fontWeight: '600', fontSize: 11 },
            ]}
          >
            Revenus {totalIncome > 0 ? `(${formatCurrency(totalIncome, currency)})` : ''}
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendLineSolid, { backgroundColor: spendingColor }]} />
          <Text
            style={[
              theme.typography.caption,
              theme.typography.tabularNums,
              { color: theme.colors.text.secondary, fontWeight: '600', fontSize: 11 },
            ]}
          >
            Dépenses cumulées ({formatCurrency(totalSpent, currency)})
          </Text>
        </View>
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
  tooltip: {
    position: 'absolute',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 90,
    zIndex: 20,
  },
  xAxisRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLineDashed: {
    width: 16,
    height: 0,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  legendLineSolid: {
    width: 14,
    height: 3,
    borderRadius: 2,
  },
});
