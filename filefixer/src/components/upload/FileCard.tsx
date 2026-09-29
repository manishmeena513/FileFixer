"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { cn, formatBytes, calcSavings } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ManagedFile } from "@/types";

interface FileCardProps {
  file: ManagedFile;
  onRemove?: (id: string) => void;
  showOutput?: boolean;
}

export function FileCard({ file, onRemove, showOutput = true }: FileCardProps) {
  const ext = file.name.split(".").pop()?.toUpperCase() ?? "FILE";
  const isImage = file.type.startsWith("image/");
  const [localThumb, setLocalThumb] = useState<string | null>(null);

  useEffect(() => {
    if (file.thumbnailUrl || !isImage) {
      setLocalThumb(null);
      return;
    }
    const url = URL.createObjectURL(file.file);
    setLocalThumb(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file.file, file.thumbnailUrl, isImage]);

  const thumbSrc = file.thumbnailUrl || localThumb;

  const statusIcon = {
    idle: null,
    pending: (
      <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--muted-foreground))]" />
    ),
    processing: (
      <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--primary))]" />
    ),
    done: <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />,
    error: <AlertCircle className="h-4 w-4 text-[hsl(var(--destructive))]" />,
  }[file.status];

  const statusLabel = {
    idle: null,
    pending: "Queued",
    processing: "Processing...",
    done: "Ready",
    error: "Failed",
  }[file.status];

  const hasSavings =
    showOutput &&
    file.status === "done" &&
    file.outputSize !== undefined &&
    file.outputSize < file.size;

  return (
    <div
      className={cn(
        "animate-scale-in group relative flex items-center gap-3 rounded-xl border p-3 transition-all",
        "border-[hsl(var(--border))] bg-[hsl(var(--card))]",
        file.status === "processing" &&
          "border-[hsl(var(--primary)/0.5)] bg-[hsl(var(--primary)/0.03)]",
        file.status === "done" && "border-[hsl(var(--success)/0.35)]",
        file.status === "error" &&
          "border-[hsl(var(--destructive)/0.45)] animate-shake"
      )}
    >
      {/* Thumbnail or icon */}
      <div className="shrink-0">
        {thumbSrc && isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbSrc}
            alt={file.name}
            className="h-12 w-12 rounded-lg object-cover border border-[hsl(var(--border))]"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[hsl(var(--secondary))]">
            {isImage ? (
              <ImageIcon className="h-5 w-5 text-[hsl(var(--primary))]" />
            ) : (
              <FileText className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-medium text-[hsl(var(--foreground))]"
          title={file.name}
        >
          {file.name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {ext}
          </Badge>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {formatBytes(file.size)}
          </span>
          {file.width && file.height && (
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              • {file.width}×{file.height}
            </span>
          )}
          {showOutput && file.outputSize !== undefined && file.status === "done" && (
            <>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                →
              </span>
              <span className="text-xs font-semibold text-[hsl(var(--success))]">
                {formatBytes(file.outputSize)}
              </span>
              {hasSavings && (
                <span className="rounded-full bg-[hsl(var(--success)/0.15)] px-1.5 py-0.5 text-[10px] font-bold text-[hsl(var(--success))]">
                  -{calcSavings(file.size, file.outputSize)}
                </span>
              )}
            </>
          )}
        </div>

        {/* Error message */}
        {file.status === "error" && file.error && (
          <p className="mt-1 text-xs font-medium text-[hsl(var(--destructive))]">
            {file.error}
          </p>
        )}
      </div>

      {/* Status + remove (Always visible on mobile touch screens!) */}
      <div className="flex shrink-0 items-center gap-1.5">
        {statusIcon && (
          <div className="flex items-center gap-1.5 px-1">
            {statusIcon}
            {statusLabel && (
              <span
                className={cn(
                  "hidden sm:inline text-xs font-medium",
                  file.status === "done" && "text-[hsl(var(--success))]",
                  file.status === "error" && "text-[hsl(var(--destructive))]",
                  (file.status === "processing" ||
                    file.status === "pending") &&
                    "text-[hsl(var(--muted-foreground))]"
                )}
              >
                {statusLabel}
              </span>
            )}
          </div>
        )}
        {onRemove && file.status !== "processing" && (
          <button
            type="button"
            onClick={() => onRemove(file.id)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] opacity-100 sm:opacity-70 transition-all hover:bg-[hsl(var(--destructive)/0.1)] hover:text-[hsl(var(--destructive))] sm:group-hover:opacity-100 focus-visible:opacity-100"
            aria-label={`Remove ${file.name}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

