"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "dark" | "light" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  cycleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const themeStorageKey = "smart-campus-theme";

function readStoredTheme(): Theme {
  try {
    const storedTheme = window.localStorage.getItem(themeStorageKey);
    return storedTheme === "dark" ||
      storedTheme === "light" ||
      storedTheme === "system"
      ? storedTheme
      : "system";
  } catch {
    return "system";
  }
}

function applyTheme(theme: Theme, systemTheme: "dark" | "light") {
  const resolvedTheme = theme === "system" ? systemTheme : theme;
  const root = document.documentElement;
  root.classList.toggle("dark", resolvedTheme === "dark");
  root.classList.toggle("light", resolvedTheme === "light");
  root.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const initialSync = window.setTimeout(() => {
      setTheme(readStoredTheme());
    }, 0);
    return () => window.clearTimeout(initialSync);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    function updateResolvedTheme() {
      const systemTheme = media.matches ? "light" : "dark";
      const nextResolvedTheme =
        theme === "system" ? systemTheme : theme;
      setResolvedTheme(nextResolvedTheme);
      applyTheme(theme, systemTheme);
    }

    const initialSync = window.setTimeout(updateResolvedTheme, 0);
    media.addEventListener("change", updateResolvedTheme);
    return () => {
      window.clearTimeout(initialSync);
      media.removeEventListener("change", updateResolvedTheme);
    };
  }, [theme]);

  const cycleTheme = useCallback(() => {
    const nextTheme: Theme =
      theme === "system"
        ? "light"
        : theme === "light"
          ? "dark"
          : "system";
    const systemTheme = window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
    try {
      window.localStorage.setItem(themeStorageKey, nextTheme);
    } catch {
      // Keep the selected theme active for this session if storage is unavailable.
    }
    setTheme(nextTheme);
    setResolvedTheme(nextTheme === "system" ? systemTheme : nextTheme);
    applyTheme(nextTheme, systemTheme);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, cycleTheme }),
    [theme, resolvedTheme, cycleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }
  return context;
}
