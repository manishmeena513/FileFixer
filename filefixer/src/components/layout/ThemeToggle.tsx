"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ThemeMode = "light" | "dark" | "system";

const emptySubscribe = () => () => {};

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";
    try {
      return (localStorage.getItem("filefixer_theme") as ThemeMode) || "dark";
    } catch {
      return "dark";
    }
  });

  const applyTheme = (mode: ThemeMode) => {
    const isDark =
      mode === "dark" ||
      (mode === "system" &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    applyTheme(theme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const current = (localStorage.getItem("filefixer_theme") as ThemeMode) || "dark";
      if (current === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const cycleTheme = () => {
    const next: ThemeMode =
      theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("theme-transitioning");
    }
    setTheme(next);
    localStorage.setItem("filefixer_theme", next);
    applyTheme(next);
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        document.documentElement.classList.remove("theme-transitioning");
      }, 250);
    }
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 sm:h-9 sm:w-9 rounded-xl opacity-50 p-0 flex items-center justify-center cursor-pointer touch-manipulation"
        aria-label="Toggle theme"
      >
        <Moon className="h-4 w-4" />
      </Button>
    );
  }

  const icon =
    theme === "dark" ? (
      <Moon className="h-4 w-4 text-blue-400 transition-transform duration-300" />
    ) : theme === "light" ? (
      <Sun className="h-4 w-4 text-amber-500 transition-transform duration-300" />
    ) : (
      <Laptop className="h-4 w-4 text-[hsl(var(--primary))] transition-transform duration-300" />
    );

  const label =
    theme === "dark"
      ? "Dark Theme"
      : theme === "light"
      ? "Light Theme"
      : "System Theme";

  return (
    <Button
      variant="ghost"
      size={showLabel ? "sm" : "icon"}
      onClick={cycleTheme}
      className={
        showLabel
          ? "h-11 sm:h-9 rounded-xl transition-all hover:bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] gap-2 px-3 flex items-center justify-center cursor-pointer touch-manipulation"
          : "h-11 w-11 sm:h-9 sm:w-9 rounded-xl transition-all hover:bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] gap-2 p-0 flex items-center justify-center cursor-pointer touch-manipulation"
      }
      title={`Theme: ${label} (Click to switch)`}
      aria-label={`Current theme is ${label}. Click to toggle dark, light, or system theme.`}
    >
      {icon}
      {showLabel && <span className="text-xs font-medium">{label}</span>}
    </Button>
  );
}
