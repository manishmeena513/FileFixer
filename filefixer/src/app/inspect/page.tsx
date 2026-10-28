"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileSearch,
  FileText,
  Image as ImageIcon,
  MapPin,
  Cpu,
  Info,
  Shield,
  Minimize2,
  RefreshCw,
  ArrowRight,
  Layers,
  FileCode,
  Tag,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToolPageShell } from "@/components/ui/ToolPageShell";
import { inspectFile, FileMetadata } from "@/lib/inspect";
import { useFileStore } from "@/stores/fileStore";
import { formatBytes } from "@/lib/file-utils";

export default function InspectPage() {
  const { files: storeFiles, addFiles: addStoreFiles } = useFileStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runInspection = async (file: File) => {
    setSelectedFile(file);
    setIsLoading(true);
    try {
      const data = await inspectFile(file);
      setMetadata(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedFile && storeFiles.length > 0) {
      runInspection(storeFiles[0].file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    addStoreFiles([file]);
    await runInspection(file);
  };

  return (
    <ToolPageShell
      icon={FileSearch}
      title="Universal File Inspector"
      description="Inspect hidden technical metadata, dimensions, EXIF tags, and PDF dictionaries locally."
      backHref="/tools"
      backLabel="All Tools"
      formats={["JPG", "PNG", "WEBP", "PDF"]}
    >
      <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
        {!selectedFile ? (
          <div className="max-w-xl mx-auto">
            <DropZone
              onFiles={handleFiles}
              multiple={false}
              accept={[
                "image/jpeg",
                "image/png",
                "image/webp",
                "application/pdf",
              ]}
              formats={["JPG", "PNG", "WEBP", "PDF"]}
              label="Drop any file to inspect technical metadata"
              sublabel="Images, PDFs, documents, or media files"
              className="py-16"
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Selected File Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel rounded-2xl p-4 sm:p-5 gap-3 shadow-md">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">
                  {metadata?.category === "image" ? (
                    <ImageIcon className="h-5 w-5" />
                  ) : metadata?.category === "pdf" ? (
                    <FileText className="h-5 w-5" />
                  ) : (
                    <FileCode className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-bold text-[hsl(var(--foreground))]"
                    title={selectedFile.name}
                  >
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono tabular-nums">
                    {metadata?.sizeFormatted || formatBytes(selectedFile.size)} ·{" "}
                    {selectedFile.type || "Unknown binary"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="min-h-[44px] shrink-0"
              >
                Inspect Another File
              </Button>
            </div>

            {/* Quick Routing Actions Bar */}
            {metadata && (
              <div className="rounded-2xl border border-[hsl(var(--primary)/0.25)] bg-[hsl(var(--primary)/0.06)] backdrop-blur-md p-4 sm:p-5 space-y-3 shadow-md">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[hsl(var(--primary))]">
                  <Tag className="h-3.5 w-3.5" />
                  <span>Quick Actions For This File</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <Link href="/privacy-cleaner" className="inline-flex">
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[44px] text-xs font-semibold bg-[hsl(var(--card))] border-[hsl(var(--primary)/0.3)] hover:bg-[hsl(var(--primary)/0.12)]"
                    >
                      <Shield className="h-3.5 w-3.5 mr-1.5 text-emerald-700 dark:text-emerald-400" />
                      Scrub in Privacy Cleaner
                    </Button>
                  </Link>

                  {metadata.category === "image" && (
                    <>
                      <Link href="/compress-image" className="inline-flex">
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-[44px] text-xs font-semibold bg-[hsl(var(--card))]"
                        >
                          <Minimize2 className="h-3.5 w-3.5 mr-1.5 text-[hsl(var(--primary))]" />
                          Compress Image
                        </Button>
                      </Link>
                      <Link href="/convert-image" className="inline-flex">
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-[44px] text-xs font-semibold bg-[hsl(var(--card))]"
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-[hsl(var(--primary))]" />
                          Convert Image
                        </Button>
                      </Link>
                    </>
                  )}

                  {metadata.category === "pdf" && (
                    <>
                      <Link href="/pdf-compress" className="inline-flex">
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-[44px] text-xs font-semibold bg-[hsl(var(--card))]"
                        >
                          <Minimize2 className="h-3.5 w-3.5 mr-1.5 text-[hsl(var(--primary))]" />
                          Compress PDF
                        </Button>
                      </Link>
                      <Link href="/pdf-split" className="inline-flex">
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-[44px] text-xs font-semibold bg-[hsl(var(--card))]"
                        >
                          <Layers className="h-3.5 w-3.5 mr-1.5 text-[hsl(var(--primary))]" />
                          Split PDF Pages
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="py-12 text-center space-y-2">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[hsl(var(--primary))]" />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Extracting headers and technical dictionaries...
                </p>
              </div>
            )}

            {!isLoading && metadata && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General File Information */}
                <div className="glass-panel-elevated rounded-2xl p-6 space-y-4 shadow-xl">
                  <h3 className="font-bold text-sm text-[hsl(var(--foreground))] flex items-center gap-2">
                    <Info className="h-4 w-4 text-[hsl(var(--primary))]" /> General
                    File Attributes
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">
                        File Name
                      </span>
                      <span
                        className="font-mono text-[hsl(var(--foreground))] truncate max-w-[220px]"
                        title={metadata.name}
                      >
                        {metadata.name}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">
                        File Size
                      </span>
                      <span className="font-mono text-[hsl(var(--foreground))] tabular-nums">
                        {metadata.sizeFormatted} (
                        {metadata.size.toLocaleString()} bytes)
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">
                        MIME Type
                      </span>
                      <span className="font-mono text-[hsl(var(--foreground))]">
                        {metadata.type}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">
                        Last Modified
                      </span>
                      <span className="font-mono text-[hsl(var(--foreground))] tabular-nums">
                        {metadata.lastModifiedDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Format-Specific Technical Information */}
                <div className="glass-panel-elevated rounded-2xl p-6 space-y-4 shadow-xl">
                  <h3 className="font-bold text-sm text-[hsl(var(--foreground))] flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-[hsl(var(--primary))]" />
                    {metadata.category === "image"
                      ? "Image & Sensor Metadata (EXIF)"
                      : metadata.category === "pdf"
                      ? "PDF Document Dictionary"
                      : "Additional Attributes"}
                  </h3>

                  {metadata.category === "image" && (
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Resolution
                        </span>
                        <span className="font-mono text-[hsl(var(--foreground))] tabular-nums">
                          {metadata.imageWidth
                            ? `${metadata.imageWidth} × ${metadata.imageHeight} px`
                            : "Unavailable"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Aspect Ratio
                        </span>
                        <span className="font-mono text-[hsl(var(--foreground))] tabular-nums">
                          {metadata.aspectRatio || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Camera Device
                        </span>
                        <span className="font-mono text-[hsl(var(--foreground))] truncate max-w-[200px]">
                          {metadata.cameraMake
                            ? `${metadata.cameraMake} ${metadata.cameraModel || ""}`
                            : "No EXIF camera tag"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Capture Date
                        </span>
                        <span className="font-mono text-[hsl(var(--foreground))] tabular-nums">
                          {metadata.dateTaken || "None"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Exposure & Aperture
                        </span>
                        <span className="font-mono text-[hsl(var(--foreground))] tabular-nums">
                          {metadata.fNumber
                            ? `f/${metadata.fNumber} · ${metadata.exposureTime || ""} · ISO ${metadata.iso || ""}`
                            : "None"}
                        </span>
                      </div>
                      {metadata.focalLength && (
                        <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                          <span className="text-[hsl(var(--muted-foreground))]">
                            Focal Length
                          </span>
                          <span className="font-mono text-[hsl(var(--foreground))] tabular-nums">
                            {metadata.focalLength} mm
                          </span>
                        </div>
                      )}
                      {metadata.software && (
                        <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                          <span className="text-[hsl(var(--muted-foreground))]">
                            Software
                          </span>
                          <span className="font-mono text-[hsl(var(--foreground))] truncate max-w-[200px]">
                            {metadata.software}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          GPS Location
                        </span>
                        <span className="font-mono text-[hsl(var(--foreground))]">
                          {metadata.hasGps ? (
                            <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1 tabular-nums">
                              <MapPin className="h-3 w-3" />
                              {metadata.gpsLatitude && metadata.gpsLongitude
                                ? `${metadata.gpsLatitude.toFixed(4)}, ${metadata.gpsLongitude.toFixed(4)}`
                                : "GPS Tag Present"}
                            </span>
                          ) : (
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                              Clean (No GPS)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {metadata.category === "pdf" && (
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Page Count
                        </span>
                        <span className="font-mono font-bold text-[hsl(var(--primary))] tabular-nums">
                          {metadata.pdfPages || "—"} Pages
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Title
                        </span>
                        <span className="font-mono text-[hsl(var(--foreground))] truncate max-w-[200px]">
                          {metadata.pdfTitle || "None"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Author
                        </span>
                        <span className="font-mono text-[hsl(var(--foreground))] truncate max-w-[200px]">
                          {metadata.pdfAuthor || "None"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Producer
                        </span>
                        <span className="font-mono text-[hsl(var(--foreground))] truncate max-w-[200px]">
                          {metadata.pdfProducer || "None"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Creator
                        </span>
                        <span className="font-mono text-[hsl(var(--foreground))] truncate max-w-[200px]">
                          {metadata.pdfCreator || "None"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Created Date
                        </span>
                        <span className="font-mono text-[hsl(var(--foreground))] tabular-nums truncate max-w-[200px]">
                          {metadata.pdfCreationDate || "None"}
                        </span>
                      </div>
                      {metadata.pdfModificationDate && (
                        <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                          <span className="text-[hsl(var(--muted-foreground))]">
                            Modified Date
                          </span>
                          <span className="font-mono text-[hsl(var(--foreground))] tabular-nums truncate max-w-[200px]">
                            {metadata.pdfModificationDate}
                          </span>
                        </div>
                      )}
                      {metadata.pdfKeywords && metadata.pdfKeywords.length > 0 && (
                        <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                          <span className="text-[hsl(var(--muted-foreground))]">
                            Keywords
                          </span>
                          <span className="font-mono text-[hsl(var(--foreground))] truncate max-w-[200px]">
                            {metadata.pdfKeywords.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {metadata.category === "other" && (
                    <div className="p-4 text-center text-xs text-[hsl(var(--muted-foreground))]">
                      Standard binary file detected. Browser has safely extracted core filesystem timestamps and file headers.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}
