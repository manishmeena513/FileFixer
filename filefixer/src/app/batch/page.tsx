"use client";

import React, { useState } from "react";
import {
  Layers,
  Download,
  Archive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/toaster";
import { processBatchItem, BatchPipelineConfig, BatchItemResult } from "@/lib/batch/batchProcessor";
import { formatBytes, SupportedImageFormat } from "@/lib/file-utils";
import { downloadAsZip } from "@/lib/zip";
import { addHistoryRecord } from "@/lib/storage/history";

export default function BatchHubPage() {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BatchItemResult[]>([]);

  // Pipeline configuration
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [targetWidth, setTargetWidth] = useState(1920);
  const [targetHeight, setTargetHeight] = useState(1080);

  const [convertEnabled, setConvertEnabled] = useState(true);
  const [targetFormat, setTargetFormat] = useState<SupportedImageFormat>("image/webp");

  const [compressEnabled, setCompressEnabled] = useState(true);
  const [qualityPct, setQualityPct] = useState(82);

  const [renameEnabled, setRenameEnabled] = useState(true);
  const [renamePattern, setRenamePattern] = useState("asset_###");

  const handleFiles = (newFiles: File[]) => {
    const valid = newFiles.filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) {
      toast({
        title: "Invalid files",
        description: "Please select image files for the batch pipeline.",
        variant: "error",
      });
      return;
    }
    setFiles((prev) => [...prev, ...valid]);
    setResults([]);
  };

  const handleProcessAll = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setResults([]);

    const config: BatchPipelineConfig = {
      resizeEnabled,
      targetWidth: resizeEnabled ? targetWidth : undefined,
      targetHeight: resizeEnabled ? targetHeight : undefined,
      convertEnabled,
      targetFormat: convertEnabled ? targetFormat : undefined,
      compressEnabled,
      qualityPct: compressEnabled ? qualityPct : undefined,
      renamePattern: renameEnabled ? renamePattern : undefined,
      startNumber: 1,
    };

    const tempResults: BatchItemResult[] = [];
    for (let i = 0; i < files.length; i++) {
      const itemResult = await processBatchItem(files[i], i, config);
      tempResults.push(itemResult);
      setResults([...tempResults]);
    }

    setIsProcessing(false);

    // Summary calculations
    const origTotal = tempResults.reduce((acc, r) => acc + r.originalSize, 0);
    const outTotal = tempResults.reduce((acc, r) => acc + r.outputSize, 0);

    toast({
      title: "Batch pipeline finished",
      description: `Processed ${tempResults.length} files. Total saved: ${formatBytes(origTotal - outTotal)}.`,
      variant: "success",
    });

    // Record to local history
    await addHistoryRecord({
      filename: `Batch (${files.length} images)`,
      tool: "Batch Processing Hub",
      originalSize: origTotal,
      outputSize: outTotal,
    });
  };

  const handleDownloadZip = async () => {
    const ready = results.filter((r) => r.status === "done");
    if (ready.length === 0) return;

    const entries = ready.map((r) => ({
      filename: r.outputName,
      blob: r.blob,
    }));

    await downloadAsZip(entries, "batch_processed_assets.zip");
    toast({
      title: "ZIP downloaded",
      description: `Downloaded ${entries.length} processed file(s).`,
      variant: "success",
    });
  };

  const totalOriginal = files.reduce((acc, f) => acc + f.size, 0);
  const totalOutput = results.reduce((acc, r) => acc + r.outputSize, 0);
  const completedCount = results.filter((r) => r.status === "done").length;
  const failedCount = results.filter((r) => r.status === "error").length;
  const savingsPct = totalOriginal > 0 && results.length > 0
    ? Math.max(0, ((totalOriginal - totalOutput) / totalOriginal) * 100)
    : 0;

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
              Batch Processing Hub
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Run multi-stage pipelines: Resize → Convert → Compress → Rename in a single pass.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Upload and Progress Dashboard */}
        <div className="space-y-6 lg:col-span-2">
          {files.length === 0 ? (
            <DropZone
              onFiles={handleFiles}
              accept={[".jpg", ".jpeg", ".png", ".webp"]}
              label="Drop images for batch processing"
              sublabel="Batch resize, convert, compress, and rename at scale"
              className="py-16"
            />
          ) : (
            <div className="space-y-6">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Total Files</span>
                  <p className="text-xl font-bold text-[hsl(var(--foreground))] mt-0.5">{files.length}</p>
                </div>
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Original Size</span>
                  <p className="text-xl font-bold text-[hsl(var(--foreground))] mt-0.5">{formatBytes(totalOriginal)}</p>
                </div>
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Output Size</span>
                  <p className="text-xl font-bold text-emerald-400 mt-0.5">{results.length > 0 ? formatBytes(totalOutput) : "—"}</p>
                </div>
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Total Saved</span>
                  <p className="text-xl font-bold text-emerald-400 mt-0.5">{results.length > 0 ? `${savingsPct.toFixed(1)}%` : "—"}</p>
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {completedCount} of {files.length} processed
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.multiple = true;
                      input.accept = ".jpg,.jpeg,.png,.webp";
                      input.onchange = (e: any) => handleFiles(Array.from(e.target.files || []));
                      input.click();
                    }}
                  >
                    Add More
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setFiles([]); setResults([]); }}>
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Items queue table */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
                <div className="max-h-[380px] overflow-y-auto divide-y divide-[hsl(var(--border))]">
                  {files.map((f, idx) => {
                    const res = results[idx];
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 text-xs gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-[hsl(var(--foreground))]">{f.name}</p>
                          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{formatBytes(f.size)}</p>
                        </div>

                        {res ? (
                          <div className="text-right min-w-0 flex-1">
                            <p className="truncate font-mono font-semibold text-[hsl(var(--primary))]">{res.outputName}</p>
                            <p className="text-[11px] text-emerald-400">{formatBytes(res.outputSize)}</p>
                          </div>
                        ) : isProcessing && idx === results.length ? (
                          <span className="text-xs text-[hsl(var(--primary))] flex items-center gap-1">
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Processing...
                          </span>
                        ) : (
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">Queued</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Pipeline Settings */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-6">
            <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
              Multi-Stage Pipeline
            </h2>

            {/* 1. Resize stage */}
            <div className="space-y-3 pb-3 border-b border-[hsl(var(--border))]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[hsl(var(--foreground))]">1. Resize Assets</span>
                <Switch checked={resizeEnabled} onCheckedChange={setResizeEnabled} />
              </div>
              {resizeEnabled && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-[hsl(var(--muted-foreground))]">Width (px)</label>
                    <input
                      type="number"
                      value={targetWidth}
                      onChange={(e) => setTargetWidth(parseInt(e.target.value, 10) || 1080)}
                      className="w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-2 py-1 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[hsl(var(--muted-foreground))]">Height (px)</label>
                    <input
                      type="number"
                      value={targetHeight}
                      onChange={(e) => setTargetHeight(parseInt(e.target.value, 10) || 1080)}
                      className="w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-2 py-1 text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Convert stage */}
            <div className="space-y-3 pb-3 border-b border-[hsl(var(--border))]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[hsl(var(--foreground))]">2. Convert Format</span>
                <Switch checked={convertEnabled} onCheckedChange={setConvertEnabled} />
              </div>
              {convertEnabled && (
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {(["image/webp", "image/jpeg", "image/png"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setTargetFormat(fmt)}
                      className={`rounded border py-1 text-xs uppercase font-mono transition-colors ${
                        targetFormat === fmt
                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] font-bold"
                          : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"
                      }`}
                    >
                      {fmt.replace("image/", "")}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Compress stage */}
            <div className="space-y-3 pb-3 border-b border-[hsl(var(--border))]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[hsl(var(--foreground))]">3. Compress Quality</span>
                <Switch checked={compressEnabled} onCheckedChange={setCompressEnabled} />
              </div>
              {compressEnabled && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[hsl(var(--muted-foreground))]">Quality</span>
                    <span className="text-[hsl(var(--primary))] font-bold">{qualityPct}%</span>
                  </div>
                  <Slider
                    value={[qualityPct]}
                    onValueChange={([v]) => setQualityPct(v)}
                    min={20}
                    max={100}
                    step={5}
                  />
                </div>
              )}
            </div>

            {/* 4. Rename stage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[hsl(var(--foreground))]">4. Sequential Rename</span>
                <Switch checked={renameEnabled} onCheckedChange={setRenameEnabled} />
              </div>
              {renameEnabled && (
                <input
                  type="text"
                  value={renamePattern}
                  onChange={(e) => setRenamePattern(e.target.value)}
                  placeholder="e.g. asset_###"
                  className="w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-2.5 py-1.5 text-xs font-mono"
                />
              )}
            </div>

            <Button
              size="lg"
              disabled={files.length === 0 || isProcessing}
              onClick={handleProcessAll}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Running Pipeline...
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4 mr-2" />
                  Process All ({files.length} files)
                </>
              )}
            </Button>
          </div>

          {/* Download ZIP result */}
          {results.length > 0 && completedCount > 0 && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span>Batch Process Complete</span>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Saved {formatBytes(totalOriginal - totalOutput)} ({savingsPct.toFixed(1)}% reduction).
              </p>
              <Button
                size="lg"
                onClick={handleDownloadZip}
                className="w-full bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"
              >
                <Archive className="h-4 w-4 mr-2" />
                Download Batch ZIP ({completedCount})
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
