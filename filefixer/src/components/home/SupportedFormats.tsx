"use client";

import React from "react";
import { FileImage, FileText, Layers } from "lucide-react";

export function SupportedFormats() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-xl p-6 sm:p-8 shadow-xl">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Supported Formats &amp; Operations
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
            Reliable, standards-compliant file utilities running directly in your browser tab.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] backdrop-blur-md p-4 space-y-2 shadow-sm">
            <div className="flex items-center gap-2">
              <FileImage className="h-4 w-4 text-[hsl(var(--primary))]" aria-hidden="true" />
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Image Formats</h3>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              JPG, PNG, WebP, and SVG. Supports quality compression, pixel scaling, format conversions, cropping, and EXIF/GPS scrubbing.
            </p>
            <div className="flex flex-wrap gap-1 pt-1">
              {["JPG", "PNG", "WEBP", "SVG"].map((fmt) => (
                <span
                  key={fmt}
                  className="rounded-md border border-[var(--glass-border)] bg-[var(--glass-surface)] px-1.5 py-0.5 text-[10px] font-mono text-[hsl(var(--muted-foreground))]"
                >
                  {fmt}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] backdrop-blur-md p-4 space-y-2 shadow-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">PDF Documents</h3>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              Standard PDF documents. Combine multiple files, split pages, extract ranges, rotate orientations, and compress file size.
            </p>
            <div className="flex flex-wrap gap-1 pt-1">
              {["MERGE", "SPLIT", "REORDER", "ROTATE", "COMPRESS"].map((fmt) => (
                <span
                  key={fmt}
                  className="rounded-md border border-[var(--glass-border)] bg-[var(--glass-surface)] px-1.5 py-0.5 text-[10px] font-mono text-[hsl(var(--muted-foreground))]"
                >
                  {fmt}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] backdrop-blur-md p-4 space-y-2 shadow-sm">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Batch &amp; Pipelines</h3>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              Multi-image batch pipelines, sequence renaming, and instant in-browser ZIP package bundling with zero server uploads.
            </p>
            <div className="flex flex-wrap gap-1 pt-1">
              {["BATCH", "ZIP", "WORKFLOWS", "RENAME"].map((fmt) => (
                <span
                  key={fmt}
                  className="rounded-md border border-[var(--glass-border)] bg-[var(--glass-surface)] px-1.5 py-0.5 text-[10px] font-mono text-[hsl(var(--muted-foreground))]"
                >
                  {fmt}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
