import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme, darkTheme, lightTheme } from '../constants/theme';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../services/storageService';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  theme: AppTheme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let isMounted = true;
    async function loadThemePreference() {
      try {
        const rawSettings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (rawSettings && isMounted) {
          const parsed = JSON.parse(rawSettings);
          if (parsed && (parsed.theme === 'light' || parsed.theme === 'dark' || parsed.theme === 'system')) {
            setThemeModeState(parsed.theme);
          }
        }
      } catch (err) {
        console.warn('Failed to load theme preference from storage:', err);
      }
    }
    loadThemePreference();
    return () => {
      isMounted = false;
    };
  }, []);

  const setThemeMode = useCallback(async (newMode: ThemeMode) => {
    setThemeModeState(newMode);
    try {
      const rawSettings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      let settings = { ...DEFAULT_SETTINGS };
      if (rawSettings) {
        try {
          settings = { ...settings, ...JSON.parse(rawSettings) };
        } catch {
          // ignore corrupted json, fallback to default
        }
      }
      settings.theme = newMode;
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to persist theme preference:', err);
    }
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const theme = useMemo(() => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  const value: ThemeContextType = useMemo(
    () => ({
      theme,
      themeMode,
      isDark,
      setThemeMode,
    }),
    [theme, themeMode, isDark, setThemeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
