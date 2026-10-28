"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  RotateCw,
  Trash2,
  Copy,
  ArrowLeft,
  ArrowRight,
  Download,
  Loader2,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFileStore } from "@/stores/fileStore";
import { useToast } from "@/components/ui/toaster";
import { loadWorkspacePages, saveWorkspacePdf, WorkspacePage } from "@/lib/pdf/workspace";
import { formatBytes, triggerDownload } from "@/lib/file-utils";
import { ToolPageShell } from "@/components/ui/ToolPageShell";

export default function PdfStudioPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    files: storeFiles,
    addFiles,
    pushDownload,
    setLatestDeliveredFile,
    triggerSupportPrompt,
  } = useFileStore();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pages, setPages] = useState<WorkspacePage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedBlob, setSavedBlob] = useState<Blob | null>(null);
  const [outputFilename, setOutputFilename] = useState<string | null>(null);

  // Auto-populate from workspace
  useEffect(() => {
    if (!pdfFile && storeFiles.length > 0) {
      const firstPdf = storeFiles.find(
        (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
      );
      if (firstPdf) handleLoadPdf(firstPdf.file);
    }
  }, [storeFiles, pdfFile]);

  const handleLoadPdf = async (file: File) => {
    setPdfFile(file);
    setIsLoading(true);
    setSavedBlob(null);
    setOutputFilename(null);

    try {
      const loaded = await loadWorkspacePages(file);
      setPages(loaded);
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Could not load PDF",
        description: err.message || "Failed to parse document structure",
      });
      setPdfFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const movePage = (index: number, direction: "left" | "right") => {
    const targetIdx = direction === "left" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= pages.length) return;
    const copy = [...pages];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setPages(copy);
    setSavedBlob(null);
  };

  const rotatePage = (index: number) => {
    const copy = [...pages];
    copy[index].rotation = (copy[index].rotation + 90) % 360;
    setPages(copy);
    setSavedBlob(null);
  };

  const duplicatePage = (index: number) => {
    const p = pages[index];
    const copy = [...pages];
    copy.splice(index + 1, 0, {
      ...p,
      id: `page-dup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    });
    setPages(copy);
    setSavedBlob(null);
    toast({
      title: "Page duplicated",
      description: `Cloned page ${index + 1} successfully.`,
      variant: "default",
    });
  };

  const removePage = (index: number) => {
    if (pages.length <= 1) {
      toast({
        variant: "error",
        title: "Cannot delete page",
        description: "A PDF must contain at least one page.",
      });
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
    setSavedBlob(null);
  };

  const handleSavePdf = async () => {
    if (!pdfFile || pages.length === 0) return;
    setIsSaving(true);

    try {
      const res = await saveWorkspacePdf(pdfFile, pages);
      setSavedBlob(res.blob);
      setOutputFilename(res.outputFilename);

      pushDownload({
        fileName: res.outputFilename,
        originalSize: pdfFile.size,
        outputSize: res.blob.size,
        savingsPct: 0,
        status: "ready",
        blob: res.blob,
      });

      toast({
        title: "PDF Studio export ready",
        description: `Saved ${res.outputFilename} successfully.`,
        variant: "success",
      });
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Save failed",
        description: err.message || "Failed to generate organized PDF",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!savedBlob || !pdfFile) return;
    const name = outputFilename || `${pdfFile.name.replace(/\.[^/.]+$/, "")}_workspace_edited.pdf`;
    triggerDownload(savedBlob, name);

    const dlItem = {
      fileName: name,
      originalSize: pdfFile.size,
      outputSize: savedBlob.size,
      savingsPct: 0,
      status: "downloaded" as const,
      blob: savedBlob,
    };

    pushDownload(dlItem);
    setLatestDeliveredFile({
      id: `deliv-${Date.now()}`,
      ...dlItem,
      timestamp: Date.now(),
    });
    triggerSupportPrompt();
  };

  return (
    <ToolPageShell
      icon={FileText}
      title="PDF Studio"
      description="Comprehensive visual PDF workstation: drag to reorder, rotate, delete, duplicate, merge, and compress pages with zero server uploads."
      formats={["PDF"]}
    >
      <div className="space-y-8">
        {!pdfFile ? (
          <div className="max-w-2xl mx-auto py-12">
            <DropZone
              onFiles={(files: File[]) => {
                const pdf = files.find(
                  (f: File) => f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf"
                );
                if (pdf) {
                  addFiles([pdf]);
                  handleLoadPdf(pdf);
                }
              }}
              accept={["application/pdf", ".pdf"]}
              title="Drop PDF Document into PDF Studio"
              description="Drag any PDF to organize, rotate, and reorder its pages"
            />
          </div>
        ) : isLoading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-700 dark:text-emerald-400" />
            <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
              Rendering PDF page thumbnails...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-xl shadow-xl">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-[hsl(var(--foreground))] truncate max-w-xs">
                  {pdfFile.name}
                </span>
                <Badge variant="outline" className="font-mono tabular-nums border-[var(--glass-border)]">
                  <span className="tabular-nums font-semibold">{pages.length}</span> Pages •{" "}
                  <span className="tabular-nums font-semibold">{formatBytes(pdfFile.size)}</span>
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[44px] px-3 py-2 text-xs font-medium touch-manipulation"
                >
                  <Upload className="h-4 w-4 mr-1.5" /> Open Different PDF
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleLoadPdf(e.target.files[0]);
                  }}
                  className="hidden"
                />

                <Button
                  onClick={handleSavePdf}
                  disabled={isSaving}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold touch-manipulation"
                >
                  {isSaving ? "Saving..." : "Save Organized PDF"}
                </Button>
                {savedBlob && (
                  <Button
                    onClick={handleDownload}
                    className="min-h-[44px] px-4 py-2 text-xs font-semibold touch-manipulation bg-[hsl(var(--success))] hover:bg-emerald-600 text-[hsl(var(--success-foreground))]"
                  >
                    <Download className="h-4 w-4 mr-1.5" /> Download
                  </Button>
                )}
              </div>
            </div>

            {/* Thumbnail Page Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {pages.map((p, idx) => (
                <div
                  key={p.id}
                  className="group relative flex flex-col rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] backdrop-blur-md p-3 space-y-3 transition-all hover:border-[var(--glass-border-luminous)] shadow-md"
                >
                  {/* Header: Page Number Badge */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold border border-[var(--glass-border)] bg-[var(--glass-surface)] px-2 py-0.5 rounded-md text-[hsl(var(--foreground))] tabular-nums">
                      Page <span className="tabular-nums">{idx + 1}</span>
                    </span>
                    {p.rotation > 0 && (
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 tabular-nums font-semibold">
                        {p.rotation}°
                      </span>
                    )}
                  </div>

                  {/* Preview Box */}
                  <div className="flex items-center justify-center bg-black/30 rounded-xl aspect-[3/4] overflow-hidden p-2 border border-[var(--glass-border)]">
                    {p.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.thumbnailUrl}
                        alt={`Page ${idx + 1}`}
                        className="max-h-full max-w-full object-contain rounded shadow-xs transition-transform duration-200"
                        style={{ transform: `rotate(${p.rotation}deg)` }}
                      />
                    ) : (
                      <FileText className="h-8 w-8 text-[hsl(var(--muted-foreground)/0.5)]" />
                    )}
                  </div>

                  {/* Page Controls Toolbar */}
                  <div className="grid grid-cols-5 gap-1 pt-1 border-t border-[var(--glass-border)]">
                    <button
                      type="button"
                      onClick={() => movePage(idx, "left")}
                      disabled={idx === 0}
                      className="min-h-[44px] min-w-[44px] rounded-lg border border-[var(--glass-border)] bg-[var(--glass-surface)] disabled:opacity-30 hover:border-[var(--glass-border-luminous)] flex items-center justify-center touch-manipulation text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                      title="Move page left"
                      aria-label={`Move page ${idx + 1} left`}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => movePage(idx, "right")}
                      disabled={idx === pages.length - 1}
                      className="min-h-[44px] min-w-[44px] rounded-lg border border-[var(--glass-border)] bg-[var(--glass-surface)] disabled:opacity-30 hover:border-[var(--glass-border-luminous)] flex items-center justify-center touch-manipulation text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                      title="Move page right"
                      aria-label={`Move page ${idx + 1} right`}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => rotatePage(idx)}
                      className="min-h-[44px] min-w-[44px] rounded-lg border border-[var(--glass-border)] bg-[var(--glass-surface)] hover:border-[var(--glass-border-luminous)] flex items-center justify-center touch-manipulation text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"
                      title="Rotate 90° Clockwise"
                      aria-label={`Rotate page ${idx + 1} clockwise`}
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicatePage(idx)}
                      className="min-h-[44px] min-w-[44px] rounded-lg border border-[var(--glass-border)] bg-[var(--glass-surface)] hover:border-[var(--glass-border-luminous)] flex items-center justify-center touch-manipulation text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                      title="Duplicate page"
                      aria-label={`Duplicate page ${idx + 1}`}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePage(idx)}
                      className="min-h-[44px] min-w-[44px] rounded-lg border border-[var(--glass-border)] bg-[var(--glass-surface)] hover:bg-[hsl(var(--destructive)/0.1)] hover:text-[hsl(var(--destructive))] flex items-center justify-center touch-manipulation text-[hsl(var(--muted-foreground))]"
                      title="Delete page"
                      aria-label={`Delete page ${idx + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}
