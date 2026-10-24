"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  ShieldCheck,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Download,
  Lock,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { ToolPageShell } from "@/components/ui/ToolPageShell";
import { useFileStore } from "@/stores/fileStore";
import { useToast } from "@/components/ui/toaster";
import { stripImageMetadata } from "@/lib/image/metadata";
import { compressPDF } from "@/lib/pdf/compress";
import { inspectFile, FileMetadata } from "@/lib/inspect";
import { formatBytes, triggerDownload } from "@/lib/file-utils";
import { addHistoryRecord } from "@/lib/storage/history";

function generateDelivId() {
  return `deliv-${Date.now()}`;
}

function getTimestamp() {
  return Date.now();
}

export default function PrivacyCleanerPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    files: storeFiles,
    addFiles,
    pushDownload,
    setLatestDeliveredFile,
    triggerSupportPrompt,
  } = useFileStore();

  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanBlob, setCleanBlob] = useState<Blob | null>(null);
  const [cleanName, setCleanName] = useState<string>("");

  const handleSelectFile = async (file: File) => {
    setActiveFile(file);
    setIsScanning(true);
    setCleanBlob(null);

    try {
      const meta = await inspectFile(file);
      setMetadata(meta);
    } catch (err) {
      console.error("Inspection error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!activeFile && storeFiles.length > 0) {
        handleSelectFile(storeFiles[0].file);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [storeFiles, activeFile]);

  const handleCleanPrivacy = async () => {
    if (!activeFile) return;
    setIsCleaning(true);

    try {
      let resultBlob: Blob = activeFile;
      const lastDot = activeFile.name.lastIndexOf(".");
      const base = lastDot > 0 ? activeFile.name.slice(0, lastDot) : activeFile.name;
      const ext = lastDot > 0 ? activeFile.name.slice(lastDot + 1) : "";
      const cleanedFileName = ext ? `${base}_privacy_clean.${ext}` : `${base}_privacy_clean`;

      const isPdf =
        activeFile.type === "application/pdf" ||
        activeFile.name.toLowerCase().endsWith(".pdf");
      const isImg =
        activeFile.type.startsWith("image/") ||
        /\.(jpe?g|png|webp|gif|bmp)$/i.test(activeFile.name);

      if (isImg) {
        // Strip EXIF, GPS, and IPTC camera headers
        const res = await stripImageMetadata(activeFile);
        resultBlob = res.blob;
      } else if (isPdf) {
        // Use compressPDF with removeMetadata: true to strip Title, Author, Subject, Keywords, Producer, Creator
        const res = await compressPDF(activeFile, {
          level: "smaller",
          removeMetadata: true,
        });
        resultBlob = res.blob;
      } else {
        toast({
          title: "Unsupported file format",
          description: "Privacy cleaning is currently supported for image files (JPEG, PNG, WebP) and PDF documents.",
          variant: "error",
        });
        return;
      }

      setCleanBlob(resultBlob);
      setCleanName(cleanedFileName);

      pushDownload({
        fileName: cleanedFileName,
        originalSize: activeFile.size,
        outputSize: resultBlob.size,
        savingsPct:
          activeFile.size > resultBlob.size
            ? ((activeFile.size - resultBlob.size) / activeFile.size) * 100
            : 0,
        status: "ready",
        blob: resultBlob,
      });

      triggerSupportPrompt();

      toast({
        title: "Privacy metadata scrubbed",
        description: `Successfully cleaned ${cleanedFileName}. All tracking tags removed.`,
        variant: "success",
      });
    } catch (err: unknown) {
      toast({
        title: "Privacy cleaning failed",
        description:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while scrubbing metadata.",
        variant: "error",
      });
    } finally {
      setIsCleaning(false);
    }
  };

  const handleDownloadClean = async () => {
    if (!cleanBlob || !activeFile) return;
    triggerDownload(cleanBlob, cleanName);

    await addHistoryRecord({
      filename: cleanName,
      tool: "Privacy Cleaner",
      originalSize: activeFile.size,
      outputSize: cleanBlob.size,
    });

    setLatestDeliveredFile({
      id: generateDelivId(),
      fileName: cleanName,
      originalSize: activeFile.size,
      outputSize: cleanBlob.size,
      status: "downloaded",
      blob: cleanBlob,
      timestamp: getTimestamp(),
    });

    triggerSupportPrompt();

    toast({
      title: "Clean file saved",
      description: `Saved ${cleanName} without personal tracking metadata.`,
      variant: "success",
    });
  };

  const hasSensitives = Boolean(
    metadata?.hasGps ||
      metadata?.cameraMake ||
      metadata?.dateTaken ||
      metadata?.pdfAuthor ||
      metadata?.pdfCreator ||
      metadata?.pdfTitle ||
      (metadata?.pdfKeywords && metadata.pdfKeywords.length > 0)
  );

  return (
    <ToolPageShell
      icon={Shield}
      title="Privacy Cleaner"
      description="Photos and PDFs often conceal your home GPS coordinates, camera serial numbers, and personal author tags. Strip them 100% locally before publishing."
      backHref="/tools"
      backLabel="All Tools"
      formats={["JPG", "PNG", "WEBP", "PDF"]}
    >
      <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
        {!activeFile ? (
          <div className="max-w-xl mx-auto">
            <DropZone
              onFiles={(files: File[]) => {
                if (files[0]) {
                  addFiles([files[0]]);
                  handleSelectFile(files[0]);
                }
              }}
              accept={[
                "image/jpeg",
                "image/png",
                "image/webp",
                "application/pdf",
              ]}
              formats={["JPG", "PNG", "WEBP", "PDF"]}
              label="Drop Image or PDF to Inspect & Clean"
              sublabel="Drag any file to audit its privacy and remove tracking tags"
              className="py-16"
            />
          </div>
        ) : (
          <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8 space-y-6 shadow-xl">
            {/* File Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[hsl(var(--border))] pb-4">
              <div>
                <h2 className="text-base font-bold text-[hsl(var(--foreground))] truncate max-w-md">
                  {activeFile.name}
                </h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono tabular-nums">
                  {formatBytes(activeFile.size)} • {activeFile.type || "Document"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveFile(null);
                    setMetadata(null);
                    setCleanBlob(null);
                  }}
                  className="text-xs min-h-[44px] touch-manipulation"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> New File
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs min-h-[44px] touch-manipulation"
                >
                  <Upload className="h-3.5 w-3.5 mr-1" /> Choose Other File
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleSelectFile(e.target.files[0]);
                }}
                className="hidden"
              />
            </div>

            {/* Privacy Audit Card */}
            {isScanning ? (
              <div className="py-12 text-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-700 dark:text-emerald-400" />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Scanning file headers for embedded EXIF, GPS & PDF metadata records...
                </p>
              </div>
            ) : hasSensitives ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-bold">
                    Sensitive Metadata Detected in File
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs text-[hsl(var(--muted-foreground))] pt-1">
                  {metadata?.hasGps && (
                    <li className="text-amber-700 dark:text-amber-300 font-semibold">
                      • GPS Coordinates: Embedded geographical latitude & longitude location tags
                    </li>
                  )}
                  {metadata?.cameraMake && (
                    <li>
                      • Camera Hardware: {metadata.cameraMake} {metadata.cameraModel}
                    </li>
                  )}
                  {metadata?.dateTaken && (
                    <li>• Exact Date & Timestamp: {metadata.dateTaken}</li>
                  )}
                  {metadata?.pdfAuthor && (
                    <li>
                      • Document Author & Software: {metadata.pdfAuthor}{" "}
                      {metadata.pdfCreator ? `(${metadata.pdfCreator})` : ""}
                    </li>
                  )}
                  {metadata?.pdfTitle && (
                    <li>• Document Title Dictionary: {metadata.pdfTitle}</li>
                  )}
                  {metadata?.pdfProducer && (
                    <li>• PDF Producer: {metadata.pdfProducer}</li>
                  )}
                </ul>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-700 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">
                  No Sensitive GPS or Author Tags Detected
                </h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-sm mx-auto">
                  This file appears clean of identifiable location tags. You can still run clean scrubbing to ensure standardized privacy headers.
                </p>
              </div>
            )}

            {/* Cleaned Result Celebration */}
            {cleanBlob && (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-5 text-center space-y-3 animate-scale-in">
                <span className="inline-block text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full">
                  Privacy Cleaned ✓
                </span>
                <h3 className="text-base font-extrabold text-[hsl(var(--foreground))]">
                  All Metadata Successfully Stripped
                </h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-xs mx-auto truncate font-mono tabular-nums">
                  {cleanName} ({formatBytes(cleanBlob.size)})
                </p>

                <Button
                  onClick={handleDownloadClean}
                  className="w-full max-w-xs mx-auto min-h-[48px] touch-manipulation bg-[hsl(var(--success))] hover:bg-emerald-600 text-white font-bold"
                >
                  <Download className="h-4 w-4 mr-1.5" /> Download Clean File
                </Button>
              </div>
            )}

            {/* Primary Clean Trigger */}
            {!cleanBlob && (
              <Button
                onClick={handleCleanPrivacy}
                disabled={isCleaning}
                className="w-full min-h-[48px] touch-manipulation font-bold text-sm bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"
              >
                {isCleaning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Scrubbing Metadata...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Strip All Metadata & Clean File
                  </>
                )}
              </Button>
            )}

            <div className="flex items-center justify-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))] pt-2">
              <Lock className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>Executed 100% inside your browser sandbox • Never uploaded</span>
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}
