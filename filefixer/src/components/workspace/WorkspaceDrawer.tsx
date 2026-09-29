"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  X,
  Plus,
  Trash2,
  Download,
  Archive,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  FileImage,
  FileText,
  File as FileIcon,
  RefreshCw,
  Sparkles,
  Minimize2,
  Maximize2,
  Layers,
  Scissors,
  Gauge,
} from "lucide-react";
import { useFileStore } from "@/stores/fileStore";
import { formatBytes } from "@/lib/utils";
import { triggerDownload } from "@/lib/file-utils";
import { downloadAsZip } from "@/lib/zip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function WorkspaceDrawer() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    files,
    isWorkspaceOpen,
    setWorkspaceOpen,
    addFiles,
    removeFile,
    clearFiles,
    clearCompleted,
    promoteOutputToInput,
  } = useFileStore();

  // Close on Escape
  useEffect(() => {
    if (!isWorkspaceOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setWorkspaceOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isWorkspaceOpen, setWorkspaceOpen]);

  const totalCount = files.length;
  const doneFiles = files.filter((f) => f.status === "done" && f.outputBlob);
  const processingCount = files.filter((f) => f.status === "processing").length;
  const pendingCount = files.filter(
    (f) => f.status === "idle" || f.status === "pending"
  ).length;
  const errorCount = files.filter((f) => f.status === "error").length;

  const imageCount = files.filter((f) => f.type.startsWith("image/")).length;
  const pdfCount = files.filter(
    (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
  ).length;

  const totalInputSize = files.reduce((acc, f) => acc + f.size, 0);

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleDownloadAllZip = async () => {
    if (doneFiles.length === 0) return;
    await downloadAsZip(
      doneFiles.map((f) => ({
        blob: f.outputBlob!,
        filename: f.outputName || f.name,
      })),
      "filefixer-workspace.zip"
    );
  };

  const navigateToTool = (href: string) => {
    setWorkspaceOpen(false);
    router.push(href);
  };

  if (!isWorkspaceOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={() => setWorkspaceOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Temporary Local File Workspace"
    >
      <div
        className="relative flex h-full w-full max-w-lg flex-col border-l border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Session Workspace</h2>
                <Badge variant="secondary" className="text-xs">
                  {totalCount} {totalCount === 1 ? "file" : "files"}
                </Badge>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                100% in-memory browser session • Cleared when tab closes
              </p>
            </div>
          </div>

          <button
            onClick={() => setWorkspaceOpen(false)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] transition-colors"
            aria-label="Close workspace"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Summary Bar */}
        {totalCount > 0 && (
          <div className="grid grid-cols-4 gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-3 text-center">
            <div className="rounded-lg bg-[hsl(var(--secondary)/0.6)] px-2 py-1.5">
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Total</p>
              <p className="text-sm font-bold">{totalCount}</p>
            </div>
            <div className="rounded-lg bg-[hsl(var(--secondary)/0.6)] px-2 py-1.5">
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Ready</p>
              <p className="text-sm font-bold text-[hsl(var(--foreground))]">
                {pendingCount}
              </p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 px-2 py-1.5">
              <p className="text-[11px] text-emerald-500">Done</p>
              <p className="text-sm font-bold text-emerald-500">
                {doneFiles.length}
              </p>
            </div>
            <div className="rounded-lg bg-[hsl(var(--secondary)/0.6)] px-2 py-1.5">
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Size</p>
              <p className="text-xs font-semibold truncate mt-0.5">
                {formatBytes(totalInputSize)}
              </p>
            </div>
          </div>
        )}

        {/* Hidden input for adding files */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,application/pdf"
          onChange={handleAddFiles}
          className="hidden"
        />

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] p-8 text-center my-6">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                <FolderKanban className="h-7 w-7" />
              </div>
              <h3 className="text-base font-semibold mb-1">
                Your Workspace is Empty
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-xs mb-5 leading-relaxed">
                Add images or PDFs here to keep them handy during your browser session and switch between tools without re-uploading.
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[44px]"
              >
                <Plus className="h-4 w-4" />
                Add Files to Workspace
              </Button>
            </div>
          ) : (
            <>
              {/* Compatible Tool Switcher */}
              <div className="rounded-xl border border-[hsl(var(--primary)/0.25)] bg-[hsl(var(--primary)/0.05)] p-3.5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--primary))] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Send Workspace Files To Tool
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {imageCount > 0 && (
                    <>
                      <button
                        onClick={() => navigateToTool("/compress-image")}
                        className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-left text-xs font-medium hover:border-[hsl(var(--primary))] transition-colors min-h-[42px]"
                      >
                        <Minimize2 className="h-3.5 w-3.5 text-[hsl(var(--primary))] shrink-0" />
                        <span className="truncate">Compress Images</span>
                      </button>
                      <button
                        onClick={() => navigateToTool("/resize-image")}
                        className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-left text-xs font-medium hover:border-[hsl(var(--primary))] transition-colors min-h-[42px]"
                      >
                        <Maximize2 className="h-3.5 w-3.5 text-[hsl(var(--primary))] shrink-0" />
                        <span className="truncate">Resize Images</span>
                      </button>
                      <button
                        onClick={() => navigateToTool("/convert-image")}
                        className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-left text-xs font-medium hover:border-[hsl(var(--primary))] transition-colors min-h-[42px]"
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-[hsl(var(--primary))] shrink-0" />
                        <span className="truncate">Convert Format</span>
                      </button>
                      <button
                        onClick={() => navigateToTool("/smart-compress")}
                        className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-left text-xs font-medium hover:border-[hsl(var(--primary))] transition-colors min-h-[42px]"
                      >
                        <Gauge className="h-3.5 w-3.5 text-[hsl(var(--primary))] shrink-0" />
                        <span className="truncate">Under X MB</span>
                      </button>
                      <button
                        onClick={() => navigateToTool("/batch")}
                        className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-left text-xs font-medium hover:border-[hsl(var(--primary))] transition-colors min-h-[42px]"
                      >
                        <Layers className="h-3.5 w-3.5 text-[hsl(var(--primary))] shrink-0" />
                        <span className="truncate">Batch Pipeline</span>
                      </button>
                      <button
                        onClick={() => navigateToTool("/images-to-pdf")}
                        className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-left text-xs font-medium hover:border-[hsl(var(--primary))] transition-colors min-h-[42px]"
                      >
                        <FileText className="h-3.5 w-3.5 text-[hsl(var(--primary))] shrink-0" />
                        <span className="truncate">Images to PDF</span>
                      </button>
                    </>
                  )}
                  {pdfCount > 0 && (
                    <>
                      <button
                        onClick={() => navigateToTool("/pdf-merge")}
                        className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-left text-xs font-medium hover:border-[hsl(var(--primary))] transition-colors min-h-[42px]"
                      >
                        <Layers className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">Merge PDFs</span>
                      </button>
                      <button
                        onClick={() => navigateToTool("/pdf-split")}
                        className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-left text-xs font-medium hover:border-[hsl(var(--primary))] transition-colors min-h-[42px]"
                      >
                        <Scissors className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">Split PDF</span>
                      </button>
                      <button
                        onClick={() => navigateToTool("/pdf-compress")}
                        className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-left text-xs font-medium hover:border-[hsl(var(--primary))] transition-colors min-h-[42px]"
                      >
                        <Minimize2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">Compress PDF</span>
                      </button>
                      <button
                        onClick={() => navigateToTool("/pdf-workspace")}
                        className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-left text-xs font-medium hover:border-[hsl(var(--primary))] transition-colors min-h-[42px]"
                      >
                        <FileText className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">PDF Workspace</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* File List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Active Files ({totalCount})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-medium text-[hsl(var(--primary))] hover:underline flex items-center gap-1 py-1 px-2 rounded-md hover:bg-[hsl(var(--primary)/0.08)]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add More
                    </button>
                    {doneFiles.length > 0 && (
                      <button
                        onClick={clearCompleted}
                        className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] py-1 px-2"
                      >
                        Clear Done
                      </button>
                    )}
                  </div>
                </div>

                {files.map((item) => {
                  const isImage = item.type.startsWith("image/");
                  const isPdf =
                    item.type === "application/pdf" ||
                    item.name.toLowerCase().endsWith(".pdf");

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 transition-colors"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--secondary))]">
                        {isImage ? (
                          <FileImage className="h-5 w-5 text-[hsl(var(--primary))]" />
                        ) : isPdf ? (
                          <FileText className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <FileIcon className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.outputName || item.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                          <span>{formatBytes(item.size)}</span>
                          {item.width && item.height && (
                            <span>
                              • {item.width}×{item.height}
                            </span>
                          )}
                          {item.outputSize !== undefined && (
                            <span className="text-emerald-500 font-medium">
                              → {formatBytes(item.outputSize)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status / Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {item.status === "processing" && (
                          <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--primary))]" />
                        )}
                        {item.status === "error" && (
                          <span title={item.error || "Failed"}>
                            <AlertCircle className="h-4 w-4 text-[hsl(var(--destructive))]" />
                          </span>
                        )}
                        {item.status === "done" && item.outputBlob && (
                          <>
                            <button
                              onClick={() => promoteOutputToInput(item.id)}
                              title="Use processed result as new input for another tool"
                              className="flex h-9 items-center gap-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-2 text-[11px] font-medium hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] transition-colors"
                            >
                              <RefreshCw className="h-3 w-3" />
                              Reuse
                            </button>
                            <button
                              onClick={() =>
                                triggerDownload(
                                  item.outputBlob!,
                                  item.outputName || item.name
                                )
                              }
                              title="Download processed file"
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white transition-colors"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => removeFile(item.id)}
                          title="Remove from workspace"
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive)/0.1)] hover:text-[hsl(var(--destructive))] transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {totalCount > 0 && (
          <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 pb-safe space-y-2.5">
            <div className="flex items-center gap-2">
              {doneFiles.length > 0 && (
                <Button
                  onClick={handleDownloadAllZip}
                  className="flex-1 min-h-[44px]"
                >
                  <Archive className="h-4 w-4" />
                  Download Ready ({doneFiles.length}) ZIP
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[44px]"
              >
                <Plus className="h-4 w-4" />
                Add Files
              </Button>
              <Button
                variant="ghost"
                onClick={clearFiles}
                className="min-h-[44px] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)]"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
