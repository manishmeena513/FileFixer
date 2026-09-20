"use client";

import React, { useState } from "react";
import {
  Layers,
  RotateCw,
  Trash2,
  Copy,
  ArrowLeft,
  ArrowRight,
  Download,
  RefreshCw,
  FileText,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { loadWorkspacePages, saveWorkspacePdf, WorkspacePage } from "@/lib/pdf/workspace";
import { formatBytes, triggerDownload } from "@/lib/file-utils";
import { addHistoryRecord } from "@/lib/storage/history";

export default function PdfWorkspacePage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pages, setPages] = useState<WorkspacePage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedResult, setSavedResult] = useState<{ blob: Blob; name: string } | null>(null);

  const handleFiles = async (files: File[]) => {
    const pdf = files.find((f) => f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf");
    if (!pdf) {
      toast({
        title: "Invalid file",
        description: "Please select a PDF document.",
        variant: "error",
      });
      return;
    }

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
              PDF Visual Workspace
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Interactive page organizer: drag, rotate, reorder, duplicate, and delete pages visually.
            </p>
          </div>
        </div>
      </div>

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
                  {pages.length} Page{pages.length === 1 ? "" : "s"} in workspace · {formatBytes(selectedFile.size)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                Change File
              </Button>
              <Button
                size="sm"
                disabled={isSaving || pages.length === 0}
                onClick={handleSave}
                className="bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                    Saving PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1.5" />
                    Save & Download PDF
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
                    <span className="font-bold text-[hsl(var(--primary))]">
                      #{idx + 1}
                    </span>
                    <span className="text-[hsl(var(--muted-foreground))]">
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
                      <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] mt-1">
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
                      className="flex items-center justify-center p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === pages.length - 1}
                      onClick={() => movePage(idx, "right")}
                      title="Move Right"
                      className="flex items-center justify-center p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => rotatePage(idx)}
                      title="Rotate 90° Clockwise"
                      className="flex items-center justify-center p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePage(idx)}
                      title="Delete Page"
                      className="flex items-center justify-center p-2 text-[hsl(var(--muted-foreground))] hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Duplicate trigger */}
                  <button
                    type="button"
                    onClick={() => duplicatePage(idx)}
                    className="w-full border-t border-[hsl(var(--border))] py-1 text-[10px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
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
                <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm text-[hsl(var(--foreground))]">
                    Reordered PDF Document Ready
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {savedResult.name} · {formatBytes(savedResult.blob.size)} ({pages.length} pages)
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => triggerDownload(savedResult.blob, savedResult.name)}
                className="w-full sm:w-auto bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Modified PDF
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
