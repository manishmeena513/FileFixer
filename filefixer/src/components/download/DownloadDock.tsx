"use client";

import React, { useState } from "react";
import {
  Download,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  Archive,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { useFileStore } from "@/stores/fileStore";
import { formatBytes } from "@/lib/utils";
import { triggerDownload } from "@/lib/file-utils";

export function DownloadDock() {
  const {
    downloadQueue,
    removeDownload,
    clearDownloads,
    setDownloadCenterOpen,
    setLatestDeliveredFile,
  } = useFileStore();

  const [isMinimized, setIsMinimized] = useState(false);

  if (downloadQueue.length === 0) return null;

  const deliveredCount = downloadQueue.filter((d) => d.status === "downloaded").length;
  const activeCount = downloadQueue.filter((d) => d.status === "processing" || d.status === "downloading").length;

  return (
    <div
      aria-label="Floating Download Dock"
      className="fixed bottom-20 md:bottom-6 right-4 z-40 max-w-sm w-full pointer-events-auto animate-dock-in"
    >
      <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.95)] backdrop-blur-md shadow-2xl transition-all">
        {/* Dock Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-2.5 bg-[hsl(var(--background)/0.7)]">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
              <Download className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[hsl(var(--foreground))]">
                Deliveries ({downloadQueue.length})
              </span>
              {activeCount > 0 && (
                <span className="ml-1.5 text-[10px] text-amber-500 font-mono">
                  • {activeCount} active
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setDownloadCenterOpen(true)}
              className="text-[11px] font-medium text-[hsl(var(--primary))] hover:underline px-2 py-1"
            >
              View All
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              aria-label={isMinimized ? "Expand dock" : "Minimize dock"}
            >
              {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              onClick={clearDownloads}
              className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              aria-label="Clear download dock"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stacked Delivery Items (shown if not minimized) */}
        {!isMinimized && (
          <div className="max-h-60 overflow-y-auto divide-y divide-[hsl(var(--border)/0.4)] p-1.5 space-y-1">
            {downloadQueue.map((item) => {
              const isDone = item.status === "downloaded" || item.status === "ready";
              const isProcessing = item.status === "processing" || item.status === "downloading" || item.status === "preparing";
              const isError = item.status === "error";

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[hsl(var(--background)/0.5)] transition-colors hover:bg-[hsl(var(--secondary)/0.5)]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0">
                      {isProcessing && (
                        <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--primary))]" />
                      )}
                      {isDone && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                      {isError && (
                        <AlertCircle className="h-4 w-4 text-[hsl(var(--destructive))]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate text-[hsl(var(--foreground))]">
                        {item.fileName}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted-foreground))]">
                        <span>{formatBytes(item.outputSize || item.originalSize)}</span>
                        {item.savingsPct !== undefined && item.savingsPct > 0 && (
                          <span className="text-emerald-500 font-medium">
                            (-{item.savingsPct.toFixed(0)}%)
                          </span>
                        )}
                        <span className="capitalize">• {item.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.blob && (
                      <button
                        onClick={() => {
                          triggerDownload(item.blob!, item.fileName);
                          setLatestDeliveredFile(item);
                        }}
                        title="Re-download file"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => removeDownload(item.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
                      aria-label="Dismiss item"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
