"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  Layers,
  RotateCw,
  Trash2,
  Copy,
  ArrowLeft,
  ArrowRight,
  Download,
  CheckCircle2,
  Scissors,
  Minimize2,
  Plus,
  Loader2,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFileStore } from "@/stores/fileStore";
import { useToast } from "@/components/ui/toaster";
import { loadWorkspacePages, saveWorkspacePdf, WorkspacePage } from "@/lib/pdf/workspace";
import { formatBytes, triggerDownload } from "@/lib/file-utils";

export default function PdfStudioPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { files: storeFiles, addFiles, pushDownload, setLatestDeliveredFile } = useFileStore();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pages, setPages] = useState<WorkspacePage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedBlob, setSavedBlob] = useState<Blob | null>(null);

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

    try {
      const loaded = await loadWorkspacePages(file);
      setPages(loaded);
    } catch (err: any) {
      alert(`Could not load PDF: ${err.message}`);
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
  };

  const removePage = (index: number) => {
    if (pages.length <= 1) {
      alert("A PDF must contain at least one page.");
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

      pushDownload({
        fileName: res.outputFilename,
        originalSize: pdfFile.size,
        outputSize: res.blob.size,
        status: "ready",
        blob: res.blob,
      });

      toast({
        title: "PDF Studio export ready",
        description: `Saved ${res.outputFilename} successfully.`,
        variant: "success",
      });
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!savedBlob || !pdfFile) return;
    const name = `organized_${pdfFile.name}`;
    triggerDownload(savedBlob, name);
    setLatestDeliveredFile({
      id: `deliv-${Date.now()}`,
      fileName: name,
      originalSize: pdfFile.size,
      outputSize: savedBlob.size,
      status: "downloaded",
      blob: savedBlob,
      timestamp: Date.now(),
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[hsl(var(--border))] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-2">
            <FileText className="h-3.5 w-3.5" />
            <span>PDF Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Visual PDF Page Workstation
          </h1>
          <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
            Reorder, rotate, duplicate, and delete document pages visually with zero cloud uploads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs"
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
        </div>
      </div>

      {!pdfFile ? (
        <div className="max-w-2xl mx-auto py-12">
          <DropZone
            onFilesSelected={(files: File[]) => {
              const pdf = files.find((f: File) => f.name.endsWith(".pdf") || f.type === "application/pdf");
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
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-400" />
          <p className="text-sm font-semibold">Rendering PDF page thumbnails...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-[hsl(var(--foreground))] truncate max-w-xs">
                {pdfFile.name}
              </span>
              <Badge variant="outline" className="font-mono">
                {pages.length} Pages • {formatBytes(pdfFile.size)}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleSavePdf}
                disabled={isSaving}
                className="min-h-[40px] text-xs font-bold"
              >
                {isSaving ? "Saving..." : "Save Organized PDF"}
              </Button>
              {savedBlob && (
                <Button
                  onClick={handleDownload}
                  className="min-h-[40px] text-xs font-bold bg-emerald-600 hover:bg-emerald-500"
                >
                  <Download className="h-4 w-4 mr-1" /> Download
                </Button>
              )}
            </div>
          </div>

          {/* Thumbnail Page Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pages.map((p, idx) => (
              <div
                key={p.id}
                className="group relative flex flex-col rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 space-y-3 transition-all hover:border-emerald-500/50 shadow-sm"
              >
                {/* Header: Page Number Badge */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold bg-[hsl(var(--secondary))] px-2 py-0.5 rounded-md text-[hsl(var(--foreground))]">
                    Page {idx + 1}
                  </span>
                  {p.rotation > 0 && (
                    <span className="text-[10px] text-emerald-400">
                      {p.rotation}°
                    </span>
                  )}
                </div>

                {/* Preview Box */}
                <div className="flex items-center justify-center bg-[hsl(var(--secondary)/0.5)] rounded-xl aspect-[3/4] overflow-hidden p-2">
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

                {/* Page Controls */}
                <div className="grid grid-cols-4 gap-1 pt-1">
                  <button
                    onClick={() => movePage(idx, "left")}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg border border-[hsl(var(--border))] disabled:opacity-30 hover:bg-[hsl(var(--secondary))] flex items-center justify-center"
                    title="Move page left"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => movePage(idx, "right")}
                    disabled={idx === pages.length - 1}
                    className="p-1.5 rounded-lg border border-[hsl(var(--border))] disabled:opacity-30 hover:bg-[hsl(var(--secondary))] flex items-center justify-center"
                    title="Move page right"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => rotatePage(idx)}
                    className="p-1.5 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] flex items-center justify-center"
                    title="Rotate 90°"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removePage(idx)}
                    className="p-1.5 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--destructive)/0.1)] hover:text-[hsl(var(--destructive))] flex items-center justify-center"
                    title="Delete page"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
