import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, GestureResponderEvent } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { PillarId, PILLAR_NAMES } from '../types/budget';
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
  currency?: string;
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
  currency = '€',
  onSelectPillar,
  size = 200,
  strokeWidth = 16,
}) => {
  const { theme } = useTheme();
  const [selectedTooltipPillar, setSelectedTooltipPillar] = useState<PillarId | null>(null);

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

    const midAngle = allocatedStartAngle + allocatedAngle / 2;

    return {
      ...p,
      name: PILLAR_NAMES[p.pillar],
      allocatedAngle,
      allocatedLength,
      allocatedStartAngle,
      midAngle,
      usageFraction,
      spentLength,
      spentStartAngle,
    };
  });

  const handlePillarPress = (pillar: PillarId) => {
    setSelectedTooltipPillar((prev) => (prev === pillar ? null : pillar));
    onSelectPillar?.(pillar);
  };

  const handleContainerPress = (event: GestureResponderEvent) => {
    const locationX = event.nativeEvent?.locationX ?? center;
    const locationY = event.nativeEvent?.locationY ?? center;
    const dx = locationX - center;
    const dy = locationY - center;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Inner radius boundary: inside the hole taps dismiss tooltip
    const innerRadius = radius - strokeWidth / 2;
    if (distance < innerRadius) {
      if (selectedTooltipPillar) {
        setSelectedTooltipPillar(null);
      }
      return;
    }

    // Convert touch to angle in degrees [0, 360) where 0° is 3 o'clock and increases clockwise
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    const normalizedTouch = ((angleDeg % 360) + 360) % 360;

    // Detect which pillar arc contains the touch angle
    const clickedSegment = segments.find((seg) => {
      const start = ((seg.allocatedStartAngle % 360) + 360) % 360;
      const sweep = seg.allocatedAngle;
      const diff = ((normalizedTouch - start) % 360 + 360) % 360;
      return diff >= 0 && diff < sweep;
    });

    if (clickedSegment) {
      handlePillarPress(clickedSegment.pillar);
    }
  };

  const activeSegment = useMemo(() => {
    if (!selectedTooltipPillar) return null;
    return segments.find((s) => s.pillar === selectedTooltipPillar) || null;
  }, [selectedTooltipPillar, segments]);

  const bubblePosition = useMemo(() => {
    if (!activeSegment) return null;
    const rad = (activeSegment.midAngle * Math.PI) / 180;
    const dist = radius * 0.58;
    const x = center + dist * Math.cos(rad);
    const y = center + dist * Math.sin(rad);
    return { x, y };
  }, [activeSegment, center, radius]);

  const innerHoleSize = Math.max(0, (radius - strokeWidth / 2) * 2);

  return (
    <Pressable
      onPress={handleContainerPress}
      style={[styles.container, { width: size, height: size }]}
    >
      <Svg width={size} height={size} pointerEvents="none">
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
            />
          );
        })}
      </Svg>

      {/* Floating Tooltip Bubble */}
      {bubblePosition && activeSegment && (
        <Pressable
          onPress={() => setSelectedTooltipPillar(null)}
          style={[
            styles.tooltipBubble,
            {
              backgroundColor: theme.colors.bg.surface,
              borderColor: activeSegment.color,
              left: bubblePosition.x,
              top: bubblePosition.y,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 6,
            },
          ]}
        >
          <View style={[styles.tooltipDot, { backgroundColor: activeSegment.color }]} />
          <Text
            style={[
              theme.typography.caption,
              theme.typography.tabularNums,
              {
                color: theme.colors.text.primary,
                fontWeight: '700',
                fontSize: 11,
              },
            ]}
          >
            {Math.round(activeSegment.spent)}/{Math.round(activeSegment.allocated)} {currency}
          </Text>
        </Pressable>
      )}

      {/* Center content */}
      <View style={styles.centerOverlay} pointerEvents="box-none">
        <Pressable
          onPress={() => setSelectedTooltipPillar(null)}
          style={[
            styles.centerHole,
            {
              width: innerHoleSize,
              height: innerHoleSize,
              borderRadius: innerHoleSize / 2,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 },
            ]}
            numberOfLines={1}
          >
            {activeSegment ? `${activeSegment.name} (${activeSegment.ratio}%)` : centerLabel}
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
            {activeSegment
              ? `${Math.round(activeSegment.spent)} / ${Math.round(activeSegment.allocated)} ${currency}`
              : (centerValue || `0,00 ${currency}`)}
          </Text>
        </Pressable>
      </View>
    </Pressable>
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
  },
  centerHole: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  tooltipBubble: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    transform: [{ translateX: -40 }, { translateY: -12 }],
    zIndex: 10,
    gap: 4,
  },
  tooltipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
