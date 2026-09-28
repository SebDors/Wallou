jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import React from 'react';
import { act, create } from 'react-test-renderer';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { darkTheme, lightTheme } from '../src/constants/theme';

let capturedTheme: ReturnType<typeof useTheme> | null = null;

const TestThemeConsumer: React.FC = () => {
  const themeCtx = useTheme();
  capturedTheme = themeCtx;
  return null;
};

describe('ThemeContext & Tokens', () => {
  beforeEach(() => {
    capturedTheme = null;
    jest.clearAllMocks();
  });

  it('exposes accurate Trade Republic Warm design tokens', () => {
    expect(darkTheme.colors.bg.canvas).toBe('#0E121A');
    expect(darkTheme.colors.bg.surface).toBe('#161B26');
    expect(darkTheme.colors.pillar.needs).toBe('#4E9F6E');
    expect(darkTheme.colors.pillar.wants).toBe('#E07A5F');
    expect(darkTheme.colors.pillar.savings).toBe('#5C7CFA');

    expect(lightTheme.colors.bg.canvas).toBe('#F8F9FA');
    expect(lightTheme.colors.bg.surface).toBe('#FFFFFF');
    expect(lightTheme.colors.pillar.needs).toBe('#3B8356');
    expect(lightTheme.colors.pillar.wants).toBe('#C85A3D');
    expect(lightTheme.colors.pillar.savings).toBe('#4263EB');
  });

  it('provides theme context and toggles dark and light modes', async () => {
    await act(async () => {
      create(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );
    });

    expect(capturedTheme).not.toBeNull();

    // Switch to dark
    await act(async () => {
      await capturedTheme?.setThemeMode('dark');
    });

    expect(capturedTheme?.themeMode).toBe('dark');
    expect(capturedTheme?.isDark).toBe(true);
    expect(capturedTheme?.theme.colors.bg.canvas).toBe('#0E121A');

    // Switch to light
    await act(async () => {
      await capturedTheme?.setThemeMode('light');
    });

    expect(capturedTheme?.themeMode).toBe('light');
    expect(capturedTheme?.isDark).toBe(false);
    expect(capturedTheme?.theme.colors.bg.canvas).toBe('#F8F9FA');
  });
});
