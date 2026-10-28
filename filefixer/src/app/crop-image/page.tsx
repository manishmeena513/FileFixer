"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Crop as CropIcon,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Download,
  RefreshCw,
  RotateCcw as ResetIcon,
  Sparkles,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { triggerDownload, getExtension } from "@/lib/file-utils";
import { useFileStore } from "@/stores/fileStore";
import { addHistoryRecord } from "@/lib/storage/history";
import { ToolPageShell } from "@/components/ui/ToolPageShell";

type AspectPresetKey = "free" | "1:1" | "4:3" | "16:9";

interface AspectPreset {
  label: string;
  key: AspectPresetKey;
  ratio: number | undefined;
}

const ASPECT_PRESETS: AspectPreset[] = [
  { label: "Free", key: "free", ratio: undefined },
  { label: "1:1 Square", key: "1:1", ratio: 1 },
  { label: "4:3 Standard", key: "4:3", ratio: 4 / 3 },
  { label: "16:9 Widescreen", key: "16:9", ratio: 16 / 9 },
];

export default function CropImagePage() {
  const { toast } = useToast();
  const {
    files: storeFiles,
    addFiles: addStoreFiles,
    pushDownload,
    setLatestDeliveredFile,
    triggerSupportPrompt,
  } = useFileStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [workingUrl, setWorkingUrl] = useState<string | null>(null);
  const [workingDims, setWorkingDims] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const rawImgRef = useRef<HTMLImageElement | null>(null);
  const displayImgRef = useRef<HTMLImageElement | null>(null);

  // Transformations
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Cropping
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [activePreset, setActivePreset] = useState<AspectPresetKey>("free");
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-load first image from Workspace if available
  useEffect(() => {
    if (!selectedFile && storeFiles.length > 0) {
      const firstImg = storeFiles.find((f) => f.type.startsWith("image/"));
      if (firstImg) setSelectedFile(firstImg.file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When selectedFile changes, load it into raw image
  useEffect(() => {
    if (!selectedFile) {
      rawImgRef.current = null;
      setWorkingUrl(null);
      setWorkingDims({ width: 0, height: 0 });
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setCrop(undefined);
      setCompletedCrop(null);
      setAspect(undefined);
      setActivePreset("free");
      return;
    }

    const img = new Image();
    const rawUrl = URL.createObjectURL(selectedFile);
    img.onload = () => {
      rawImgRef.current = img;
      renderBitmap(img, 0, false, false);
      URL.revokeObjectURL(rawUrl);
    };
    img.src = rawUrl;

    return () => {
      URL.revokeObjectURL(rawUrl);
    };
  }, [selectedFile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Canvas-based transformation pipeline: render rotation/flips into bitmap
  const renderBitmap = useCallback(
    (
      sourceImg: HTMLImageElement,
      rot: number,
      fH: boolean,
      fV: boolean
    ) => {
      const isQuarterRotated = rot === 90 || rot === 270;
      const targetW = isQuarterRotated
        ? sourceImg.naturalHeight
        : sourceImg.naturalWidth;
      const targetH = isQuarterRotated
        ? sourceImg.naturalWidth
        : sourceImg.naturalHeight;

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, targetW);
      canvas.height = Math.max(1, targetH);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.scale(fH ? -1 : 1, fV ? -1 : 1);
      ctx.drawImage(
        sourceImg,
        -sourceImg.naturalWidth / 2,
        -sourceImg.naturalHeight / 2
      );
      ctx.restore();

      canvas.toBlob((blob) => {
        if (!blob) return;
        const newUrl = URL.createObjectURL(blob);
        setWorkingUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return newUrl;
        });
        setWorkingDims({ width: targetW, height: targetH });
      });
    },
    []
  );

  // Apply transforms to bitmap when orientation changes
  const applyTransform = (newRot: number, newFH: boolean, newFV: boolean) => {
    setRotation(newRot);
    setFlipH(newFH);
    setFlipV(newFV);
    setCrop(undefined);
    setCompletedCrop(null);
    if (rawImgRef.current) {
      renderBitmap(rawImgRef.current, newRot, newFH, newFV);
    }
  };

  const handleRotateCw = () =>
    applyTransform((rotation + 90) % 360, flipH, flipV);
  const handleRotateCcw = () =>
    applyTransform((rotation - 90 + 360) % 360, flipH, flipV);
  const handleFlipH = () => applyTransform(rotation, !flipH, flipV);
  const handleFlipV = () => applyTransform(rotation, flipH, !flipV);

  const handleReset = () => {
    setAspect(undefined);
    setActivePreset("free");
    applyTransform(0, false, false);
  };

  const handleAspectPresetSelect = (preset: AspectPreset) => {
    setActivePreset(preset.key);
    setAspect(preset.ratio);

    if (!displayImgRef.current) return;
    const { width, height } = displayImgRef.current;

    if (preset.ratio) {
      const centered = centerCrop(
        makeAspectCrop({ unit: "%", width: 90 }, preset.ratio, width, height),
        width,
        height
      );
      setCrop(centered);
      setCompletedCrop(convertToPixelCrop(centered, width, height));
    } else {
      setCrop(undefined);
      setCompletedCrop(null);
    }
  };

  const handleExport = async () => {
    if (!selectedFile || !displayImgRef.current || !workingUrl) return;
    setIsProcessing(true);

    try {
      const displayImg = displayImgRef.current;
      const naturalW = displayImg.naturalWidth;
      const naturalH = displayImg.naturalHeight;
      const scaleX = naturalW / displayImg.width;
      const scaleY = naturalH / displayImg.height;

      const cropX = completedCrop && completedCrop.width > 0
        ? Math.max(0, completedCrop.x * scaleX)
        : 0;
      const cropY = completedCrop && completedCrop.height > 0
        ? Math.max(0, completedCrop.y * scaleY)
        : 0;
      const cropW = completedCrop && completedCrop.width > 0
        ? Math.min(naturalW - cropX, completedCrop.width * scaleX)
        : naturalW;
      const cropH = completedCrop && completedCrop.height > 0
        ? Math.min(naturalH - cropY, completedCrop.height * scaleY)
        : naturalH;

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = Math.max(1, Math.round(cropW));
      exportCanvas.height = Math.max(1, Math.round(cropH));
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context");

      ctx.drawImage(
        displayImg,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        exportCanvas.width,
        exportCanvas.height
      );

      const ext = getExtension(selectedFile.name) || "jpg";
      const mime = selectedFile.type || "image/jpeg";
      const outputName = `${selectedFile.name.replace(/\.[^/.]+$/, "")}_cropped.${ext}`;

      const blob = await new Promise<Blob>((resolve, reject) => {
        exportCanvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Export failed"))),
          mime,
          0.95
        );
      });

      triggerDownload(blob, outputName);

      const dlItem = {
        fileName: outputName,
        originalSize: selectedFile.size,
        outputSize: blob.size,
        savingsPct:
          selectedFile.size > blob.size
            ? ((selectedFile.size - blob.size) / selectedFile.size) * 100
            : 0,
        status: "downloaded" as const,
        blob,
      };

      pushDownload(dlItem);
      setLatestDeliveredFile({
        id: `deliv-${Date.now()}`,
        ...dlItem,
        timestamp: Date.now(),
      });
      triggerSupportPrompt();

      await addHistoryRecord({
        filename: selectedFile.name,
        tool: `Crop & Transform Image (${exportCanvas.width}×${exportCanvas.height})`,
        originalSize: selectedFile.size,
        outputSize: blob.size,
      });

      toast({
        title: "Export complete",
        description: `Image successfully cropped to ${exportCanvas.width} × ${exportCanvas.height}px and downloaded.`,
        variant: "success",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Transform failed",
        description: err.message || "Failed to process image",
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Live dimensions for inspector
  const displayW = displayImgRef.current?.width || 1;
  const displayH = displayImgRef.current?.height || 1;
  const scaleX = workingDims.width > 0 ? workingDims.width / displayW : 1;
  const scaleY = workingDims.height > 0 ? workingDims.height / displayH : 1;

  const actualCropW =
    completedCrop && completedCrop.width > 0
      ? Math.round(completedCrop.width * scaleX)
      : workingDims.width;
  const actualCropH =
    completedCrop && completedCrop.height > 0
      ? Math.round(completedCrop.height * scaleY)
      : workingDims.height;

  const totalArea = workingDims.width * workingDims.height;
  const cropArea = actualCropW * actualCropH;
  const areaCoveragePct =
    totalArea > 0 ? Math.min(100, Math.round((cropArea / totalArea) * 100)) : 100;

  return (
    <ToolPageShell
      icon={CropIcon}
      title="Crop & Transform Image"
      description="Interactively crop with aspect presets, rotate 90°, and flip images locally with zero cloud uploads."
      formats={["JPG", "PNG", "WEBP"]}
    >
      {!selectedFile ? (
        <DropZone
          onFiles={(files) => {
            const img = files.find((f) => f.type.startsWith("image/"));
            if (img) {
              addStoreFiles([img]);
              setSelectedFile(img);
            }
          }}
          accept={[".jpg", ".jpeg", ".png", ".webp"]}
          multiple={false}
          label="Drop an image to crop and transform"
          sublabel="Supports JPG, PNG, and WebP with zero quality degradation"
          className="py-16"
        />
      ) : (
        <div className="space-y-6">
          {/* Action Toolbar & Preset Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-xl p-4 shadow-xl">
            {/* Aspect Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[hsl(var(--foreground))] mr-1">
                Aspect:
              </span>
              {ASPECT_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handleAspectPresetSelect(preset)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium border transition-all touch-manipulation tabular-nums ${
                    activePreset === preset.key
                      ? "border-blue-400/50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                      : "border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] text-[hsl(var(--foreground))] hover:border-[var(--glass-border-luminous)]"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Transform Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRotateCcw}
                className="min-h-[44px] touch-manipulation"
                title="Rotate 90° Left"
              >
                <RotateCcw className="h-4 w-4 mr-1.5" /> 90° Left
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRotateCw}
                className="min-h-[44px] touch-manipulation"
                title="Rotate 90° Right"
              >
                <RotateCw className="h-4 w-4 mr-1.5" /> 90° Right
              </Button>
              <Button
                variant={flipH ? "default" : "secondary"}
                size="sm"
                onClick={handleFlipH}
                className="min-h-[44px] touch-manipulation"
                title="Flip Horizontal"
              >
                <FlipHorizontal className="h-4 w-4 mr-1.5" /> Flip H
              </Button>
              <Button
                variant={flipV ? "default" : "secondary"}
                size="sm"
                onClick={handleFlipV}
                className="min-h-[44px] touch-manipulation"
                title="Flip Vertical"
              >
                <FlipVertical className="h-4 w-4 mr-1.5" /> Flip V
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="min-h-[44px] touch-manipulation"
                title="Reset All Transforms"
              >
                <ResetIcon className="h-4 w-4 mr-1.5" /> Reset
              </Button>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto sm:ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="flex-1 sm:flex-none min-h-[44px] touch-manipulation"
              >
                Change Image
              </Button>
              <Button
                variant="default"
                size="sm"
                disabled={isProcessing}
                onClick={handleExport}
                className="flex-1 sm:flex-none min-h-[44px] bg-[hsl(var(--success))] hover:bg-emerald-600 text-[hsl(var(--success-foreground))] font-semibold touch-manipulation"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Download className="h-4 w-4 mr-1.5" />
                )}
                Download Result
              </Button>
            </div>
          </div>

          {/* Interactive Canvas Stage */}
          <div className="flex min-h-[360px] sm:min-h-[420px] items-center justify-center rounded-2xl border border-[var(--glass-border-luminous)] bg-black/60 backdrop-blur-md p-3 sm:p-6 overflow-hidden shadow-2xl max-w-full">
            {workingUrl ? (
              <ReactCrop
                crop={crop}
                aspect={aspect}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                className="max-h-[600px] max-w-full select-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={displayImgRef}
                  src={workingUrl}
                  alt="Crop target"
                  className="max-h-[550px] max-w-full object-contain pointer-events-none select-none"
                  onLoad={(e) => {
                    const target = e.currentTarget;
                    if (aspect) {
                      const centered = centerCrop(
                        makeAspectCrop(
                          { unit: "%", width: 90 },
                          aspect,
                          target.width,
                          target.height
                        ),
                        target.width,
                        target.height
                      );
                      setCrop(centered);
                      setCompletedCrop(
                        convertToPixelCrop(
                          centered,
                          target.width,
                          target.height
                        )
                      );
                    }
                  }}
                />
              </ReactCrop>
            ) : (
              <div className="flex items-center justify-center text-xs text-[hsl(var(--muted-foreground))]">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Preparing Canvas Bitmap...
              </div>
            )}
          </div>

          {/* Live Crop Dimension Inspector */}
          <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-2 mb-3">
              <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
                Live Crop Dimension Inspector
              </span>
              <span className="text-[11px] font-mono tabular-nums text-[hsl(var(--primary))] font-medium uppercase">
                Preset: {activePreset}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] p-2.5">
                <div className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">
                  Crop Dimensions
                </div>
                <div className="text-sm font-bold font-mono text-[hsl(var(--primary))] tabular-nums">
                  {actualCropW} × {actualCropH} px
                </div>
              </div>
              <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] p-2.5">
                <div className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">
                  Source Dimensions
                </div>
                <div className="text-sm font-bold font-mono text-[hsl(var(--foreground))] tabular-nums">
                  {workingDims.width} × {workingDims.height} px
                </div>
              </div>
              <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] p-2.5">
                <div className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">
                  Aspect Ratio
                </div>
                <div className="text-sm font-bold font-mono text-[hsl(var(--foreground))] tabular-nums">
                  {actualCropH > 0
                    ? `${(actualCropW / actualCropH).toFixed(2)}:1`
                    : "—"}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] p-2.5">
                <div className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">
                  Area Coverage
                </div>
                <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {areaCoveragePct}%
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-[hsl(var(--muted-foreground))]">
              Drag handles or select an aspect preset. Rotations and flips are rendered directly onto the bitmap canvas with zero coordinate drift.
            </p>
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
