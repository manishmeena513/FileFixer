"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  RotateCw,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Download,
  RefreshCw,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { loadWorkspacePages, saveWorkspacePdf, WorkspacePage } from "@/lib/pdf/workspace";
import { formatBytes, triggerDownload } from "@/lib/file-utils";
import { addHistoryRecord } from "@/lib/storage/history";
import { useFileStore } from "@/stores/fileStore";
import { ToolPageShell } from "@/components/ui/ToolPageShell";

export default function PdfWorkspacePage() {
  const { toast } = useToast();
  const {
    files: storeFiles,
    addFiles: addStoreFiles,
    pushDownload,
    setLatestDeliveredFile,
    triggerSupportPrompt,
  } = useFileStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pages, setPages] = useState<WorkspacePage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedResult, setSavedResult] = useState<{ blob: Blob; name: string } | null>(null);

  const loadPdfIntoWorkspace = async (pdf: File) => {
    setSelectedFile(pdf);
    setIsLoading(true);
    setSavedResult(null);

    try {
      const loaded = await loadWorkspacePages(pdf);
      setPages(loaded);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Could not read PDF",
        description: err.message || "Failed to load pages",
        variant: "error",
      });
      setSelectedFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedFile && storeFiles.length > 0) {
      const firstPdf = storeFiles.find(
        (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
      );
      if (firstPdf) {
        loadPdfIntoWorkspace(firstPdf.file);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiles = async (files: File[]) => {
    const pdf = files.find(
      (f) => f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf"
    );
    if (!pdf) {
      toast({
        title: "Invalid file",
        description: "Please select a PDF document.",
        variant: "error",
      });
      return;
    }
    addStoreFiles([pdf]);
    await loadPdfIntoWorkspace(pdf);
  };

  const movePage = (index: number, direction: "left" | "right") => {
    const targetIdx = direction === "left" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= pages.length) return;
    const copy = [...pages];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setPages(copy);
    setSavedResult(null);
  };

  const rotatePage = (index: number) => {
    const copy = [...pages];
    copy[index].rotation = (copy[index].rotation + 90) % 360;
    setPages(copy);
    setSavedResult(null);
  };

  const duplicatePage = (index: number) => {
    const p = pages[index];
    const copy = [...pages];
    const newPage: WorkspacePage = {
      id: `page-dup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      originalPageIndex: p.originalPageIndex,
      displayNumber: p.displayNumber,
      rotation: p.rotation,
    };
    copy.splice(index + 1, 0, newPage);
    setPages(copy);
    setSavedResult(null);
    toast({
      title: "Page duplicated",
      description: `Duplicated page ${index + 1}.`,
      variant: "default",
    });
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "A PDF must contain at least one page.",
        variant: "error",
      });
      return;
    }
    const copy = [...pages];
    copy.splice(index, 1);
    setPages(copy);
    setSavedResult(null);
  };

  const handleSave = async () => {
    if (!selectedFile || pages.length === 0) return;
    setIsSaving(true);

    try {
      const res = await saveWorkspacePdf(selectedFile, pages);
      setSavedResult({ blob: res.blob, name: res.outputFilename });

      // Enqueue to Download Dock as ready
      pushDownload({
        fileName: res.outputFilename,
        originalSize: selectedFile.size,
        outputSize: res.blob.size,
        savingsPct: 0,
        status: "ready",
        blob: res.blob,
      });

      toast({
        title: "Workspace saved",
        description: `Successfully arranged ${pages.length} page(s).`,
        variant: "success",
      });

      // Save to local history
      await addHistoryRecord({
        filename: selectedFile.name,
        tool: "PDF Visual Workspace",
        originalSize: selectedFile.size,
        outputSize: res.blob.size,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Save failed",
        description: err.message || "Failed to generate organized PDF",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!savedResult || !selectedFile) return;
    triggerDownload(savedResult.blob, savedResult.name);

    const dlItem = {
      fileName: savedResult.name,
      originalSize: selectedFile.size,
      outputSize: savedResult.blob.size,
      savingsPct: 0,
      status: "downloaded" as const,
      blob: savedResult.blob,
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
      icon={Layers}
      title="PDF Visual Workspace"
      description="Interactive page organizer: rotate, reorder, duplicate, and delete pages visually."
      formats={["PDF"]}
    >
      {!selectedFile ? (
        <DropZone
          onFiles={handleFiles}
          accept={[".pdf"]}
          multiple={false}
          label="Drop a PDF to open the Visual Workspace"
          sublabel="Organize, rotate, duplicate, and delete pages"
          className="py-16"
        />
      ) : (
        <div className="space-y-6">
          {/* Top action toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  <span className="tabular-nums font-medium text-[hsl(var(--foreground))]">
                    {pages.length}
                  </span>{" "}
                  Page{pages.length === 1 ? "" : "s"} in workspace ·{" "}
                  <span className="tabular-nums font-medium text-[hsl(var(--foreground))]">
                    {formatBytes(selectedFile.size)}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] px-3 py-2 text-xs font-medium touch-manipulation"
                onClick={() => setSelectedFile(null)}
              >
                Change File
              </Button>
              <Button
                size="sm"
                disabled={isSaving || pages.length === 0}
                onClick={handleSave}
                className="min-h-[44px] px-4 py-2 touch-manipulation bg-[hsl(var(--success))] hover:bg-emerald-600 text-[hsl(var(--success-foreground))] font-semibold"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                    Saving PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Page workspace cards grid */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {pages.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex flex-col rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] overflow-hidden transition-all hover:border-[hsl(var(--primary)/0.5)] shadow-sm"
                >
                  {/* Page header tag */}
                  <div className="flex items-center justify-between bg-[hsl(var(--secondary))] px-2.5 py-1.5 text-[11px] font-mono">
                    <span className="font-bold text-[hsl(var(--primary))] tabular-nums">
                      #{idx + 1}
                    </span>
                    <span className="text-[hsl(var(--muted-foreground))] tabular-nums">
                      orig p.{p.originalPageIndex + 1}
                    </span>
                  </div>

                  {/* Visual card content */}
                  <div className="flex flex-1 items-center justify-center p-6 bg-[hsl(var(--card))] min-h-[140px] text-center">
                    <div
                      style={{
                        transform: `rotate(${p.rotation}deg)`,
                        transition: "transform 0.2s ease-out",
                      }}
                      className="flex flex-col items-center"
                    >
                      <FileText className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />
                      <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] mt-1 tabular-nums">
                        {p.rotation > 0 ? `${p.rotation}°` : "Page"}
                      </span>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="grid grid-cols-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.5)] divide-x divide-[hsl(var(--border))]">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => movePage(idx, "left")}
                      title="Move Left"
                      aria-label={`Move page ${idx + 1} left`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] disabled:opacity-30 disabled:pointer-events-none touch-manipulation"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === pages.length - 1}
                      onClick={() => movePage(idx, "right")}
                      title="Move Right"
                      aria-label={`Move page ${idx + 1} right`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] disabled:opacity-30 disabled:pointer-events-none touch-manipulation"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => rotatePage(idx)}
                      title="Rotate 90° Clockwise"
                      aria-label={`Rotate page ${idx + 1} clockwise`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] touch-manipulation"
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePage(idx)}
                      title="Delete Page"
                      aria-label={`Delete page ${idx + 1}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] touch-manipulation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Duplicate trigger */}
                  <button
                    type="button"
                    onClick={() => duplicatePage(idx)}
                    className="min-h-[44px] w-full border-t border-[hsl(var(--border))] py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] flex items-center justify-center touch-manipulation transition-colors"
                  >
                    + Duplicate
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Download card */}
          {savedResult && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm text-[hsl(var(--foreground))]">
                    Reordered PDF Document Ready
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {savedResult.name} ·{" "}
                    <span className="tabular-nums font-medium text-[hsl(var(--foreground))]">
                      {formatBytes(savedResult.blob.size)}
                    </span>{" "}
                    (
                    <span className="tabular-nums font-medium text-[hsl(var(--foreground))]">
                      {pages.length}
                    </span>{" "}
                    pages)
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                onClick={handleDownload}
                className="w-full sm:w-auto min-h-[44px] touch-manipulation bg-[hsl(var(--success))] hover:bg-emerald-600 text-[hsl(var(--success-foreground))] font-semibold"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Modified PDF
              </Button>
            </div>
          )}
        </div>
      )}
    </ToolPageShell>
  );
}
