import React, { createContext, useContext, useState } from "react";
import { useColorScheme } from "react-native";

export const lightColors = {
  primary: "#0b6efd",
  primaryLight: "#eff6ff",
  secondary: "#0d253f",
  secondaryLight: "#eef2ff",
  background: "#f7f9fc",
  surface: "#ffffff",
  text: "#111827",
  textMuted: "#6b7280",
  textLight: "#ffffff",
  border: "#e5e7eb",
  borderDark: "#d1d5db",
  success: "#15803d",
  successLight: "#eefbf2",
  danger: "#dc2626",
  dangerLight: "#fef2f2",
  warning: "#d97706",
  warningLight: "#fffbeb",
  info: "#2563eb",
  infoLight: "#eff6ff",
};

export const darkColors = {
  primary: "#3b82f6", // Brighter blue for dark mode visibility
  primaryLight: "rgba(59, 130, 246, 0.12)",
  secondary: "#ffffff",
  secondaryLight: "rgba(255, 255, 255, 0.08)",
  background: "#0c0f1d", // Dark navy
  surface: "#181c33", // Lighter container blocks
  text: "#f3f4f6", // Light grey text
  textMuted: "#9ca3af", // Muted grey text
  textLight: "#ffffff",
  border: "#252b47",
  borderDark: "#4b5563",
  success: "#22c55e",
  successLight: "rgba(34, 197, 94, 0.12)",
  danger: "#ef4444",
  dangerLight: "rgba(239, 68, 68, 0.12)",
  warning: "#f59e0b",
  warningLight: "rgba(245, 158, 11, 0.12)",
  info: "#60a5fa",
  infoLight: "rgba(96, 165, 250, 0.12)",
};

export const theme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    huge: 32,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    huge: 28,
    round: 9999,
  },
  typography: {
    titleLarge: {
      fontSize: 32,
      fontWeight: "800",
      lineHeight: 38,
    },
    titleMedium: {
      fontSize: 26,
      fontWeight: "800",
      lineHeight: 32,
    },
    titleSmall: {
      fontSize: 20,
      fontWeight: "700",
      lineHeight: 26,
    },
    bodyLarge: {
      fontSize: 16,
      lineHeight: 24,
    },
    bodyMedium: {
      fontSize: 15,
      lineHeight: 22,
    },
    bodySmall: {
      fontSize: 13,
      lineHeight: 18,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
    },
  },
} as const;

export type ColorsType = typeof lightColors;
export type ThemeType = typeof theme;

type ThemeMode = "system" | "light" | "dark";

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return React.createElement(
    ThemeContext.Provider,
    { value: { themeMode, setThemeMode, toggleTheme } },
    children
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  const systemScheme = useColorScheme();

  const themeMode = context ? context.themeMode : "system";
  const toggleTheme = context ? context.toggleTheme : () => {};
  const setThemeMode = context ? context.setThemeMode : () => {};

  const activeScheme = themeMode === "system" ? systemScheme : themeMode;
  const colors: ColorsType = activeScheme === "dark" ? darkColors : lightColors;

  return {
    colors,
    spacing: theme.spacing,
    borderRadius: theme.borderRadius,
    typography: theme.typography,
    isDark: activeScheme === "dark",
    themeMode,
    toggleTheme,
    setThemeMode,
  };
}
