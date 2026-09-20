"use client";

import React, { useState, useEffect } from "react";
import {
  Maximize2,
  Download,
  Archive,
  RefreshCw,
  Lock,
  Unlock,
  Sliders,
  Layers,
  Sparkles,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { FileCard } from "@/components/upload/FileCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { useFileStore } from "@/stores/fileStore";
import { resizeImage, RESIZE_PRESETS, ResizeOptions } from "@/lib/image/resize";
import { getImageDimensions, triggerDownload, stripExtension, getExtension } from "@/lib/file-utils";
import { downloadAsZip } from "@/lib/zip";

export default function ResizeImagePage() {
  const { files, addFiles, removeFile, clearFiles, updateStatus, setOutput } = useFileStore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Resize controls
  const [width, setWidth] = useState<number>(1080);
  const [height, setHeight] = useState<number>(1080);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [percentage, setPercentage] = useState<number>(100);
  const [fitMode, setFitMode] = useState<"contain" | "cover" | "stretch">("stretch");

  const singleFile = files.length === 1 ? files[0] : null;

  // Auto-detect dimensions from first image if available
  useEffect(() => {
    if (files.length > 0) {
      getImageDimensions(files[0].file)
        .then((dims) => {
          setWidth(dims.width);
          setHeight(dims.height);
          setAspectRatio(dims.width / dims.height);
        })
        .catch(() => {});
    }
  }, [files]);

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockAspect && aspectRatio > 0) {
      setHeight(Math.round(val / aspectRatio));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockAspect && aspectRatio > 0) {
      setWidth(Math.round(val * aspectRatio));
    }
  };

  const handlePercentageScale = (pct: number) => {
    setPercentage(pct);
    if (files.length > 0) {
      getImageDimensions(files[0].file)
        .then((dims) => {
          const newW = Math.round((dims.width * pct) / 100);
          const newH = Math.round((dims.height * pct) / 100);
          setWidth(newW);
          setHeight(newH);
        })
        .catch(() => {});
    }
  };

  const handlePresetSelect = (preset: typeof RESIZE_PRESETS[0]) => {
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
    if (files.length === 0) return;
    setIsProcessing(true);

    const options: ResizeOptions = {
      width,
      height,
      maintainAspectRatio: lockAspect,
      fitMode,
      quality: 0.92,
    };

    let completed = 0;
    for (const f of files) {
      updateStatus(f.id, "processing");
      try {
        const res = await resizeImage(f.file, options);
        const base = stripExtension(f.name);
        const ext = getExtension(f.name) || "jpg";
        const outputName = `${base}_${width}x${height}.${ext}`;
        setOutput(f.id, res.blob, outputName, res.blob.size);
        completed++;
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
    const f = files.find((item) => item.id === id);
    if (!f || !f.outputBlob) return;
    triggerDownload(f.outputBlob, f.outputName || `resized_${f.name}`);
  };

  const handleDownloadZip = async () => {
    const ready = files.filter((f) => f.outputBlob);
    if (ready.length === 0) return;
    const entries = ready.map((f) => ({
      filename: f.outputName || f.name,
      blob: f.outputBlob!,
    }));
    await downloadAsZip(entries, "resized_images.zip");
    toast({
      title: "ZIP downloaded",
      description: `Downloaded ${entries.length} resized image(s).`,
      variant: "success",
    });
  };

  const anyCompleted = files.some((f) => f.status === "done");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
            <Maximize2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
              Resize Image
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Scale dimensions, lock aspect ratios, or apply standard social media presets.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Files */}
        <div className="space-y-6 lg:col-span-2">
          {files.length === 0 ? (
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
                <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  {files.length} Image{files.length > 1 ? "s" : ""} Selected
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
                  <Button variant="ghost" size="sm" onClick={clearFiles}>
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {files.map((f) => (
                  <FileCard key={f.id} file={f} onRemove={removeFile} />
                ))}
              </div>
            </div>
          )}

          {/* Social Media & Standard Presets Grid */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4">
            <h3 className="text-sm font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" /> Quick Size Presets
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {RESIZE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePresetSelect(p)}
                  className={`flex flex-col items-start p-3 rounded-lg border text-left transition-colors ${
                    width === p.width && height === p.height
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--foreground))]"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary)/0.8)] text-[hsl(var(--muted-foreground))]"
                  }`}
                >
                  <span className="text-xs font-semibold text-[hsl(var(--foreground))]">{p.label}</span>
                  <span className="text-[11px] font-mono mt-0.5 text-[hsl(var(--primary))]">
                    {p.width} × {p.height} px
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-6">
            <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
              Dimensions & Options
            </h2>

            {/* Width & Height */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-medium text-[hsl(var(--foreground))]">Width (px)</label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={width}
                    onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 py-2 text-sm font-mono text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  />
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => setLockAspect(!lockAspect)}
                    className={`rounded p-2 border transition-colors ${
                      lockAspect
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                        : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    }`}
                    title={lockAspect ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
                  >
                    {lockAspect ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-medium text-[hsl(var(--foreground))]">Height (px)</label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={height}
                    onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 py-2 text-sm font-mono text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  />
                </div>
              </div>

              {/* Quick percentage buttons */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Scale:</span>
                {[25, 50, 75, 150, 200].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentageScale(pct)}
                    className="rounded bg-[hsl(var(--secondary))] px-2 py-1 text-xs font-mono text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.7)]"
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              {/* Fit Mode */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-[hsl(var(--foreground))]">Fit Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["stretch", "cover", "contain"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFitMode(mode)}
                      className={`rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors ${
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
              className="w-full"
              size="lg"
              disabled={files.length === 0 || isProcessing}
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
                  {files.length > 1 ? `Resize All (${files.length})` : "Resize Image"}
                </>
              )}
            </Button>
          </div>

          {/* Download options */}
          {singleFile && singleFile.status === "done" && singleFile.outputBlob && (
            <Button
              variant="default"
              size="lg"
              className="w-full bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"
              onClick={() => handleDownloadSingle(singleFile.id)}
            >
              <Download className="h-4 w-4" />
              Download Resized Image
            </Button>
          )}

          {files.length > 1 && anyCompleted && (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-3">
              <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Batch Resizing Complete
              </span>
              <Button
                variant="default"
                size="lg"
                className="w-full bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"
                onClick={handleDownloadZip}
              >
                <Archive className="h-4 w-4" />
                Download All Resized (ZIP)
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
