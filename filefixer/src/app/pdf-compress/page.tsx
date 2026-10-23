"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { BeforeAfterStats } from "@/components/results/BeforeAfter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toaster";
import { compressPDF, PdfCompressResult } from "@/lib/pdf/compress";
import { formatBytes, triggerDownload } from "@/lib/file-utils";
import { addHistoryRecord } from "@/lib/storage/history";
import { useFileStore } from "@/stores/fileStore";
import { ToolPageShell } from "@/components/ui/ToolPageShell";

export default function PdfCompressPage() {
  const { toast } = useToast();
  const {
    files: storeFiles,
    addFiles: addStoreFiles,
    pushDownload,
    setLatestDeliveredFile,
    triggerSupportPrompt,
  } = useFileStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [level, setLevel] = useState<"balanced" | "smaller" | "custom">("balanced");
  const [stripMeta, setStripMeta] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PdfCompressResult | null>(null);

  useEffect(() => {
    if (!selectedFile && storeFiles.length > 0) {
      const firstPdf = storeFiles.find(
        (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
      );
      if (firstPdf) setSelectedFile(firstPdf.file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiles = (files: File[]) => {
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
    setSelectedFile(pdf);
    setResult(null);
  };

  const handleCompress = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);

    try {
      const res = await compressPDF(selectedFile, {
        level,
        removeMetadata: stripMeta,
      });
      setResult(res);

      const base = selectedFile.name.replace(/\.[^/.]+$/, "");
      const outputFilename = `${base}_compressed.pdf`;

      // Enqueue to global Download Dock as ready
      pushDownload({
        fileName: outputFilename,
        originalSize: res.originalSize,
        outputSize: res.outputSize,
        savingsPct: res.savingsPct,
        status: "ready",
        blob: res.blob,
      });

      toast({
        title: "PDF compressed",
        description: `Reduced by ${res.savingsPct.toFixed(1)}% (${formatBytes(res.originalSize)} → ${formatBytes(res.outputSize)}).`,
        variant: "success",
      });

      // Save to local IndexedDB history
      await addHistoryRecord({
        filename: selectedFile.name,
        tool: "PDF Compress",
        originalSize: res.originalSize,
        outputSize: res.outputSize,
        savingsPct: res.savingsPct,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Compression failed",
        description: err.message || "Failed to compress PDF",
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !selectedFile) return;
    const base = selectedFile.name.replace(/\.[^/.]+$/, "");
    const outputFilename = `${base}_compressed.pdf`;
    triggerDownload(result.blob, outputFilename);

    const dlItem = {
      fileName: outputFilename,
      originalSize: result.originalSize,
      outputSize: result.outputSize,
      savingsPct: result.savingsPct,
      status: "downloaded" as const,
      blob: result.blob,
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
      title="Compress PDF"
      description="Optimize PDF stream dictionaries and deduplicate resources locally without uploading."
      formats={["PDF"]}
    >
      <div className="space-y-6">
        {!selectedFile ? (
          <DropZone
            onFiles={handleFiles}
            accept={[".pdf"]}
            multiple={false}
            label="Drop your PDF document here to compress"
            sublabel="Clean client-side stream optimization"
            className="py-16"
          />
        ) : (
          <div className="space-y-6">
            {/* File header */}
            <div className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] tabular-nums">
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] px-3 py-2 text-xs font-medium touch-manipulation"
                onClick={() => setSelectedFile(null)}
              >
                Change File
              </Button>
            </div>

            {/* Optimization mode selection */}
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-6">
              <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
                Optimization Profile
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setLevel("balanced")}
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all min-h-[44px] touch-manipulation ${
                    level === "balanced"
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--foreground))]"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary)/0.8)]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-sm text-[hsl(var(--foreground))]">Balanced Mode</span>
                    <Badge variant="outline" className="text-[10px]">Recommended</Badge>
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2 leading-relaxed">
                    Deduplicates shared objects and compacts internal streams while keeping full vector clarity and original layout metadata.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setLevel("smaller")}
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all min-h-[44px] touch-manipulation ${
                    level === "smaller"
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--foreground))]"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary)/0.8)]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-sm text-[hsl(var(--foreground))]">Smaller File</span>
                    <Badge variant="outline" className="text-[10px]">Maximum Savings</Badge>
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2 leading-relaxed">
                    Aggressively discards unreferenced PDF trailers, creator tags, and rebuilds object cross-reference tables from scratch.
                  </p>
                </button>
              </div>

              {/* Strip metadata switch */}
              <div className="flex items-center justify-between pt-2 border-t border-[hsl(var(--border))] min-h-[44px]">
                <label
                  htmlFor="strip-meta-toggle"
                  className="text-xs text-[hsl(var(--foreground))] font-medium cursor-pointer flex-1"
                >
                  Remove Embedded Author & Title Metadata
                </label>
                <Switch
                  id="strip-meta-toggle"
                  checked={stripMeta}
                  onCheckedChange={setStripMeta}
                  className="touch-manipulation"
                />
              </div>

              <Button
                size="lg"
                disabled={isProcessing}
                onClick={handleCompress}
                className="w-full min-h-[44px] touch-manipulation font-semibold"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Optimizing PDF in Browser...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Compress PDF
                  </>
                )}
              </Button>
            </div>

            {/* Results card */}
            {result && (
              <div className="space-y-4">
                <BeforeAfterStats
                  originalSize={result.originalSize}
                  outputSize={result.outputSize}
                  originalFormat="PDF"
                  outputFormat={`PDF • ${result.pageCount} pages`}
                />
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold text-sm text-[hsl(var(--foreground))]">
                        Compressed PDF Ready
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        <span className="tabular-nums font-medium text-[hsl(var(--foreground))]">
                          {formatBytes(result.originalSize)}
                        </span>{" "}
                        →{" "}
                        <strong className="text-emerald-700 dark:text-emerald-400 font-bold tabular-nums">
                          {formatBytes(result.outputSize)}
                        </strong>{" "}
                        (
                        <span className="tabular-nums font-medium text-[hsl(var(--foreground))]">
                          {result.savingsPct.toFixed(1)}%
                        </span>{" "}
                        smaller ·{" "}
                        <span className="tabular-nums font-medium text-[hsl(var(--foreground))]">
                          {result.pageCount}
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
                    Download Compressed PDF
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}
