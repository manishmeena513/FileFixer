"use client";

import React, { useState, useEffect } from "react";
import {
  Maximize2,
  Download,
  Archive,
  RefreshCw,
  Lock,
  Unlock,
  Sparkles,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { FileCard } from "@/components/upload/FileCard";
import { BeforeAfterStats } from "@/components/results/BeforeAfter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { useFileStore } from "@/stores/fileStore";
import { resizeImage, RESIZE_PRESETS, ResizeOptions } from "@/lib/image/resize";
import {
  getImageDimensions,
  triggerDownload,
  stripExtension,
  getExtension,
} from "@/lib/file-utils";
import { downloadAsZip } from "@/lib/zip";
import { addHistoryRecord } from "@/lib/storage/history";
import { ToolPageShell } from "@/components/ui/ToolPageShell";

export default function ResizeImagePage() {
  const {
    files,
    addFiles,
    removeFile,
    clearFiles,
    updateStatus,
    setOutput,
    pushDownload,
    setLatestDeliveredFile,
    triggerSupportPrompt,
  } = useFileStore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Resize controls
  const [width, setWidth] = useState<number>(1080);
  const [height, setHeight] = useState<number>(1080);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [percentage, setPercentage] = useState<number>(100);
  const [fitMode, setFitMode] = useState<"contain" | "cover" | "stretch">(
    "stretch"
  );
  const [activeAspectPreset, setActiveAspectPreset] = useState<string>("custom");
  const [origDims, setOrigDims] = useState<{ width: number; height: number } | null>(
    null
  );

  const imageFiles = files.filter(
    (f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|avif)$/i.test(f.name)
  );
  const singleFile = imageFiles.length === 1 ? imageFiles[0] : null;

  // Auto-detect dimensions from first image if available
  useEffect(() => {
    if (imageFiles.length > 0) {
      getImageDimensions(imageFiles[0].file)
        .then((dims) => {
          setOrigDims(dims);
          setWidth(dims.width);
          setHeight(dims.height);
          const ratio = dims.width / dims.height;
          setAspectRatio(ratio);
        })
        .catch(() => {});
    } else {
      setOrigDims(null);
    }
  }, [imageFiles.length > 0 ? imageFiles[0].id : null]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockAspect && aspectRatio > 0) {
      setHeight(Math.max(1, Math.round(val / aspectRatio)));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockAspect && aspectRatio > 0) {
      setWidth(Math.max(1, Math.round(val * aspectRatio)));
    }
  };

  const handlePercentageScale = (pct: number) => {
    setPercentage(pct);
    const baseW = origDims?.width || width;
    const baseH = origDims?.height || height;
    const newW = Math.max(1, Math.round((baseW * pct) / 100));
    const newH = Math.max(1, Math.round((baseH * pct) / 100));
    setWidth(newW);
    setHeight(newH);
    if (newH > 0) setAspectRatio(newW / newH);
  };

  const aspectPresets = [
    { label: "Free", key: "custom" },
    { label: "16:9", key: "16:9", ratio: 16 / 9 },
    { label: "4:3", key: "4:3", ratio: 4 / 3 },
    { label: "1:1", key: "1:1", ratio: 1 },
    { label: "9:16", key: "9:16", ratio: 9 / 16 },
  ];

  const handleSelectAspectPreset = (preset: (typeof aspectPresets)[0]) => {
    setActiveAspectPreset(preset.key);
    if (preset.key === "custom" || !preset.ratio) {
      setLockAspect(false);
      return;
    }
    setAspectRatio(preset.ratio);
    setLockAspect(true);
    setHeight(Math.max(1, Math.round(width / preset.ratio)));
  };

  const handlePresetSelect = (preset: (typeof RESIZE_PRESETS)[0]) => {
    setWidth(preset.width);
    setHeight(preset.height);
    setAspectRatio(preset.width / preset.height);
    setFitMode("cover");
  };

  const handleFiles = (newFiles: File[]) => {
    const valid = newFiles.filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) {
      toast({
        title: "Invalid file",
        description: "Please upload image files (JPG, PNG, WebP).",
        variant: "error",
      });
      return;
    }
    addFiles(valid);
  };

  const handleResizeAll = async () => {
    if (imageFiles.length === 0) return;
    setIsProcessing(true);

    const options: ResizeOptions = {
      width,
      height,
      maintainAspectRatio: lockAspect,
      fitMode,
      quality: 0.92,
    };

    let completed = 0;
    for (const f of imageFiles) {
      updateStatus(f.id, "processing");
      try {
        const res = await resizeImage(f.file, options);
        const base = stripExtension(f.name);
        const ext = getExtension(f.name) || "jpg";
        const outputName = `${base}_${width}x${height}.${ext}`;
        setOutput(f.id, res.blob, outputName, res.blob.size, width, height);
        completed++;

        // Push to download dock as ready
        pushDownload({
          fileName: outputName,
          originalSize: f.size,
          outputSize: res.blob.size,
          savingsPct:
            f.size > res.blob.size
              ? ((f.size - res.blob.size) / f.size) * 100
              : 0,
          status: "ready",
          blob: res.blob,
        });

        await addHistoryRecord({
          filename: f.name,
          tool: `Resize Image (${width}×${height})`,
          originalSize: f.size,
          outputSize: res.blob.size,
        });
      } catch (err: any) {
        console.error(err);
        updateStatus(f.id, "error", err.message || "Failed to resize");
      }
    }

    setIsProcessing(false);
    toast({
      title: "Resizing completed",
      description: `Resized ${completed} file(s) to ${width} × ${height}px.`,
      variant: "success",
    });
  };

  const handleDownloadSingle = (id: string) => {
    const f = imageFiles.find((item) => item.id === id);
    if (!f || !f.outputBlob) return;
    const fileName = f.outputName || `resized_${f.name}`;
    triggerDownload(f.outputBlob, fileName);

    const outSize = f.outputSize || f.outputBlob.size;
    const dlItem = {
      fileName,
      originalSize: f.size,
      outputSize: outSize,
      savingsPct:
        f.size > outSize ? ((f.size - outSize) / f.size) * 100 : 0,
      status: "downloaded" as const,
      blob: f.outputBlob,
    };

    pushDownload(dlItem);
    setLatestDeliveredFile({
      id: `deliv-${Date.now()}`,
      ...dlItem,
      timestamp: Date.now(),
    });
    triggerSupportPrompt();
  };

  const handleDownloadZip = async () => {
    const ready = imageFiles.filter((f) => f.outputBlob);
    if (ready.length === 0) return;
    const entries = ready.map((f) => ({
      filename: f.outputName || f.name,
      blob: f.outputBlob!,
    }));
    await downloadAsZip(entries, "resized_images.zip");

    for (const rf of ready) {
      const outSize = rf.outputSize || rf.outputBlob!.size;
      pushDownload({
        fileName: rf.outputName || rf.name,
        originalSize: rf.size,
        outputSize: outSize,
        savingsPct:
          rf.size > outSize ? ((rf.size - outSize) / rf.size) * 100 : 0,
        status: "downloaded",
        blob: rf.outputBlob!,
      });
    }

    triggerSupportPrompt();
    toast({
      title: "ZIP downloaded",
      description: `Downloaded ${entries.length} resized image(s).`,
      variant: "success",
    });
  };

  const anyCompleted = imageFiles.some((f) => f.status === "done");
  const origW = origDims?.width;
  const origH = origDims?.height;
  const scaleDelta =
    origW && origH && origW > 0 && origH > 0
      ? Math.round(
          ((width * height - origW * origH) / (origW * origH)) * 100
        )
      : 0;

  return (
    <ToolPageShell
      icon={Maximize2}
      title="Resize Image"
      description="Scale dimensions, lock aspect ratios, or apply standard social media presets."
      formats={["JPG", "PNG", "WEBP"]}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Files & Live Inspector */}
        <div className="space-y-6 lg:col-span-2">
          {imageFiles.length === 0 ? (
            <DropZone
              onFiles={handleFiles}
              accept={[".jpg", ".jpeg", ".png", ".webp"]}
              label="Drop images to resize"
              sublabel="Resize single images or bulk assets together"
              className="py-16"
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
                <span className="text-sm font-semibold text-[hsl(var(--foreground))] tabular-nums">
                  {imageFiles.length} Image{imageFiles.length > 1 ? "s" : ""} Selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-[44px] touch-manipulation"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.multiple = true;
                      input.accept = ".jpg,.jpeg,.png,.webp";
                      input.onchange = (e: any) =>
                        handleFiles(Array.from(e.target.files || []));
                      input.click();
                    }}
                  >
                    Add More
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-[44px] touch-manipulation"
                    onClick={clearFiles}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {imageFiles.map((f) => (
                  <FileCard key={f.id} file={f} onRemove={removeFile} />
                ))}
              </div>
            </div>
          )}

          {/* High-Clarity Live Dimension Inspector */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-2">
              <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
                Live Dimension Inspector
              </span>
              <span className="text-[11px] font-mono tabular-nums text-[hsl(var(--primary))] font-medium">
                {fitMode.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded-lg bg-[hsl(var(--secondary))] p-2.5">
                <div className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">
                  Original
                </div>
                <div className="text-sm font-bold text-[hsl(var(--foreground))] tabular-nums">
                  {origW && origH ? `${origW} × ${origH}` : "—"}
                </div>
              </div>
              <div className="rounded-lg bg-[hsl(var(--secondary))] p-2.5">
                <div className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">
                  Target
                </div>
                <div className="text-sm font-bold text-[hsl(var(--primary))] tabular-nums">
                  {width} × {height}
                </div>
              </div>
              <div className="rounded-lg bg-[hsl(var(--secondary))] p-2.5">
                <div className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">
                  Aspect Ratio
                </div>
                <div className="text-sm font-bold text-[hsl(var(--foreground))] tabular-nums">
                  {height > 0 ? `${(width / height).toFixed(2)}:1` : "—"}
                </div>
              </div>
              <div className="rounded-lg bg-[hsl(var(--secondary))] p-2.5">
                <div className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">
                  Resolution Delta
                </div>
                <div
                  className={`text-sm font-bold tabular-nums ${
                    scaleDelta >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {origW ? `${scaleDelta > 0 ? "+" : ""}${scaleDelta}%` : "—"}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))] pt-1">
              <span>
                Megapixels:{" "}
                <strong className="text-[hsl(var(--foreground))] tabular-nums">
                  {((width * height) / 1000000).toFixed(2)} MP
                </strong>
              </span>
              <span>
                Aspect Preset:{" "}
                <strong className="text-[hsl(var(--foreground))] uppercase">
                  {activeAspectPreset}
                </strong>
              </span>
            </div>
          </div>

          {/* Social Media & Standard Presets Grid */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" /> Social &
              Standard Size Presets
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {RESIZE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePresetSelect(p)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-colors min-h-[52px] touch-manipulation tabular-nums ${
                    width === p.width && height === p.height
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--foreground))]"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary)/0.8)] text-[hsl(var(--muted-foreground))]"
                  }`}
                >
                  <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
                    {p.label}
                  </span>
                  <span className="text-[11px] font-mono mt-0.5 text-[hsl(var(--primary))] tabular-nums">
                    {p.width} × {p.height} px
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-6 space-y-6">
            <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
              Dimensions & Options
            </h2>

            {/* Aspect Presets Chips */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                Aspect Ratio Presets
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {aspectPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectAspectPreset(preset)}
                    className={`min-h-[44px] rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors touch-manipulation tabular-nums ${
                      activeAspectPreset === preset.key
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.8)]"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Width, Lock & Height */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-medium text-[hsl(var(--foreground))]">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={width}
                    onChange={(e) =>
                      handleWidthChange(parseInt(e.target.value, 10) || 1)
                    }
                    className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 text-sm font-mono text-[hsl(var(--foreground))] tabular-nums focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  />
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !lockAspect;
                      setLockAspect(next);
                      if (next && height > 0) {
                        setAspectRatio(width / height);
                      }
                    }}
                    className={`h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center border transition-colors touch-manipulation ${
                      lockAspect
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                        : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    }`}
                    aria-label={
                      lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"
                    }
                    title={
                      lockAspect ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"
                    }
                  >
                    {lockAspect ? (
                      <Lock className="h-5 w-5" />
                    ) : (
                      <Unlock className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-medium text-[hsl(var(--foreground))]">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={height}
                    onChange={(e) =>
                      handleHeightChange(parseInt(e.target.value, 10) || 1)
                    }
                    className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 text-sm font-mono text-[hsl(var(--foreground))] tabular-nums focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  />
                </div>
              </div>

              {/* Percentage Scaling Quick Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  Percentage Scale:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[25, 50, 75, 100, 150, 200].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handlePercentageScale(pct)}
                      className={`min-h-[44px] rounded-xl px-2.5 py-2 text-xs font-mono font-medium border transition-colors touch-manipulation tabular-nums ${
                        percentage === pct
                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                          : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.7)]"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Fit Mode */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-[hsl(var(--foreground))]">
                  Fit Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["stretch", "cover", "contain"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFitMode(mode)}
                      className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs capitalize transition-colors touch-manipulation ${
                        fitMode === mode
                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] font-medium"
                          : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              className="w-full min-h-[48px] touch-manipulation"
              size="lg"
              disabled={imageFiles.length === 0 || isProcessing}
              onClick={handleResizeAll}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Resizing Images...
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  <span className="tabular-nums">
                    {imageFiles.length > 1
                      ? `Resize All (${imageFiles.length})`
                      : "Resize Image"}
                  </span>
                </>
              )}
            </Button>
          </div>

          {/* Download options */}
          {singleFile && singleFile.status === "done" && singleFile.outputBlob && (
            <div className="space-y-3">
              <BeforeAfterStats
                originalSize={singleFile.size}
                outputSize={singleFile.outputSize ?? singleFile.outputBlob.size}
                originalDimensions={
                  singleFile.width && singleFile.height
                    ? `${singleFile.width}×${singleFile.height}`
                    : undefined
                }
                outputDimensions={`${singleFile.outputWidth ?? width}×${singleFile.outputHeight ?? height}`}
                originalFormat={singleFile.name.split(".").pop()}
                outputFormat={(singleFile.outputName || singleFile.name)
                  .split(".")
                  .pop()}
              />
              <Button
                variant="default"
                size="lg"
                className="w-full min-h-[48px] bg-[hsl(var(--success))] hover:bg-emerald-600 text-[hsl(var(--success-foreground))] font-semibold touch-manipulation"
                onClick={() => handleDownloadSingle(singleFile.id)}
              >
                <Download className="h-4 w-4" />
                Download Resized Image
              </Button>
            </div>
          )}

          {imageFiles.length > 1 && anyCompleted && (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-[hsl(var(--foreground))]">
                  Batch Resizing Complete
                </span>
                <span className="text-xs text-[hsl(var(--success))] font-medium tabular-nums">
                  {imageFiles.filter((f) => f.status === "done").length} ready
                </span>
              </div>
              <Button
                variant="default"
                size="lg"
                className="w-full min-h-[48px] bg-[hsl(var(--success))] hover:bg-emerald-600 text-[hsl(var(--success-foreground))] font-semibold touch-manipulation"
                onClick={handleDownloadZip}
              >
                <Archive className="h-4 w-4" />
                Download All Resized (ZIP)
              </Button>
            </div>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}
