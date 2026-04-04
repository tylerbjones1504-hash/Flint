import React, { createContext, useContext, useMemo } from 'react';
import { darkColors, type FlintColors } from './colors';

type ColorScheme = 'light' | 'dark';

interface ThemeContextValue {
  colorScheme: ColorScheme;
  colors: FlintColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: 'dark',
  colors: darkColors,
  isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme: ColorScheme = 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme,
      colors: darkColors,
      isDark: true,
    }),
    [],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useColors() {
  return useContext(ThemeContext).colors;
}
