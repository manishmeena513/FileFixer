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

export function ToolCard({ tool, className }: ToolCardProps) {
  const Icon = tool.icon;

  return (
    <Link
      href={tool.slug}
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-200",
        "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))]",
        "hover:-translate-y-1 hover:border-[hsl(var(--primary)/0.6)] hover:shadow-lg hover:shadow-[hsl(var(--primary)/0.06)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2",
        className
      )}
      aria-label={`Open ${tool.name} - ${tool.description}`}
    >
      <div>
        {/* Top Header: Icon + Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--primary))] transition-transform duration-200 group-hover:scale-105 group-hover:border-[hsl(var(--primary)/0.4)] group-hover:bg-[hsl(var(--primary)/0.1)]">
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
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
        <h3 className="mt-4 text-base font-bold text-[hsl(var(--foreground))] transition-colors group-hover:text-[hsl(var(--primary))]">
          {tool.name}
        </h3>

        {/* Practical Description */}
        <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed line-clamp-3">
          {tool.description}
        </p>
      </div>

      {/* Card Footer: Feature indicator + Primary CTA */}
      <div className="mt-5 pt-3.5 border-t border-[hsl(var(--border))] flex items-center justify-between gap-2 text-xs">
        <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] truncate">
          {tool.featureIndicator || (tool.supportedFormats ? tool.supportedFormats.join(" · ") : "Browser Native")}
        </span>

        <span className="inline-flex items-center gap-1 font-semibold text-[hsl(var(--primary))] group-hover:underline flex-shrink-0">
          <span>Open Tool</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
