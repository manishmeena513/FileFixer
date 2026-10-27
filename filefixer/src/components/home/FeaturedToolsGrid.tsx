"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Layers,
  Minimize2,
  FilePlus,
  Scissors,
  FileCheck,
  Maximize2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TOOLS } from "@/lib/tools";
import { TabularNum } from "@/components/ui/TabularNum";

const FEATURED_TOOLS = [
  {
    title: "Smart 'Under X MB'",
    desc: "Signature multi-pass optimizer that progressively tests compression levels until your exact target size is reached.",
    href: "/smart-compress",
    icon: Sparkles,
    badge: "Signature",
    color: "from-cyan-500/20 to-teal-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  },
  {
    title: "Batch Multi-Pipeline",
    desc: "Execute multi-stage image processing (Resize → Convert → Compress → Rename) in one local pass.",
    href: "/batch",
    icon: Layers,
    badge: "Bulk Hub",
    color: "from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30",
  },
  {
    title: "Compress Image",
    desc: "Reduce JPG, PNG, and WebP file size by up to 80% with live before/after visual comparison.",
    href: "/compress-image",
    icon: Minimize2,
    badge: "Fast",
    color: "from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  {
    title: "PDF Visual Workspace",
    desc: "Reorder, rotate, duplicate, and extract PDF pages interactively with visual page thumbnails.",
    href: "/pdf-workspace",
    icon: Layers,
    badge: "Workspace",
    color: "from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  {
    title: "Merge PDFs",
    desc: "Combine multiple PDF documents into one cleanly organized file in seconds.",
    href: "/pdf-merge",
    icon: FilePlus,
    badge: "Popular",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  {
    title: "Split & Extract PDF",
    desc: "Extract specific pages or ranges from any PDF without uploading to a third party.",
    href: "/pdf-split",
    icon: Scissors,
    badge: "Clean",
    color: "from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-400 border-red-500/30",
  },
  {
    title: "Universal File Inspector",
    desc: "Inspect dimensions, EXIF camera tags, GPS location presence, and PDF metadata dictionaries.",
    href: "/inspect",
    icon: FileCheck,
    badge: "Inspect",
    color: "from-emerald-500/20 to-cyan-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  {
    title: "Resize Image",
    desc: "Scale dimensions with aspect ratio lock or choose standard social media & document presets.",
    href: "/resize-image",
    icon: Maximize2,
    badge: "Presets",
    color: "from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  {
    title: "Convert Image",
    desc: "Switch between JPG, PNG, and WebP instantly in single or bulk batches.",
    href: "/convert-image",
    icon: RefreshCw,
    badge: "Convert",
    color: "from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  },
];

export function FeaturedToolsGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
          Everyday File Utilities
        </h2>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          Specialized, fast browser tools built for both desktop and mobile workflows.
        </p>
      </div>

      {/* 9 Workstation Cards */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURED_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.title}
              href={tool.href}
              className="interactive-card group relative flex flex-col justify-between rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-md p-5 sm:p-6 hover:border-[var(--glass-border-luminous)] hover:bg-[var(--glass-surface-elevated)] hover:shadow-[0_12px_36px_rgba(59,130,246,0.18)] transition-all cursor-pointer min-h-[44px]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border bg-gradient-to-br ${tool.color}`}
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold tracking-wider border-[var(--glass-border)]"
                  >
                    {tool.badge}
                  </Badge>
                </div>

                <h3 className="mt-4 sm:mt-5 text-base sm:text-lg font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                  {tool.title}
                </h3>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-[hsl(var(--muted-foreground))] leading-relaxed line-clamp-2">
                  {tool.desc}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-[var(--glass-border)] flex items-center justify-between text-xs font-semibold text-[hsl(var(--primary))]">
                <span>Open Tool</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Explore All Tools CTA Banner */}
      <div className="mt-10 sm:mt-12 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] backdrop-blur-xl p-6 sm:p-8 text-center sm:flex sm:items-center sm:justify-between sm:text-left shadow-xl">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">
            Explore all <TabularNum value={TOOLS.length} className="font-mono font-bold" /> local tools
          </h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Search and filter every image, PDF, and batch utility in one directory.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link href="/tools">
            <Button size="lg" className="w-full sm:w-auto font-semibold min-h-[44px] cursor-pointer touch-manipulation">
              <span>View All <TabularNum value={TOOLS.length} className="font-mono ml-1 mr-1" /> Tools</span>
              <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
