"use client";

import React, { useEffect, useRef } from "react";
import {
  Download,
  Archive,
  Trash2,
  X,
  FileCheck,
  CheckCircle2,
} from "lucide-react";
import { useFileStore } from "@/stores/fileStore";
import { formatBytes } from "@/lib/utils";
import { triggerDownload } from "@/lib/file-utils";
import { downloadAsZip } from "@/lib/zip";
import { Button } from "@/components/ui/button";

export function DownloadCenterModal() {
  const {
    isDownloadCenterOpen,
    setDownloadCenterOpen,
    downloadQueue,
    clearDownloads,
    removeDownload,
    setLatestDeliveredFile,
  } = useFileStore();

  const modalContainerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Manage focus, Tab trapping, Escape dismissal & body scroll lock
  useEffect(() => {
    if (isDownloadCenterOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Initial focus on close button
      closeButtonRef.current?.focus();
      const timerId = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 30);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          setDownloadCenterOpen(false);
          return;
        }

        // Tab Focus Trap Loop
        if (e.key === "Tab" && modalContainerRef.current) {
          const focusable = modalContainerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) {
            e.preventDefault();
            return;
          }

          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first || !modalContainerRef.current.contains(document.activeElement)) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last || !modalContainerRef.current.contains(document.activeElement)) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        clearTimeout(timerId);
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isDownloadCenterOpen, setDownloadCenterOpen]);

  if (!isDownloadCenterOpen) return null;

  const validFiles = downloadQueue.filter((d) => d.blob);
  const totalOriginalSize = validFiles.reduce((acc, f) => acc + (f.originalSize || 0), 0);
  const totalOutputSize = validFiles.reduce((acc, f) => acc + (f.outputSize || 0), 0);
  const totalSaved = totalOriginalSize > totalOutputSize ? totalOriginalSize - totalOutputSize : 0;
  const totalSavedPct = totalOriginalSize > 0 ? (totalSaved / totalOriginalSize) * 100 : 0;

  const handleDownloadAllZip = async () => {
    if (validFiles.length === 0) return;
    await downloadAsZip(
      validFiles.map((f) => ({
        filename: f.fileName,
        blob: f.blob!,
      })),
      "filefixer-deliveries.zip"
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fade-in"
      onClick={() => setDownloadCenterOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Download Center"
    >
      <div
        ref={modalContainerRef}
        className="w-full max-w-xl overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl animate-scale-in flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Session Download Center</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {validFiles.length} delivered files ready in browser memory
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setDownloadCenterOpen(false)}
            className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] transition-colors touch-manipulation cursor-pointer"
            aria-label="Close download center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Aggregate Stats Summary */}
        {validFiles.length > 0 && (
          <div className="grid grid-cols-3 gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.5)] p-4 text-center tabular-nums">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">
                Total Original
              </span>
              <p className="text-xs font-bold tabular-nums">{formatBytes(totalOriginalSize)}</p>
            </div>
            <div className="space-y-0.5 border-x border-[hsl(var(--border)/0.6)]">
              <span className="text-[10px] uppercase font-semibold text-emerald-400">
                Final Size
              </span>
              <p className="text-xs font-bold text-emerald-400 tabular-nums">
                {formatBytes(totalOutputSize)}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-[hsl(var(--primary))]">
                Bandwidth Saved
              </span>
              <p className="text-xs font-bold text-[hsl(var(--primary))] tabular-nums">
                {formatBytes(totalSaved)} ({totalSavedPct.toFixed(0)}%)
              </p>
            </div>
          </div>
        )}

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {validFiles.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <FileCheck className="h-10 w-10 mx-auto text-[hsl(var(--muted-foreground)/0.4)]" />
              <p className="text-sm font-semibold">No downloaded files yet</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-xs mx-auto">
                Process images or PDFs in any FileFixer tool or the Central Workspace to see your delivery history here.
              </p>
            </div>
          ) : (
            validFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/0.5)] transition-colors hover:border-[hsl(var(--primary)/0.4)]"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate text-[hsl(var(--foreground))]">
                    {file.fileName}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5 tabular-nums">
                    <span className="tabular-nums">{formatBytes(file.outputSize)}</span>
                    {file.originalSize > file.outputSize && (
                      <span className="text-emerald-500 font-medium tabular-nums">
                        from {formatBytes(file.originalSize)}
                      </span>
                    )}
                    <span className="text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Ready
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {file.blob && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerDownload(file.blob!, file.fileName);
                        setLatestDeliveredFile(file);
                      }}
                      className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))] transition-colors touch-manipulation cursor-pointer"
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeDownload(file.id)}
                    className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] touch-manipulation cursor-pointer"
                    aria-label="Remove from list"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {validFiles.length > 0 && (
          <div className="border-t border-[hsl(var(--border))] p-4 bg-[hsl(var(--background)/0.7)] flex items-center gap-3">
            <Button
              onClick={handleDownloadAllZip}
              className="flex-1 min-h-[44px]"
            >
              <Archive className="h-4 w-4" />
              Download All as ZIP ({validFiles.length})
            </Button>
            <Button
              variant="outline"
              onClick={clearDownloads}
              className="min-h-[44px] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)]"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
