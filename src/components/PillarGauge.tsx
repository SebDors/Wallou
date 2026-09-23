import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Home, Coffee, PiggyBank, AlertTriangle } from 'lucide-react-native';
import { PillarId } from '../types/budget';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../services/budgetEngine';

export interface PillarGaugeProps {
  pillarId: PillarId;
  name: string;
  ratio: number;
  spent: number;
  allocated: number;
  remaining: number;
  isOverBudget: boolean;
  overrunAmount: number;
  currency?: string;
  onPress?: () => void;
}

export const PillarGauge: React.FC<PillarGaugeProps> = ({
  pillarId,
  name,
  ratio,
  spent,
  allocated,
  remaining,
  isOverBudget,
  overrunAmount,
  currency = '€',
  onPress,
}) => {
  const { theme } = useTheme();

  const getPillarColor = () => {
    switch (pillarId) {
      case 'needs':
        return theme.colors.pillar.needs;
      case 'wants':
        return theme.colors.pillar.wants;
      case 'savings':
        return theme.colors.pillar.savings;
    }
  };

  const getPillarBg = () => {
    switch (pillarId) {
      case 'needs':
        return theme.colors.pillar.needsBg;
      case 'wants':
        return theme.colors.pillar.wantsBg;
      case 'savings':
        return theme.colors.pillar.savingsBg;
    }
  };

  const getPillarIcon = () => {
    const iconColor = getPillarColor();
    switch (pillarId) {
      case 'needs':
        return <Home size={18} color={iconColor} />;
      case 'wants':
        return <Coffee size={18} color={iconColor} />;
      case 'savings':
        return <PiggyBank size={18} color={iconColor} />;
    }
  };

  const percent = allocated > 0 ? (spent / allocated) * 100 : spent > 0 ? 100 : 0;
  const clampedFillPercent = Math.min(100, Math.max(0, percent));
  const activeBarColor = isOverBudget ? theme.colors.status.overrun : getPillarColor();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.bg.surface,
          borderColor: isOverBudget
            ? theme.colors.status.overrun
            : theme.colors.border.subtle,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.lg,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: getPillarBg(), borderRadius: theme.radii.sm },
            ]}
          >
            {getPillarIcon()}
          </View>
          <Text
            style={[
              theme.typography.title2,
              { color: theme.colors.text.primary, marginLeft: theme.spacing.sm },
            ]}
          >
            {name}
          </Text>
          <View
            style={[
              styles.ratioBadge,
              {
                backgroundColor: theme.colors.bg.surfaceSubtle,
                borderRadius: theme.radii.full,
                marginLeft: theme.spacing.xs,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.text.secondary, fontWeight: '600' },
              ]}
            >
              {ratio}%
            </Text>
          </View>
        </View>

        <Text
          style={[
            theme.typography.body,
            theme.typography.tabularNums,
            { color: theme.colors.text.secondary },
          ]}
        >
          <Text style={{ color: theme.colors.text.primary, fontWeight: '600' }}>
            {formatCurrency(spent, currency)}
          </Text>
          {' / '}
          {formatCurrency(allocated, currency)}
        </Text>
      </View>

      {/* Progress Track */}
      <View
        style={[
          styles.track,
          {
            backgroundColor: theme.colors.bg.surfaceSubtle,
            borderRadius: theme.radii.sm,
            marginVertical: theme.spacing.md,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${clampedFillPercent}%`,
              backgroundColor: activeBarColor,
              borderRadius: theme.radii.sm,
            },
          ]}
        />
      </View>

      {/* Footer Details */}
      <View style={styles.footerRow}>
        <View style={styles.footerLeft}>
          {isOverBudget ? (
            <View style={styles.alertRow}>
              <AlertTriangle size={14} color={theme.colors.status.overrun} />
              <Text
                style={[
                  theme.typography.caption,
                  theme.typography.tabularNums,
                  {
                    color: theme.colors.status.overrun,
                    fontWeight: '600',
                    marginLeft: 4,
                  },
                ]}
              >
                Dépassé de +{formatCurrency(overrunAmount, currency)}
              </Text>
            </View>
          ) : (
            <Text
              style={[
                theme.typography.caption,
                theme.typography.tabularNums,
                { color: theme.colors.text.secondary },
              ]}
            >
              Reste {formatCurrency(remaining, currency)}
            </Text>
          )}
        </View>

        <Text
          style={[
            theme.typography.caption,
            theme.typography.tabularNums,
            {
              color: isOverBudget
                ? theme.colors.status.overrun
                : theme.colors.text.secondary,
              fontWeight: isOverBudget ? '700' : '500',
            },
          ]}
        >
          {Math.round(percent)}%
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratioBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  track: {
    height: 8,
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
