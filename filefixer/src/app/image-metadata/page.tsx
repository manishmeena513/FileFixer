"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Download,
  Trash2,
  RefreshCw,
  Camera,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Wand2,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import {
  readImageMetadata,
  stripImageMetadata,
  DetailedExif,
} from "@/lib/image/metadata";
import { formatBytes, triggerDownload } from "@/lib/file-utils";
import { addHistoryRecord } from "@/lib/storage/history";
import { useFileStore } from "@/stores/fileStore";
import { ToolPageShell } from "@/components/ui/ToolPageShell";

export default function ImageMetadataPage() {
  const { toast } = useToast();
  const {
    files: storeFiles,
    addFiles: addStoreFiles,
    pushDownload,
    setLatestDeliveredFile,
    triggerSupportPrompt,
  } = useFileStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<DetailedExif | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStripping, setIsStripping] = useState(false);
  const [cleanedBlob, setCleanedBlob] = useState<{
    blob: Blob;
    name: string;
  } | null>(null);

  const loadFileMetadata = async (img: File) => {
    setSelectedFile(img);
    setIsLoading(true);
    setCleanedBlob(null);

    try {
      const data = await readImageMetadata(img);
      setMetadata(data);
    } catch {
      setMetadata(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedFile && storeFiles.length > 0) {
      const firstImg = storeFiles.find((f) => f.type.startsWith("image/"));
      if (firstImg) {
        loadFileMetadata(firstImg.file);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiles = async (files: File[]) => {
    const img = files.find((f) => f.type.startsWith("image/"));
    if (!img) {
      toast({
        title: "Invalid file",
        description: "Please select an image file (JPG, PNG, WebP).",
        variant: "error",
      });
      return;
    }
    addStoreFiles([img]);
    await loadFileMetadata(img);
  };

  const handleStripMetadata = async () => {
    if (!selectedFile) return;
    setIsStripping(true);

    try {
      const res = await stripImageMetadata(selectedFile);
      setCleanedBlob({ blob: res.blob, name: res.outputFilename });

      // Stage in download dock as ready
      pushDownload({
        fileName: res.outputFilename,
        originalSize: selectedFile.size,
        outputSize: res.blob.size,
        savingsPct:
          selectedFile.size > res.blob.size
            ? ((selectedFile.size - res.blob.size) / selectedFile.size) * 100
            : 0,
        status: "ready",
        blob: res.blob,
      });

      toast({
        title: "Metadata sanitized",
        description: `Stripped ${metadata?.rawTagCount || 0} EXIF headers and GPS tags.`,
        variant: "success",
      });

      await addHistoryRecord({
        filename: selectedFile.name,
        tool: "EXIF & GPS Sanitizer",
        originalSize: selectedFile.size,
        outputSize: res.blob.size,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Sanitization failed",
        description: err.message || "Failed to sanitize image metadata",
        variant: "error",
      });
    } finally {
      setIsStripping(false);
    }
  };

  const handleDownloadCleaned = () => {
    if (!cleanedBlob || !selectedFile) return;
    triggerDownload(cleanedBlob.blob, cleanedBlob.name);

    const savings =
      selectedFile.size > cleanedBlob.blob.size
        ? ((selectedFile.size - cleanedBlob.blob.size) / selectedFile.size) *
          100
        : 0;

    const dlItem = {
      fileName: cleanedBlob.name,
      originalSize: selectedFile.size,
      outputSize: cleanedBlob.blob.size,
      savingsPct: savings,
      status: "downloaded" as const,
      blob: cleanedBlob.blob,
    };

    pushDownload(dlItem);
    setLatestDeliveredFile({
      id: `deliv-${Date.now()}`,
      ...dlItem,
      timestamp: Date.now(),
    });
    triggerSupportPrompt();
  };

  const handleCopyGps = () => {
    if (
      metadata?.latitude === undefined ||
      metadata?.longitude === undefined
    )
      return;
    const coords = `${metadata.latitude.toFixed(6)}, ${metadata.longitude.toFixed(6)}`;
    navigator.clipboard.writeText(coords);
    toast({
      title: "Coordinates copied",
      description: `Copied "${coords}" to clipboard.`,
      variant: "success",
    });
  };

  return (
    <ToolPageShell
      icon={ShieldAlert}
      title="Image Metadata & Privacy Cleaner"
      description="Inspect camera sensor tags, view embedded GPS coordinates, and eliminate EXIF data with zero cloud uploads."
      formats={["JPG", "PNG", "WEBP"]}
    >
      {!selectedFile ? (
        <DropZone
          onFiles={handleFiles}
          accept={[".jpg", ".jpeg", ".png", ".webp"]}
          multiple={false}
          label="Drop an image to inspect or sanitize metadata"
          sublabel="Detect camera models, GPS locations, and hidden EXIF headers"
          className="py-16"
        />
      ) : (
        <div className="space-y-6">
          {/* File summary bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-[hsl(var(--foreground))] truncate max-w-md">
                {selectedFile.name}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] tabular-nums mt-0.5">
                {formatBytes(selectedFile.size)} · {selectedFile.type || "image/jpeg"}
                {metadata?.imageWidth && metadata?.imageHeight ? (
                  <>
                    {" "}
                    · {metadata.imageWidth} × {metadata.imageHeight} px
                    {metadata.megapixels && ` (${metadata.megapixels})`}
                  </>
                ) : null}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] touch-manipulation self-start sm:self-center"
              onClick={() => {
                setSelectedFile(null);
                setMetadata(null);
                setCleanedBlob(null);
              }}
            >
              Change Image
            </Button>
          </div>

          {/* GPS Location Card (Prominent Privacy Banner) */}
          {metadata?.hasGps &&
          metadata.latitude !== undefined &&
          metadata.longitude !== undefined ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 text-destructive font-bold text-sm sm:text-base">
                  <MapPin className="h-5 w-5 shrink-0" />
                  <span>Sensitive GPS Location Detected</span>
                </div>
                <Badge variant="destructive" className="text-xs">
                  Coordinates Embedded
                </Badge>
              </div>

              <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                This image contains embedded geographical coordinates. Anyone with access to this file can pinpoint the exact location where it was captured.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] p-3">
                  <span className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">
                    Decimal Coordinates
                  </span>
                  <div className="mt-1 font-mono font-bold text-sm text-[hsl(var(--foreground))] tabular-nums">
                    {metadata.latitude.toFixed(6)}, {metadata.longitude.toFixed(6)}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] p-3">
                  <span className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">
                    DMS Format
                  </span>
                  <div className="mt-1 font-mono font-medium text-xs text-[hsl(var(--foreground))] tabular-nums truncate">
                    {metadata.dmsLatitude || "—"}, {metadata.dmsLongitude || "—"}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] p-3">
                  <span className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">
                    Altitude
                  </span>
                  <div className="mt-1 font-mono font-bold text-sm text-[hsl(var(--foreground))] tabular-nums">
                    {metadata.altitude !== undefined
                      ? `${metadata.altitude.toFixed(1)} m`
                      : "Not recorded"}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] p-3">
                  <span className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">
                    GPS Date / Time
                  </span>
                  <div className="mt-1 font-mono font-medium text-xs text-[hsl(var(--foreground))] tabular-nums truncate">
                    {metadata.gpsTimestamp || "Not recorded"}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyGps}
                  className="min-h-[44px] touch-manipulation font-medium"
                >
                  <Copy className="h-4 w-4 mr-1.5" />
                  Copy Coordinates
                </Button>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${metadata.latitude}&mlon=${metadata.longitude}#map=16/${metadata.latitude}/${metadata.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.8)] transition-colors touch-manipulation"
                >
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  View on OpenStreetMap
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">
                  Clean of GPS Data
                </p>
                <p className="text-[11px] opacity-90">
                  No geographic coordinates or location tags are embedded in this file.
                </p>
              </div>
            </div>
          )}

          {/* Detailed Camera & Sensor Inspection Table */}
          <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-xl p-5 sm:p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
              <h3 className="font-bold text-sm sm:text-base text-[hsl(var(--foreground))] flex items-center gap-2">
                <Camera className="h-4 w-4 text-[hsl(var(--primary))]" />
                Detected Camera &amp; Sensor Diagnostics
              </h3>
              <Badge variant="outline" className="font-mono text-xs tabular-nums border-[var(--glass-border)]">
                {metadata?.rawTagCount || 0} Tags Detected
              </Badge>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center p-8 text-xs text-[hsl(var(--muted-foreground))]">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Reading metadata headers...
              </div>
            ) : metadata ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {/* Camera & Hardware */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--primary))]">
                    Camera &amp; Hardware
                  </span>
                  <div className="space-y-2">
                    <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Make</span>
                      <span className="font-medium text-[hsl(var(--foreground))]">
                        {metadata.make || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Model</span>
                      <span className="font-medium text-[hsl(var(--foreground))]">
                        {metadata.model || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Lens Model</span>
                      <span className="font-medium text-[hsl(var(--foreground))] truncate max-w-[160px]">
                        {metadata.lensModel || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Software / OS</span>
                      <span className="font-medium text-[hsl(var(--foreground))] truncate max-w-[160px]">
                        {metadata.software || "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Exposure & Optics */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--primary))]">
                    Exposure &amp; Optics
                  </span>
                  <div className="space-y-2">
                    <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Aperture</span>
                      <span className="font-mono text-[hsl(var(--foreground))] tabular-nums">
                        {metadata.fNumber ? `f/${metadata.fNumber}` : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Shutter Speed</span>
                      <span className="font-mono text-[hsl(var(--foreground))] tabular-nums">
                        {metadata.exposureTime || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">ISO</span>
                      <span className="font-mono text-[hsl(var(--foreground))] tabular-nums">
                        {metadata.iso ? `ISO ${metadata.iso}` : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Focal Length</span>
                      <span className="font-mono text-[hsl(var(--foreground))] tabular-nums">
                        {metadata.focalLength
                          ? `${metadata.focalLength}mm`
                          : "N/A"}
                        {metadata.focalLengthIn35mm
                          ? ` (35mm: ${metadata.focalLengthIn35mm}mm)`
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Capture & Geometry */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--primary))]">
                    Capture &amp; Geometry
                  </span>
                  <div className="space-y-2">
                    <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Date Taken</span>
                      <span className="font-mono text-[hsl(var(--foreground))] tabular-nums text-[11px] truncate max-w-[170px]">
                        {metadata.dateTime || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Resolution</span>
                      <span className="font-mono text-[hsl(var(--foreground))] tabular-nums">
                        {metadata.imageWidth && metadata.imageHeight
                          ? `${metadata.imageWidth} × ${metadata.imageHeight}`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Megapixels</span>
                      <span className="font-mono text-[hsl(var(--foreground))] tabular-nums">
                        {metadata.megapixels || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Flash</span>
                      <span className="font-medium text-[hsl(var(--foreground))]">
                        {metadata.flash || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
                No standard EXIF metadata tags found on this image file.
              </div>
            )}

            {/* Privacy notice banner */}
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] p-3.5 flex items-start gap-2.5 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Clean Strategy:</strong> Clicking the button below draws the pixel matrix directly onto a clean HTML5 canvas and re-encodes it into an uncontaminated image buffer, eliminating all EXIF, GPS, camera, and serial tags.
              </span>
            </div>

            {/* Sanitization Button */}
            <Button
              size="lg"
              disabled={isStripping}
              onClick={handleStripMetadata}
              className="w-full min-h-[48px] bg-[hsl(var(--destructive))] hover:bg-red-600 text-[hsl(var(--destructive-foreground))] font-semibold touch-manipulation"
            >
              {isStripping ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Sanitizing Metadata in Canvas...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Strip All Metadata &amp; Sanitize Image
                </>
              )}
            </Button>
          </div>

          {/* Post-Sanitization Deliverable Card */}
          {cleanedBlob && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 sm:p-6 space-y-4 animate-slide-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-bold text-sm sm:text-base text-[hsl(var(--foreground))]">
                      Sanitized Clean Image Ready
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 tabular-nums">
                      {metadata?.rawTagCount || 0} metadata tags removed · Clean output size: {formatBytes(cleanedBlob.blob.size)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    size="lg"
                    onClick={handleDownloadCleaned}
                    className="min-h-[48px] bg-[hsl(var(--success))] hover:bg-emerald-600 text-[hsl(var(--success-foreground))] font-semibold touch-manipulation"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Sanitized Image
                  </Button>
                  <Link
                    href="/image-studio"
                    className="inline-flex items-center justify-center min-h-[48px] px-4 py-2 rounded-xl text-xs font-semibold border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-colors touch-manipulation"
                  >
                    <Wand2 className="h-4 w-4 mr-2 text-[hsl(var(--primary))]" />
                    Open in Image Studio
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolPageShell>
  );
}
