import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
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
  const gap = 3; // gap in pixels between segments

  // Order requested: Needs (Green, Left) -> Wants (Orange, Bottom/Center) -> Savings (Blue, Right)
  // Trigonometric / Counter-Clockwise orientation:
  // Starting at Top (12 o'clock, which is -90deg in standard SVG), CCW means going towards Left (9 o'clock)
  const pillarConfigs: {
    pillar: PillarId;
    spent: number;
    allocated: number;
    ratio: number;
    color: string;
    lightColor: string;
  }[] = [
    {
      pillar: 'needs',
      spent: Math.max(0, needsSpent),
      allocated: needsAllocated ?? 0,
      ratio: ratios.needs,
      color: theme.colors.pillar.needs,
      lightColor: theme.colors.pillar.needsBg,
    },
    {
      pillar: 'wants',
      spent: Math.max(0, wantsSpent),
      allocated: wantsAllocated ?? 0,
      ratio: ratios.wants,
      color: theme.colors.pillar.wants,
      lightColor: theme.colors.pillar.wantsBg,
    },
    {
      pillar: 'savings',
      spent: Math.max(0, savingsSpent),
      allocated: savingsAllocated ?? 0,
      ratio: ratios.savings,
      color: theme.colors.pillar.savings,
      lightColor: theme.colors.pillar.savingsBg,
    },
  ];

  // Normalized allocation percentages summing to 100
  const totalRatio = (ratios.needs + ratios.wants + ratios.savings) || 100;
  const allocationShares = pillarConfigs.map((cfg) => ({
    ...cfg,
    allocationPercent: (cfg.ratio / totalRatio) * 100,
  }));

  // We can calculate each segment's start angle (accumulated)
  let accumulatedRatio = 0;
  const segmentsWithPositions = allocationShares.map((seg) => {
    const startRatio = accumulatedRatio;
    accumulatedRatio += seg.allocationPercent;

    // What portion of this pillar is spent?
    // If allocated > 0, spentRatio = min(1, spent / allocated)
    // If allocated == 0 and spent > 0, we treat it as 100% used of its visual slot
    const usageFraction = seg.allocated > 0
      ? Math.min(1, seg.spent / seg.allocated)
      : (seg.spent > 0 ? 1 : 0);

    const spentPercentOfCircle = (seg.allocationPercent * usageFraction);

    return {
      ...seg,
      startRatio,
      spentPercentOfCircle,
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

        {/* 
          Trigonometric / Counter-Clockwise rendering:
          In SVG, standard circle angles go clockwise with positive dashoffset.
          Applying scale(-1, 1) around center mirrors horizontally, turning clockwise
          into counter-clockwise (Left first)!
          Combined with -90deg rotation, starting at top (12h) goes towards 9h (left, green) -> 6h (wants) -> 3h (savings, right).
        */}
        <G rotation="-90" origin={`${center}, ${center}`} scaleX={-1} scaleY={1} x={-size} y={0}>
          {/* Layer 1: Translucent / lighter allocation slots (50%, 30%, 20%) */}
          {segmentsWithPositions.map((seg) => {
            if (seg.allocationPercent <= 0) return null;
            const strokeLength = (seg.allocationPercent / 100) * circumference;
            const dashArray = `${Math.max(0, strokeLength - gap)} ${circumference}`;
            const strokeOffset = -((seg.startRatio / 100) * circumference);

            return (
              <Circle
                key={`alloc-${seg.pillar}`}
                cx={center}
                cy={center}
                r={radius}
                stroke={seg.color}
                strokeOpacity={0.22}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                fill="transparent"
                onPress={() => onSelectPillar?.(seg.pillar)}
              />
            );
          })}

          {/* Layer 2: Real spent progress within the allocated slots */}
          {segmentsWithPositions.map((seg) => {
            if (seg.spentPercentOfCircle <= 0) return null;
            const strokeLength = (seg.spentPercentOfCircle / 100) * circumference;
            const dashArray = `${Math.max(0, strokeLength - (seg.spentPercentOfCircle >= seg.allocationPercent ? gap : 0))} ${circumference}`;
            const strokeOffset = -((seg.startRatio / 100) * circumference);

            return (
              <Circle
                key={`spent-${seg.pillar}`}
                cx={center}
                cy={center}
                r={radius}
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                fill="transparent"
                onPress={() => onSelectPillar?.(seg.pillar)}
              />
            );
          })}
        </G>
      </Svg>

      {/* Center content */}
      <View style={styles.centerOverlay} pointerEvents="box-none">
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
          ]}
          numberOfLines={1}
        >
          {centerLabel}
        </Text>
        {centerValue !== undefined && (
          <Text
            style={[
              theme.typography.title2,
              theme.typography.tabularNums,
              { color: theme.colors.text.primary, fontWeight: '700', marginTop: 2 },
            ]}
            numberOfLines={1}
          >
            {centerValue}
          </Text>
        )}
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
