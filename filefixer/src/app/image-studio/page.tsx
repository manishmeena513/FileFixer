"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileImage,
  Upload,
  Crop,
  Maximize2,
  Minimize2,
  RefreshCw,
  Shield,
  Download,
  CheckCircle2,
  Undo2,
  Redo2,
  Sparkles,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Sliders,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Check,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { BeforeAfterStats, CompareSlider } from "@/components/results/BeforeAfter";
import { useFileStore } from "@/stores/fileStore";
import { useToast } from "@/components/ui/toaster";
import { formatBytes, triggerDownload, SupportedImageFormat } from "@/lib/file-utils";
import { compressImage } from "@/lib/image/compress";
import { resizeImage } from "@/lib/image/resize";
import { convertImage } from "@/lib/image/convert";
import { transformImage } from "@/lib/image/transform";
import { stripImageMetadata, readImageMetadata } from "@/lib/image/metadata";

export default function ImageStudioPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { files: storeFiles, addFiles, pushDownload, setLatestDeliveredFile } = useFileStore();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputName, setOutputName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Studio Settings
  const [qualityPct, setQualityPct] = useState(82);
  const [targetWidth, setTargetWidth] = useState(1920);
  const [targetHeight, setTargetHeight] = useState(1080);
  const [lockAspect, setLockAspect] = useState(true);
  const [targetFormat, setTargetFormat] = useState<SupportedImageFormat>("image/webp");
  const [exifData, setExifData] = useState<any>(null);

  // Auto-populate from workspace
  useEffect(() => {
    if (!imageFile && storeFiles.length > 0) {
      const firstImg = storeFiles.find((f) => f.type.startsWith("image/"));
      if (firstImg) {
        handleLoadImage(firstImg.file);
      }
    }
  }, [storeFiles, imageFile]);

  const handleLoadImage = (file: File) => {
    setImageFile(file);
    setOutputBlob(null);
    setOutputUrl(null);
    setOutputName(file.name);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Probe dimensions & EXIF
    const img = new window.Image();
    img.onload = () => {
      setTargetWidth(img.naturalWidth);
      setTargetHeight(img.naturalHeight);
    };
    img.src = url;

    readImageMetadata(file).then((exif) => setExifData(exif)).catch(() => setExifData(null));
  };

  const handleSelectFiles = (files: File[]) => {
    const valid = files.find((f) => f.type.startsWith("image/"));
    if (valid) {
      addFiles([valid]);
      handleLoadImage(valid);
    }
  };

  // Run full studio pipeline on current image
  const handleApplyChanges = async () => {
    if (!imageFile) return;
    setIsProcessing(true);

    try {
      let curBlob: Blob = imageFile;
      let curFile: File = imageFile;

      // 1. Resize
      const resizeRes = await resizeImage(curFile, {
        width: targetWidth,
        height: targetHeight,
        maintainAspectRatio: lockAspect,
      });
      curBlob = resizeRes.blob;
      curFile = new File([curBlob], imageFile.name, { type: curBlob.type });

      // 2. Convert format
      const convertRes = await convertImage(curFile, {
        targetFormat,
        quality: qualityPct / 100,
      });
      curBlob = convertRes.blob;
      let finalName = convertRes.outputFilename;

      // 3. Compress
      const compRes = await compressImage(curFile, {
        mode: "quality",
        quality: qualityPct / 100,
      });
      curBlob = compRes.blob;

      setOutputBlob(curBlob);
      setOutputName(finalName);

      if (outputUrl) URL.revokeObjectURL(outputUrl);
      const newUrl = URL.createObjectURL(curBlob);
      setOutputUrl(newUrl);

      // Queue in download dock
      pushDownload({
        fileName: finalName,
        originalSize: imageFile.size,
        outputSize: curBlob.size,
        savingsPct:
          imageFile.size > curBlob.size
            ? ((imageFile.size - curBlob.size) / imageFile.size) * 100
            : 0,
        status: "ready",
        blob: curBlob,
      });

      toast({
        title: "Image Studio export ready",
        description: `Optimized ${finalName} successfully.`,
        variant: "success",
      });
    } catch (err: any) {
      alert(`Image processing failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate = async (angle: 90 | 270) => {
    if (!imageFile) return;
    setIsProcessing(true);
    try {
      const blob = await transformImage(imageFile, { rotation: angle });
      const nextFile = new File([blob], imageFile.name, { type: blob.type || imageFile.type });
      handleLoadImage(nextFile);
    } catch (err: any) {
      alert(`Rotate failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeliver = () => {
    if (!outputBlob) return;
    triggerDownload(outputBlob, outputName);
    setLatestDeliveredFile({
      id: `deliv-${Date.now()}`,
      fileName: outputName,
      originalSize: imageFile?.size || 0,
      outputSize: outputBlob.size,
      status: "downloaded",
      blob: outputBlob,
      timestamp: Date.now(),
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[hsl(var(--border))] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] px-3 py-1 text-xs font-semibold text-[hsl(var(--primary))] mb-2">
            <FileImage className="h-3.5 w-3.5" />
            <span>Image Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Professional Image Workstation
          </h1>
          <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
            Resize, compress, convert, rotate, and strip metadata in a unified live studio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs"
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
      </div>

      {!imageFile ? (
        <div className="max-w-2xl mx-auto py-12">
          <DropZone
            onFilesSelected={handleSelectFiles}
            accept={["image/*", ".jpg", ".jpeg", ".png", ".webp", ".avif"]}
            title="Drop Image into Image Studio"
            description="Drag any JPG, PNG, or WebP photo to open in the professional studio"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Visual Canvas (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3 text-xs text-[hsl(var(--muted-foreground))]">
              <span className="font-semibold truncate max-w-xs">{imageFile.name}</span>
              <div className="flex items-center gap-2 font-mono">
                <span>{formatBytes(imageFile.size)}</span>
                {outputBlob && (
                  <span className="text-emerald-400 font-bold">
                    → {formatBytes(outputBlob.size)}
                  </span>
                )}
              </div>
            </div>

            {/* Stage */}
            <div className="flex items-center justify-center p-4 bg-[hsl(var(--secondary)/0.3)] rounded-2xl min-h-[420px]">
              {previewUrl && (
                outputUrl ? (
                  <div className="w-full max-w-lg">
                    <CompareSlider
                      originalUrl={previewUrl}
                      outputUrl={outputUrl}
                      beforeLabel="Original"
                      afterLabel="Optimized"
                    />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt={imageFile.name}
                    className="max-h-[500px] max-w-full rounded-xl shadow-xl object-contain"
                  />
                )
              )}
            </div>

            {/* Orientation quick buttons */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRotate(270)}
                  className="text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> 90° CCW
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRotate(90)}
                  className="text-xs"
                >
                  <RotateCw className="h-3.5 w-3.5 mr-1" /> 90° CW
                </Button>
              </div>

              {exifData && (
                <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30">
                  <Shield className="h-3 w-3 mr-1" /> EXIF Found
                </Badge>
              )}
            </div>
          </div>

          {/* Controls Sidebar (5 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-6">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[hsl(var(--primary))]" /> Studio Controls
            </h2>

            {/* 1. Dimensions */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Resolution & Dimensions
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))]">Width (px)</label>
                  <input
                    type="number"
                    value={targetWidth}
                    onChange={(e) => setTargetWidth(Number(e.target.value))}
                    className="w-full mt-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))]">Height (px)</label>
                  <input
                    type="number"
                    value={targetHeight}
                    onChange={(e) => setTargetHeight(Number(e.target.value))}
                    className="w-full mt-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[hsl(var(--muted-foreground))]">Lock Aspect Ratio</span>
                <Switch checked={lockAspect} onCheckedChange={setLockAspect} />
              </div>
            </div>

            {/* 2. Format */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Target Format
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { format: "image/webp", label: "WebP" },
                  { format: "image/jpeg", label: "JPG" },
                  { format: "image/png", label: "PNG" },
                ].map((f) => (
                  <button
                    key={f.format}
                    onClick={() => setTargetFormat(f.format as SupportedImageFormat)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                      targetFormat === f.format
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--background))]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Compression Quality */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">Quality Level</span>
                <span className="font-mono font-bold text-[hsl(var(--primary))]">
                  {qualityPct}%
                </span>
              </div>
              <Slider
                value={[qualityPct]}
                onValueChange={(val) => setQualityPct(val[0])}
                min={10}
                max={100}
                step={1}
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5">
              <Button
                onClick={handleApplyChanges}
                disabled={isProcessing}
                className="w-full min-h-[48px] font-bold"
              >
                {isProcessing ? "Processing..." : "Apply & Preview Result"}
              </Button>

              {outputBlob && (
                <Button
                  onClick={handleDeliver}
                  className="w-full min-h-[46px] bg-emerald-600 hover:bg-emerald-500 font-bold"
                >
                  <Download className="h-4 w-4 mr-2" /> Download Finished File
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
