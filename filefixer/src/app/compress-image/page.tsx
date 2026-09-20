"use client";

import React, { useState, useTransition } from "react";
import {
  Minimize2,
  Download,
  Archive,
  RefreshCw,
  Sliders,
  Target,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { FileCard } from "@/components/upload/FileCard";
import { BeforeAfterStats, CompareSlider } from "@/components/results/BeforeAfter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/toaster";
import { useFileStore } from "@/stores/fileStore";
import { compressImage, CompressionOptions } from "@/lib/image/compress";
import { triggerDownload, createObjectURL } from "@/lib/file-utils";
import { downloadAsZip } from "@/lib/zip";

export default function CompressImagePage() {
  const { files, addFiles, removeFile, clearFiles, updateStatus, setOutput } = useFileStore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<"recommended" | "targetSize" | "quality">("recommended");
  const [targetSizeMB, setTargetSizeMB] = useState<number>(1.0);
  const [qualityPct, setQualityPct] = useState<number>(80);

  // Single file preview state
  const singleFile = files.length === 1 ? files[0] : null;
  const originalPreviewUrl = singleFile ? createObjectURL(singleFile.file) : null;
  const optimizedPreviewUrl = singleFile?.outputBlob ? createObjectURL(singleFile.outputBlob) : null;

  const handleFiles = (newFiles: File[]) => {
    const validImages = newFiles.filter((f) => f.type.startsWith("image/"));
    if (validImages.length === 0) {
      toast({
        title: "Invalid file format",
        description: "Please select JPG, PNG, or WebP images.",
        variant: "error",
      });
      return;
    }
    addFiles(validImages);
  };

  const handleProcessAll = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    let completedCount = 0;
    const options: CompressionOptions = {
      mode,
      targetSizeMB: mode === "targetSize" ? targetSizeMB : undefined,
      quality: mode === "quality" ? qualityPct / 100 : undefined,
    };

    for (const f of files) {
      updateStatus(f.id, "processing");
      try {
        const res = await compressImage(f.file, options);
        setOutput(f.id, res.blob, res.outputName, res.outputSize);
        completedCount++;
      } catch (err: any) {
        console.error(err);
        updateStatus(f.id, "error", err.message || "Compression failed");
      }
    }

    setIsProcessing(false);
    toast({
      title: "Compression completed",
      description: `Successfully processed ${completedCount} of ${files.length} file(s).`,
      variant: "success",
    });
  };

  const handleDownloadSingle = (fileId: string) => {
    const f = files.find((item) => item.id === fileId);
    if (!f || !f.outputBlob) return;
    triggerDownload(f.outputBlob, f.outputName || f.name);
  };

  const handleDownloadAllZip = async () => {
    const readyFiles = files.filter((f) => f.outputBlob);
    if (readyFiles.length === 0) return;

    const entries = readyFiles.map((f) => ({
      filename: f.outputName || f.name,
      blob: f.outputBlob!,
    }));

    await downloadAsZip(entries, "compressed_images.zip");
    toast({
      title: "ZIP downloaded",
      description: `Downloaded ${entries.length} compressed image(s).`,
      variant: "success",
    });
  };

  const allCompleted = files.length > 0 && files.every((f) => f.status === "done");
  const anyCompleted = files.some((f) => f.status === "done");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
            <Minimize2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
              Compress Image
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Reduce JPG, PNG, and WebP file size locally without sacrificing visual quality.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left column: Upload & Files */}
        <div className="space-y-6 lg:col-span-2">
          {files.length === 0 ? (
            <DropZone
              onFiles={handleFiles}
              accept={[".jpg", ".jpeg", ".png", ".webp"]}
              label="Drop your images here"
              sublabel="Supports single or batch compression for JPG, PNG, and WebP"
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
                      input.onchange = (e: any) => {
                        handleFiles(Array.from(e.target.files || []));
                      };
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

          {/* Draggable slider comparison for single file when ready */}
          {singleFile && singleFile.status === "done" && originalPreviewUrl && optimizedPreviewUrl && (
            <div className="mt-8 space-y-3">
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Visual Quality Comparison
              </h3>
              <div className="h-72 w-full rounded-xl border border-[hsl(var(--border))] bg-black/40 overflow-hidden">
                <CompareSlider
                  originalUrl={originalPreviewUrl}
                  outputUrl={optimizedPreviewUrl}
                  className="h-full w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right column: Controls & Results */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-6">
            <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
              Compression Settings
            </h2>

            <Tabs
              value={mode}
              onValueChange={(val: any) => setMode(val)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="recommended" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Auto
                </TabsTrigger>
                <TabsTrigger value="targetSize" className="text-xs">
                  <Target className="h-3 w-3 mr-1" />
                  Target
                </TabsTrigger>
                <TabsTrigger value="quality" className="text-xs">
                  <Sliders className="h-3 w-3 mr-1" />
                  Quality
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recommended" className="space-y-3 pt-2">
                <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                  Automatically calculates optimal balance between maximum file size reduction and high visual clarity.
                </p>
                <div className="rounded-lg bg-[hsl(var(--secondary))] p-3 text-xs text-[hsl(var(--secondary-foreground))]">
                  ✓ Recommended for web upload & general sharing
                </div>
              </TabsContent>

              <TabsContent value="targetSize" className="space-y-4 pt-2">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Choose a maximum output target size:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Under 250 KB", value: 0.25 },
                    { label: "Under 500 KB", value: 0.5 },
                    { label: "Under 1 MB", value: 1.0 },
                    { label: "Under 2 MB", value: 2.0 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setTargetSizeMB(preset.value)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        targetSizeMB === preset.value
                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                          : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.8)]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="quality" className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[hsl(var(--foreground))]">
                    Quality Level
                  </span>
                  <span className="text-xs font-mono font-bold text-[hsl(var(--primary))]">
                    {qualityPct}%
                  </span>
                </div>
                <Slider
                  value={[qualityPct]}
                  onValueChange={([val]) => setQualityPct(val)}
                  min={10}
                  max={100}
                  step={5}
                />
                <div className="flex justify-between text-[10px] text-[hsl(var(--muted-foreground))]">
                  <span>Smaller File (10%)</span>
                  <span>Highest Quality (100%)</span>
                </div>
              </TabsContent>
            </Tabs>

            <Button
              className="w-full"
              size="lg"
              disabled={files.length === 0 || isProcessing}
              onClick={handleProcessAll}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Compressing in Browser...
                </>
              ) : (
                <>
                  <Minimize2 className="h-4 w-4" />
                  {files.length > 1 ? `Compress All (${files.length})` : "Compress Image"}
                </>
              )}
            </Button>
          </div>

          {/* Results summary */}
          {singleFile && singleFile.outputSize && singleFile.status === "done" && (
            <div className="space-y-3">
              <BeforeAfterStats
                originalSize={singleFile.size}
                outputSize={singleFile.outputSize}
              />
              <Button
                variant="default"
                size="lg"
                className="w-full bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"
                onClick={() => handleDownloadSingle(singleFile.id)}
              >
                <Download className="h-4 w-4" />
                Download Compressed Image
              </Button>
            </div>
          )}

          {/* Batch download if multiple files */}
          {files.length > 1 && anyCompleted && (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-[hsl(var(--foreground))]">Batch Results</span>
                <span className="text-xs text-[hsl(var(--success))] font-medium">
                  {files.filter((f) => f.status === "done").length} of {files.length} ready
                </span>
              </div>
              <Button
                variant="default"
                size="lg"
                className="w-full bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"
                onClick={handleDownloadAllZip}
              >
                <Archive className="h-4 w-4" />
                Download All (ZIP)
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
