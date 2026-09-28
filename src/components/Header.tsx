import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  rightAction,
  leftAction,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { marginBottom: theme.spacing.lg }, style]}>
      <View style={styles.row}>
        {leftAction && <View style={styles.actionLeft}>{leftAction}</View>}
        <View style={styles.textContainer}>
          <Text
            style={[
              theme.typography.title1,
              { color: theme.colors.text.primary },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.text.secondary, marginTop: theme.spacing.xs },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightAction && <View style={styles.actionRight}>{rightAction}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
  },
  actionLeft: {
    marginRight: 12,
  },
  actionRight: {
    marginLeft: 12,
  },
});
