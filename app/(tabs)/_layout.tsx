import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import { PieChart, ArrowLeftRight, Plus, Repeat, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useQuickEntry } from '../../src/context/QuickEntryContext';

interface TabBarItemProps {
  label: string;
  icon: (color: string) => React.ReactNode;
  isActive: boolean;
  onPress: () => void;
}

function TabBarItem({ label, icon, isActive, onPress }: TabBarItemProps) {
  const { theme } = useTheme();
  const color = isActive ? theme.colors.text.primary : theme.colors.text.muted;

  return (
    <Pressable onPress={onPress} style={styles.tabItem}>
      {icon(color)}
      <Text
        style={[
          theme.typography.caption,
          {
            color,
            fontWeight: isActive ? '600' : '500',
            marginTop: 4,
            fontSize: 11,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { openQuickEntry } = useQuickEntry();

  const currentRouteName = state.routes[state.index]?.name;

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          backgroundColor: theme.colors.bg.surface,
          borderTopColor: theme.colors.border.subtle,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 64 + Math.max(insets.bottom, 8),
        },
      ]}
    >
      {/* Tab 1: Dashboard (Aperçu) */}
      <TabBarItem
        label="Aperçu"
        icon={(color) => <PieChart size={20} color={color} />}
        isActive={currentRouteName === 'index'}
        onPress={() => navigation.navigate('index')}
      />

      {/* Tab 2: Transactions (Opérations) */}
      <TabBarItem
        label="Opérations"
        icon={(color) => <ArrowLeftRight size={20} color={color} />}
        isActive={currentRouteName === 'transactions'}
        onPress={() => navigation.navigate('transactions')}
      />

      {/* Center [+] Quick Entry Button */}
      <View style={styles.centerButtonWrapper}>
        <Pressable
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch {}
            openQuickEntry();
          }}
          style={({ pressed }) => [
            styles.centerButton,
            {
              backgroundColor: theme.colors.pillar.savings,
              borderRadius: theme.radii.full,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Tab 3: Recurrences (Fixes) */}
      <TabBarItem
        label="Fixes"
        icon={(color) => <Repeat size={20} color={color} />}
        isActive={currentRouteName === 'recurrences'}
        onPress={() => navigation.navigate('recurrences')}
      />

      {/* Tab 4: Settings (Réglages) */}
      <TabBarItem
        label="Réglages"
        icon={(color) => <Settings size={20} color={color} />}
        isActive={currentRouteName === 'settings'}
        onPress={() => navigation.navigate('settings')}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Aperçu' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Opérations' }} />
      <Tabs.Screen name="recurrences" options={{ title: 'Fixes' }} />
      <Tabs.Screen name="settings" options={{ title: 'Réglages' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  centerButtonWrapper: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 4,
  },
});
