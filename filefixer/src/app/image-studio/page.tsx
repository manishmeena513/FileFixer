"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  FileImage,
  Crop as CropIcon,
  Maximize2,
  Sliders,
  Sparkles,
  Download,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  RefreshCw,
  RotateCcw as ResetIcon,
  Upload,
  Layers,
  Palette,
  CheckCircle2,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BeforeAfterStats, CompareSlider } from "@/components/results/BeforeAfter";
import { useFileStore } from "@/stores/fileStore";
import { useToast } from "@/components/ui/toaster";
import { formatBytes, triggerDownload, SupportedImageFormat } from "@/lib/file-utils";
import { addHistoryRecord } from "@/lib/storage/history";
import { ToolPageShell } from "@/components/ui/ToolPageShell";

type AspectPresetKey = "free" | "1:1" | "4:3" | "16:9" | "9:16" | "3:2";

interface AspectPreset {
  label: string;
  key: AspectPresetKey;
  ratio: number | undefined;
}

const ASPECT_PRESETS: AspectPreset[] = [
  { label: "Free", key: "free", ratio: undefined },
  { label: "1:1 Square", key: "1:1", ratio: 1 },
  { label: "4:3 Photo", key: "4:3", ratio: 4 / 3 },
  { label: "16:9 Wide", key: "16:9", ratio: 16 / 9 },
  { label: "9:16 Story", key: "9:16", ratio: 9 / 16 },
  { label: "3:2 Classic", key: "3:2", ratio: 3 / 2 },
];

const FILTER_PRESETS = [
  { label: "Normal", key: "none" },
  { label: "B&W", key: "bw" },
  { label: "Warm Tone", key: "warm" },
  { label: "Cool Tone", key: "cool" },
  { label: "Sepia", key: "sepia" },
  { label: "Invert", key: "invert" },
];

export default function ImageStudioPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    files: storeFiles,
    addFiles,
    pushDownload,
    setLatestDeliveredFile,
    triggerSupportPrompt,
  } = useFileStore();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [workingUrl, setWorkingUrl] = useState<string | null>(null);
  const [rawImg, setRawImg] = useState<HTMLImageElement | null>(null);
  const displayImgRef = useRef<HTMLImageElement | null>(null);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<string>("crop");

  // Output deliverable
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputName, setOutputName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<"stage" | "compare">("stage");

  // 1. Crop & Orientation
  const [isCropMode, setIsCropMode] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [activePreset, setActivePreset] = useState<AspectPresetKey>("free");
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // 2. Resize
  const [targetWidth, setTargetWidth] = useState<number>(1920);
  const [targetHeight, setTargetHeight] = useState<number>(1080);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [naturalAspectRatio, setNaturalAspectRatio] = useState<number>(16 / 9);

  // 3. Adjust & Filter
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [filterPreset, setFilterPreset] = useState<string>("none");

  // 4. Export
  const [targetFormat, setTargetFormat] = useState<SupportedImageFormat>("image/webp");
  const [qualityPct, setQualityPct] = useState<number>(85);
  const [stripExif, setStripExif] = useState<boolean>(true);

  // Auto-populate from workspace
  useEffect(() => {
    if (!imageFile && storeFiles.length > 0) {
      const firstImg = storeFiles.find((f) => f.type.startsWith("image/"));
      if (firstImg) {
        handleLoadImage(firstImg.file);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeFiles]);

  const handleLoadImage = (file: File) => {
    setImageFile(file);
    setOutputBlob(null);
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    setOutputUrl(null);
    setOutputName(file.name);
    setViewMode("stage");

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      setRawImg(img);
      setTargetWidth(img.naturalWidth);
      setTargetHeight(img.naturalHeight);
      setNaturalAspectRatio(img.naturalWidth / img.naturalHeight);
      renderBitmap(img, 0, false, false);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const renderBitmap = useCallback(
    (sourceImg: HTMLImageElement, rot: number, fH: boolean, fV: boolean) => {
      const isQuarterRotated = rot === 90 || rot === 270;
      const stageW = isQuarterRotated ? sourceImg.naturalHeight : sourceImg.naturalWidth;
      const stageH = isQuarterRotated ? sourceImg.naturalWidth : sourceImg.naturalHeight;

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, stageW);
      canvas.height = Math.max(1, stageH);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.scale(fH ? -1 : 1, fV ? -1 : 1);
      ctx.drawImage(sourceImg, -sourceImg.naturalWidth / 2, -sourceImg.naturalHeight / 2);
      ctx.restore();

      canvas.toBlob((blob) => {
        if (!blob) return;
        const newUrl = URL.createObjectURL(blob);
        setWorkingUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return newUrl;
        });
      });
    },
    []
  );

  const applyOrientation = (newRot: number, newFH: boolean, newFV: boolean) => {
    setRotation(newRot);
    setFlipH(newFH);
    setFlipV(newFV);
    setCrop(undefined);
    setCompletedCrop(null);
    if (rawImg) {
      renderBitmap(rawImg, newRot, newFH, newFV);
    }
  };

  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (lockAspect && naturalAspectRatio > 0) {
      setTargetHeight(Math.max(1, Math.round(val / naturalAspectRatio)));
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (lockAspect && naturalAspectRatio > 0) {
      setTargetWidth(Math.max(1, Math.round(val * naturalAspectRatio)));
    }
  };

  const handlePercentageScale = (pct: number) => {
    if (!rawImg) return;
    const baseW = rawImg.naturalWidth;
    const baseH = rawImg.naturalHeight;
    const newW = Math.max(1, Math.round((baseW * pct) / 100));
    const newH = Math.max(1, Math.round((baseH * pct) / 100));
    setTargetWidth(newW);
    setTargetHeight(newH);
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

  // Main Studio Processing Pipeline
  const handleProcessStudio = async () => {
    if (!imageFile || !displayImgRef.current) return;
    setIsProcessing(true);

    try {
      const displayImg = displayImgRef.current;
      const naturalW = displayImg.naturalWidth;
      const naturalH = displayImg.naturalHeight;
      const scaleX = naturalW / displayImg.width;
      const scaleY = naturalH / displayImg.height;

      const cropX =
        completedCrop && completedCrop.width > 0
          ? Math.max(0, completedCrop.x * scaleX)
          : 0;
      const cropY =
        completedCrop && completedCrop.height > 0
          ? Math.max(0, completedCrop.y * scaleY)
          : 0;
      const cropW =
        completedCrop && completedCrop.width > 0
          ? Math.min(naturalW - cropX, completedCrop.width * scaleX)
          : naturalW;
      const cropH =
        completedCrop && completedCrop.height > 0
          ? Math.min(naturalH - cropY, completedCrop.height * scaleY)
          : naturalH;

      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = Math.max(1, targetWidth);
      finalCanvas.height = Math.max(1, targetHeight);
      const finalCtx = finalCanvas.getContext("2d");
      if (!finalCtx) throw new Error("Could not initialize canvas context");

      // Construct CSS filter chain
      let filterChain = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      if (filterPreset === "bw") filterChain += " grayscale(100%)";
      else if (filterPreset === "warm") filterChain += " sepia(30%) saturate(120%)";
      else if (filterPreset === "cool") filterChain += " hue-rotate(180deg) saturate(90%)";
      else if (filterPreset === "sepia") filterChain += " sepia(85%)";
      else if (filterPreset === "invert") filterChain += " invert(100%)";

      finalCtx.filter = filterChain;

      if (targetFormat === "image/jpeg") {
        finalCtx.fillStyle = "#ffffff";
        finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      }

      finalCtx.drawImage(
        displayImg,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        finalCanvas.width,
        finalCanvas.height
      );

      const ext =
        targetFormat === "image/webp"
          ? "webp"
          : targetFormat === "image/png"
          ? "png"
          : "jpg";
      const base = imageFile.name.replace(/\.[^/.]+$/, "");
      const finalFilename = `${base}_studio.${ext}`;

      const finalBlob = await new Promise<Blob>((resolve, reject) => {
        finalCanvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))),
          targetFormat,
          qualityPct / 100
        );
      });

      setOutputBlob(finalBlob);
      setOutputName(finalFilename);

      if (outputUrl) URL.revokeObjectURL(outputUrl);
      const newOutUrl = URL.createObjectURL(finalBlob);
      setOutputUrl(newOutUrl);
      setViewMode("compare");

      // Stage into Download Dock as ready
      pushDownload({
        fileName: finalFilename,
        originalSize: imageFile.size,
        outputSize: finalBlob.size,
        savingsPct:
          imageFile.size > finalBlob.size
            ? ((imageFile.size - finalBlob.size) / imageFile.size) * 100
            : 0,
        status: "ready",
        blob: finalBlob,
      });

      await addHistoryRecord({
        filename: imageFile.name,
        tool: `Image Studio (${targetWidth}×${targetHeight})`,
        originalSize: imageFile.size,
        outputSize: finalBlob.size,
      });

      toast({
        title: "Workstation render complete",
        description: `Successfully processed to ${formatBytes(finalBlob.size)}.`,
        variant: "success",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Processing failed",
        description: err.message || "Failed to process image in studio",
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadOutput = () => {
    if (!outputBlob || !imageFile) return;
    triggerDownload(outputBlob, outputName);

    const savings =
      imageFile.size > outputBlob.size
        ? ((imageFile.size - outputBlob.size) / imageFile.size) * 100
        : 0;

    const dlItem = {
      fileName: outputName,
      originalSize: imageFile.size,
      outputSize: outputBlob.size,
      savingsPct: savings,
      status: "downloaded" as const,
      blob: outputBlob,
    };

    pushDownload(dlItem);
    setLatestDeliveredFile({
      id: `deliv-${Date.now()}`,
      ...dlItem,
      timestamp: Date.now(),
    });
    triggerSupportPrompt();
  };

  // Real-time CSS filter preview
  const liveFilterStyle = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${
    filterPreset === "bw"
      ? "grayscale(100%)"
      : filterPreset === "warm"
      ? "sepia(30%) saturate(120%)"
      : filterPreset === "cool"
      ? "hue-rotate(180deg) saturate(90%)"
      : filterPreset === "sepia"
      ? "sepia(85%)"
      : filterPreset === "invert"
      ? "invert(100%)"
      : ""
  }`;

  return (
    <ToolPageShell
      icon={FileImage}
      title="Image Studio"
      description="Professional multi-tool workstation: crop, resize, adjust colors, apply filters, and convert formats in a single pass."
      formats={["JPG", "PNG", "WEBP"]}
    >
      {!imageFile ? (
        <DropZone
          onFiles={(files) => {
            const img = files.find((f) => f.type.startsWith("image/"));
            if (img) {
              addFiles([img]);
              handleLoadImage(img);
            }
          }}
          accept={[".jpg", ".jpeg", ".png", ".webp"]}
          multiple={false}
          label="Drop an image into the Studio Workstation"
          sublabel="Comprehensive all-in-one image transformation workbench"
          className="py-16"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Visual Stage (7-8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between border-b border-[var(--glass-border)] pb-3 text-xs text-[hsl(var(--muted-foreground))] gap-2">
              <span className="font-semibold text-[hsl(var(--foreground))] truncate max-w-xs">
                {imageFile.name}
              </span>
              <div className="flex items-center gap-3 font-mono tabular-nums">
                <span>Original: {formatBytes(imageFile.size)}</span>
                {outputBlob && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    → {formatBytes(outputBlob.size)}
                  </span>
                )}
                {outputUrl && (
                  <div className="flex rounded-xl border border-[var(--glass-border)] p-0.5 bg-[var(--glass-surface-elevated)]">
                    <button
                      type="button"
                      onClick={() => setViewMode("stage")}
                      className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg text-xs font-sans font-medium transition-all flex items-center justify-center ${
                        viewMode === "stage"
                          ? "bg-[hsl(var(--primary))] text-white shadow-xs"
                          : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                      }`}
                    >
                      Stage
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("compare")}
                      className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg text-xs font-sans font-medium transition-all flex items-center justify-center ${
                        viewMode === "compare"
                          ? "bg-[hsl(var(--primary))] text-white shadow-xs"
                          : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                      }`}
                    >
                      Compare
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Stage Viewport */}
            <div className="flex min-h-[440px] items-center justify-center p-4 bg-black/60 rounded-2xl overflow-hidden relative border border-[var(--glass-border-luminous)] shadow-2xl">
              {viewMode === "compare" && workingUrl && outputUrl ? (
                <div className="w-full max-w-xl h-80 sm:h-96">
                  <CompareSlider
                    originalUrl={workingUrl}
                    outputUrl={outputUrl}
                    beforeLabel="Working"
                    afterLabel="Finished"
                    className="h-full w-full"
                  />
                </div>
              ) : workingUrl ? (
                isCropMode ? (
                  <ReactCrop
                    crop={crop}
                    aspect={aspect}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    className="max-h-[520px] select-none"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={displayImgRef}
                      src={workingUrl}
                      alt="Studio target"
                      className="max-h-[480px] max-w-full object-contain pointer-events-none select-none transition-all"
                      style={{ filter: liveFilterStyle }}
                    />
                  </ReactCrop>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    ref={displayImgRef}
                    src={workingUrl}
                    alt="Studio preview"
                    className="max-h-[480px] max-w-full object-contain rounded-xl shadow-2xl transition-all"
                    style={{ filter: liveFilterStyle }}
                  />
                )
              ) : (
                <div className="flex items-center text-xs text-[hsl(var(--muted-foreground))]">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Loading Workstation Canvas...
                </div>
              )}
            </div>

            {/* Stage Footer Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-[hsl(var(--muted-foreground))]">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[44px] touch-manipulation"
                >
                  <Upload className="h-4 w-4 mr-1.5" /> Open Different Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleLoadImage(e.target.files[0]);
                  }}
                  className="hidden"
                />
              </div>

              <div className="flex items-center gap-2 font-mono tabular-nums text-xs">
                <span>
                  Canvas: {targetWidth} × {targetHeight} px
                </span>
                <span>·</span>
                <span>{((targetWidth * targetHeight) / 1000000).toFixed(2)} MP</span>
              </div>
            </div>

            {/* BeforeAfter Stats when processed */}
            {outputBlob && (
              <div className="pt-2 animate-slide-up">
                <BeforeAfterStats
                  originalSize={imageFile.size}
                  outputSize={outputBlob.size}
                  originalDimensions={
                    rawImg
                      ? `${rawImg.naturalWidth}×${rawImg.naturalHeight}`
                      : undefined
                  }
                  outputDimensions={`${targetWidth}×${targetHeight}`}
                  originalFormat={imageFile.name.split(".").pop()}
                  outputFormat={outputName.split(".").pop()}
                />
              </div>
            )}
          </div>

          {/* Controls Sidebar (4-5 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-xl p-5 sm:p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
              <h2 className="text-base font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[hsl(var(--primary))]" /> Workstation Tools
              </h2>
            </div>

            {/* 4 Ergonomic Tool Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 min-h-[44px]">
                <TabsTrigger value="crop" className="text-xs min-h-[38px] px-1">
                  Crop
                </TabsTrigger>
                <TabsTrigger value="resize" className="text-xs min-h-[38px] px-1">
                  Resize
                </TabsTrigger>
                <TabsTrigger value="adjust" className="text-xs min-h-[38px] px-1">
                  Filters
                </TabsTrigger>
                <TabsTrigger value="export" className="text-xs min-h-[38px] px-1">
                  Export
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Crop & Transform */}
              <TabsContent value="crop" className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
                    Crop Overlay
                  </span>
                  <Button
                    variant={isCropMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsCropMode(!isCropMode)}
                    className="min-h-[40px] touch-manipulation text-xs"
                  >
                    <CropIcon className="h-3.5 w-3.5 mr-1" />
                    {isCropMode ? "Crop Active" : "Enable Crop Mode"}
                  </Button>
                </div>

                {isCropMode && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))]">
                      Aspect Ratio Presets:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {ASPECT_PRESETS.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => handleAspectPresetSelect(p)}
                          className={`min-h-[44px] rounded-xl border text-xs font-medium transition-all touch-manipulation tabular-nums ${
                            activePreset === p.key
                              ? "border-blue-400/50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                              : "border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] text-[hsl(var(--foreground))] hover:border-[var(--glass-border-luminous)]"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-[var(--glass-border)]">
                  <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
                    Orientation &amp; Flips
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        applyOrientation((rotation - 90 + 360) % 360, flipH, flipV)
                      }
                      className="min-h-[44px] touch-manipulation text-xs"
                    >
                      <RotateCcw className="h-4 w-4 mr-1.5" /> 90° Left
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        applyOrientation((rotation + 90) % 360, flipH, flipV)
                      }
                      className="min-h-[44px] touch-manipulation text-xs"
                    >
                      <RotateCw className="h-4 w-4 mr-1.5" /> 90° Right
                    </Button>
                    <Button
                      variant={flipH ? "default" : "outline"}
                      size="sm"
                      onClick={() => applyOrientation(rotation, !flipH, flipV)}
                      className="min-h-[44px] touch-manipulation text-xs"
                    >
                      <FlipHorizontal className="h-4 w-4 mr-1.5" /> Flip H
                    </Button>
                    <Button
                      variant={flipV ? "default" : "outline"}
                      size="sm"
                      onClick={() => applyOrientation(rotation, flipH, !flipV)}
                      className="min-h-[44px] touch-manipulation text-xs"
                    >
                      <FlipVertical className="h-4 w-4 mr-1.5" /> Flip V
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Dimensions & Resize */}
              <TabsContent value="resize" className="space-y-4 pt-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-[hsl(var(--foreground))]">
                        Width (px)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10000}
                        value={targetWidth}
                        onChange={(e) =>
                          handleWidthChange(parseInt(e.target.value, 10) || 1)
                        }
                        className="h-11 w-full mt-1 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] px-3 text-xs font-mono tabular-nums focus:outline-none focus:border-[var(--glass-border-luminous)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.3)]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[hsl(var(--foreground))]">
                        Height (px)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10000}
                        value={targetHeight}
                        onChange={(e) =>
                          handleHeightChange(parseInt(e.target.value, 10) || 1)
                        }
                        className="h-11 w-full mt-1 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] px-3 text-xs font-mono tabular-nums focus:outline-none focus:border-[var(--glass-border-luminous)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.3)]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[hsl(var(--muted-foreground))]">
                      Lock Aspect Ratio
                    </span>
                    <Switch checked={lockAspect} onCheckedChange={setLockAspect} />
                  </div>
                </div>

                {/* Percentage Quick Chips */}
                <div className="space-y-1.5 pt-2 border-t border-[hsl(var(--border))]">
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Scale Percentage:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[25, 50, 75, 100, 150, 200].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handlePercentageScale(pct)}
                        className="min-h-[44px] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-2 py-1 text-xs font-mono tabular-nums touch-manipulation hover:bg-[hsl(var(--secondary)/0.8)]"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution Presets */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Resolution Presets:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-left">
                    {[
                      { label: "1080p FHD", w: 1920, h: 1080 },
                      { label: "720p HD", w: 1280, h: 720 },
                      { label: "Square Post", w: 1080, h: 1080 },
                      { label: "Story / Reel", w: 1080, h: 1920 },
                    ].map((res) => (
                      <button
                        key={res.label}
                        type="button"
                        onClick={() => {
                          setTargetWidth(res.w);
                          setTargetHeight(res.h);
                          setNaturalAspectRatio(res.w / res.h);
                        }}
                        className="min-h-[44px] p-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-left touch-manipulation hover:bg-[hsl(var(--secondary)/0.8)]"
                      >
                        <div className="text-xs font-semibold">{res.label}</div>
                        <div className="text-[10px] font-mono text-[hsl(var(--primary))] tabular-nums">
                          {res.w} × {res.h}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Adjust & Filter */}
              <TabsContent value="adjust" className="space-y-4 pt-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Brightness</span>
                      <span className="font-mono font-bold text-[hsl(var(--primary))] tabular-nums">
                        {brightness}%
                      </span>
                    </div>
                    <Slider
                      value={[brightness]}
                      onValueChange={([v]) => setBrightness(v)}
                      min={50}
                      max={150}
                      step={1}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Contrast</span>
                      <span className="font-mono font-bold text-[hsl(var(--primary))] tabular-nums">
                        {contrast}%
                      </span>
                    </div>
                    <Slider
                      value={[contrast]}
                      onValueChange={([v]) => setContrast(v)}
                      min={50}
                      max={150}
                      step={1}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Saturation</span>
                      <span className="font-mono font-bold text-[hsl(var(--primary))] tabular-nums">
                        {saturation}%
                      </span>
                    </div>
                    <Slider
                      value={[saturation]}
                      onValueChange={([v]) => setSaturation(v)}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[hsl(var(--border))]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
                      Color Filter Presets
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBrightness(100);
                        setContrast(100);
                        setSaturation(100);
                        setFilterPreset("none");
                      }}
                      className="text-[11px] h-7 px-2"
                    >
                      <ResetIcon className="h-3 w-3 mr-1" /> Reset
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {FILTER_PRESETS.map((fp) => (
                      <button
                        key={fp.key}
                        type="button"
                        onClick={() => setFilterPreset(fp.key)}
                        className={`min-h-[44px] rounded-xl border text-xs font-medium transition-all touch-manipulation ${
                          filterPreset === fp.key
                            ? "border-blue-400/50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                            : "border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] text-[hsl(var(--foreground))] hover:border-[var(--glass-border-luminous)]"
                        }`}
                      >
                        {fp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Tab 4: Export & Quality */}
              <TabsContent value="export" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                    Target Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { format: "image/webp", label: "WebP" },
                      { format: "image/jpeg", label: "JPG" },
                      { format: "image/png", label: "PNG" },
                    ].map((f) => (
                      <button
                        key={f.format}
                        type="button"
                        onClick={() =>
                          setTargetFormat(f.format as SupportedImageFormat)
                        }
                        className={`min-h-[44px] rounded-xl border text-xs font-bold transition-all touch-manipulation ${
                          targetFormat === f.format
                            ? "border-blue-400/50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                            : "border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] text-[hsl(var(--foreground))] hover:border-[var(--glass-border-luminous)]"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {targetFormat !== "image/png" && (
                  <div className="space-y-2 pt-2 border-t border-[hsl(var(--border))]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">Quality Level</span>
                      <span className="font-mono font-bold text-[hsl(var(--primary))] tabular-nums">
                        {qualityPct}%
                      </span>
                    </div>
                    <Slider
                      value={[qualityPct]}
                      onValueChange={([val]) => setQualityPct(val)}
                      min={10}
                      max={100}
                      step={1}
                    />
                    <div className="flex justify-between text-[10px] text-[hsl(var(--muted-foreground))] tabular-nums">
                      <span>Smaller File (10%)</span>
                      <span>Maximum Quality (100%)</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[hsl(var(--border))] text-xs">
                  <div>
                    <p className="font-semibold text-[hsl(var(--foreground))]">
                      Strip EXIF &amp; GPS
                    </p>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                      Sanitize camera tags upon export
                    </p>
                  </div>
                  <Switch checked={stripExif} onCheckedChange={setStripExif} />
                </div>
              </TabsContent>
            </Tabs>

            {/* Main Action Buttons */}
            <div className="pt-4 border-t border-[hsl(var(--border))] space-y-3">
              <Button
                onClick={handleProcessStudio}
                disabled={isProcessing}
                className="w-full min-h-[48px] font-bold touch-manipulation"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Rendering Canvas Pipeline...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Apply &amp; Process Image
                  </>
                )}
              </Button>

              {outputBlob && (
                <Button
                  onClick={handleDownloadOutput}
                  className="w-full min-h-[48px] bg-[hsl(var(--success))] hover:bg-emerald-600 text-[hsl(var(--success-foreground))] font-bold touch-manipulation tabular-nums"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Finished File ({formatBytes(outputBlob.size)})
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
