"use client";

import React, { useState } from "react";
import {
  FilePlus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Download,
  RefreshCw,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { mergePDFs } from "@/lib/pdf/merge";
import { formatBytes, triggerDownload } from "@/lib/file-utils";

interface MergeItem {
  id: string;
  file: File;
}

export default function PdfMergePage() {
  const { toast } = useToast();
  const [items, setItems] = useState<MergeItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [mergedStats, setMergedStats] = useState<{ count: number; size: number } | null>(null);

  const handleFiles = (files: File[]) => {
    const valid = files.filter((f) => f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf");
    if (valid.length === 0) {
      toast({
        title: "Invalid file",
        description: "Please select PDF documents.",
        variant: "error",
      });
      return;
    }
    const newItems = valid.map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      file: f,
    }));
    setItems((prev) => [...prev, ...newItems]);
    setMergedBlob(null);
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const copy = [...items];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setItems(copy);
    setMergedBlob(null);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setMergedBlob(null);
  };

  const handleMerge = async () => {
    if (items.length < 2) {
      toast({
        title: "Minimum 2 PDFs required",
        description: "Please select at least 2 PDF documents to combine.",
        variant: "error",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const filesToMerge = items.map((it) => it.file);
      const res = await mergePDFs(filesToMerge);
      setMergedBlob(res.blob);
      setMergedStats({ count: res.pageCount, size: res.blob.size });
      toast({
        title: "Merge completed",
        description: `Combined into a single PDF with ${res.pageCount} pages.`,
        variant: "success",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Merge failed",
        description: err.message || "Failed to combine PDFs",
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!mergedBlob) return;
    triggerDownload(mergedBlob, "merged_document.pdf");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
            <FilePlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
              Merge PDFs
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Combine multiple PDF documents into a single file. Reorder pages and files completely locally.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <DropZone
          onFiles={handleFiles}
          accept={[".pdf"]}
          label="Drop PDF files here to merge"
          sublabel="Select two or more PDF documents"
          className="py-12"
        />

        {items.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
              <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Merge Order ({items.length} files)
              </span>
              <Button variant="ghost" size="sm" onClick={() => setItems([])}>
                Clear All
              </Button>
            </div>

            {/* Reorderable list */}
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-7 w-7 items-center justify-center rounded bg-[hsl(var(--secondary))] text-xs font-mono font-bold text-[hsl(var(--primary))]">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <FileText className="h-5 w-5 flex-shrink-0 text-[hsl(var(--muted-foreground))]" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]">
                        {it.file.name}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {formatBytes(it.file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={idx === 0}
                      onClick={() => moveItem(idx, "up")}
                      className="h-8 w-8"
                      title="Move Up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={idx === items.length - 1}
                      onClick={() => moveItem(idx, "down")}
                      className="h-8 w-8"
                      title="Move Down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(it.id)}
                      className="h-8 w-8 text-[hsl(var(--destructive))] hover:text-red-400"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Merge CTA */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                Documents are merged sequentially from top to bottom.
              </span>
              <Button
                size="lg"
                disabled={items.length < 2 || isProcessing}
                onClick={handleMerge}
                className="w-full sm:w-auto"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Merging Locally...
                  </>
                ) : (
                  <>
                    <FilePlus className="h-4 w-4 mr-2" />
                    Merge {items.length} PDFs
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Result ready card */}
        {mergedBlob && mergedStats && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm text-[hsl(var(--foreground))]">
                  Merged PDF Document Ready
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                  Total {mergedStats.count} pages · {formatBytes(mergedStats.size)}
                </p>
              </div>
            </div>

            <Button
              size="lg"
              onClick={handleDownload}
              className="w-full sm:w-auto bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download merged_document.pdf
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
