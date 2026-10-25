"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_STORAGE_KEY = "kemix-theme";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    async function loadThemePreference() {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme === "light" || storedTheme === "dark") {
        setThemeState(storedTheme);
        applyTheme(storedTheme);
        return;
      }

      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        if (!response.ok) throw new Error(`Settings request failed (${response.status})`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error?.message || "Failed to load theme preference");
        const configuredTheme = result.data?.settings?.cms?.preferences?.theme;
        const latestStoredTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
        const nextTheme: Theme =
          latestStoredTheme === "light" || latestStoredTheme === "dark"
            ? latestStoredTheme
            : configuredTheme === "dark"
            ? "dark"
            : "light";
        setThemeState(nextTheme);
        applyTheme(nextTheme);
      } catch (error) {
        console.error("Failed to load configured theme; using light theme", error);
        setThemeState("light");
        applyTheme("light");
      }
    }

    loadThemePreference();
  }, []);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [setTheme, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
