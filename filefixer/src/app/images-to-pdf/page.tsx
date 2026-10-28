"use client";

import React, { useState, useEffect } from "react";
import {
  Images,
  ArrowUp,
  ArrowDown,
  Trash2,
  Download,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { convertImagesToPdf, ImagesToPdfOptions } from "@/lib/pdf/imagesToPdf";
import { formatBytes, triggerDownload } from "@/lib/file-utils";
import { useFileStore } from "@/stores/fileStore";
import { addHistoryRecord } from "@/lib/storage/history";
import { ToolPageShell } from "@/components/ui/ToolPageShell";

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export default function ImagesToPdfPage() {
  const { toast } = useToast();
  const {
    files: storeFiles,
    addFiles: addStoreFiles,
    pushDownload,
    setLatestDeliveredFile,
    triggerSupportPrompt,
  } = useFileStore();
  const [items, setItems] = useState<ImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState("");

  // Settings
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "auto">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape" | "auto">("auto");
  const [margin, setMargin] = useState<number>(20);

  // Result
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (items.length === 0 && storeFiles.length > 0) {
      const imgs = storeFiles.filter((f) => f.type.startsWith("image/"));
      if (imgs.length > 0) {
        setItems(
          imgs.map((img) => ({
            id: `${Date.now()}-${Math.random()}`,
            file: img.file,
            previewUrl: URL.createObjectURL(img.file),
          }))
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    addStoreFiles(valid);
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
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
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

      const origTotal = items.reduce((acc, it) => acc + it.file.size, 0);
      const res = await convertImagesToPdf(
        items.map((it) => it.file),
        options,
        (current, total) => {
          setProgressText(`Processing image ${current} of ${total}...`);
        }
      );

      setResultBlob(res.blob);

      // Register in Download Dock as ready
      pushDownload({
        fileName: res.outputFilename,
        originalSize: origTotal,
        outputSize: res.blob.size,
        savingsPct: 0,
        status: "ready",
        blob: res.blob,
      });

      await addHistoryRecord({
        filename: `Images to PDF (${items.length} pages)`,
        tool: "Images to PDF",
        originalSize: origTotal,
        outputSize: res.blob.size,
      });

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
    const fileName = "images_document.pdf";
    triggerDownload(resultBlob, fileName);

    const origTotal = items.reduce((acc, it) => acc + it.file.size, 0);
    const dlItem = {
      fileName,
      originalSize: origTotal,
      outputSize: resultBlob.size,
      savingsPct: 0,
      status: "downloaded" as const,
      blob: resultBlob,
    };
    pushDownload(dlItem);
    setLatestDeliveredFile({
      id: `deliv-${Date.now()}`,
      ...dlItem,
      timestamp: Date.now(),
    });
    triggerSupportPrompt();
  };

  return (
    <ToolPageShell
      icon={Images}
      title="Images to PDF"
      description="Combine photos, document scans, or receipts into a clean PDF with custom page dimensions."
      formats={["JPG", "PNG", "WEBP"]}
    >
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
                  <span className="tabular-nums font-bold text-[hsl(var(--foreground))]">
                    {items.length}
                  </span>{" "}
                  Image{items.length > 1 ? "s" : ""} (Pages in Order)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-[44px] px-3 py-2 text-xs font-medium touch-manipulation"
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
                    className="min-h-[44px] px-3 py-2 text-xs font-medium touch-manipulation"
                    onClick={() => setItems([])}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {/* List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {items.map((it, idx) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] backdrop-blur-md p-2.5 shadow-sm hover:border-[var(--glass-border-luminous)] transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-surface)] text-xs font-mono font-bold text-[hsl(var(--primary))] tabular-nums">
                        {idx + 1}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={it.previewUrl}
                        alt={it.file.name}
                        className="h-10 w-10 rounded-lg object-cover flex-shrink-0 border border-[var(--glass-border)]"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]">
                          {it.file.name}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono tabular-nums">
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
                        className="min-h-[44px] min-w-[44px] h-11 w-11 touch-manipulation flex items-center justify-center"
                        title="Move Up"
                        aria-label={`Move image ${idx + 1} up`}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={idx === items.length - 1}
                        onClick={() => moveItem(idx, "down")}
                        className="min-h-[44px] min-w-[44px] h-11 w-11 touch-manipulation flex items-center justify-center"
                        title="Move Down"
                        aria-label={`Move image ${idx + 1} down`}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(it.id)}
                        className="min-h-[44px] min-w-[44px] h-11 w-11 touch-manipulation flex items-center justify-center text-[hsl(var(--destructive))] hover:text-red-400"
                        title="Remove"
                        aria-label={`Remove image ${idx + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
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
          <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-xl p-5 sm:p-6 space-y-6 shadow-xl">
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
                    className={`min-h-[44px] px-2 py-2 rounded-xl border text-xs font-medium transition-all touch-manipulation flex items-center justify-center ${
                      pageSize === opt.value
                        ? "border-blue-400/50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                        : "border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] text-[hsl(var(--muted-foreground))] hover:border-[var(--glass-border-luminous)]"
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
                    className={`min-h-[44px] px-2 py-2 rounded-xl border text-xs font-medium transition-all touch-manipulation flex items-center justify-center ${
                      orientation === opt.value
                        ? "border-blue-400/50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                        : "border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] text-[hsl(var(--muted-foreground))] hover:border-[var(--glass-border-luminous)]"
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
                    className={`min-h-[44px] px-2 py-2 rounded-xl border text-xs font-medium transition-all touch-manipulation flex items-center justify-center ${
                      margin === opt.value
                        ? "border-blue-400/50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                        : "border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] text-[hsl(var(--muted-foreground))] hover:border-[var(--glass-border-luminous)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full min-h-[44px] touch-manipulation font-semibold"
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
                  Create PDF (<span className="tabular-nums ml-1 mr-1">{items.length}</span>{" "}
                  {items.length === 1 ? "page" : "pages"})
                </>
              )}
            </Button>
          </div>

          {/* Download button */}
          {resultBlob && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md p-5 space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4" /> PDF Document Compiled
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Size:{" "}
                <span className="tabular-nums font-medium text-[hsl(var(--foreground))]">
                  {formatBytes(resultBlob.size)}
                </span>{" "}
                ·{" "}
                <span className="tabular-nums font-medium text-[hsl(var(--foreground))]">
                  {items.length}
                </span>{" "}
                pages
              </p>
              <Button
                size="lg"
                onClick={handleDownload}
                className="w-full min-h-[44px] touch-manipulation bg-[hsl(var(--success))] hover:bg-emerald-600 text-[hsl(var(--success-foreground))] font-semibold"
              >
                <Download className="h-4 w-4 mr-2" />
                Download images_document.pdf
              </Button>
            </div>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}
