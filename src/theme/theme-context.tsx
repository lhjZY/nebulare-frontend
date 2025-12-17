import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { themePresets, ThemePreset } from "./presets";

type ThemeContextValue = {
  themeId: string;
  presets: ThemePreset[];
  setTheme: (id: string) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const DEFAULT_THEME_ID = "blue-gradient-theme";
export const THEME_STORAGE_KEY = "tickclone.theme";

export function readStoredTheme(storage: Pick<Storage, "getItem"> | null): string {
  const stored = storage?.getItem(THEME_STORAGE_KEY);
  return stored ?? DEFAULT_THEME_ID;
}

export function applyTheme(themeId: string) {
  // 设置 data-theme 属性，触发 CSS 中对应的主题变量
  document.documentElement.dataset.theme = themeId;

  // 添加过渡效果，使主题切换更平滑
  document.documentElement.style.transition = "background-color 0.3s ease, color 0.3s ease";
}

type ThemeProviderProps = { children: React.ReactNode };

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeId, setThemeId] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_THEME_ID;

    // 添加错误处理，防止 localStorage 不可用时崩溃
    try {
      return readStoredTheme(window.localStorage);
    } catch (error) {
      console.warn("Failed to read theme from localStorage:", error);
      return DEFAULT_THEME_ID;
    }
  });

  useEffect(() => {
    applyTheme(themeId);

    // 持久化到 localStorage，添加错误处理
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
      } catch (error) {
        console.warn("Failed to save theme to localStorage:", error);
      }
    }
  }, [themeId]);

  const value = useMemo(
    () => ({
      themeId,
      presets: themePresets,
      setTheme: setThemeId,
    }),
    [themeId],
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
