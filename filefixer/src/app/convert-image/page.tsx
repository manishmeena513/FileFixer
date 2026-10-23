"use client";

import React, { useState } from "react";
import {
  RefreshCw,
  Download,
  Archive,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { FileCard } from "@/components/upload/FileCard";
import { BeforeAfterStats } from "@/components/results/BeforeAfter";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/toaster";
import { useFileStore } from "@/stores/fileStore";
import { convertImage } from "@/lib/image/convert";
import { SupportedImageFormat, triggerDownload } from "@/lib/file-utils";
import { downloadAsZip } from "@/lib/zip";
import { addHistoryRecord } from "@/lib/storage/history";
import { ToolPageShell } from "@/components/ui/ToolPageShell";

interface FormatOption {
  label: string;
  mime: SupportedImageFormat;
  ext: string;
  description: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    label: "WebP (Modern Web)",
    mime: "image/webp",
    ext: "webp",
    description: "High efficiency, 30% smaller, supports full transparency",
  },
  {
    label: "PNG (Lossless)",
    mime: "image/png",
    ext: "png",
    description: "Pixel-perfect graphics, screenshots, logos with transparency",
  },
  {
    label: "JPG / JPEG (Universal)",
    mime: "image/jpeg",
    ext: "jpg",
    description: "Universal compatibility across all devices and platforms",
  },
];

const PRESET_BG_COLORS = [
  { label: "White", value: "#FFFFFF", border: true },
  { label: "Black", value: "#000000", border: false },
  { label: "Light Slate", value: "#F1F5F9", border: true },
  { label: "Midnight Dark", value: "#0B1020", border: false },
];

export default function ConvertImagePage() {
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
  const [targetFormat, setTargetFormat] =
    useState<SupportedImageFormat>("image/webp");
  const [qualityPct, setQualityPct] = useState<number>(90);
  const [bgColor, setBgColor] = useState<string>("#FFFFFF");

  const imageFiles = files.filter(
    (f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|avif)$/i.test(f.name)
  );
  const singleFile = imageFiles.length === 1 ? imageFiles[0] : null;

  // Check if any uploaded image is PNG or WebP (has potential alpha transparency)
  const hasPotentialTransparency = imageFiles.some(
    (f) =>
      f.type === "image/png" ||
      f.type === "image/webp" ||
      /\.(png|webp)$/i.test(f.name)
  );

  const handleFiles = (newFiles: File[]) => {
    const valid = newFiles.filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) {
      toast({
        title: "Invalid file format",
        description: "Please select JPG, PNG, or WebP images.",
        variant: "error",
      });
      return;
    }
    addFiles(valid);
  };

  const handleConvertAll = async () => {
    if (imageFiles.length === 0) return;
    setIsProcessing(true);

    let completed = 0;
    for (const f of imageFiles) {
      updateStatus(f.id, "processing");
      try {
        const res = await convertImage(f.file, {
          targetFormat,
          quality: qualityPct / 100,
          backgroundColor: bgColor,
        });
        setOutput(f.id, res.blob, res.outputFilename, res.blob.size);
        completed++;

        // Push to download dock as ready
        pushDownload({
          fileName: res.outputFilename,
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
          tool: `Convert to ${targetFormat.replace("image/", "").toUpperCase()}`,
          originalSize: f.size,
          outputSize: res.blob.size,
        });
      } catch (err: any) {
        console.error(err);
        updateStatus(f.id, "error", err.message || "Conversion failed");
      }
    }

    setIsProcessing(false);
    toast({
      title: "Conversion complete",
      description: `Converted ${completed} image(s) to ${
        FORMAT_OPTIONS.find((fo) => fo.mime === targetFormat)?.label
      }.`,
      variant: "success",
    });
  };

  const handleDownloadSingle = (id: string) => {
    const f = imageFiles.find((item) => item.id === id);
    if (!f || !f.outputBlob) return;
    const fileName = f.outputName || f.name;
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
    await downloadAsZip(entries, "converted_images.zip");

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
      description: `Downloaded ${entries.length} converted image(s).`,
      variant: "success",
    });
  };

  const anyCompleted = imageFiles.some((f) => f.status === "done");

  return (
    <ToolPageShell
      icon={RefreshCw}
      title="Convert Image"
      description="Convert single or multiple images between JPG, PNG, and WebP formats instantly with zero cloud uploads."
      formats={["JPG", "PNG", "WEBP"]}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Files & Transparency Detection */}
        <div className="space-y-6 lg:col-span-2">
          {imageFiles.length === 0 ? (
            <DropZone
              onFiles={handleFiles}
              accept={[".jpg", ".jpeg", ".png", ".webp"]}
              label="Drop images to convert"
              sublabel="Supports batch conversion across JPG, PNG, and WebP"
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

          {/* Alpha Transparency Status Banner */}
          {imageFiles.length > 0 && (
            <div className="space-y-3">
              {targetFormat === "image/jpeg" && hasPotentialTransparency ? (
                <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">
                      Transparency Compositing Notice
                    </p>
                    <p className="text-[11px] opacity-90">
                      JPG format does not support transparency. Transparent areas will be automatically filled with your chosen background color.
                    </p>
                  </div>
                </div>
              ) : targetFormat !== "image/jpeg" ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">
                      Full Alpha Transparency Preserved
                    </p>
                    <p className="text-[11px] opacity-90">
                      Exporting to {targetFormat === "image/webp" ? "WebP" : "PNG"} preserves transparent alpha channels seamlessly with zero clipping.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Format Guide */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-xs text-[hsl(var(--muted-foreground))] space-y-3">
            <h3 className="font-semibold text-sm text-[hsl(var(--foreground))]">
              Format Selection Guide
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-[hsl(var(--secondary))] p-3 space-y-1">
                <span className="font-bold text-[hsl(var(--foreground))]">
                  WebP (Recommended)
                </span>
                <p className="text-[11px] leading-relaxed">
                  Modern web standard. ~30% smaller than JPG with lossy or lossless compression and full alpha transparency.
                </p>
              </div>
              <div className="rounded-lg bg-[hsl(var(--secondary))] p-3 space-y-1">
                <span className="font-bold text-[hsl(var(--foreground))]">
                  PNG (Lossless)
                </span>
                <p className="text-[11px] leading-relaxed">
                  Pixel-perfect raster format. Ideal for screenshots, icons, and graphics where compression artifacts must be zero.
                </p>
              </div>
              <div className="rounded-lg bg-[hsl(var(--secondary))] p-3 space-y-1">
                <span className="font-bold text-[hsl(var(--foreground))]">
                  JPG (Universal)
                </span>
                <p className="text-[11px] leading-relaxed">
                  Supported everywhere across all operating systems, legacy software, print processors, and document portals.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-6 space-y-6">
            <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
              Conversion Target
            </h2>

            {/* Target format buttons */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                Select Output Format
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {FORMAT_OPTIONS.map((fo) => (
                  <button
                    key={fo.mime}
                    type="button"
                    onClick={() => setTargetFormat(fo.mime)}
                    className={`flex flex-col items-start justify-center p-3 rounded-xl border text-left transition-all min-h-[48px] touch-manipulation ${
                      targetFormat === fo.mime
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--foreground))]"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary)/0.8)]"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                        {fo.label}
                      </span>
                      <span className="text-xs font-mono font-bold uppercase text-[hsl(var(--primary))]">
                        .{fo.ext}
                      </span>
                    </div>
                    <span className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                      {fo.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Dial for JPG/WebP */}
            {targetFormat !== "image/png" ? (
              <div className="space-y-3 pt-2 border-t border-[hsl(var(--border))]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[hsl(var(--foreground))]">
                    Export Quality
                  </span>
                  <span className="text-xs font-mono font-bold text-[hsl(var(--primary))] tabular-nums">
                    {qualityPct}%
                  </span>
                </div>
                <Slider
                  value={[qualityPct]}
                  onValueChange={([v]) => setQualityPct(v)}
                  min={10}
                  max={100}
                  step={5}
                />
                <div className="flex justify-between text-[10px] text-[hsl(var(--muted-foreground))] tabular-nums">
                  <span>Smaller (10%)</span>
                  <span>Maximum (100%)</span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-[hsl(var(--secondary))] p-3 text-xs text-[hsl(var(--secondary-foreground))]">
                ✓ PNG is always 100% lossless with uncompressed pixel fidelity.
              </div>
            )}

            {/* Background Color Compositing Controls (for JPG) */}
            {targetFormat === "image/jpeg" && (
              <div className="space-y-3 pt-3 border-t border-[hsl(var(--border))]">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                  Background Color (Replaces Transparency)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_BG_COLORS.map((swatch) => (
                    <button
                      key={swatch.value}
                      type="button"
                      onClick={() => setBgColor(swatch.value)}
                      className={`min-h-[44px] rounded-xl flex items-center justify-center gap-1.5 px-2 py-1.5 border text-xs font-medium transition-colors touch-manipulation ${
                        bgColor.toLowerCase() === swatch.value.toLowerCase()
                          ? "border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary)/0.25)]"
                          : "border-[hsl(var(--border))]"
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-black/20 shrink-0 shadow-xs"
                        style={{ backgroundColor: swatch.value }}
                      />
                      <span className="truncate text-[11px]">{swatch.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-center gap-2 h-11 px-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] min-w-[140px]">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-7 w-7 rounded-lg border border-black/20 bg-transparent cursor-pointer p-0"
                      aria-label="Custom background color"
                    />
                    <span className="text-xs font-mono font-medium text-[hsl(var(--foreground))] uppercase tabular-nums">
                      {bgColor}
                    </span>
                  </div>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    Custom Hex Color
                  </span>
                </div>
              </div>
            )}

            <Button
              className="w-full min-h-[48px] font-semibold touch-manipulation"
              size="lg"
              disabled={imageFiles.length === 0 || isProcessing}
              onClick={handleConvertAll}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Converting in Browser...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  <span className="tabular-nums">
                    {imageFiles.length > 1
                      ? `Convert All (${imageFiles.length})`
                      : "Convert Image"}
                  </span>
                </>
              )}
            </Button>
          </div>

          {/* Download single */}
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
                outputDimensions={
                  singleFile.width && singleFile.height
                    ? `${singleFile.width}×${singleFile.height}`
                    : undefined
                }
                originalFormat={singleFile.name.split(".").pop()}
                outputFormat={(singleFile.outputName || "").split(".").pop()}
              />
              <Button
                variant="default"
                size="lg"
                className="w-full min-h-[48px] bg-[hsl(var(--success))] hover:bg-emerald-600 text-[hsl(var(--success-foreground))] font-semibold touch-manipulation"
                onClick={() => handleDownloadSingle(singleFile.id)}
              >
                <Download className="h-4 w-4" />
                Download Converted Image
              </Button>
            </div>
          )}

          {/* Download batch ZIP */}
          {imageFiles.length > 1 && anyCompleted && (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-[hsl(var(--foreground))]">
                  Batch Conversion Ready
                </span>
                <span className="text-xs text-[hsl(var(--success))] font-medium tabular-nums">
                  {imageFiles.filter((f) => f.status === "done").length} of{" "}
                  {imageFiles.length} ready
                </span>
              </div>
              <Button
                variant="default"
                size="lg"
                className="w-full min-h-[48px] bg-[hsl(var(--success))] hover:bg-emerald-600 text-[hsl(var(--success-foreground))] font-semibold touch-manipulation"
                onClick={handleDownloadZip}
              >
                <Archive className="h-4 w-4" />
                Download All (ZIP)
              </Button>
            </div>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}
