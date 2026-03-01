import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";

type ColorScheme = "dark" | "light";

interface ThemeContextValue {
  colorScheme: ColorScheme;
  toggleTheme: () => void;
  colors: typeof Colors.dark;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "@biohack_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>("dark");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === "light" || val === "dark") setColorScheme(val);
    });
  }, []);

  const toggleTheme = async () => {
    const next = colorScheme === "dark" ? "light" : "dark";
    setColorScheme(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const value = useMemo(
    () => ({ colorScheme, toggleTheme, colors, isDark }),
    [colorScheme, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
