"use client";

import React from "react";
import Link from "next/link";
import {
  Minimize2,
  Maximize2,
  RefreshCw,
  FilePlus,
  Scissors,
  Layers,
  Shield,
  Mail,
  Globe,
  Gauge,
  ArrowRight,
} from "lucide-react";
import { TOOLS } from "@/lib/tools";
import { TabularNum } from "@/components/ui/TabularNum";

const SMART_QUICK_ACTIONS = [
  {
    label: "Compress",
    sub: "Shrink file size",
    href: "/compress-image",
    icon: Minimize2,
  },
  {
    label: "Convert",
    sub: "JPG, PNG, WebP",
    href: "/convert-image",
    icon: RefreshCw,
  },
  {
    label: "Resize",
    sub: "Exact px or %",
    href: "/resize-image",
    icon: Maximize2,
  },
  {
    label: "Merge PDF",
    sub: "Combine PDFs",
    href: "/pdf-merge",
    icon: FilePlus,
  },
  {
    label: "Split PDF",
    sub: "Separate pages",
    href: "/pdf-split",
    icon: Scissors,
  },
  {
    label: "Extract Pages",
    sub: "Visual PDF grid",
    href: "/pdf-workspace",
    icon: Layers,
  },
  {
    label: "Remove Metadata",
    sub: "Strip EXIF & GPS",
    href: "/image-metadata",
    icon: Shield,
  },
  {
    label: "Optimize for Email",
    sub: "Fit attachment limits",
    href: "/smart-compress",
    icon: Mail,
  },
  {
    label: "Optimize for Web",
    sub: "Fast loading assets",
    href: "/batch",
    icon: Globe,
  },
  {
    label: "Make Smaller",
    sub: "Target exact KB/MB",
    href: "/smart-compress",
    icon: Gauge,
  },
];

export function QuickActionGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-xl p-5 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
              What do you want to do?
            </h2>
            <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
              Jump straight into a task or preset workflow.
            </p>
          </div>
          <Link
            href="/tools"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-[hsl(var(--primary))] hover:underline cursor-pointer touch-manipulation"
          >
            <span>
              Browse all <TabularNum value={TOOLS.length} className="font-bold font-mono" /> tools
            </span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
          {SMART_QUICK_ACTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="interactive-card group flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] backdrop-blur-md p-3 sm:p-3.5 min-h-[56px] hover:border-[var(--glass-border-luminous)] hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer touch-manipulation"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface)] text-[hsl(var(--primary))] shadow-sm transition-transform group-hover:scale-105">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] truncate">
                    {item.label}
                  </p>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">
                    {item.sub}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
