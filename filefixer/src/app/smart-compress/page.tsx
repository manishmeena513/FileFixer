"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  TrendingDown,
  Target,
  FileText,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { smartCompress, CompressionAttempt, SmartCompressResult } from "@/lib/smartCompress";
import { formatBytes, triggerDownload } from "@/lib/file-utils";
import { addHistoryRecord } from "@/lib/storage/history";

export default function SmartCompressPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetMB, setTargetMB] = useState<number>(1.0);
  const [customInput, setCustomInput] = useState<string>("1.0");
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveAttempts, setLiveAttempts] = useState<CompressionAttempt[]>([]);
  const [finalResult, setFinalResult] = useState<SmartCompressResult | null>(null);

  const presets = [
    { label: "Under 250 KB", val: 0.25 },
    { label: "Under 500 KB", val: 0.5 },
    { label: "Under 1 MB", val: 1.0 },
    { label: "Under 2 MB", val: 2.0 },
    { label: "Under 5 MB", val: 5.0 },
  ];

  const handleFiles = (files: File[]) => {
    if (files.length === 0) return;
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
          description: `Compressed to ${formatBytes(res.bestSize)} (Target: < ${targetMB} MB).`,
          variant: "success",
        });
      } else {
        toast({
          title: "Best effort completed",
          description: `Reached ${formatBytes(res.bestSize)}. Practical limit reached.`,
          variant: "default",
        });
      }

      // Record to local IndexedDB history
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
    triggerDownload(finalResult.bestBlob, `${base}_under_${targetMB}MB.${ext}`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
              Smart &quot;Under X MB&quot; Mode
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Signature feature: progressively tests stronger optimizations until your exact size target is reached.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Upload and Attempts Log */}
        <div className="space-y-6 lg:col-span-2">
          {!selectedFile ? (
            <DropZone
              onFiles={handleFiles}
              multiple={false}
              label="Drop any image or PDF here"
              sublabel="FileFixer will test iterative optimizations in real-time"
              className="py-16"
            />
          ) : (
            <div className="space-y-6">
              {/* File card */}
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
                      Original: {formatBytes(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                  Change File
                </Button>
              </div>

              {/* Live attempts progress dashboard */}
              {(isProcessing || liveAttempts.length > 0) && (
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
                      <Target className="h-4 w-4 text-[hsl(var(--primary))]" /> Progressive Optimization Attempts
                    </h3>
                    <Badge variant="outline" className="font-mono text-xs">
                      Target: &lt; {targetMB} MB ({formatBytes(targetMB * 1024 * 1024)})
                    </Badge>
                  </div>

                  <div className="space-y-2.5">
                    {/* Original baseline */}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.5)] text-xs">
                      <span className="font-medium text-[hsl(var(--muted-foreground))]">Baseline Original</span>
                      <span className="font-mono font-bold text-[hsl(var(--foreground))]">{formatBytes(selectedFile.size)}</span>
                    </div>

                    {/* Attempt passes */}
                    {liveAttempts.map((attempt) => (
                      <div
                        key={attempt.attemptNumber}
                        className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-all ${
                          attempt.success
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {attempt.success ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
                              {attempt.attemptNumber}
                            </span>
                          )}
                          <span className="font-medium">{attempt.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold">{formatBytes(attempt.sizeBytes)}</span>
                          {attempt.success && (
                            <Badge variant="success" className="text-[10px]">Target Met</Badge>
                          )}
                        </div>
                      </div>
                    ))}

                    {isProcessing && (
                      <div className="flex items-center justify-center gap-2 p-3 text-xs text-[hsl(var(--muted-foreground))]">
                        <RefreshCw className="h-4 w-4 animate-spin text-[hsl(var(--primary))]" />
                        Running next optimization iteration in browser...
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
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-6">
            <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
              Size Target
            </h2>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                Standard Targets
              </label>
              <div className="grid grid-cols-1 gap-2">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setTargetMB(p.val);
                      setCustomInput(String(p.val));
                    }}
                    className={`flex items-center justify-between p-3 rounded-lg border text-xs font-medium transition-colors ${
                      targetMB === p.val
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary)/0.8)]"
                    }`}
                  >
                    <span>{p.label}</span>
                    <span className="font-mono text-[11px]">{p.val} MB</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom MB input */}
            <div className="space-y-1.5 pt-2 border-t border-[hsl(var(--border))]">
              <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                Custom Target Size (MB)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={customInput}
                onChange={(e) => {
                  setCustomInput(e.target.value);
                  const parsed = parseFloat(e.target.value);
                  if (!isNaN(parsed) && parsed > 0) {
                    setTargetMB(parsed);
                  }
                }}
                className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 py-2 text-sm font-mono text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              />
            </div>

            <Button
              size="lg"
              disabled={!selectedFile || isProcessing}
              onClick={handleStartSmartCompress}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Testing Passes...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Make Under {targetMB} MB
                </>
              )}
            </Button>
          </div>

          {/* Download card */}
          {finalResult && selectedFile && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span>
                  {finalResult.achieved ? "Target Successfully Achieved!" : "Best Supported Result"}
                </span>
              </div>

              <div className="text-xs space-y-1 text-[hsl(var(--muted-foreground))]">
                <p>Original: <strong>{formatBytes(finalResult.originalSize)}</strong></p>
                <p className="text-emerald-400 font-semibold">
                  Optimized: <strong>{formatBytes(finalResult.bestSize)}</strong> (
                  -{((finalResult.originalSize - finalResult.bestSize) / finalResult.originalSize * 100).toFixed(1)}%)
                </p>
              </div>

              <Button
                size="lg"
                onClick={handleDownload}
                className="w-full bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Result
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
