"use client";

import React, { useState } from "react";
import {
  RefreshCw,
  Download,
  Archive,
  ArrowRight,
  Sliders,
  Sparkles,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { FileCard } from "@/components/upload/FileCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/toaster";
import { useFileStore } from "@/stores/fileStore";
import { convertImage } from "@/lib/image/convert";
import { SupportedImageFormat, triggerDownload } from "@/lib/file-utils";
import { downloadAsZip } from "@/lib/zip";

const FORMAT_OPTIONS: { label: string; mime: SupportedImageFormat; ext: string }[] = [
  { label: "JPG / JPEG", mime: "image/jpeg", ext: "jpg" },
  { label: "PNG (Lossless)", mime: "image/png", ext: "png" },
  { label: "WebP (Modern)", mime: "image/webp", ext: "webp" },
];

export default function ConvertImagePage() {
  const { files, addFiles, removeFile, clearFiles, updateStatus, setOutput } = useFileStore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetFormat, setTargetFormat] = useState<SupportedImageFormat>("image/webp");
  const [qualityPct, setQualityPct] = useState<number>(90);
  const [bgColor, setBgColor] = useState<string>("#ffffff");

  const singleFile = files.length === 1 ? files[0] : null;

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
    if (files.length === 0) return;
    setIsProcessing(true);

    let completed = 0;
    for (const f of files) {
      updateStatus(f.id, "processing");
      try {
        const res = await convertImage(f.file, {
          targetFormat,
          quality: qualityPct / 100,
          backgroundColor: bgColor,
        });
        setOutput(f.id, res.blob, res.outputFilename, res.blob.size);
        completed++;
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
    const f = files.find((item) => item.id === id);
    if (!f || !f.outputBlob) return;
    triggerDownload(f.outputBlob, f.outputName || f.name);
  };

  const handleDownloadZip = async () => {
    const ready = files.filter((f) => f.outputBlob);
    if (ready.length === 0) return;
    const entries = ready.map((f) => ({
      filename: f.outputName || f.name,
      blob: f.outputBlob!,
    }));
    await downloadAsZip(entries, "converted_images.zip");
    toast({
      title: "ZIP downloaded",
      description: `Downloaded ${entries.length} converted image(s).`,
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
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
              Convert Image
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Convert single or multiple images between JPG, PNG, and WebP formats instantly.
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
              label="Drop images to convert"
              sublabel="Supports batch conversion across JPG, PNG, and WebP"
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

          {/* Quick info */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-xs text-[hsl(var(--muted-foreground))] space-y-2">
            <h3 className="font-semibold text-sm text-[hsl(var(--foreground))]">Format Guide:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-[hsl(var(--foreground))]">WebP:</strong> Modern web format, 30% smaller than JPG with transparency support.</li>
              <li><strong className="text-[hsl(var(--foreground))]">PNG:</strong> Lossless clarity and full alpha transparency, ideal for logos & graphics.</li>
              <li><strong className="text-[hsl(var(--foreground))]">JPG:</strong> Universal compatibility for photographs across all devices and legacy systems.</li>
            </ul>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-6">
            <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
              Conversion Target
            </h2>

            {/* Target format radio/buttons */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[hsl(var(--foreground))]">Target Format</label>
              <div className="grid grid-cols-1 gap-2">
                {FORMAT_OPTIONS.map((fo) => (
                  <button
                    key={fo.mime}
                    type="button"
                    onClick={() => setTargetFormat(fo.mime)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-colors ${
                      targetFormat === fo.mime
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--foreground))] font-semibold"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary)/0.8)]"
                    }`}
                  >
                    <span>{fo.label}</span>
                    <span className="text-xs font-mono uppercase text-[hsl(var(--primary))]">.{fo.ext}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality for JPG/WebP */}
            {targetFormat !== "image/png" && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[hsl(var(--foreground))]">Export Quality</span>
                  <span className="text-xs font-mono font-bold text-[hsl(var(--primary))]">{qualityPct}%</span>
                </div>
                <Slider
                  value={[qualityPct]}
                  onValueChange={([v]) => setQualityPct(v)}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>
            )}

            {/* Background color for JPG */}
            {targetFormat === "image/jpeg" && (
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-[hsl(var(--foreground))]">
                  Background Color (for transparent areas)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-8 w-12 rounded border border-[hsl(var(--border))] bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-[hsl(var(--muted-foreground))] uppercase">{bgColor}</span>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              disabled={files.length === 0 || isProcessing}
              onClick={handleConvertAll}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  {files.length > 1 ? `Convert All (${files.length})` : "Convert Image"}
                </>
              )}
            </Button>
          </div>

          {/* Download single */}
          {singleFile && singleFile.status === "done" && singleFile.outputBlob && (
            <Button
              variant="default"
              size="lg"
              className="w-full bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"
              onClick={() => handleDownloadSingle(singleFile.id)}
            >
              <Download className="h-4 w-4" />
              Download Converted Image
            </Button>
          )}

          {/* Download batch ZIP */}
          {files.length > 1 && anyCompleted && (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-3">
              <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Batch Conversion Ready
              </span>
              <Button
                variant="default"
                size="lg"
                className="w-full bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"
                onClick={handleDownloadZip}
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
