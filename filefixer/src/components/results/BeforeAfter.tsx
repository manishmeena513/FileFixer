"use client";

import React, { useCallback, useRef, useState } from "react";
import { cn, formatBytes, calcSavings } from "@/lib/utils";
import { ArrowRight, TrendingDown, CheckCircle2 } from "lucide-react";

interface BeforeAfterProps {
  originalSize: number;
  outputSize: number;
  originalUrl?: string;
  outputUrl?: string;
  originalDimensions?: string;
  outputDimensions?: string;
  originalFormat?: string;
  outputFormat?: string;
  className?: string;
}

export function BeforeAfterStats({
  originalSize,
  outputSize,
  originalDimensions,
  outputDimensions,
  originalFormat,
  outputFormat,
  className,
}: Omit<BeforeAfterProps, "originalUrl" | "outputUrl">) {
  const saved = originalSize - outputSize;
  const pct = calcSavings(originalSize, outputSize);
  const isGood = saved > 0;

  return (
    <div
      className={cn(
        "animate-slide-up rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Original */}
        <div className="flex-1 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Original
          </p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-[hsl(var(--foreground))]">
            {formatBytes(originalSize)}
          </p>
          {(originalDimensions || originalFormat) && (
            <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
              {[originalFormat?.toUpperCase(), originalDimensions]
                .filter(Boolean)
                .join(" • ")}
            </p>
          )}
        </div>

        {/* Arrow + Badge */}
        <div className="flex flex-col items-center gap-1.5 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--secondary))]">
            <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </div>
          {isGood && (
            <span className="rounded-full bg-[hsl(var(--success)/0.15)] px-2.5 py-0.5 text-xs font-bold text-[hsl(var(--success))]">
              -{pct}
            </span>
          )}
        </div>

        {/* Optimized */}
        <div className="flex-1 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            New Size
          </p>
          <p
            className={cn(
              "mt-1 text-xl sm:text-2xl font-bold",
              isGood
                ? "text-[hsl(var(--success))]"
                : "text-[hsl(var(--foreground))]"
            )}
          >
            {formatBytes(outputSize)}
          </p>
          {(outputDimensions || outputFormat) && (
            <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
              {[outputFormat?.toUpperCase(), outputDimensions]
                .filter(Boolean)
                .join(" • ")}
            </p>
          )}
        </div>
      </div>

      {isGood ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--success)/0.1)] px-3 py-2.5 border border-[hsl(var(--success)/0.2)]">
          <TrendingDown className="h-4 w-4 text-[hsl(var(--success))] shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-[hsl(var(--success))]">
            Saved {formatBytes(saved)} ({pct} smaller)
          </span>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--secondary))] px-3 py-2 text-xs text-[hsl(var(--muted-foreground))]">
          <CheckCircle2 className="h-4 w-4 text-[hsl(var(--primary))] shrink-0" />
          <span>Processed at maximum quality</span>
        </div>
      )}
    </div>
  );
}

interface CompareSliderProps {
  originalUrl: string;
  outputUrl: string;
  className?: string;
}

export function CompareSlider({
  originalUrl,
  outputUrl,
  className,
}: CompareSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50); // percentage

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const pct = Math.max(
      2,
      Math.min(98, ((clientX - rect.left) / rect.width) * 100)
    );
    setPosition(pct);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (e.buttons !== 1) return;
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length > 0) {
        updatePosition(e.touches[0].clientX);
      }
    },
    [updatePosition]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPosition((p) => Math.max(2, p - 5));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPosition((p) => Math.min(98, p + 5));
    }
  }, []);

  const safePosition = Math.max(2, position);

  return (
    <div
      ref={containerRef}
      className={cn("compare-slider select-none bg-black/20", className)}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={(e) => updatePosition(e.clientX)}
      onKeyDown={handleKeyDown}
      role="slider"
      aria-label="Compare original and optimized image"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      tabIndex={0}
    >
      {/* Output (bottom layer, full width) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={outputUrl}
        alt="Optimized"
        className="h-full w-full object-contain pointer-events-none"
      />

      {/* Original (clipped to left portion) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${safePosition}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={originalUrl}
          alt="Original"
          className="h-full object-contain"
          style={{ width: `${100 / (safePosition / 100)}%`, maxWidth: "none" }}
        />
      </div>

      {/* Labels */}
      <div className="pointer-events-none absolute left-2.5 top-2.5 rounded-md bg-black/70 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-white">
        Before
      </div>
      <div className="pointer-events-none absolute right-2.5 top-2.5 rounded-md bg-[hsl(var(--primary)/0.9)] backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-white">
        After
      </div>

      {/* Handle */}
      <div
        className="compare-slider-handle"
        style={{ left: `${safePosition}%` }}
      />
    </div>
  );
}

