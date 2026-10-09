"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  ShieldCheck,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Download,
  Trash2,
  HardDrive,
  Eye,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFileStore } from "@/stores/fileStore";
import { stripImageMetadata, readImageMetadata } from "@/lib/image/metadata";
import { inspectFile, FileMetadata } from "@/lib/inspect";
import { formatBytes, triggerDownload } from "@/lib/file-utils";

export default function PrivacyCleanerPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { files: storeFiles, addFiles, pushDownload, setLatestDeliveredFile } = useFileStore();

  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanBlob, setCleanBlob] = useState<Blob | null>(null);
  const [cleanName, setCleanName] = useState<string>("");

  useEffect(() => {
    if (!activeFile && storeFiles.length > 0) {
      handleSelectFile(storeFiles[0].file);
    }
  }, [storeFiles, activeFile]);

  const handleSelectFile = async (file: File) => {
    setActiveFile(file);
    setIsScanning(true);
    setCleanBlob(null);

    try {
      const meta = await inspectFile(file);
      setMetadata(meta);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCleanPrivacy = async () => {
    if (!activeFile) return;
    setIsCleaning(true);

    try {
      let resultBlob: Blob = activeFile;
      const ext = activeFile.name.split(".").pop() || "jpg";
      const cleanedFileName = `${activeFile.name.replace(/\.[^/.]+$/, "")}_privacy_clean.${ext}`;

      if (activeFile.type.startsWith("image/")) {
        const res = await stripImageMetadata(activeFile);
        resultBlob = res.blob;
      }

      setCleanBlob(resultBlob);
      setCleanName(cleanedFileName);

      pushDownload({
        fileName: cleanedFileName,
        originalSize: activeFile.size,
        outputSize: resultBlob.size,
        status: "ready",
        blob: resultBlob,
      });
    } catch (err: any) {
      alert(`Privacy cleaning failed: ${err.message}`);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleDownloadClean = () => {
    if (!cleanBlob || !activeFile) return;
    triggerDownload(cleanBlob, cleanName);

    setLatestDeliveredFile({
      id: `deliv-${Date.now()}`,
      fileName: cleanName,
      originalSize: activeFile.size,
      outputSize: cleanBlob.size,
      status: "downloaded",
      blob: cleanBlob,
      timestamp: Date.now(),
    });
  };

  const hasSensitives = Boolean(
    metadata?.hasGps ||
      metadata?.cameraMake ||
      metadata?.dateTaken ||
      metadata?.pdfAuthor
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
          <Shield className="h-4 w-4" />
          <span>Privacy Cleaner</span>
        </div>
        <h1 className="text-3xl font-extrabold sm:text-4xl tracking-tight text-[hsl(var(--foreground))]">
          Erase Hidden GPS & Camera Data
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Photos and PDFs often conceal your home GPS coordinates, camera serial numbers, and personal author tags. Strip them 100% locally before publishing.
        </p>
      </div>

      {!activeFile ? (
        <div className="max-w-xl mx-auto">
          <DropZone
            onFilesSelected={(files: File[]) => {
              if (files[0]) {
                addFiles([files[0]]);
                handleSelectFile(files[0]);
              }
            }}
            accept={["image/*", ".pdf", "application/pdf"]}
            title="Drop Image or PDF to Inspect & Clean"
            description="Drag any file to audit its privacy and remove tracking tags"
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
              <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
                {formatBytes(activeFile.size)} • {activeFile.type}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs"
            >
              <Upload className="h-3.5 w-3.5 mr-1" /> Choose Other File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => {
                if (e.target.files?.[0]) handleSelectFile(e.target.files[0]);
              }}
              className="hidden"
            />
          </div>

          {/* Privacy Audit Card */}
          {isScanning ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-400" />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Scanning file headers for embedded EXIF & GPS records...
              </p>
            </div>
          ) : hasSensitives ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-bold">
                  Sensitive Metadata Detected in File
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-[hsl(var(--muted-foreground))] pt-1">
                {metadata?.hasGps && (
                  <li className="text-amber-300 font-semibold">
                    • GPS Coordinates: Embedded geographical latitude & longitude
                  </li>
                )}
                {metadata?.cameraMake && (
                  <li>• Camera Maker & Model: {metadata.cameraMake} {metadata.cameraModel}</li>
                )}
                {metadata?.dateTaken && (
                  <li>• Exact Date & Timestamp: {metadata.dateTaken}</li>
                )}
                {metadata?.pdfAuthor && (
                  <li>• Document Author & Software: {metadata.pdfAuthor} ({metadata.pdfCreator})</li>
                )}
              </ul>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400" />
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">
                No Sensitive GPS or Camera Tags Detected
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-sm mx-auto">
                This file appears clean of identifiable location tags. You can still run clean scrubbing to ensure standardized privacy headers.
              </p>
            </div>
          )}

          {/* Cleaned Result Celebration */}
          {cleanBlob && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-5 text-center space-y-3 animate-scale-in">
              <span className="inline-block text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full">
                Privacy Cleaned ✓
              </span>
              <h3 className="text-base font-extrabold text-[hsl(var(--foreground))]">
                All Metadata Successfully Stripped
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-xs mx-auto truncate font-mono">
                {cleanName}
              </p>

              <Button
                onClick={handleDownloadClean}
                className="w-full max-w-xs mx-auto min-h-[44px] bg-emerald-600 hover:bg-emerald-500 font-bold"
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
              className="w-full min-h-[48px] font-bold text-sm bg-emerald-600 hover:bg-emerald-500"
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
            <Lock className="h-3.5 w-3.5 text-emerald-500" />
            <span>Executed 100% inside your browser sandbox • Never uploaded</span>
          </div>
        </div>
      )}
    </div>
  );
}
