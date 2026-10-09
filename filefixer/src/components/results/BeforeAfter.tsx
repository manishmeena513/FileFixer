"use client";

import React, { useCallback, useRef, useState } from "react";
import { cn, formatBytes, calcSavings } from "@/lib/utils";
import { ArrowRight, TrendingDown, CheckCircle2 } from "lucide-react";

interface BeforeAfterProps {
  originalSize: number;
  outputSize?: number;
  newSize?: number;
  originalUrl?: string;
  outputUrl?: string;
  originalDimensions?: string;
  outputDimensions?: string;
  newDimensions?: string;
  originalFormat?: string;
  outputFormat?: string;
  className?: string;
}

export function BeforeAfterStats({
  originalSize,
  outputSize,
  newSize,
  originalDimensions,
  outputDimensions,
  newDimensions,
  originalFormat,
  outputFormat,
  className,
}: Omit<BeforeAfterProps, "originalUrl" | "outputUrl">) {
  const actualOutputSize = outputSize ?? newSize ?? originalSize;
  const actualOutputDims = outputDimensions ?? newDimensions;
  const saved = originalSize - actualOutputSize;
  const pct = calcSavings(originalSize, actualOutputSize);
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
            <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-400">
              <TrendingDown className="h-3 w-3" />
              -{pct}%
            </span>
          )}
        </div>

        {/* Output */}
        <div className="flex-1 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--primary))]">
            Optimized
          </p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-emerald-400">
            {formatBytes(actualOutputSize)}
          </p>
          {(actualOutputDims || outputFormat) && (
            <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
              {[outputFormat?.toUpperCase(), actualOutputDims]
                .filter(Boolean)
                .join(" • ")}
            </p>
          )}
        </div>
      </div>

      {/* Summary message */}
      {isGood ? (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-400 border border-emerald-500/20">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Saved {formatBytes(saved)} ({pct}% smaller)
          </span>
          <span className="text-[11px] opacity-80 hidden sm:inline">
            Zero cloud uploads
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
  originalUrl?: string;
  outputUrl?: string;
  beforeUrl?: string;
  afterUrl?: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function CompareSlider({
  originalUrl,
  outputUrl,
  beforeUrl,
  afterUrl,
  beforeLabel = "Before",
  afterLabel = "After",
  className,
}: CompareSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50); // percentage

  const srcOriginal = originalUrl || beforeUrl || "";
  const srcOutput = outputUrl || afterUrl || "";

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
      if (e.touches[0]) {
        updatePosition(e.touches[0].clientX);
      }
    },
    [updatePosition]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPosition((prev) => Math.max(2, prev - 5));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPosition((prev) => Math.min(98, prev + 5));
    }
  }, []);

  const safePosition = Math.max(2, Math.min(98, position));

  return (
    <div
      ref={containerRef}
      className={cn(
        "compare-slider relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-black/40 shadow-xl aspect-[4/3] max-h-[500px]",
        className
      )}
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
        src={srcOutput}
        alt={afterLabel}
        className="h-full w-full object-contain pointer-events-none"
      />

      {/* Original (clipped to left portion) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${safePosition}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={srcOriginal}
          alt={beforeLabel}
          className="h-full object-contain"
          style={{ width: `${100 / (safePosition / 100)}%`, maxWidth: "none" }}
        />
      </div>

      {/* Labels */}
      <div className="pointer-events-none absolute left-2.5 top-2.5 rounded-md bg-black/70 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-white">
        {beforeLabel}
      </div>
      <div className="pointer-events-none absolute right-2.5 top-2.5 rounded-md bg-[hsl(var(--primary)/0.9)] backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-white">
        {afterLabel}
      </div>

      {/* Handle */}
      <div
        className="compare-slider-handle"
        style={{ left: `${safePosition}%` }}
      />
    </div>
  );
}
