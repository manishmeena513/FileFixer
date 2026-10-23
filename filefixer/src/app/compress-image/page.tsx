"use client";

import React, { useState, useEffect } from "react";
import {
  Minimize2,
  Download,
  Archive,
  RefreshCw,
  Sliders,
  Target,
  Sparkles,
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
import { triggerDownload } from "@/lib/file-utils";
import { downloadAsZip } from "@/lib/zip";
import { addHistoryRecord } from "@/lib/storage/history";
import { ToolPageShell } from "@/components/ui/ToolPageShell";

export default function CompressImagePage() {
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
  const [mode, setMode] = useState<"recommended" | "targetSize" | "quality">(
    "recommended"
  );
  const [targetSizeMB, setTargetSizeMB] = useState<number>(1.0);
  const [qualityPct, setQualityPct] = useState<number>(80);
  const [selectedCompareId, setSelectedCompareId] = useState<string | null>(null);

  // Filter image files
  const imageFiles = files.filter(
    (f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|avif)$/i.test(f.name)
  );

  const completedFiles = imageFiles.filter(
    (f) => f.status === "done" && f.outputBlob
  );
  const activeFile =
    completedFiles.find((f) => f.id === selectedCompareId) ||
    completedFiles[0] ||
    (imageFiles.length === 1 ? imageFiles[0] : null);

  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(
    null
  );
  const [optimizedPreviewUrl, setOptimizedPreviewUrl] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!activeFile?.file) {
      setOriginalPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(activeFile.file);
    setOriginalPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setOriginalPreviewUrl(null);
    };
  }, [activeFile?.file]);

  useEffect(() => {
    if (!activeFile?.outputBlob) {
      setOptimizedPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(activeFile.outputBlob);
    setOptimizedPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setOptimizedPreviewUrl(null);
    };
  }, [activeFile?.outputBlob]);

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
    if (imageFiles.length === 0) return;
    setIsProcessing(true);

    let completedCount = 0;
    const options: CompressionOptions = {
      mode,
      targetSizeMB: mode === "targetSize" ? targetSizeMB : undefined,
      quality: mode === "quality" ? qualityPct / 100 : undefined,
    };

    for (const f of imageFiles) {
      updateStatus(f.id, "processing");
      try {
        const res = await compressImage(f.file, options);
        setOutput(f.id, res.blob, res.outputName, res.outputSize);
        completedCount++;

        // Push to global download dock as ready
        pushDownload({
          fileName: res.outputName,
          originalSize: f.size,
          outputSize: res.outputSize,
          savingsPct:
            f.size > res.outputSize
              ? ((f.size - res.outputSize) / f.size) * 100
              : 0,
          status: "ready",
          blob: res.blob,
        });

        await addHistoryRecord({
          filename: f.name,
          tool: "Compress Image",
          originalSize: f.size,
          outputSize: res.outputSize,
        });
      } catch (err: any) {
        console.error(err);
        updateStatus(f.id, "error", err.message || "Compression failed");
      }
    }

    setIsProcessing(false);
    toast({
      title: "Compression completed",
      description: `Successfully processed ${completedCount} of ${imageFiles.length} file(s).`,
      variant: "success",
    });
  };

  const handleDownloadSingle = (fileId: string) => {
    const f = imageFiles.find((item) => item.id === fileId);
    if (!f || !f.outputBlob) return;
    const fileName = f.outputName || f.name;
    triggerDownload(f.outputBlob, fileName);

    const outSize = f.outputSize || f.outputBlob.size;
    const savings =
      f.size > outSize ? ((f.size - outSize) / f.size) * 100 : 0;

    const dlItem = {
      fileName,
      originalSize: f.size,
      outputSize: outSize,
      savingsPct: savings,
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

  const handleDownloadAllZip = async () => {
    const readyFiles = imageFiles.filter((f) => f.outputBlob);
    if (readyFiles.length === 0) return;

    const entries = readyFiles.map((f) => ({
      filename: f.outputName || f.name,
      blob: f.outputBlob!,
    }));

    await downloadAsZip(entries, "compressed_images.zip");

    for (const rf of readyFiles) {
      const outSize = rf.outputSize || rf.outputBlob!.size;
      const savings =
        rf.size > outSize ? ((rf.size - outSize) / rf.size) * 100 : 0;
      pushDownload({
        fileName: rf.outputName || rf.name,
        originalSize: rf.size,
        outputSize: outSize,
        savingsPct: savings,
        status: "downloaded",
        blob: rf.outputBlob!,
      });
    }

    triggerSupportPrompt();
    toast({
      title: "ZIP downloaded",
      description: `Downloaded ${entries.length} compressed image(s).`,
      variant: "success",
    });
  };

  const anyCompleted = imageFiles.some((f) => f.status === "done");

  return (
    <ToolPageShell
      icon={Minimize2}
      title="Compress Image"
      description="Reduce JPG, PNG, and WebP file size locally without sacrificing visual quality."
      formats={["JPG", "PNG", "WEBP"]}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left column: Upload & Files */}
        <div className="space-y-6 lg:col-span-2">
          {imageFiles.length === 0 ? (
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
                      input.onchange = (e: any) => {
                        handleFiles(Array.from(e.target.files || []));
                      };
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

          {/* Visual comparison slider when images are ready */}
          {completedFiles.length > 0 && originalPreviewUrl && optimizedPreviewUrl && (
            <div className="mt-8 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  Visual Quality Comparison
                </h3>
                {completedFiles.length > 1 && (
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    Select an image to preview
                  </span>
                )}
              </div>

              {completedFiles.length > 1 && (
                <div className="flex flex-wrap gap-2 pb-1">
                  {completedFiles.map((cf) => (
                    <button
                      key={cf.id}
                      type="button"
                      onClick={() => setSelectedCompareId(cf.id)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium border transition-colors touch-manipulation tabular-nums ${
                        activeFile?.id === cf.id
                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                          : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.8)]"
                      }`}
                    >
                      <span className="truncate max-w-[140px] inline-block align-middle">
                        {cf.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="h-72 sm:h-80 w-full rounded-xl border border-[hsl(var(--border))] bg-black/40 overflow-hidden">
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
              <TabsList className="grid w-full grid-cols-3 min-h-[44px]">
                <TabsTrigger value="recommended" className="text-xs min-h-[38px]">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Auto
                </TabsTrigger>
                <TabsTrigger value="targetSize" className="text-xs min-h-[38px]">
                  <Target className="h-3 w-3 mr-1" />
                  Target
                </TabsTrigger>
                <TabsTrigger value="quality" className="text-xs min-h-[38px]">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: "Under 100 KB", value: 0.1 },
                    { label: "Under 250 KB", value: 0.25 },
                    { label: "Under 500 KB", value: 0.5 },
                    { label: "Under 1 MB", value: 1.0 },
                    { label: "Under 2 MB", value: 2.0 },
                    { label: "Under 5 MB", value: 5.0 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setTargetSizeMB(preset.value)}
                      className={`min-h-[44px] rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors touch-manipulation tabular-nums ${
                        targetSizeMB === preset.value
                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                          : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.8)]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-[hsl(var(--border))]">
                  <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1.5">
                    Custom Target (MB)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0.05}
                      max={50}
                      step={0.05}
                      value={targetSizeMB}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) setTargetSizeMB(val);
                      }}
                      className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 text-xs font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    />
                    <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                      MB
                    </span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="quality" className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[hsl(var(--foreground))]">
                    Quality Level
                  </span>
                  <span className="text-xs font-mono font-bold text-[hsl(var(--primary))] tabular-nums">
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
                <div className="flex justify-between text-[10px] text-[hsl(var(--muted-foreground))] tabular-nums">
                  <span>Smaller File (10%)</span>
                  <span>Highest Quality (100%)</span>
                </div>
              </TabsContent>
            </Tabs>

            <Button
              className="w-full min-h-[48px] touch-manipulation"
              size="lg"
              disabled={imageFiles.length === 0 || isProcessing}
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
                  <span className="tabular-nums">
                    {imageFiles.length > 1
                      ? `Compress All (${imageFiles.length})`
                      : "Compress Image"}
                  </span>
                </>
              )}
            </Button>
          </div>

          {/* Results summary */}
          {activeFile && activeFile.outputSize && activeFile.status === "done" && (
            <div className="space-y-3">
              <BeforeAfterStats
                originalSize={activeFile.size}
                outputSize={activeFile.outputSize}
                originalDimensions={
                  activeFile.width && activeFile.height
                    ? `${activeFile.width}×${activeFile.height}`
                    : undefined
                }
                outputDimensions={
                  activeFile.width && activeFile.height
                    ? `${activeFile.width}×${activeFile.height}`
                    : undefined
                }
                originalFormat={activeFile.name.split(".").pop()}
                outputFormat={
                  (activeFile.outputName || activeFile.name).split(".").pop()
                }
              />
              <Button
                variant="default"
                size="lg"
                className="w-full min-h-[48px] bg-[hsl(var(--success))] hover:bg-emerald-600 text-[hsl(var(--success-foreground))] font-semibold touch-manipulation"
                onClick={() => handleDownloadSingle(activeFile.id)}
              >
                <Download className="h-4 w-4" />
                Download Compressed Image
              </Button>
            </div>
          )}

          {/* Batch download if multiple files */}
          {imageFiles.length > 1 && anyCompleted && (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-[hsl(var(--foreground))]">
                  Batch Results
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
                onClick={handleDownloadAllZip}
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
