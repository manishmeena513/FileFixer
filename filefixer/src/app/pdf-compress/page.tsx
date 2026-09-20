"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  CheckCircle2,
  RefreshCw,
  TrendingDown,
  Sparkles,
  Sliders,
  ShieldCheck,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toaster";
import { compressPDF, PdfCompressResult } from "@/lib/pdf/compress";
import { formatBytes, triggerDownload } from "@/lib/file-utils";
import { addHistoryRecord } from "@/lib/storage/history";

export default function PdfCompressPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [level, setLevel] = useState<"balanced" | "smaller" | "custom">("balanced");
  const [stripMeta, setStripMeta] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PdfCompressResult | null>(null);

  const handleFiles = (files: File[]) => {
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
    triggerDownload(result.blob, `${base}_compressed.pdf`);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
              Compress PDF
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Optimize PDF stream dictionaries and deduplicate resources locally without uploading.
            </p>
          </div>
        </div>
      </div>

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
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
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
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
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
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
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
              <div className="flex items-center justify-between pt-2 border-t border-[hsl(var(--border))] text-xs">
                <span className="text-[hsl(var(--foreground))] font-medium">Remove Embedded Author & Title Metadata</span>
                <Switch checked={stripMeta} onCheckedChange={setStripMeta} />
              </div>

              <Button
                size="lg"
                disabled={isProcessing}
                onClick={handleCompress}
                className="w-full"
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
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-[hsl(var(--foreground))]">
                      Compressed PDF Ready
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                      {formatBytes(result.originalSize)} → <strong className="text-emerald-400 font-bold">{formatBytes(result.outputSize)}</strong> ({result.savingsPct.toFixed(1)}% smaller · {result.pageCount} pages)
                    </p>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={handleDownload}
                  className="w-full sm:w-auto bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Compressed PDF
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
