import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { PillarId } from '../types/budget';
import { useTheme } from '../context/ThemeContext';

export interface DonutChartProps {
  needsSpent: number;
  wantsSpent: number;
  savingsSpent: number;
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
  const gap = 4; // gap in pixels between segments

  const totalSpent = Math.max(0, needsSpent) + Math.max(0, wantsSpent) + Math.max(0, savingsSpent);

  const segments: { pillar: PillarId; amount: number; color: string; percent: number }[] = [
    {
      pillar: 'needs',
      amount: Math.max(0, needsSpent),
      color: theme.colors.pillar.needs,
      percent: totalSpent > 0 ? (Math.max(0, needsSpent) / totalSpent) * 100 : 0,
    },
    {
      pillar: 'wants',
      amount: Math.max(0, wantsSpent),
      color: theme.colors.pillar.wants,
      percent: totalSpent > 0 ? (Math.max(0, wantsSpent) / totalSpent) * 100 : 0,
    },
    {
      pillar: 'savings',
      amount: Math.max(0, savingsSpent),
      color: theme.colors.pillar.savings,
      percent: totalSpent > 0 ? (Math.max(0, savingsSpent) / totalSpent) * 100 : 0,
    },
  ];

  let accumulatedPercent = 0;

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

        {totalSpent > 0 && (
          <G rotation="-90" origin={`${center}, ${center}`}>
            {segments.map((seg) => {
              if (seg.percent <= 0) return null;

              const strokeLength = (seg.percent / 100) * circumference;
              const dashArray = `${Math.max(0, strokeLength - gap)} ${circumference}`;
              const strokeOffset = -((accumulatedPercent / 100) * circumference);

              accumulatedPercent += seg.percent;

              return (
                <Circle
                  key={seg.pillar}
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
        )}
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
