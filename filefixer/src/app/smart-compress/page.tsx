"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Target,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { BeforeAfterStats, CompareSlider } from "@/components/results/BeforeAfter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import {
  smartCompress,
  CompressionAttempt,
  SmartCompressResult,
} from "@/lib/smartCompress";
import { formatBytes, triggerDownload } from "@/lib/file-utils";
import { addHistoryRecord } from "@/lib/storage/history";
import { useFileStore } from "@/stores/fileStore";

export default function SmartCompressPage() {
  const { toast } = useToast();
  const { files: storeFiles, addFiles: addStoreFiles } = useFileStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetMB, setTargetMB] = useState<number>(1.0);
  const [customInput, setCustomInput] = useState<string>("1.0");
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveAttempts, setLiveAttempts] = useState<CompressionAttempt[]>([]);
  const [finalResult, setFinalResult] = useState<SmartCompressResult | null>(
    null
  );

  const [origPreviewUrl, setOrigPreviewUrl] = useState<string | null>(null);
  const [outPreviewUrl, setOutPreviewUrl] = useState<string | null>(null);

  // Auto-load from Workspace if available
  useEffect(() => {
    if (!selectedFile && storeFiles.length > 0) {
      setSelectedFile(storeFiles[0].file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manage object URLs cleanly for image comparison
  useEffect(() => {
    if (!selectedFile || !selectedFile.type.startsWith("image/")) {
      setOrigPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setOrigPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  useEffect(() => {
    if (
      !finalResult ||
      !selectedFile ||
      !selectedFile.type.startsWith("image/")
    ) {
      setOutPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(finalResult.bestBlob);
    setOutPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [finalResult, selectedFile]);

  const presets = [
    { label: "Under 100 KB", sub: "Strict portal limit", val: 0.1 },
    { label: "Under 250 KB", sub: "Form / ID upload", val: 0.25 },
    { label: "Under 500 KB", sub: "Fast web asset", val: 0.5 },
    { label: "Under 1 MB", sub: "Standard attachment", val: 1.0 },
    { label: "Under 2 MB", sub: "Email / Document", val: 2.0 },
    { label: "Under 5 MB", sub: "High-res limit", val: 5.0 },
  ];

  const handleFiles = (files: File[]) => {
    if (files.length === 0) return;
    addStoreFiles([files[0]]);
    setSelectedFile(files[0]);
    setLiveAttempts([]);
    setFinalResult(null);
  };

  const handleStartSmartCompress = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setLiveAttempts([]);
    setFinalResult(null);

    try {
      const res = await smartCompress(selectedFile, targetMB, (attempt) => {
        setLiveAttempts((prev) => [...prev, attempt]);
      });
      setFinalResult(res);

      if (res.achieved) {
        toast({
          title: "Target size achieved!",
          description: `Compressed to ${formatBytes(res.bestSize)} (Target: < ${targetMB >= 1 ? `${targetMB} MB` : `${Math.round(targetMB * 1024)} KB`}).`,
          variant: "success",
        });
      } else {
        toast({
          title: "Closest safe size reached",
          description: `Reached ${formatBytes(res.bestSize)} without destructive quality loss.`,
          variant: "default",
        });
      }

      await addHistoryRecord({
        filename: selectedFile.name,
        tool: "Smart Under-X-MB",
        originalSize: selectedFile.size,
        outputSize: res.bestSize,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Compression failed",
        description: err.message || "Failed to complete smart optimization",
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!finalResult || !selectedFile) return;
    const base = selectedFile.name.replace(/\.[^/.]+$/, "");
    const ext = selectedFile.name.split(".").pop() || "jpg";
    const targetLabel =
      targetMB >= 1 ? `${targetMB}MB` : `${Math.round(targetMB * 1024)}KB`;
    triggerDownload(
      finalResult.bestBlob,
      `${base}_under_${targetLabel}.${ext}`
    );
  };

  const isImage = selectedFile?.type.startsWith("image/");
  const targetFormatted =
    targetMB >= 1
      ? `${targetMB} MB`
      : `${Math.round(targetMB * 1024)} KB`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
              Exact Size Compression (&quot;Under X MB&quot;)
            </h1>
            <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
              Progressively tests compression passes until your exact KB or MB upload limit is met.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-3">
        {/* Left: Upload, Attempts Log & Visual Preview */}
        <div className="space-y-6 lg:col-span-2">
          {!selectedFile ? (
            <DropZone
              onFiles={handleFiles}
              multiple={false}
              formats={["JPG", "PNG", "WEBP", "PDF"]}
              label="Drop any image or PDF to hit an exact size limit"
              sublabel="FileFixer tests progressive compression passes locally in real time"
              className="py-12 sm:py-16"
            />
          ) : (
            <div className="space-y-5">
              {/* File card */}
              <div className="flex items-center justify-between rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">
                    {isImage ? (
                      <ImageIcon className="h-5 w-5" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Original Size:{" "}
                      <strong className="text-[hsl(var(--foreground))]">
                        {formatBytes(selectedFile.size)}
                      </strong>
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setLiveAttempts([]);
                    setFinalResult(null);
                  }}
                  className="min-h-[40px]"
                >
                  Change File
                </Button>
              </div>

              {/* Before/After Stats + Interactive Image Slider when finished */}
              {finalResult && (
                <div className="space-y-4">
                  <BeforeAfterStats
                    originalSize={finalResult.originalSize}
                    outputSize={finalResult.bestSize}
                  />
                  {origPreviewUrl && outPreviewUrl && (
                    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                      <p className="mb-2 text-xs font-medium text-[hsl(var(--muted-foreground))] text-center">
                        Drag slider to compare Original vs {targetFormatted} Target Result
                      </p>
                      <CompareSlider
                        originalUrl={origPreviewUrl}
                        outputUrl={outPreviewUrl}
                        className="h-64 sm:h-80 w-full rounded-xl"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Live attempts progress dashboard */}
              {(isProcessing || liveAttempts.length > 0) && (
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
                      <Target className="h-4 w-4 text-[hsl(var(--primary))]" />
                      Progressive Optimization Passes
                    </h3>
                    <Badge variant="outline" className="font-mono text-xs">
                      Goal: &lt; {targetFormatted} (
                      {formatBytes(targetMB * 1024 * 1024)})
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {/* Original baseline */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.5)] text-xs">
                      <span className="font-medium text-[hsl(var(--muted-foreground))]">
                        Original Baseline
                      </span>
                      <span className="font-mono font-bold text-[hsl(var(--foreground))]">
                        {formatBytes(selectedFile.size)}
                      </span>
                    </div>

                    {/* Attempt passes */}
                    {liveAttempts.map((attempt) => (
                      <div
                        key={attempt.attemptNumber}
                        className={`animate-slide-up flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                          attempt.success
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {attempt.success ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[10px] font-mono font-bold text-[hsl(var(--muted-foreground))]">
                              {attempt.attemptNumber}
                            </span>
                          )}
                          <span className="font-medium truncate">
                            Try {attempt.attemptNumber}: {attempt.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="font-mono font-bold">
                            {formatBytes(attempt.sizeBytes)}
                          </span>
                          {attempt.success && (
                            <Badge variant="success" className="text-[10px]">
                              Target Met
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}

                    {isProcessing && (
                      <div className="flex items-center justify-center gap-2 p-3 text-xs text-[hsl(var(--muted-foreground))]">
                        <RefreshCw className="h-4 w-4 animate-spin text-[hsl(var(--primary))]" />
                        Testing next compression pass locally...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Target controls & Final result */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-6 space-y-5">
            <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
              Select Target Size
            </h2>

            {/* Quick Presets */}
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => {
                const active = Math.abs(targetMB - p.val) < 0.001;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setTargetMB(p.val);
                      setCustomInput(String(p.val));
                    }}
                    className={`flex flex-col items-start justify-center p-3 rounded-xl border text-left transition-all min-h-[54px] ${
                      active
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.14)] text-[hsl(var(--primary))]"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.7)] text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary)/0.4)]"
                    }`}
                  >
                    <span className="text-xs font-bold">{p.label}</span>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      {p.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom MB input */}
            <div className="space-y-1.5 pt-3 border-t border-[hsl(var(--border))]">
              <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                Custom Target Size (MB)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.05"
                max="50"
                value={customInput}
                onChange={(e) => {
                  setCustomInput(e.target.value);
                  const parsed = parseFloat(e.target.value);
                  if (!isNaN(parsed) && parsed > 0) {
                    setTargetMB(parsed);
                  }
                }}
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3.5 py-2.5 text-sm font-mono text-[hsl(var(--foreground))] min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              />
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Tip: Enter 0.1 for 100 KB, 0.5 for 500 KB, or 2 for 2 MB.
              </p>
            </div>

            <Button
              size="lg"
              disabled={!selectedFile || isProcessing}
              onClick={handleStartSmartCompress}
              className="w-full min-h-[48px] font-semibold"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Testing Passes...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Compress Under {targetFormatted}
                </>
              )}
            </Button>
          </div>

          {/* Download card */}
          {finalResult && selectedFile && (
            <div
              className={`animate-slide-up rounded-2xl border p-5 space-y-4 ${
                finalResult.achieved
                  ? "border-emerald-500/35 bg-emerald-500/10"
                  : "border-amber-500/35 bg-amber-500/10"
              }`}
            >
              <div
                className={`flex items-center gap-2 font-bold text-sm ${
                  finalResult.achieved ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {finalResult.achieved ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0" />
                )}
                <span>
                  {finalResult.achieved
                    ? "Target Size Achieved!"
                    : "Closest Safe Size Reached"}
                </span>
              </div>

              {!finalResult.achieved && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                  Further compression would cause severe visual degradation. We stopped at the smallest safe size ({formatBytes(finalResult.bestSize)}).
                </p>
              )}

              <div className="text-xs space-y-1 text-[hsl(var(--muted-foreground))]">
                <p>
                  Original:{" "}
                  <strong className="text-[hsl(var(--foreground))]">
                    {formatBytes(finalResult.originalSize)}
                  </strong>
                </p>
                <p className="text-emerald-400 font-semibold">
                  Final Result:{" "}
                  <strong>{formatBytes(finalResult.bestSize)}</strong>
                </p>
              </div>

              <Button
                size="lg"
                onClick={handleDownload}
                className="w-full min-h-[48px] bg-[hsl(var(--success))] hover:bg-emerald-600 text-white font-semibold"
              >
                <Download className="h-4 w-4" />
                Download ({formatBytes(finalResult.bestSize)})
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

