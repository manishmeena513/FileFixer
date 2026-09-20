"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface LogoProps {
  /**
   * Logo display variant:
   * - "full": Logo Mark + "FileFixer" Wordmark (+ optional Tagline)
   * - "mark": Icon Mark only
   * - "wordmark": Typography only
   */
  variant?: "full" | "mark" | "wordmark";

  /**
   * Size presets or custom pixel height
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;

  /**
   * Whether to display the tagline under the wordmark
   */
  showTagline?: boolean;

  /**
   * Custom tagline text (defaults to "FIX YOUR FILES. KEEP THEM PRIVATE.")
   */
  taglineText?: string;

  /**
   * Theme mode: "auto" uses CSS dark/light classes
   */
  theme?: "auto" | "dark" | "light";

  /**
   * Additional class names
   */
  className?: string;

  /**
   * Interactive hover micro-animation
   */
  animated?: boolean;
}

const sizeConfig = {
  xs: { height: 22, markSize: 22, fontSize: "text-base", taglineSize: "text-[7.5px]", gap: "gap-1.5" },
  sm: { height: 28, markSize: 28, fontSize: "text-lg", taglineSize: "text-[8.5px]", gap: "gap-2" },
  md: { height: 36, markSize: 36, fontSize: "text-xl", taglineSize: "text-[9.5px]", gap: "gap-2.5" },
  lg: { height: 48, markSize: 48, fontSize: "text-2xl", taglineSize: "text-[11px]", gap: "gap-3" },
  xl: { height: 64, markSize: 64, fontSize: "text-4xl", taglineSize: "text-xs", gap: "gap-4" },
};

/**
 * FileFixer Geometric Mark:
 * A stylized blue document sheet with a folded top-right corner and an embedded
 * white fixing wrench that dynamically grips the middle bar of the "F".
 */
export function LogoMark({
  size = 36,
  theme = "auto",
  className,
  animated = true,
}: {
  size?: number;
  theme?: "auto" | "dark" | "light";
  className?: string;
  animated?: boolean;
}) {
  const isLight = theme === "light";
  const wrenchColor = isLight ? "#0B1220" : "currentColor";
  const foldColor = isLight ? "#1E40AF" : "#FFFFFF";

  return (
    <svg
      viewBox="0 0 95 110"
      width={size}
      height={Math.round((size * 110) / 95)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="FileFixer Symbol"
      className={cn(
        "shrink-0 transition-transform duration-200",
        animated && "group-hover:scale-105 group-hover:rotate-[-1deg]",
        className
      )}
    >
      <defs>
        {/* Modern Vibrant Blue Gradient matching Brand Reference */}
        <linearGradient id="ff-mark-blue" x1="6" y1="8" x2="85" y2="103" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="35%" stopColor="#3B82F6" />
          <stop offset="70%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        <filter id="ff-mark-shadow" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0284C7" floodOpacity="0.3" />
        </filter>
      </defs>

      <g filter="url(#ff-mark-shadow)">
        {/* 1. Top Section & Left Spine (Head & Back of the 'F') */}
        <path
          d="M 59 8 L 19 8 C 11 8 6 13 6 21 L 6 82 C 6 86.5 10 88.5 14 85 L 24 74 C 21.5 68 21 61 23 54 C 26 44 34 39 45 39 L 85 39 L 85 34.5 L 59 8 Z"
          fill="url(#ff-mark-blue)"
        />

        {/* 2. Fold Corner Flap */}
        <path
          d="M 59 8 L 59 31.5 C 59 33.5 61 34.5 63 34.5 L 85 34.5 Z"
          fill={foldColor}
          className={cn(!isLight && "text-white dark:text-white")}
        />

        {/* 3. Middle Horizontal Bar (Gripped by the wrench jaws) */}
        <path
          d="M 42 45 L 81 45 C 83.5 45 85.5 47 85.5 49.5 L 85.5 56.5 C 85.5 59 83.5 61 81 61 L 45 61 C 41 61 38.5 57.5 40 53.5 C 41 50 40.5 46.5 42 45 Z"
          fill="url(#ff-mark-blue)"
        />

        {/* 4. Bottom Horizontal Bar (45° Chamfered corner) */}
        <path
          d="M 38 69 L 84 69 L 57 103 L 32 103 C 27 103 24 98 28 92 L 38 69 Z"
          fill="url(#ff-mark-blue)"
        />

        {/* 5. Precision Fixing Wrench */}
        <path
          d="M 39 47 C 34 50 30 55 28 62 C 27.5 66 26 71 23 75 L 12 87 C 7 92 6 97 8 100 C 10 102.5 14 103 17 100 L 30 88 C 33 85 37 82 41 81 C 46 80 52 78 57 68 C 57.5 67 56 66 54 67 L 47 69 C 43 70 40 68 39 64 C 38.5 60 41 56 45 54 L 49 51 C 50.5 50 49 48 47 48 L 39 47 Z"
          fill={wrenchColor}
          className={cn(!isLight && "text-white dark:text-white")}
        />
      </g>
    </svg>
  );
}

/**
 * Typographic Wordmark:
 * Matches the reference font weight, dual-tone split (File in white/navy, Fixer in vibrant blue),
 * and uppercase letter-spaced tagline.
 */
export function LogoWordmark({
  fontSize = "text-xl",
  taglineSize = "text-[9.5px]",
  showTagline = false,
  taglineText = "FIX YOUR FILES. KEEP THEM PRIVATE.",
  theme = "auto",
  className,
}: {
  fontSize?: string;
  taglineSize?: string;
  showTagline?: boolean;
  taglineText?: string;
  theme?: "auto" | "dark" | "light";
  className?: string;
}) {
  const isLight = theme === "light";
  const isDark = theme === "dark";

  return (
    <div className={cn("flex flex-col justify-center leading-none select-none", className)}>
      <div className={cn("font-extrabold tracking-[-0.03em] flex items-baseline font-sans", fontSize)}>
        <span
          className={cn(
            isLight
              ? "text-slate-900"
              : isDark
              ? "text-white"
              : "text-[hsl(var(--foreground))]"
          )}
        >
          File
        </span>
        <span className="text-[#2563EB] dark:text-[#3882F6]">
          Fixer
        </span>
      </div>

      {showTagline && (
        <span
          className={cn(
            "font-semibold uppercase tracking-[0.14em] mt-1",
            taglineSize,
            isLight
              ? "text-slate-500"
              : "text-slate-400 dark:text-slate-400"
          )}
        >
          {taglineText}
        </span>
      )}
    </div>
  );
}

/**
 * Main Centralized Logo Component
 */
export function Logo({
  variant = "full",
  size = "md",
  showTagline = false,
  taglineText,
  theme = "auto",
  className,
  animated = true,
}: LogoProps) {
  const isPreset = typeof size === "string" && size in sizeConfig;
  const config = isPreset ? sizeConfig[size as keyof typeof sizeConfig] : null;
  const markPx = typeof size === "number" ? size : config?.markSize ?? 36;

  if (variant === "mark") {
    return <LogoMark size={markPx} theme={theme} className={className} animated={animated} />;
  }

  if (variant === "wordmark") {
    return (
      <LogoWordmark
        fontSize={config?.fontSize ?? "text-xl"}
        taglineSize={config?.taglineSize ?? "text-[9.5px]"}
        showTagline={showTagline}
        taglineText={taglineText}
        theme={theme}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        "group inline-flex items-center select-none",
        config?.gap ?? "gap-2.5",
        className
      )}
    >
      <LogoMark size={markPx} theme={theme} animated={animated} />
      <LogoWordmark
        fontSize={config?.fontSize ?? "text-xl"}
        taglineSize={config?.taglineSize ?? "text-[9.5px]"}
        showTagline={showTagline}
        taglineText={taglineText}
        theme={theme}
      />
    </div>
  );
}
