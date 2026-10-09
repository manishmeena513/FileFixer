"use client";

import React from "react";
import {
  Check,
  Download,
  RefreshCw,
  X,
  Sparkles,
  ArrowRight,
  HardDrive,
  FileCheck,
} from "lucide-react";
import { useFileStore } from "@/stores/fileStore";
import { formatBytes } from "@/lib/utils";
import { triggerDownload } from "@/lib/file-utils";
import { Button } from "@/components/ui/button";

export function FileDeliveredModal() {
  const { latestDeliveredFile, setLatestDeliveredFile, promoteOutputToInput, files } =
    useFileStore();

  if (!latestDeliveredFile) return null;

  const handleDownloadAgain = () => {
    if (latestDeliveredFile.blob) {
      triggerDownload(latestDeliveredFile.blob, latestDeliveredFile.fileName);
    }
  };

  const correspondingFile = files.find(
    (f) =>
      f.name === latestDeliveredFile.fileName ||
      f.outputName === latestDeliveredFile.fileName
  );

  const handleReuse = () => {
    if (correspondingFile) {
      promoteOutputToInput(correspondingFile.id);
    }
    setLatestDeliveredFile(null);
  };

  const savingsPct =
    latestDeliveredFile.savingsPct ??
    (latestDeliveredFile.originalSize && latestDeliveredFile.outputSize
      ? ((latestDeliveredFile.originalSize - latestDeliveredFile.outputSize) /
          latestDeliveredFile.originalSize) *
        100
      : undefined);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fade-in"
      onClick={() => setLatestDeliveredFile(null)}
      role="dialog"
      aria-modal="true"
      aria-label="File Delivered"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8 shadow-2xl animate-scale-in text-center space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setLatestDeliveredFile(null)}
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] transition-colors"
          aria-label="Close delivery modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Animated Checkmark Circle */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" className="animate-check-draw" />
          </svg>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            FILE DELIVERED
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[hsl(var(--foreground))]">
            Ready on your device.
          </h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-xs mx-auto truncate font-mono">
            {latestDeliveredFile.fileName}
          </p>
        </div>

        {/* Before / After Stats Card */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/0.6)] p-3 text-center">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Original
            </span>
            <p className="text-xs font-bold text-[hsl(var(--foreground))]">
              {formatBytes(latestDeliveredFile.originalSize)}
            </p>
          </div>

          <div className="space-y-0.5 border-x border-[hsl(var(--border)/0.6)]">
            <span className="text-[10px] uppercase tracking-wider text-emerald-400">
              Final Size
            </span>
            <p className="text-xs font-bold text-emerald-400">
              {formatBytes(latestDeliveredFile.outputSize)}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--primary))]">
              Saved
            </span>
            <p className="text-xs font-bold text-[hsl(var(--primary))]">
              {savingsPct && savingsPct > 0 ? `-${savingsPct.toFixed(0)}%` : "Optimized"}
            </p>
          </div>
        </div>

        {/* Guarantee Pill */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))]">
          <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
          <span>Processed 100% in your browser • Never sent to cloud</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {latestDeliveredFile.blob && (
            <Button
              onClick={handleDownloadAgain}
              className="w-full min-h-[46px] font-semibold"
            >
              <Download className="h-4 w-4" />
              Download Again
            </Button>
          )}

          {correspondingFile && (
            <Button
              variant="outline"
              onClick={handleReuse}
              className="w-full min-h-[44px]"
            >
              <RefreshCw className="h-4 w-4" />
              Reuse in Another Tool
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => setLatestDeliveredFile(null)}
            className="w-full min-h-[40px] text-xs text-[hsl(var(--muted-foreground))]"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
