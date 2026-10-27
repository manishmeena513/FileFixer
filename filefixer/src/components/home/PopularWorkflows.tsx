"use client";

import React from "react";
import Link from "next/link";
import {
  Workflow,
  ArrowRight,
  Sparkles,
  Camera,
  ShoppingBag,
  FileText,
  Receipt,
  ShieldAlert,
  Hash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFormatBadgeClasses } from "@/components/tools/ToolCard";
import { cn } from "@/lib/utils";

interface WorkflowCardDef {
  id: string;
  category: string;
  badge: string;
  icon: React.ElementType;
  title: string;
  description: string;
  steps: string[];
  formats: string[];
  statTag: string;
  route: string;
}

const WORKFLOWS: WorkflowCardDef[] = [
  {
    id: "passport-prep",
    category: "Images",
    badge: "Signature",
    icon: Camera,
    title: "Passport & ID Application Prep",
    description: "Frame standard proportions, resize to exact dimensions, and compress under strict government portal file limits (<200KB).",
    steps: ["Crop 1:1 / 35×45mm", "Resize 600×600", "Smart Compress <200KB", "Strip EXIF"],
    formats: ["JPG", "PNG"],
    statTag: "Target <200 KB • Zero Upload",
    route: "/crop-image",
  },
  {
    id: "ecommerce-webp",
    category: "Batch",
    badge: "High Savings",
    icon: ShoppingBag,
    title: "E-Commerce Web Asset Optimization",
    description: "Convert bulk high-res product photos to modern WebP, scale to catalog dimensions, and compress for sub-second page loads.",
    steps: ["Bulk Resize", "Convert to WebP", "High Compression", "ZIP Download"],
    formats: ["JPG", "PNG", "WebP"],
    statTag: "Avg -72% size • ZIP Export",
    route: "/batch",
  },
  {
    id: "doc-merge-sign",
    category: "PDF",
    badge: "Document Hub",
    icon: FileText,
    title: "Official Document Merge & Sign",
    description: "Combine scattered scan pages, addenda, and cover sheets into a clean, numbered PDF, reorder pages, and optimize file size.",
    steps: ["Merge PDFs", "Thumbnail Reorder & Rotate", "Compact PDF Streams"],
    formats: ["PDF"],
    statTag: "Multi-PDF • 100% In-Memory",
    route: "/pdf-merge",
  },
  {
    id: "receipts-to-pdf",
    category: "PDF",
    badge: "Accounting",
    icon: Receipt,
    title: "Receipts & Expense Scans to PDF",
    description: "Assemble phone camera snapshots or receipts into a clean, paginated, ready-to-share A4/Letter PDF document.",
    steps: ["Upload Photos", "Auto-Orient & Sort", "A4 / Letter Margins", "Export PDF"],
    formats: ["JPG", "PNG"],
    statTag: "A4 / Letter Presets • Instant Export",
    route: "/images-to-pdf",
  },
  {
    id: "privacy-sanitizer",
    category: "Security",
    badge: "Zero Leak",
    icon: ShieldAlert,
    title: "Privacy Sanitizer & Metadata Scrub",
    description: "Inspect hidden EXIF camera tags, remove embedded GPS home coordinates, and wipe PDF author metadata before sharing online.",
    steps: ["Inspect Headers", "Strip GPS & Serial No", "Download Clean File"],
    formats: ["JPG", "PNG", "PDF"],
    statTag: "0 B Leaked • Sanitized",
    route: "/privacy-cleaner",
  },
  {
    id: "bulk-resequence",
    category: "Batch",
    badge: "Organization",
    icon: Hash,
    title: "Bulk Photo Re-Sequence & Rename",
    description: "Standardize chaotic camera filenames into clean, numbered sequences with custom naming templates and live preview.",
    steps: ["Queue Files", "Template Pattern", "Live Preview", "ZIP Export"],
    formats: ["All files"],
    statTag: "Live Preview • Zero Collision",
    route: "/batch-rename",
  },
];

export function PopularWorkflows() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] px-3 py-1 text-xs font-semibold text-[hsl(var(--primary))] mb-3">
          <Workflow className="h-3.5 w-3.5" aria-hidden="true" />
          <span>CURATED WORKFLOWS</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
          Popular Workflows
        </h2>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          Proven multi-tool pipelines designed to accomplish complex file tasks in a single local session.
        </p>
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {WORKFLOWS.map((wf) => {
          const Icon = wf.icon;
          return (
            <div
              key={wf.id}
              className="flex flex-col justify-between rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-md p-5 sm:p-6 shadow-lg hover:border-[var(--glass-border-luminous)] hover:shadow-[0_12px_36px_rgba(59,130,246,0.18)] transition-all duration-300"
            >
              <div className="space-y-4">
                {/* Top: Icon + Category + Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] text-[hsl(var(--primary))] shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] border-[var(--glass-border)]">
                      {wf.category}
                    </Badge>
                    <Badge variant="secondary" className="border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.1)] text-[10px] font-medium text-[hsl(var(--primary))]">
                      {wf.badge}
                    </Badge>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[hsl(var(--foreground))]">
                    {wf.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed line-clamp-2">
                    {wf.description}
                  </p>
                </div>

                {/* Pipeline Flow Steps */}
                <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] p-3 shadow-xs">
                  <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
                    Pipeline Steps
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {wf.steps.map((step, idx) => (
                      <React.Fragment key={step}>
                        <span className="rounded-md border border-[var(--glass-border)] bg-[var(--glass-surface)] px-2 py-0.5 font-medium text-[hsl(var(--foreground))] text-[10px]">
                          {step}
                        </span>
                        {idx < wf.steps.length - 1 && (
                          <span className="text-[hsl(var(--muted-foreground))] font-bold text-[10px]">
                            →
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Format Pills & Stat Tag */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1">
                    {wf.formats.map((fmt) => (
                      <span
                        key={fmt}
                        className={cn(
                          "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-mono font-medium",
                          getFormatBadgeClasses(fmt)
                        )}
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] font-medium">
                    {wf.statTag}
                  </span>
                </div>
              </div>

              {/* Card Footer: Launch Button */}
              <div className="mt-5 pt-4 border-t border-[hsl(var(--border))]">
                <Link href={wf.route} className="block">
                  <Button
                    variant="outline"
                    className="w-full min-h-[44px] justify-between font-semibold text-xs border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] cursor-pointer touch-manipulation"
                  >
                    <span>Launch Workflow</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
