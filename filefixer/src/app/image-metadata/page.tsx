"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Download,
  Trash2,
  RefreshCw,
  Camera,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { readImageMetadata, stripImageMetadata, DetailedExif } from "@/lib/image/metadata";
import { formatBytes, triggerDownload } from "@/lib/file-utils";
import { addHistoryRecord } from "@/lib/storage/history";

export default function ImageMetadataPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<DetailedExif | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStripping, setIsStripping] = useState(false);
  const [cleanedBlob, setCleanedBlob] = useState<{ blob: Blob; name: string } | null>(null);

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

  const handleStripMetadata = async () => {
    if (!selectedFile) return;
    setIsStripping(true);

    try {
      const res = await stripImageMetadata(selectedFile);
      setCleanedBlob({ blob: res.blob, name: res.outputFilename });
      toast({
        title: "Metadata removed",
        description: "Detectable EXIF headers and GPS tags have been stripped.",
        variant: "success",
      });

      // Save to local history
      await addHistoryRecord({
        filename: selectedFile.name,
        tool: "EXIF & GPS Stripper",
        originalSize: selectedFile.size,
        outputSize: res.blob.size,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Stripping failed",
        description: err.message || "Failed to sanitize image metadata",
        variant: "error",
      });
    } finally {
      setIsStripping(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
              Image Metadata &amp; Privacy Cleaner
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Inspect camera, GPS, and sensor tags, and strip detectable EXIF data before sharing.
            </p>
          </div>
        </div>
      </div>

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
          <div className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <div>
              <p className="font-semibold text-sm text-[hsl(var(--foreground))] truncate max-w-md">
                {selectedFile.name}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {formatBytes(selectedFile.size)} · {selectedFile.type}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
              Change Image
            </Button>
          </div>

          {/* Metadata Inspector Card */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[hsl(var(--foreground))] flex items-center gap-2">
                <Camera className="h-4 w-4 text-[hsl(var(--primary))]" /> Detected Sensor &amp; Camera Tags
              </h3>
              {metadata?.hasGps ? (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> GPS Location Attached
                </Badge>
              ) : (
                <Badge variant="outline">Clean of GPS</Badge>
              )}
            </div>

            {metadata ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                    <span className="text-[hsl(var(--muted-foreground))]">Camera Make</span>
                    <span className="font-mono text-[hsl(var(--foreground))]">{metadata.make || "None"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                    <span className="text-[hsl(var(--muted-foreground))]">Camera Model</span>
                    <span className="font-mono text-[hsl(var(--foreground))]">{metadata.model || "None"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                    <span className="text-[hsl(var(--muted-foreground))]">Software / OS</span>
                    <span className="font-mono text-[hsl(var(--foreground))]">{metadata.software || "None"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                    <span className="text-[hsl(var(--muted-foreground))]">Date &amp; Time Taken</span>
                    <span className="font-mono text-[hsl(var(--foreground))]">{metadata.dateTime || "None"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                    <span className="text-[hsl(var(--muted-foreground))]">Exposure &amp; ISO</span>
                    <span className="font-mono text-[hsl(var(--foreground))]">
                      {metadata.fNumber ? `f/${metadata.fNumber} · ${metadata.exposureTime || ""} · ISO ${metadata.iso || ""}` : "None"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[hsl(var(--border))]">
                    <span className="text-[hsl(var(--muted-foreground))]">Lens Model</span>
                    <span className="font-mono text-[hsl(var(--foreground))]">{metadata.lensModel || "None"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[hsl(var(--muted-foreground))]">
                No standard EXIF metadata tags found on this image file.
              </div>
            )}

            {/* Honest disclaimer */}
            <div className="rounded-lg bg-[hsl(var(--secondary)/0.6)] p-3 flex items-start gap-2.5 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Honest Privacy Notice:</strong> This tool strips all detectable EXIF headers, camera information, and GPS coordinate tags. Avoid relying solely on software if dealing with forensic-level classified material.
              </span>
            </div>

            {/* Strip CTA */}
            <Button
              size="lg"
              disabled={isStripping}
              onClick={handleStripMetadata}
              className="w-full bg-[hsl(var(--destructive))] hover:bg-red-600 text-white"
            >
              {isStripping ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Sanitizing Metadata in Canvas...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Available Metadata
                </>
              )}
            </Button>
          </div>

          {/* Download Clean Image */}
          {cleanedBlob && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm text-[hsl(var(--foreground))]">
                    Clean Image Ready
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    EXIF and GPS data eliminated · {formatBytes(cleanedBlob.blob.size)}
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => triggerDownload(cleanedBlob.blob, cleanedBlob.name)}
                className="w-full sm:w-auto bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Sanitized Image
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
