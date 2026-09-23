import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Delete } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

export interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onClear?: () => void;
  enableHaptics?: boolean;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onKeyPress,
  onBackspace,
  onClear,
  enableHaptics = true,
}) => {
  const { theme } = useTheme();

  const handlePress = (key: string) => {
    if (enableHaptics) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Safe fallback if haptics is unsupported on web/simulator
      }
    }
    onKeyPress(key);
  };

  const handleBackspace = () => {
    if (enableHaptics) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Safe fallback
      }
    }
    onBackspace();
  };

  const renderKey = (label: string, value: string) => (
    <Pressable
      key={value}
      onPress={() => handlePress(value)}
      style={({ pressed }) => [
        styles.key,
        {
          backgroundColor: pressed
            ? theme.colors.border.subtle
            : theme.colors.bg.surfaceSubtle,
          borderRadius: theme.radii.md,
        },
      ]}
    >
      <Text
        style={[
          theme.typography.title1,
          theme.typography.tabularNums,
          { color: theme.colors.text.primary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        {renderKey('1', '1')}
        {renderKey('2', '2')}
        {renderKey('3', '3')}
      </View>
      <View style={styles.row}>
        {renderKey('4', '4')}
        {renderKey('5', '5')}
        {renderKey('6', '6')}
      </View>
      <View style={styles.row}>
        {renderKey('7', '7')}
        {renderKey('8', '8')}
        {renderKey('9', '9')}
      </View>
      <View style={styles.row}>
        {renderKey(',', '.')}
        {renderKey('0', '0')}
        <Pressable
          onPress={handleBackspace}
          onLongPress={onClear}
          style={({ pressed }) => [
            styles.key,
            {
              backgroundColor: pressed
                ? theme.colors.border.subtle
                : theme.colors.bg.surfaceSubtle,
              borderRadius: theme.radii.md,
            },
          ]}
        >
          <Delete size={24} color={theme.colors.text.primary} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    width: '100%',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  key: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
