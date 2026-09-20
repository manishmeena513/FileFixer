"use client";

import React, { useState } from "react";
import {
  FileSearch,
  FileText,
  Image as ImageIcon,
  Camera,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Cpu,
  Info,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { inspectFile, FileMetadata } from "@/lib/inspect";

export default function InspectPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
            <FileSearch className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
              Universal File Inspector
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Inspect hidden technical metadata, dimensions, EXIF tags, and PDF dictionaries locally.
            </p>
          </div>
        </div>
      </div>

      {!selectedFile ? (
        <DropZone
          onFiles={handleFiles}
          multiple={false}
          label="Drop any file to inspect technical metadata"
          sublabel="Images, PDFs, documents, or media files"
          className="py-16"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">
                {metadata?.category === "image" ? (
                  <ImageIcon className="h-5 w-5" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {metadata?.sizeFormatted} · {selectedFile.type || "Unknown binary"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
              Inspect Another
            </Button>
          </div>

          {metadata && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General File Information */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4">
                <h3 className="font-bold text-sm text-[hsl(var(--foreground))] flex items-center gap-2">
                  <Info className="h-4 w-4 text-[hsl(var(--primary))]" /> General File Attributes
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                    <span className="text-[hsl(var(--muted-foreground))]">File Name</span>
                    <span className="font-mono text-[hsl(var(--foreground))] truncate max-w-[220px]" title={metadata.name}>
                      {metadata.name}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                    <span className="text-[hsl(var(--muted-foreground))]">File Size</span>
                    <span className="font-mono text-[hsl(var(--foreground))]">{metadata.sizeFormatted} ({metadata.size.toLocaleString()} bytes)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                    <span className="text-[hsl(var(--muted-foreground))]">MIME Type</span>
                    <span className="font-mono text-[hsl(var(--foreground))]">{metadata.type}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                    <span className="text-[hsl(var(--muted-foreground))]">Last Modified</span>
                    <span className="font-mono text-[hsl(var(--foreground))]">{metadata.lastModifiedDate}</span>
                  </div>
                </div>
              </div>

              {/* Format-Specific Information */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4">
                <h3 className="font-bold text-sm text-[hsl(var(--foreground))] flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-[hsl(var(--primary))]" />
                  {metadata.category === "image" ? "Image & Sensor Metadata" : metadata.category === "pdf" ? "PDF Document Metadata" : "Additional Attributes"}
                </h3>

                {metadata.category === "image" && (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Resolution</span>
                      <span className="font-mono text-[hsl(var(--foreground))]">
                        {metadata.imageWidth ? `${metadata.imageWidth} × ${metadata.imageHeight} px` : "Unavailable"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Aspect Ratio</span>
                      <span className="font-mono text-[hsl(var(--foreground))]">{metadata.aspectRatio || "—"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Camera Device</span>
                      <span className="font-mono text-[hsl(var(--foreground))]">
                        {metadata.cameraMake ? `${metadata.cameraMake} ${metadata.cameraModel || ""}` : "No EXIF camera tag"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Capture Date</span>
                      <span className="font-mono text-[hsl(var(--foreground))]">{metadata.dateTaken || "None"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Exposure & Aperture</span>
                      <span className="font-mono text-[hsl(var(--foreground))]">
                        {metadata.fNumber ? `f/${metadata.fNumber} · ${metadata.exposureTime || ""} · ISO ${metadata.iso || ""}` : "None"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Location (GPS Tag)</span>
                      <span className="font-mono text-[hsl(var(--foreground))]">
                        {metadata.hasGps ? (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> GPS Present
                          </span>
                        ) : (
                          "Clean (No GPS)"
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {metadata.category === "pdf" && (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Page Count</span>
                      <span className="font-mono font-bold text-[hsl(var(--primary))]">{metadata.pdfPages || "—"} Pages</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Title</span>
                      <span className="font-mono text-[hsl(var(--foreground))] truncate max-w-[200px]">{metadata.pdfTitle || "None"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Author</span>
                      <span className="font-mono text-[hsl(var(--foreground))] truncate max-w-[200px]">{metadata.pdfAuthor || "None"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Producer</span>
                      <span className="font-mono text-[hsl(var(--foreground))] truncate max-w-[200px]">{metadata.pdfProducer || "None"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Created Date</span>
                      <span className="font-mono text-[hsl(var(--foreground))]">{metadata.pdfCreationDate || "None"}</span>
                    </div>
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
  );
}
