"use client";

import React, { useCallback, useRef, useState } from "react";
import { cn, formatBytes, calcSavings } from "@/lib/utils";
import { ArrowRight, TrendingDown } from "lucide-react";

interface BeforeAfterProps {
  originalSize: number;
  outputSize: number;
  originalUrl?: string;
  outputUrl?: string;
  className?: string;
}

export function BeforeAfterStats({
  originalSize,
  outputSize,
  className,
}: Pick<BeforeAfterProps, "originalSize" | "outputSize" | "className">) {
  const saved = originalSize - outputSize;
  const pct = calcSavings(originalSize, outputSize);
  const isGood = saved > 0;

  return (
    <div className={cn(
      "rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5",
      className
    )}>
      <div className="flex items-center gap-4">
        {/* Original */}
        <div className="flex-1 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Original</p>
          <p className="mt-1 text-2xl font-bold text-[hsl(var(--foreground))]">{formatBytes(originalSize)}</p>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-1">
          <ArrowRight className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
          {isGood && (
            <span className="rounded-full bg-[hsl(var(--success)/0.15)] px-2 py-0.5 text-xs font-medium text-[hsl(var(--success))]">
              -{pct}
            </span>
          )}
        </div>

        {/* Optimized */}
        <div className="flex-1 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Optimized</p>
          <p className={cn(
            "mt-1 text-2xl font-bold",
            isGood ? "text-[hsl(var(--success))]" : "text-[hsl(var(--foreground))]"
          )}>
            {formatBytes(outputSize)}
          </p>
        </div>
      </div>

      {isGood && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[hsl(var(--success)/0.08)] py-2">
          <TrendingDown className="h-4 w-4 text-[hsl(var(--success))]" />
          <span className="text-sm font-medium text-[hsl(var(--success))]">
            Saved {formatBytes(saved)} ({pct} smaller)
          </span>
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

export function CompareSlider({ originalUrl, outputUrl, className }: CompareSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50); // percentage

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
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
      updatePosition(e.touches[0].clientX);
    },
    [updatePosition]
  );

  return (
    <div
      ref={containerRef}
      className={cn("compare-slider select-none", className)}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={(e) => updatePosition(e.clientX)}
      role="slider"
      aria-label="Compare original and optimized image"
      aria-valuenow={Math.round(position)}
      tabIndex={0}
    >
      {/* Output (bottom layer, full width) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={outputUrl} alt="Optimized" className="h-full w-full object-contain" />

      {/* Original (clipped to left portion) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={originalUrl}
          alt="Original"
          className="h-full object-contain"
          style={{ width: `${100 / (position / 100)}%`, maxWidth: "none" }}
        />
      </div>

      {/* Labels */}
      <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">Original</div>
      <div className="absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">Optimized</div>

      {/* Handle */}
      <div className="compare-slider-handle" style={{ left: `${position}%` }} />
    </div>
  );
}
