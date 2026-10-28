"use client";

import React, { useState, useEffect } from "react";
import {
  Scissors,
  Download,
  Archive,
  RefreshCw,
  FileText,
  CheckCircle2,
  ListFilter,
  Layers,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toaster";
import {
  getPdfPageCount,
  parsePageSelection,
  extractPages,
  splitAllPages,
} from "@/lib/pdf/split";
import { formatBytes, triggerDownload } from "@/lib/file-utils";
import { downloadAsZip } from "@/lib/zip";
import { useFileStore } from "@/stores/fileStore";
import { addHistoryRecord } from "@/lib/storage/history";
import { ToolPageShell } from "@/components/ui/ToolPageShell";

export default function PdfSplitPage() {
  const { toast } = useToast();
  const {
    files: storeFiles,
    addFiles: addStoreFiles,
    pushDownload,
    setLatestDeliveredFile,
    triggerSupportPrompt,
  } = useFileStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modes: "range" | "interactive" | "all"
  const [mode, setMode] = useState<"range" | "interactive" | "all">("range");
  const [rangeInput, setRangeInput] = useState<string>("1-2");
  const [selectedPageNumbers, setSelectedPageNumbers] = useState<Set<number>>(new Set());

  // Result states
  const [extractedResult, setExtractedResult] = useState<{ blob: Blob; name: string } | null>(null);

  useEffect(() => {
    if (!selectedFile && storeFiles.length > 0) {
      const firstPdf = storeFiles.find(
        (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
      );
      if (firstPdf) setSelectedFile(firstPdf.file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setTotalPages(0);
      setExtractedResult(null);
      return;
    }

    setIsLoadingDoc(true);
    getPdfPageCount(selectedFile)
      .then((count) => {
        setTotalPages(count);
        setRangeInput(count > 1 ? `1-${Math.min(count, 3)}` : "1");
        // default select first page
        setSelectedPageNumbers(new Set([1]));
      })
      .catch((err) => {
        console.error(err);
        toast({
          title: "PDF Error",
          description: "Could not read page information from this PDF.",
          variant: "error",
        });
      })
      .finally(() => setIsLoadingDoc(false));
  }, [selectedFile, toast]);

  const handleFiles = (files: File[]) => {
    const pdf = files.find(
      (f) => f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf"
    );
    if (!pdf) {
      toast({
        title: "Invalid file",
        description: "Please select a PDF document.",
        variant: "error",
      });
      return;
    }
    addStoreFiles([pdf]);
    setSelectedFile(pdf);
  };

  const togglePageSelection = (pageNum: number) => {
    setSelectedPageNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      return next;
    });
  };

  const selectAllPages = () => {
    const all = new Set<number>();
    for (let i = 1; i <= totalPages; i++) all.add(i);
    setSelectedPageNumbers(all);
  };

  const deselectAllPages = () => {
    setSelectedPageNumbers(new Set());
  };

  const handleExtractRangeOrSelected = async () => {
    if (!selectedFile || totalPages === 0) return;
    setIsProcessing(true);

    try {
      let pageIndices: number[] = [];

      if (mode === "range") {
        pageIndices = parsePageSelection(rangeInput, totalPages);
      } else if (mode === "interactive") {
        pageIndices = Array.from(selectedPageNumbers)
          .map((n) => n - 1)
          .sort((a, b) => a - b);
      }

      if (pageIndices.length === 0) {
        toast({
          title: "No pages selected",
          description: "Please specify valid pages to extract.",
          variant: "error",
        });
        setIsProcessing(false);
        return;
      }

      const res = await extractPages(selectedFile, pageIndices);
      setExtractedResult({ blob: res.blob, name: res.outputFilename });

      // Enqueue to Download Dock as ready
      pushDownload({
        fileName: res.outputFilename,
        originalSize: selectedFile.size,
        outputSize: res.blob.size,
        savingsPct: 0,
        status: "ready",
        blob: res.blob,
      });

      await addHistoryRecord({
        filename: selectedFile.name,
        tool: `Split PDF (${pageIndices.length} pages)`,
        originalSize: selectedFile.size,
        outputSize: res.blob.size,
      });

      toast({
        title: "Extraction complete",
        description: `Extracted ${pageIndices.length} page(s) successfully.`,
        variant: "success",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Extraction failed",
        description: err.message || "Failed to split PDF",
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadExtracted = () => {
    if (!extractedResult || !selectedFile) return;
    triggerDownload(extractedResult.blob, extractedResult.name);

    const dlItem = {
      fileName: extractedResult.name,
      originalSize: selectedFile.size,
      outputSize: extractedResult.blob.size,
      savingsPct: 0,
      status: "downloaded" as const,
      blob: extractedResult.blob,
    };
    pushDownload(dlItem);
    setLatestDeliveredFile({
      id: `deliv-${Date.now()}`,
      ...dlItem,
      timestamp: Date.now(),
    });
    triggerSupportPrompt();
  };

  const handleSplitAllToZip = async () => {
    if (!selectedFile || totalPages === 0) return;
    setIsProcessing(true);

    try {
      const parts = await splitAllPages(selectedFile);
      const totalOut = parts.reduce((acc, p) => acc + p.blob.size, 0);
      const zipName = `${selectedFile.name.replace(/\.[^/.]+$/, "")}_all_pages.zip`;
      await downloadAsZip(parts, zipName);

      await addHistoryRecord({
        filename: selectedFile.name,
        tool: `Split PDF All (${parts.length} pages)`,
        originalSize: selectedFile.size,
        outputSize: totalOut,
      });

      const dlItem = {
        fileName: zipName,
        originalSize: selectedFile.size,
        outputSize: totalOut,
        savingsPct: 0,
        status: "downloaded" as const,
      };
      pushDownload(dlItem);
      setLatestDeliveredFile({
        id: `deliv-${Date.now()}`,
        ...dlItem,
        timestamp: Date.now(),
      });
      triggerSupportPrompt();

      toast({
        title: "Split all complete",
        description: `Downloaded ZIP with ${parts.length} separate single-page PDFs.`,
        variant: "success",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Split all failed",
        description: err.message || "Failed to split pages into ZIP",
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolPageShell
      icon={Scissors}
      title="Split & Extract PDF"
      description="Extract page ranges, pick individual pages, or split every page into separate files."
      formats={["PDF"]}
    >
      {!selectedFile ? (
        <DropZone
          onFiles={handleFiles}
          accept={[".pdf"]}
          multiple={false}
          label="Drop a PDF document here to split"
          sublabel="Extract custom pages or break into individual single-page documents"
          className="py-16"
        />
      ) : (
        <div className="space-y-6">
          {/* File summary */}
          <div className="flex items-center justify-between rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-xl p-4 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] text-[hsl(var(--primary))] shadow-sm">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
                  <span className="tabular-nums">{formatBytes(selectedFile.size)}</span> ·{" "}
                  {totalPages > 0 ? (
                    <>
                      <span className="tabular-nums">{totalPages}</span> Pages
                    </>
                  ) : (
                    "Loading pages..."
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] px-3 py-2 text-xs font-medium touch-manipulation"
              onClick={() => setSelectedFile(null)}
            >
              Change File
            </Button>
          </div>

          {/* Mode Selector */}
          <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-xl p-5 sm:p-6 space-y-6 shadow-xl">
            <Tabs value={mode} onValueChange={(v: any) => setMode(v)}>
              <TabsList className="grid w-full grid-cols-3 min-h-[48px] p-1">
                <TabsTrigger
                  value="range"
                  className="min-h-[44px] text-xs font-medium touch-manipulation"
                >
                  <ListFilter className="h-3.5 w-3.5 mr-1.5" />
                  By Page Range
                </TabsTrigger>
                <TabsTrigger
                  value="interactive"
                  className="min-h-[44px] text-xs font-medium touch-manipulation"
                >
                  <Layers className="h-3.5 w-3.5 mr-1.5" />
                  Select Pages
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="min-h-[44px] text-xs font-medium touch-manipulation"
                >
                  <Archive className="h-3.5 w-3.5 mr-1.5" />
                  Split All to ZIP
                </TabsTrigger>
              </TabsList>

              {/* Mode A: Range */}
              <TabsContent value="range" className="space-y-4 pt-4">
                <div>
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                    Page Ranges or Numbers
                  </label>
                  <input
                    type="text"
                    value={rangeInput}
                    onChange={(e) => setRangeInput(e.target.value)}
                    placeholder="e.g. 1-3, 5, 8-10"
                    className="mt-1.5 w-full min-h-[44px] rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] px-3 py-2 text-sm font-mono text-[hsl(var(--foreground))] focus:outline-none focus:border-[var(--glass-border-luminous)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.3)]"
                  />
                  <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                    Example: <code className="text-[hsl(var(--primary))] font-mono">1-5</code> or{" "}
                    <code className="text-[hsl(var(--primary))] font-mono">2, 4, 7-9</code> (Total:{" "}
                    <span className="tabular-nums font-mono font-medium text-[hsl(var(--foreground))]">{totalPages}</span> pages)
                  </p>
                </div>

                <Button
                  size="lg"
                  disabled={isProcessing || totalPages === 0}
                  onClick={handleExtractRangeOrSelected}
                  className="w-full min-h-[44px] touch-manipulation font-semibold"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Extracting Pages...
                    </>
                  ) : (
                    <>
                      <Scissors className="h-4 w-4 mr-2" />
                      Extract Selected Range
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* Mode B: Visual Selector */}
              <TabsContent value="interactive" className="space-y-4 pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[hsl(var(--muted-foreground))]">
                    <span className="tabular-nums font-semibold text-[hsl(var(--foreground))]">
                      {selectedPageNumbers.size}
                    </span>{" "}
                    of{" "}
                    <span className="tabular-nums font-semibold text-[hsl(var(--foreground))]">
                      {totalPages}
                    </span>{" "}
                    pages selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllPages}
                      className="min-h-[44px] px-3 py-2 text-xs font-medium inline-flex items-center text-[hsl(var(--primary))] hover:underline touch-manipulation"
                    >
                      Select All
                    </button>
                    <span className="text-[hsl(var(--border))]">·</span>
                    <button
                      type="button"
                      onClick={deselectAllPages}
                      className="min-h-[44px] px-3 py-2 text-xs font-medium inline-flex items-center text-[hsl(var(--muted-foreground))] hover:underline touch-manipulation"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {/* Grid of pages */}
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 max-h-64 overflow-y-auto p-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
                    const isSelected = selectedPageNumbers.has(num);
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => togglePageSelection(num)}
                        className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-mono transition-all min-h-[44px] min-w-[44px] touch-manipulation ${
                          isSelected
                            ? "border-blue-400/50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/25"
                            : "border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] text-[hsl(var(--muted-foreground))] hover:border-[var(--glass-border-luminous)] hover:text-[hsl(var(--foreground))]"
                        }`}
                        aria-pressed={isSelected}
                        aria-label={`Page ${num}`}
                      >
                        <FileText className={`h-5 w-5 mb-1 ${isSelected ? "text-white" : "text-[hsl(var(--muted-foreground))]"}`} />
                        <span className="tabular-nums">p. {num}</span>
                      </button>
                    );
                  })}
                </div>

                <Button
                  size="lg"
                  disabled={isProcessing || selectedPageNumbers.size === 0}
                  onClick={handleExtractRangeOrSelected}
                  className="w-full min-h-[44px] touch-manipulation font-semibold"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Extracting Selected Pages...
                    </>
                  ) : (
                    <>
                      <Scissors className="h-4 w-4 mr-2" />
                      Extract <span className="tabular-nums ml-1 mr-1">{selectedPageNumbers.size}</span> Page(s) to PDF
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* Mode C: Split All to individual PDFs */}
              <TabsContent value="all" className="space-y-4 pt-4">
                <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] p-4 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                  Breaks each of the{" "}
                  <strong className="text-[hsl(var(--foreground))]">
                    <span className="tabular-nums font-mono">{totalPages}</span>
                  </strong>{" "}
                  pages in this PDF into its own separate single-page document and bundles them into a ZIP file.
                </div>
                <Button
                  size="lg"
                  disabled={isProcessing || totalPages === 0}
                  onClick={handleSplitAllToZip}
                  className="w-full min-h-[44px] touch-manipulation bg-[hsl(var(--primary))] font-semibold"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Splitting All Pages...
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4 mr-2" />
                      Split All to ZIP (<span className="tabular-nums font-mono">{totalPages}</span> files)
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          {/* Download card */}
          {extractedResult && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm text-[hsl(var(--foreground))]">
                    Extracted PDF Document Ready
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {extractedResult.name} ·{" "}
                    <span className="tabular-nums font-medium text-[hsl(var(--foreground))]">
                      {formatBytes(extractedResult.blob.size)}
                    </span>
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                onClick={handleDownloadExtracted}
                className="w-full sm:w-auto min-h-[44px] touch-manipulation bg-[hsl(var(--success))] hover:bg-emerald-600 text-[hsl(var(--success-foreground))] font-semibold"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Extracted PDF
              </Button>
            </div>
          )}
        </div>
      )}
    </ToolPageShell>
  );
}
