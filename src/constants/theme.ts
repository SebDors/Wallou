export interface ThemeColors {
  bg: {
    canvas: string;
    surface: string;
    surfaceSubtle: string;
  };
  border: {
    subtle: string;
    focus: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  pillar: {
    needs: string;
    needsBg: string;
    wants: string;
    wantsBg: string;
    savings: string;
    savingsBg: string;
  };
  status: {
    income: string;
    incomeBg: string;
    overrun: string;
    overrunBg: string;
    warning: string;
  };
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
}

export interface ThemeRadii {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface TypographyStyle {
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700';
  lineHeight: number;
}

export interface ThemeTypography {
  display: TypographyStyle;
  title1: TypographyStyle;
  title2: TypographyStyle;
  bodyLarge: TypographyStyle;
  body: TypographyStyle;
  caption: TypographyStyle;
  tabularNums: {
    fontVariant: ('tabular-nums')[];
  };
}

export interface AppTheme {
  isDark: boolean;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  radii: ThemeRadii;
  typography: ThemeTypography;
}

export const SPACING: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
};

export const RADII: ThemeRadii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const TYPOGRAPHY: ThemeTypography = {
  display: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
  },
  title1: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  title2: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  tabularNums: {
    fontVariant: ['tabular-nums'],
  },
};

export const DARK_COLORS: ThemeColors = {
  bg: {
    canvas: '#0E121A',
    surface: '#161B26',
    surfaceSubtle: '#1E2534',
  },
  border: {
    subtle: '#262F42',
    focus: '#5C7CFA',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#94A3B8',
    muted: '#64748B',
  },
  pillar: {
    needs: '#4E9F6E',
    needsBg: 'rgba(78, 159, 110, 0.15)',
    wants: '#E07A5F',
    wantsBg: 'rgba(224, 122, 95, 0.15)',
    savings: '#5C7CFA',
    savingsBg: 'rgba(92, 124, 250, 0.15)',
  },
  status: {
    income: '#34D399',
    incomeBg: 'rgba(52, 211, 153, 0.15)',
    overrun: '#F87171',
    overrunBg: 'rgba(248, 113, 113, 0.15)',
    warning: '#FBBF24',
  },
};

export const LIGHT_COLORS: ThemeColors = {
  bg: {
    canvas: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F3F5',
  },
  border: {
    subtle: '#E5E7EB',
    focus: '#4263EB',
  },
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    muted: '#94A3B8',
  },
  pillar: {
    needs: '#3B8356',
    needsBg: 'rgba(59, 131, 86, 0.12)',
    wants: '#C85A3D',
    wantsBg: 'rgba(200, 90, 61, 0.12)',
    savings: '#4263EB',
    savingsBg: 'rgba(66, 99, 235, 0.12)',
  },
  status: {
    income: '#10B981',
    incomeBg: 'rgba(16, 185, 129, 0.12)',
    overrun: '#EF4444',
    overrunBg: 'rgba(239, 68, 68, 0.12)',
    warning: '#F59E0B',
  },
};

export const darkTheme: AppTheme = {
  isDark: true,
  colors: DARK_COLORS,
  spacing: SPACING,
  radii: RADII,
  typography: TYPOGRAPHY,
};

export const lightTheme: AppTheme = {
  isDark: false,
  colors: LIGHT_COLORS,
  spacing: SPACING,
  radii: RADII,
  typography: TYPOGRAPHY,
};
