"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ThemeMode = "light" | "dark" | "system";

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

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
    setMounted(true);
    const saved = localStorage.getItem("filefixer_theme") as ThemeMode | null;
    const initialTheme: ThemeMode = saved || "dark";
    setTheme(initialTheme);
    applyTheme(initialTheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const current = (localStorage.getItem("filefixer_theme") as ThemeMode) || "dark";
      if (current === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const cycleTheme = () => {
    const next: ThemeMode =
      theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
    setTheme(next);
    localStorage.setItem("filefixer_theme", next);
    applyTheme(next);
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 opacity-50"
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
      className="h-9 rounded-xl transition-all hover:bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] gap-2 px-2.5"
      title={`Theme: ${label} (Click to switch)`}
      aria-label={`Current theme is ${label}. Click to toggle dark, light, or system theme.`}
    >
      {icon}
      {showLabel && <span className="text-xs font-medium">{label}</span>}
    </Button>
  );
}
