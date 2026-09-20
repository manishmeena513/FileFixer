"use client";

import React, { useState } from "react";
import {
  Images,
  ArrowUp,
  ArrowDown,
  Trash2,
  Download,
  RefreshCw,
  CheckCircle2,
  FileCheck,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { convertImagesToPdf, ImagesToPdfOptions } from "@/lib/pdf/imagesToPdf";
import { formatBytes, triggerDownload } from "@/lib/file-utils";

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export default function ImagesToPdfPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<ImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState("");

  // Settings
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "auto">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape" | "auto">("auto");
  const [margin, setMargin] = useState<number>(20);

  // Result
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const handleFiles = (files: File[]) => {
    const valid = files.filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) {
      toast({
        title: "Invalid file",
        description: "Please select image files (JPG, PNG, WebP).",
        variant: "error",
      });
      return;
    }
    const newItems = valid.map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    setItems((prev) => [...prev, ...newItems]);
    setResultBlob(null);
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const copy = [...items];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setItems(copy);
    setResultBlob(null);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setResultBlob(null);
  };

  const handleConvert = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    setProgressText("Initializing PDF engine...");

    try {
      const options: ImagesToPdfOptions = {
        pageSize,
        orientation,
        margin,
      };

      const res = await convertImagesToPdf(
        items.map((it) => it.file),
        options,
        (current, total) => {
          setProgressText(`Processing image ${current} of ${total}...`);
        }
      );

      setResultBlob(res.blob);
      toast({
        title: "PDF Created",
        description: `Successfully compiled ${items.length} images into a single PDF.`,
        variant: "success",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Conversion failed",
        description: err.message || "Failed to create PDF from images",
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
      setProgressText("");
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    triggerDownload(resultBlob, "images_document.pdf");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
            <Images className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
              Images to PDF
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Combine photos, document scans, or receipts into a clean PDF with custom page dimensions.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Images list */}
        <div className="space-y-6 lg:col-span-2">
          {items.length === 0 ? (
            <DropZone
              onFiles={handleFiles}
              accept={[".jpg", ".jpeg", ".png", ".webp"]}
              label="Drop images to create a PDF"
              sublabel="Select photos, scans, or screenshots in order"
              className="py-16"
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
                <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  {items.length} Image{items.length > 1 ? "s" : ""} (Pages in Order)
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
                  <Button variant="ghost" size="sm" onClick={() => setItems([])}>
                    Clear All
                  </Button>
                </div>
              </div>

              {/* List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {items.map((it, idx) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-[hsl(var(--secondary))] text-xs font-mono font-bold text-[hsl(var(--primary))]">
                        {idx + 1}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={it.previewUrl}
                        alt={it.file.name}
                        className="h-10 w-10 rounded object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]">
                          {it.file.name}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {formatBytes(it.file.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={idx === 0}
                        onClick={() => moveItem(idx, "up")}
                        className="h-7 w-7"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={idx === items.length - 1}
                        onClick={() => moveItem(idx, "down")}
                        className="h-7 w-7"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(it.id)}
                        className="h-7 w-7 text-[hsl(var(--destructive))] hover:text-red-400"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Options & Output */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-6">
            <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
              PDF Layout Options
            </h2>

            {/* Page Size */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Page Size</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "A4", value: "a4" },
                  { label: "US Letter", value: "letter" },
                  { label: "Auto Fit", value: "auto" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPageSize(opt.value as any)}
                    className={`rounded-lg border py-2 text-xs font-medium transition-colors ${
                      pageSize === opt.value
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orientation */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Orientation</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Auto", value: "auto" },
                  { label: "Portrait", value: "portrait" },
                  { label: "Landscape", value: "landscape" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setOrientation(opt.value as any)}
                    className={`rounded-lg border py-2 text-xs font-medium transition-colors ${
                      orientation === opt.value
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Margin */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Page Margins</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "No Margin", value: 0 },
                  { label: "Small (10pt)", value: 10 },
                  { label: "Normal (20pt)", value: 20 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMargin(opt.value)}
                    className={`rounded-lg border py-2 text-xs font-medium transition-colors ${
                      margin === opt.value
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={items.length === 0 || isProcessing}
              onClick={handleConvert}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  <span>{progressText || "Building PDF..."}</span>
                </>
              ) : (
                <>
                  <Images className="h-4 w-4 mr-2" />
                  Create PDF ({items.length} {items.length === 1 ? "page" : "pages"})
                </>
              )}
            </Button>
          </div>

          {/* Download button */}
          {resultBlob && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4" /> PDF Document Compiled
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Size: {formatBytes(resultBlob.size)} · {items.length} pages
              </p>
              <Button
                size="lg"
                onClick={handleDownload}
                className="w-full bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download images_document.pdf
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
