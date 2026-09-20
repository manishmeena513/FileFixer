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
import { Badge } from "@/components/ui/badge";
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

export default function PdfSplitPage() {
  const { toast } = useToast();
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
    const pdf = files.find((f) => f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf");
    if (!pdf) {
      toast({
        title: "Invalid file",
        description: "Please select a PDF document.",
        variant: "error",
      });
      return;
    }
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
        pageIndices = Array.from(selectedPageNumbers).map((n) => n - 1).sort((a, b) => a - b);
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

  const handleSplitAllToZip = async () => {
    if (!selectedFile || totalPages === 0) return;
    setIsProcessing(true);

    try {
      const parts = await splitAllPages(selectedFile);
      await downloadAsZip(parts, `${selectedFile.name.replace(/\.[^/.]+$/, "")}_all_pages.zip`);
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
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
            <Scissors className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
              Split & Extract PDF
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Extract page ranges, pick individual pages, or split every page into separate files.
            </p>
          </div>
        </div>
      </div>

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
          <div className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {formatBytes(selectedFile.size)} · {totalPages > 0 ? `${totalPages} Pages` : "Loading pages..."}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
              Change File
            </Button>
          </div>

          {/* Mode Selector */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-6">
            <Tabs value={mode} onValueChange={(v: any) => setMode(v)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="range" className="text-xs">
                  <ListFilter className="h-3.5 w-3.5 mr-1.5" />
                  By Page Range
                </TabsTrigger>
                <TabsTrigger value="interactive" className="text-xs">
                  <Layers className="h-3.5 w-3.5 mr-1.5" />
                  Select Pages
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs">
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
                    className="mt-1.5 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 py-2 text-sm font-mono text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  />
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    Example: <code className="text-[hsl(var(--primary))]">1-5</code> or{" "}
                    <code className="text-[hsl(var(--primary))]">2, 4, 7-9</code> (Total: {totalPages} pages)
                  </p>
                </div>

                <Button
                  size="lg"
                  disabled={isProcessing || totalPages === 0}
                  onClick={handleExtractRangeOrSelected}
                  className="w-full"
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
                    {selectedPageNumbers.size} of {totalPages} pages selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllPages}
                      className="text-[hsl(var(--primary))] hover:underline"
                    >
                      Select All
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={deselectAllPages}
                      className="text-[hsl(var(--muted-foreground))] hover:underline"
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
                        className={`flex flex-col items-center justify-center rounded-lg border p-3 text-xs font-mono transition-colors ${
                          isSelected
                            ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] font-bold shadow-sm"
                            : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary)/0.8)]"
                        }`}
                      >
                        <FileText className="h-5 w-5 mb-1" />
                        <span>p. {num}</span>
                      </button>
                    );
                  })}
                </div>

                <Button
                  size="lg"
                  disabled={isProcessing || selectedPageNumbers.size === 0}
                  onClick={handleExtractRangeOrSelected}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Extracting Selected Pages...
                    </>
                  ) : (
                    <>
                      <Scissors className="h-4 w-4 mr-2" />
                      Extract {selectedPageNumbers.size} Page(s) to PDF
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* Mode C: Split All to individual PDFs */}
              <TabsContent value="all" className="space-y-4 pt-4">
                <div className="rounded-lg bg-[hsl(var(--secondary))] p-4 text-xs text-[hsl(var(--secondary-foreground))] leading-relaxed">
                  Breaks each of the <strong>{totalPages}</strong> pages in this PDF into its own separate single-page document and bundles them into a ZIP file.
                </div>
                <Button
                  size="lg"
                  disabled={isProcessing || totalPages === 0}
                  onClick={handleSplitAllToZip}
                  className="w-full bg-[hsl(var(--primary))]"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Splitting All Pages...
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4 mr-2" />
                      Split All to ZIP ({totalPages} files)
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          {/* Download card */}
          {extractedResult && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm text-[hsl(var(--foreground))]">
                    Extracted PDF Document Ready
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {extractedResult.name} · {formatBytes(extractedResult.blob.size)}
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => triggerDownload(extractedResult.blob, extractedResult.name)}
                className="w-full sm:w-auto bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Extracted PDF
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
