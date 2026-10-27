"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ToolItem } from "@/lib/tools";

interface ToolCardProps {
  tool: ToolItem;
  className?: string;
}

export function getFormatBadgeClasses(format: string): string {
  const f = format.toLowerCase();
  if (f === "pdf") {
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-300";
  }
  if (f === "jpg" || f === "jpeg") {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300";
  }
  if (f === "png") {
    return "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800/50 dark:bg-violet-950/40 dark:text-violet-300";
  }
  if (f === "webp") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (f === "images") {
    return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-300";
  }
  return "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]";
}

export function ToolCard({ tool, className }: ToolCardProps) {
  const Icon = tool.icon;
  const destination = tool.slug || tool.href || "/";

  return (
    <Link
      href={destination}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 cursor-pointer min-h-[44px]",
        "border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-md shadow-md text-[hsl(var(--foreground))]",
        "hover:-translate-y-1 hover:border-[var(--glass-border-luminous)] hover:shadow-[0_12px_36px_rgba(59,130,246,0.18)] hover:bg-[var(--glass-surface-elevated)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]",
        className
      )}
      aria-label={`Open ${tool.name} - ${tool.description}`}
    >
      <div className="space-y-3">
        {/* Top Header: Icon + Category + Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] text-[hsl(var(--primary))] transition-all duration-200 group-hover:scale-105 group-hover:border-[var(--glass-border-luminous)] group-hover:shadow-[0_0_15px_rgba(96,165,250,0.25)]">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] border-[var(--glass-border)]">
              {tool.category}
            </Badge>
            {tool.badge && (
              <Badge variant="secondary" className="border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.1)] text-[10px] font-medium text-[hsl(var(--primary))]">
                {tool.badge}
              </Badge>
            )}
          </div>
        </div>

        {/* Tool Name */}
        <h3 className="text-base font-bold text-[hsl(var(--foreground))] transition-colors group-hover:text-[hsl(var(--primary))]">
          {tool.name}
        </h3>

        {/* Practical Description */}
        <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed line-clamp-2">
          {tool.description}
        </p>

        {/* Dedicated Supported Format Pills */}
        {tool.supportedFormats && tool.supportedFormats.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1" aria-label="Supported file formats">
            {tool.supportedFormats.map((fmt) => (
              <span
                key={fmt}
                className={cn(
                  "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-mono font-medium transition-colors",
                  getFormatBadgeClasses(fmt)
                )}
              >
                {fmt}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer: Feature indicator + Primary CTA */}
      <div className="mt-5 pt-3.5 border-t border-[var(--glass-border)] flex items-center justify-between gap-2 text-xs">
        <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] truncate">
          {tool.featureIndicator || "Browser Native"}
        </span>

        <span className="inline-flex items-center gap-1 font-semibold text-[hsl(var(--primary))] group-hover:underline shrink-0">
          <span>Open Tool</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
