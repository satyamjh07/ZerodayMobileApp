import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { THEMES, ThemeName, ColorPalette } from "@/constants/colors";

const THEME_KEY = "sa_theme";

type ThemeContextType = {
  themeName: ThemeName;
  colors: ColorPalette & { radius: number };
  setTheme: (name: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>("dark");

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val && val in THEMES) setThemeName(val as ThemeName);
    });
  }, []);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeName(name);
    AsyncStorage.setItem(THEME_KEY, name);
  }, []);

  const colors = { ...THEMES[themeName], radius: 12 };

  return (
    <ThemeContext.Provider value={{ themeName, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
