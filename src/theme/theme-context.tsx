import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { themePresets, ThemePreset } from "./presets";

type ThemeContextValue = {
  preset: ThemePreset;
  presets: ThemePreset[];
  setTheme: (id: string) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const DEFAULT_THEME_ID = "default";
export const THEME_STORAGE_KEY = "tickclone.theme";

export function resolvePreset(id: string | null | undefined): ThemePreset {
  return themePresets.find((p) => p.id === id) ?? themePresets.find((p) => p.id === DEFAULT_THEME_ID)!;
}

export function readStoredTheme(storage: Pick<Storage, "getItem"> | null): string {
  const stored = storage?.getItem(THEME_STORAGE_KEY);
  return stored ?? DEFAULT_THEME_ID;
}

export function applyTheme(preset: ThemePreset) {
  const style = document.documentElement.style;
  style.setProperty("--theme-primary", preset.color);
  style.setProperty("--theme-aside-bg", preset.asideBg ?? preset.color);
  style.setProperty("--theme-input-border", preset.inputBorder ?? preset.color);
  style.setProperty("--theme-sidebar-bg", preset.sidebarBg ?? preset.color)
  style.setProperty("--theme-sidebar-item-active", preset.sidebarItemActive ?? preset.color);
  
}

type ThemeProviderProps = { children: React.ReactNode };

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_THEME_ID;
    return readStoredTheme(window.localStorage);
  });

  const preset = useMemo(() => resolvePreset(activeId), [activeId]);

  useEffect(() => {
    applyTheme(preset);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, preset.id);
    }
  }, [preset]);

  const value = useMemo(
    () => ({
      preset,
      presets: themePresets,
      setTheme: setActiveId
    }),
    [preset]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
