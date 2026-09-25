import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { PillarId } from '../types/budget';
import { useTheme } from '../context/ThemeContext';

export interface DonutChartProps {
  needsSpent: number;
  wantsSpent: number;
  savingsSpent: number;
  needsAllocated?: number;
  wantsAllocated?: number;
  savingsAllocated?: number;
  ratios?: { needs: number; wants: number; savings: number };
  centerLabel?: string;
  centerValue?: string;
  onSelectPillar?: (pillar: PillarId) => void;
  size?: number;
  strokeWidth?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  needsSpent,
  wantsSpent,
  savingsSpent,
  needsAllocated,
  wantsAllocated,
  savingsAllocated,
  ratios = { needs: 50, wants: 30, savings: 20 },
  centerLabel = 'Reste à vivre',
  centerValue,
  onSelectPillar,
  size = 200,
  strokeWidth = 16,
}) => {
  const { theme } = useTheme();

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 3; // Gap in pixels between allocated segments

  // Order requested by user:
  // Green (Needs) on LEFT (12h to 6h)
  // Orange (Wants) at BOTTOM (6h to bottom-right)
  // Blue (Savings) on RIGHT (bottom-right to 12h)
  // Direction: Counter-clockwise / Trigonometric (anti-horaire) starting from top (12h).
  const totalRatio = (ratios.needs + ratios.wants + ratios.savings) || 100;

  const pillarData = [
    {
      pillar: 'needs' as PillarId,
      spent: Math.max(0, needsSpent),
      allocated: needsAllocated ?? 0,
      ratio: ratios.needs,
      color: theme.colors.pillar.needs,
    },
    {
      pillar: 'wants' as PillarId,
      spent: Math.max(0, wantsSpent),
      allocated: wantsAllocated ?? 0,
      ratio: ratios.wants,
      color: theme.colors.pillar.wants,
    },
    {
      pillar: 'savings' as PillarId,
      spent: Math.max(0, savingsSpent),
      allocated: savingsAllocated ?? 0,
      ratio: ratios.savings,
      color: theme.colors.pillar.savings,
    },
  ];

  // Calculate angles for each pillar in counter-clockwise direction
  let currentEndAngle = -90; // Top of circle is -90 deg
  const segments = pillarData.map((p) => {
    const allocatedAngle = (p.ratio / totalRatio) * 360;
    const allocatedLength = (allocatedAngle / 360) * circumference;

    // Start angle in clockwise convention that draws backwards from currentEndAngle to (currentEndAngle - allocatedAngle)
    const allocatedStartAngle = currentEndAngle - allocatedAngle;

    // Portion spent
    const usageFraction = p.allocated > 0
      ? Math.min(1, p.spent / p.allocated)
      : (p.spent > 0 ? 1 : 0);
    const spentAngle = allocatedAngle * usageFraction;
    const spentLength = (spentAngle / 360) * circumference;
    const spentStartAngle = currentEndAngle - spentAngle;

    // Update currentEndAngle for next pillar
    currentEndAngle -= allocatedAngle;

    return {
      ...p,
      allocatedAngle,
      allocatedLength,
      allocatedStartAngle,
      usageFraction,
      spentLength,
      spentStartAngle,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background track circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.colors.bg.surfaceSubtle}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Layer 1: Translucent allocated slot arcs (50%, 30%, 20%) */}
        {segments.map((seg) => {
          if (seg.allocatedLength <= 0) return null;
          const dashLength = Math.max(0, seg.allocatedLength - gap);
          return (
            <Circle
              key={`alloc-${seg.pillar}`}
              cx={center}
              cy={center}
              r={radius}
              stroke={seg.color}
              strokeOpacity={0.25}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference}`}
              strokeDashoffset={0}
              rotation={seg.allocatedStartAngle}
              origin={`${center}, ${center}`}
              fill="transparent"
              onPress={() => onSelectPillar?.(seg.pillar)}
            />
          );
        })}

        {/* Layer 2: Real spent progress arcs */}
        {segments.map((seg) => {
          if (seg.spentLength <= 0) return null;
          const dashLength = Math.max(
            0,
            seg.spentLength - (seg.usageFraction >= 1 ? gap : 0)
          );
          return (
            <Circle
              key={`spent-${seg.pillar}`}
              cx={center}
              cy={center}
              r={radius}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference}`}
              strokeDashoffset={0}
              rotation={seg.spentStartAngle}
              origin={`${center}, ${center}`}
              fill="transparent"
              onPress={() => onSelectPillar?.(seg.pillar)}
            />
          );
        })}
      </Svg>

      {/* Center content */}
      <View style={styles.centerOverlay} pointerEvents="box-none">
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 },
          ]}
          numberOfLines={1}
        >
          {centerLabel}
        </Text>
        <Text
          style={[
            theme.typography.title2,
            theme.typography.tabularNums,
            { color: theme.colors.text.primary, fontWeight: '700', marginTop: 2, fontSize: 18 },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {centerValue || '0,00 €'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    alignSelf: 'center',
  },
  centerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
});
