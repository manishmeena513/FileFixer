"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Layers,
  Download,
  Archive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toaster";
import {
  processBatchItem,
  BatchPipelineConfig,
  BatchItemResult,
} from "@/lib/batch/batchProcessor";
import {
  formatBytes,
  SupportedImageFormat,
  triggerDownload,
} from "@/lib/file-utils";
import { downloadAsZip } from "@/lib/zip";
import { addHistoryRecord } from "@/lib/storage/history";
import { useFileStore } from "@/stores/fileStore";
import { calcSavings } from "@/lib/utils";

export default function BatchHubPage() {
  const { toast } = useToast();
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const { files: storeFiles, addFiles: addStoreFiles, pushDownload } = useFileStore();

  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIdx, setCurrentIdx] = useState<number>(-1);
  const [results, setResults] = useState<(BatchItemResult | undefined)[]>([]);

  // Pipeline configuration
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [targetWidth, setTargetWidth] = useState(1920);
  const [targetHeight, setTargetHeight] = useState(1080);

  const [convertEnabled, setConvertEnabled] = useState(true);
  const [targetFormat, setTargetFormat] =
    useState<SupportedImageFormat>("image/webp");

  const [compressEnabled, setCompressEnabled] = useState(true);
  const [qualityPct, setQualityPct] = useState(82);

  const [renameEnabled, setRenameEnabled] = useState(true);
  const [renamePattern, setRenamePattern] = useState("asset_###");

  // Auto-populate from Temporary File Workspace on mount if compatible images exist
  useEffect(() => {
    if (files.length === 0 && storeFiles.length > 0) {
      const workspaceImages = storeFiles
        .filter((f) => f.type.startsWith("image/"))
        .map((f) => f.file);
      if (workspaceImages.length > 0) {
        setFiles(workspaceImages);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiles = (newFiles: File[]) => {
    const valid = newFiles.filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) {
      toast({
        title: "Invalid files",
        description:
          "Please select image files (JPG, PNG, WebP) for the batch pipeline.",
        variant: "error",
      });
      return;
    }
    addStoreFiles(valid);
    setFiles((prev) => [...prev, ...valid]);
    setResults([]);
  };

  const removeSingleFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setResults((prev) => prev.filter((_, i) => i !== idx));
  };

  const buildConfig = (): BatchPipelineConfig => ({
    resizeEnabled,
    targetWidth: resizeEnabled ? targetWidth : undefined,
    targetHeight: resizeEnabled ? targetHeight : undefined,
    convertEnabled,
    targetFormat: convertEnabled ? targetFormat : undefined,
    compressEnabled,
    qualityPct: compressEnabled ? qualityPct : undefined,
    renamePattern: renameEnabled ? renamePattern : undefined,
    startNumber: 1,
  });

  const handleProcessAll = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setResults(new Array(files.length).fill(undefined));

    const config = buildConfig();
    const tempResults: (BatchItemResult | undefined)[] = new Array(
      files.length
    ).fill(undefined);

    for (let i = 0; i < files.length; i++) {
      setCurrentIdx(i);
      const itemResult = await processBatchItem(files[i], i, config);
      tempResults[i] = itemResult;
      setResults([...tempResults]);
    }

    setCurrentIdx(-1);
    setIsProcessing(false);

    const validResults = tempResults.filter(
      (r): r is BatchItemResult => !!r && r.status === "done"
    );
    const origTotal = validResults.reduce((acc, r) => acc + r.originalSize, 0);
    const outTotal = validResults.reduce((acc, r) => acc + r.outputSize, 0);

    validResults.forEach((r) => {
      pushDownload({
        fileName: r.outputName,
        originalSize: r.originalSize,
        outputSize: r.outputSize,
        savingsPct: r.originalSize > r.outputSize ? ((r.originalSize - r.outputSize) / r.originalSize) * 100 : 0,
        status: "ready",
        blob: r.blob,
      });
    });

    toast({
      title: "Batch pipeline finished",
      description: `Processed ${validResults.length} of ${files.length} files. Saved ${formatBytes(Math.max(0, origTotal - outTotal))}.`,
      variant: "success",
    });

    if (validResults.length > 0) {
      await addHistoryRecord({
        filename: `Batch (${validResults.length} images)`,
        tool: "Batch Studio",
        originalSize: origTotal,
        outputSize: outTotal,
      });
    }
  };

  const handleRetryFailed = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    const config = buildConfig();
    const nextResults = [...results];

    for (let i = 0; i < files.length; i++) {
      if (!nextResults[i] || nextResults[i]?.status === "error") {
        setCurrentIdx(i);
        const itemResult = await processBatchItem(files[i], i, config);
        nextResults[i] = itemResult;
        setResults([...nextResults]);
      }
    }

    setCurrentIdx(-1);
    setIsProcessing(false);
    toast({
      title: "Retry complete",
      description: "Reprocessed failed items.",
      variant: "success",
    });
  };

  const handleDownloadZip = async () => {
    const ready = results.filter(
      (r): r is BatchItemResult => !!r && r.status === "done"
    );
    if (ready.length === 0) return;

    const entries = ready.map((r) => ({
      filename: r.outputName,
      blob: r.blob,
    }));

    await downloadAsZip(entries, "filefixer_batch_assets.zip");
    toast({
      title: "ZIP downloaded",
      description: `Downloaded ${entries.length} processed file(s).`,
      variant: "success",
    });
  };

  const handleDownloadAllIndividual = () => {
    const ready = results.filter(
      (r): r is BatchItemResult => !!r && r.status === "done"
    );
    if (ready.length === 0) return;
    ready.forEach((r, idx) => {
      setTimeout(() => {
        triggerDownload(r.blob, r.outputName);
      }, idx * 150);
    });
    toast({
      title: "Downloading files",
      description: `Started downloading ${ready.length} file(s).`,
      variant: "success",
    });
  };

  const definedResults = results.filter((r): r is BatchItemResult => !!r);
  const completedResults = definedResults.filter((r) => r.status === "done");
  const failedResults = definedResults.filter((r) => r.status === "error");

  const totalOriginal = files.reduce((acc, f) => acc + f.size, 0);
  const totalOutput = completedResults.reduce((acc, r) => acc + r.outputSize, 0);
  const completedCount = completedResults.length;
  const failedCount = failedResults.length;
  const spaceSaved = Math.max(0, totalOriginal - totalOutput);
  const savingsPct =
    totalOriginal > 0 && completedCount > 0
      ? Math.max(0, ((totalOriginal - totalOutput) / totalOriginal) * 100)
      : 0;
  const progressPct =
    files.length > 0
      ? Math.round((definedResults.length / files.length) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
              Batch Studio
            </h1>
            <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
              Multi-stage local pipeline: Resize → Convert → Compress → Rename in one pass.
            </p>
          </div>
        </div>
      </div>

      <input
        ref={addMoreInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />

      <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-3">
        {/* Left: Upload and Progress Dashboard */}
        <div className="space-y-6 lg:col-span-2">
          {files.length === 0 ? (
            <DropZone
              onFiles={handleFiles}
              accept={["image/jpeg", "image/png", "image/webp"]}
              formats={["JPG", "PNG", "WEBP"]}
              label="Drop multiple images for batch processing"
              sublabel="Batch resize, convert, compress, and rename at scale — 100% locally"
              className="py-12 sm:py-16"
            />
          ) : (
            <div className="space-y-5">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Files
                  </span>
                  <p className="text-lg sm:text-xl font-bold text-[hsl(var(--foreground))] mt-0.5">
                    {files.length}
                  </p>
                </div>
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Done / Failed
                  </span>
                  <p className="text-lg sm:text-xl font-bold mt-0.5">
                    <span className="text-emerald-400">{completedCount}</span>
                    <span className="text-[hsl(var(--muted-foreground))] mx-1">
                      /
                    </span>
                    <span
                      className={
                        failedCount > 0
                          ? "text-[hsl(var(--destructive))]"
                          : "text-[hsl(var(--muted-foreground))]"
                      }
                    >
                      {failedCount}
                    </span>
                  </p>
                </div>
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Before
                  </span>
                  <p className="text-base sm:text-lg font-bold text-[hsl(var(--foreground))] mt-0.5 truncate">
                    {formatBytes(totalOriginal)}
                  </p>
                </div>
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    After
                  </span>
                  <p className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5 truncate">
                    {completedCount > 0 ? formatBytes(totalOutput) : "—"}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                    Space Saved
                  </span>
                  <p className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5">
                    {completedCount > 0
                      ? `${formatBytes(spaceSaved)} (${savingsPct.toFixed(0)}%)`
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Live Progress Bar */}
              {(isProcessing || definedResults.length > 0) && (
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[hsl(var(--foreground))]">
                      {isProcessing
                        ? `Processing file ${currentIdx + 1} of ${files.length}...`
                        : `Batch complete (${completedCount} succeeded${failedCount > 0 ? `, ${failedCount} failed` : ""})`}
                    </span>
                    <span className="font-mono font-bold text-[hsl(var(--primary))]">
                      {progressPct}%
                    </span>
                  </div>
                  <Progress value={progressPct} />
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addMoreInputRef.current?.click()}
                    disabled={isProcessing}
                    className="min-h-[40px]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add More
                  </Button>
                  {failedCount > 0 && !isProcessing && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleRetryFailed}
                      className="min-h-[40px] text-amber-400 border border-amber-500/30"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Retry Failed ({failedCount})
                    </Button>
                  )}
                  {definedResults.length > 0 && !isProcessing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResults([])}
                      className="min-h-[40px]"
                    >
                      Clear Results
                    </Button>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => {
                    setFiles([]);
                    setResults([]);
                  }}
                  className="min-h-[40px] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear All
                </Button>
              </div>

              {/* DESKTOP TABLE VIEW (md and up) */}
              <div className="hidden md:block rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
                <div className="grid grid-cols-12 gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.5)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  <div className="col-span-5">Original File</div>
                  <div className="col-span-4">Pipeline Output</div>
                  <div className="col-span-3 text-right">Status & Action</div>
                </div>
                <div className="max-h-[420px] overflow-y-auto divide-y divide-[hsl(var(--border))]">
                  {files.map((f, idx) => {
                    const res = results[idx];
                    const isCurrent = isProcessing && idx === currentIdx;
                    return (
                      <div
                        key={`${f.name}-${idx}`}
                        className="grid grid-cols-12 items-center gap-3 px-4 py-3 text-xs transition-colors hover:bg-[hsl(var(--secondary)/0.3)]"
                      >
                        <div className="col-span-5 min-w-0">
                          <p
                            className="truncate font-medium text-[hsl(var(--foreground))]"
                            title={f.name}
                          >
                            {f.name}
                          </p>
                          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                            {formatBytes(f.size)}
                          </p>
                        </div>

                        <div className="col-span-4 min-w-0">
                          {res && res.status === "done" ? (
                            <div>
                              <p
                                className="truncate font-mono font-semibold text-[hsl(var(--primary))]"
                                title={res.outputName}
                              >
                                {res.outputName}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <span className="text-emerald-400 font-semibold">
                                  {formatBytes(res.outputSize)}
                                </span>
                                {res.outputSize < f.size && (
                                  <span className="rounded bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-bold text-emerald-400">
                                    -{calcSavings(f.size, res.outputSize)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : res && res.status === "error" ? (
                            <span className="text-[hsl(var(--destructive))] font-medium">
                              {res.error || "Processing failed"}
                            </span>
                          ) : isCurrent ? (
                            <span className="text-[hsl(var(--primary))] flex items-center gap-1.5 font-medium">
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              Processing...
                            </span>
                          ) : (
                            <span className="text-[hsl(var(--muted-foreground))]">
                              Ready in queue
                            </span>
                          )}
                        </div>

                        <div className="col-span-3 flex items-center justify-end gap-1.5">
                          {res && res.status === "done" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                triggerDownload(res.blob, res.outputName)
                              }
                              className="h-8 px-2.5 text-xs"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Save
                            </Button>
                          )}
                          {res && res.status === "error" && (
                            <AlertCircle className="h-4 w-4 text-[hsl(var(--destructive))]" />
                          )}
                          {!isProcessing && (
                            <button
                              type="button"
                              onClick={() => removeSingleFile(idx)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive)/0.1)] hover:text-[hsl(var(--destructive))]"
                              aria-label={`Remove ${f.name}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MOBILE CARD VIEW (below md) */}
              <div className="md:hidden space-y-2.5">
                {files.map((f, idx) => {
                  const res = results[idx];
                  const isCurrent = isProcessing && idx === currentIdx;
                  return (
                    <div
                      key={`${f.name}-${idx}-mobile`}
                      className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">
                            {f.name}
                          </p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            Original: {formatBytes(f.size)}
                          </p>
                        </div>
                        {!isProcessing && (
                          <button
                            type="button"
                            onClick={() => removeSingleFile(idx)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive)/0.1)] hover:text-[hsl(var(--destructive))]"
                            aria-label={`Remove ${f.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {res && res.status === "done" ? (
                        <div className="flex items-center justify-between gap-2 rounded-lg bg-[hsl(var(--secondary)/0.6)] p-2.5">
                          <div className="min-w-0">
                            <p className="truncate font-mono text-xs font-semibold text-[hsl(var(--primary))]">
                              {res.outputName}
                            </p>
                            <p className="text-xs font-semibold text-emerald-400">
                              {formatBytes(res.outputSize)}
                              {res.outputSize < f.size &&
                                ` (-${calcSavings(f.size, res.outputSize)})`}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              triggerDownload(res.blob, res.outputName)
                            }
                            className="min-h-[40px] shrink-0"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Save
                          </Button>
                        </div>
                      ) : res && res.status === "error" ? (
                        <div className="rounded-lg bg-[hsl(var(--destructive)/0.1)] p-2 text-xs text-[hsl(var(--destructive))]">
                          {res.error || "Processing failed"}
                        </div>
                      ) : isCurrent ? (
                        <div className="flex items-center gap-2 text-xs font-medium text-[hsl(var(--primary))]">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Queued
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Pipeline Settings & Batch Download Actions */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-6 space-y-5">
            <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
              Multi-Stage Pipeline
            </h2>

            {/* 1. Resize stage */}
            <div className="space-y-3 pb-3.5 border-b border-[hsl(var(--border))]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
                  1. Resize Assets
                </span>
                <Switch
                  checked={resizeEnabled}
                  onCheckedChange={setResizeEnabled}
                />
              </div>
              {resizeEnabled && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      Max Width (px)
                    </label>
                    <input
                      type="number"
                      value={targetWidth}
                      onChange={(e) =>
                        setTargetWidth(parseInt(e.target.value, 10) || 1080)
                      }
                      className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-2.5 py-2 text-xs font-mono min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      Max Height (px)
                    </label>
                    <input
                      type="number"
                      value={targetHeight}
                      onChange={(e) =>
                        setTargetHeight(parseInt(e.target.value, 10) || 1080)
                      }
                      className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-2.5 py-2 text-xs font-mono min-h-[40px]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Convert stage */}
            <div className="space-y-3 pb-3.5 border-b border-[hsl(var(--border))]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
                  2. Convert Format
                </span>
                <Switch
                  checked={convertEnabled}
                  onCheckedChange={setConvertEnabled}
                />
              </div>
              {convertEnabled && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {(["image/webp", "image/jpeg", "image/png"] as const).map(
                    (fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setTargetFormat(fmt)}
                        className={`rounded-lg border py-2 text-xs uppercase font-mono transition-colors min-h-[40px] ${
                          targetFormat === fmt
                            ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] font-bold"
                            : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"
                        }`}
                      >
                        {fmt.replace("image/", "")}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* 3. Compress stage */}
            <div className="space-y-3 pb-3.5 border-b border-[hsl(var(--border))]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
                  3. Compress Quality
                </span>
                <Switch
                  checked={compressEnabled}
                  onCheckedChange={setCompressEnabled}
                />
              </div>
              {compressEnabled && (
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[hsl(var(--muted-foreground))]">
                      Target Quality
                    </span>
                    <span className="text-[hsl(var(--primary))] font-bold">
                      {qualityPct}%
                    </span>
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
                <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
                  4. Sequential Rename
                </span>
                <Switch
                  checked={renameEnabled}
                  onCheckedChange={setRenameEnabled}
                />
              </div>
              {renameEnabled && (
                <div>
                  <input
                    type="text"
                    value={renamePattern}
                    onChange={(e) => setRenamePattern(e.target.value)}
                    placeholder="e.g. asset_###"
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 py-2 text-xs font-mono min-h-[40px]"
                  />
                  <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                    Use ### for zero-padded numbering (001, 002...)
                  </p>
                </div>
              )}
            </div>

            <Button
              size="lg"
              disabled={files.length === 0 || isProcessing}
              onClick={handleProcessAll}
              className="w-full min-h-[48px] font-semibold"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Running Pipeline...
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4" />
                  Process All ({files.length} files)
                </>
              )}
            </Button>
          </div>

          {/* Download Results Card */}
          {completedCount > 0 && (
            <div className="animate-slide-up rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-3.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>Batch Ready ({completedCount} files)</span>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Total space saved:{" "}
                <strong className="text-emerald-400">
                  {formatBytes(spaceSaved)} ({savingsPct.toFixed(1)}%)
                </strong>
              </p>
              <div className="space-y-2">
                <Button
                  size="lg"
                  onClick={handleDownloadZip}
                  className="w-full min-h-[46px] bg-[hsl(var(--success))] hover:bg-emerald-600 text-white font-semibold"
                >
                  <Archive className="h-4 w-4" />
                  Download ZIP ({completedCount})
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleDownloadAllIndividual}
                  className="w-full min-h-[42px]"
                >
                  <Download className="h-4 w-4" />
                  Download All Individually
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

