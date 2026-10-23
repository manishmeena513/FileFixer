"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Trash2,
  Sparkles,
  ArrowRight,
  Layers,
  Minimize2,
  Maximize2,
  RefreshCw,
  Crop,
  Shield,
  FileText,
  FilePlus,
  Scissors,
  FileCheck,
  PenLine,
} from "lucide-react";
import { FileCard } from "@/components/upload/FileCard";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabularNum } from "@/components/ui/TabularNum";
import { formatBytes } from "@/lib/utils";
import type { ManagedFile } from "@/types";

interface StagedFilesSummaryProps {
  files: ManagedFile[];
  onRemoveFile: (id: string) => void;
  onClearFiles: () => void;
  onOpenWorkspace: () => void;
  onAddMoreFiles: (files: File[]) => void;
}

interface SmartAction {
  label: string;
  desc: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  primary?: boolean;
}

export function StagedFilesSummary({
  files,
  onRemoveFile,
  onClearFiles,
  onOpenWorkspace,
  onAddMoreFiles,
}: StagedFilesSummaryProps) {
  const router = useRouter();

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const imageFiles = files.filter((f) => f.type.startsWith("image/"));
  const pdfFiles = files.filter(
    (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
  );
  const otherFiles = files.filter(
    (f) => !f.type.startsWith("image/") && f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")
  );

  // Compute smart recommendations based on payload structure
  const recommendations: SmartAction[] = [];

  if (imageFiles.length > 0 && pdfFiles.length === 0 && otherFiles.length === 0) {
    if (imageFiles.length === 1) {
      recommendations.push(
        {
          label: "Compress Image",
          desc: "Reduce file weight while keeping sharpness",
          href: "/compress-image",
          icon: Minimize2,
          badge: "Quality & Size",
          primary: true,
        },
        {
          label: "Resize Dimensions",
          desc: "Scale pixels, percentages, or standard presets",
          href: "/resize-image",
          icon: Maximize2,
        },
        {
          label: "Convert Format",
          desc: "Switch between WebP, JPG, and PNG",
          href: "/convert-image",
          icon: RefreshCw,
        },
        {
          label: "Crop & Rotate",
          desc: "Frame aspect ratios, straighten, and flip",
          href: "/crop-image",
          icon: Crop,
        },
        {
          label: "Smart 'Under X MB'",
          desc: "Hit exact portal limits (<200KB, <1MB)",
          href: "/smart-compress",
          icon: Sparkles,
        },
        {
          label: "Remove Metadata",
          desc: "Strip private camera EXIF & GPS tags",
          href: "/image-metadata",
          icon: Shield,
        }
      );
    } else {
      recommendations.push(
        {
          label: "Batch Studio",
          desc: `Resize, convert, compress & rename all ${imageFiles.length} images`,
          href: "/batch",
          icon: Layers,
          badge: "Bulk Automation",
          primary: true,
        },
        {
          label: "Images to PDF",
          desc: "Compile all photos into a single paginated document",
          href: "/images-to-pdf",
          icon: FileText,
        },
        {
          label: "Batch Rename",
          desc: "Standardize into clean numbered templates",
          href: "/batch-rename",
          icon: PenLine,
        },
        {
          label: "Compress All",
          desc: "Batch shrink images to save storage",
          href: "/compress-image",
          icon: Minimize2,
        }
      );
    }
  } else if (pdfFiles.length > 0 && imageFiles.length === 0 && otherFiles.length === 0) {
    if (pdfFiles.length === 1) {
      recommendations.push(
        {
          label: "Compress PDF",
          desc: "Optimize internal streams to meet portal limits",
          href: "/pdf-compress",
          icon: Minimize2,
          badge: "Optimize Streams",
          primary: true,
        },
        {
          label: "Split & Extract Pages",
          desc: "Extract specific page ranges or single sheets",
          href: "/pdf-split",
          icon: Scissors,
        },
        {
          label: "Page Organizer",
          desc: "Visual thumbnail grid to rotate, reorder, or delete",
          href: "/pdf-workspace",
          icon: Layers,
        },
        {
          label: "PDF Studio",
          desc: "Comprehensive visual PDF page workbench",
          href: "/pdf-studio",
          icon: FileText,
        }
      );
    } else {
      recommendations.push(
        {
          label: "Merge PDFs",
          desc: `Combine ${pdfFiles.length} PDF files into one ordered document`,
          href: "/pdf-merge",
          icon: FilePlus,
          badge: "Combine All",
          primary: true,
        },
        {
          label: "PDF Studio",
          desc: "Interactive visual workbench for multiple documents",
          href: "/pdf-studio",
          icon: FileText,
        },
        {
          label: "Universal Inspector",
          desc: "Analyze document dictionaries and metadata",
          href: "/inspect",
          icon: FileCheck,
        }
      );
    }
  } else {
    // Mixed or generic file set
    recommendations.push(
      {
        label: "Universal File Inspector",
        desc: "Inspect MIME types, resolutions, EXIF, and structures",
        href: "/inspect",
        icon: FileCheck,
        badge: "Inspect Metadata",
        primary: true,
      },
      {
        label: "File Workspace",
        desc: "Manage and preview mixed files in unified station",
        href: "/workspace",
        icon: FolderKanban,
      },
      {
        label: "Batch Rename",
        desc: "Standardize file sequence names in bulk",
        href: "/batch-rename",
        icon: PenLine,
      }
    );
  }

  const categoryHeadline =
    imageFiles.length > 0 && pdfFiles.length === 0 && otherFiles.length === 0
      ? imageFiles.length === 1
        ? "Your Image"
        : `Your ${imageFiles.length} Images`
      : pdfFiles.length > 0 && imageFiles.length === 0 && otherFiles.length === 0
      ? pdfFiles.length === 1
        ? "Your PDF"
        : `Your ${pdfFiles.length} PDFs`
      : `Your ${files.length} Files`;

  return (
    <div className="animate-scale-in rounded-2xl border-2 border-[hsl(var(--primary)/0.45)] bg-[hsl(var(--card))] p-4 sm:p-6 shadow-2xl space-y-5">
      {/* Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[hsl(var(--border))] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
            <FolderKanban className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
                Smart File Drop Ready
              </h2>
              <Badge variant="default" className="text-[11px] font-mono tabular-nums">
                <TabularNum value={files.length} /> {files.length === 1 ? "file" : "files"} • {formatBytes(totalSize)}
              </Badge>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Choose an action below to route files directly into that tool with 0 re-uploading
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/workspace"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.12)] px-3.5 py-1.5 text-xs font-semibold text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.2)] transition-colors cursor-pointer touch-manipulation"
          >
            <FolderKanban className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Open Full Workspace</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFiles}
            className="min-h-[44px] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)] cursor-pointer touch-manipulation"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Clear</span>
          </Button>
        </div>
      </div>

      {/* File Preview List (Compact) */}
      <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
        {files.slice(0, 4).map((f) => (
          <FileCard
            key={f.id}
            file={f}
            onRemove={onRemoveFile}
            showOutput={true}
          />
        ))}
        {files.length > 4 && (
          <button
            type="button"
            onClick={onOpenWorkspace}
            className="w-full min-h-[44px] rounded-lg border border-dashed border-[hsl(var(--border))] py-2.5 text-center text-xs font-medium text-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary))] transition-colors cursor-pointer touch-manipulation"
          >
            + <TabularNum value={files.length - 4} /> more files in session (Click to view in Workspace)
          </button>
        )}
      </div>

      {/* Recommended Contextual Actions */}
      <div>
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--primary))] flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Recommended Actions for {categoryHeadline}</span>
        </p>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
          {recommendations.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.href + act.label}
                type="button"
                onClick={() => router.push(act.href)}
                className={`group flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all min-h-[64px] cursor-pointer touch-manipulation ${
                  act.primary
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] shadow-xs hover:bg-[hsl(var(--primary)/0.15)]"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:border-[hsl(var(--primary)/0.6)] hover:bg-[hsl(var(--secondary)/0.6)]"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    act.primary
                      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                      : "bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] truncate">
                      {act.label}
                    </p>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--muted-foreground))] transition-transform group-hover:translate-x-0.5 group-hover:text-[hsl(var(--primary))]" aria-hidden="true" />
                  </div>
                  <p className="mt-0.5 text-[11px] text-[hsl(var(--muted-foreground))] line-clamp-1">
                    {act.desc}
                  </p>
                  {act.badge && (
                    <span className="inline-block mt-1 text-[9px] font-mono text-[hsl(var(--primary))] font-semibold">
                      {act.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add More Files Drop Bar */}
      <div className="pt-1">
        <DropZone
          onFiles={onAddMoreFiles}
          label="Add more files to this session"
          sublabel=""
          formats={[]}
          className="py-3 sm:py-4 border border-dashed bg-[hsl(var(--background)/0.5)] min-h-[44px]"
        />
      </div>
    </div>
  );
}
