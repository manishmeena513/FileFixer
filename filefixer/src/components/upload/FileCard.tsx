"use client";

import React from "react";
import { X, CheckCircle2, AlertCircle, Loader2, FileText, Image } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
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

  const statusIcon = {
    idle: null,
    pending: <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--muted-foreground))]" />,
    processing: <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--primary))]" />,
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

  return (
    <div className={cn(
      "group relative flex items-start gap-3 rounded-lg border p-3 transition-colors",
      "border-[hsl(var(--border))] bg-[hsl(var(--card))]",
      file.status === "done" && "border-[hsl(var(--success)/0.3)]",
      file.status === "error" && "border-[hsl(var(--destructive)/0.3)]",
    )}>
      {/* Thumbnail or icon */}
      <div className="flex-shrink-0">
        {file.thumbnailUrl && isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.thumbnailUrl}
            alt={file.name}
            className="h-12 w-12 rounded object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded bg-[hsl(var(--secondary))]">
            {isImage ? (
              <Image className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
            ) : (
              <FileText className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]" title={file.name}>
          {file.name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{ext}</Badge>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {formatBytes(file.size)}
          </span>
          {showOutput && file.outputSize && file.status === "done" && (
            <>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">→</span>
              <span className="text-xs font-medium text-[hsl(var(--success))]">
                {formatBytes(file.outputSize)}
              </span>
            </>
          )}
        </div>

        {/* Error message */}
        {file.status === "error" && file.error && (
          <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{file.error}</p>
        )}
      </div>

      {/* Status + remove */}
      <div className="flex flex-shrink-0 items-center gap-2">
        {statusIcon && (
          <div className="flex items-center gap-1.5">
            {statusIcon}
            {statusLabel && (
              <span className={cn(
                "text-xs",
                file.status === "done" && "text-[hsl(var(--success))]",
                file.status === "error" && "text-[hsl(var(--destructive))]",
                (file.status === "processing" || file.status === "pending") && "text-[hsl(var(--muted-foreground))]",
              )}>
                {statusLabel}
              </span>
            )}
          </div>
        )}
        {onRemove && file.status !== "processing" && (
          <button
            onClick={() => onRemove(file.id)}
            className="rounded p-1 text-[hsl(var(--muted-foreground))] opacity-0 transition-opacity hover:text-[hsl(var(--foreground))] group-hover:opacity-100 focus-visible:opacity-100"
            aria-label={`Remove ${file.name}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
