import React from 'react';
import { Pressable, Text, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export interface PillProps {
  label: string;
  count?: number;
  isActive?: boolean;
  onPress?: () => void;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const Pill: React.FC<PillProps> = ({
  label,
  count,
  isActive = false,
  onPress,
  accentColor,
  style,
}) => {
  const { theme } = useTheme();

  const activeColor = accentColor || theme.colors.pillar.savings;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          borderRadius: theme.radii.full,
          backgroundColor: isActive
            ? activeColor
            : theme.colors.bg.surfaceSubtle,
          borderColor: isActive ? activeColor : theme.colors.border.subtle,
          borderWidth: 1,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          theme.typography.caption,
          styles.text,
          {
            color: isActive
              ? '#FFFFFF'
              : theme.colors.text.secondary,
            fontWeight: isActive ? '600' : '500',
          },
        ]}
      >
        {label}
      </Text>
      {typeof count === 'number' && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isActive
                ? 'rgba(255, 255, 255, 0.25)'
                : theme.colors.border.subtle,
              marginLeft: theme.spacing.xs,
              borderRadius: theme.radii.full,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: isActive ? '#FFFFFF' : theme.colors.text.muted,
              },
            ]}
          >
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    letterSpacing: 0.2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
