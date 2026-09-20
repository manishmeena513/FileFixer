"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Crop as CropIcon,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Download,
  RefreshCw,
  RotateCcw as ResetIcon,
  Image as ImageIcon,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { transformImage } from "@/lib/image/transform";
import { triggerDownload, createObjectURL, revokeObjectURL } from "@/lib/file-utils";

export default function CropImagePage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Transform states
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = createObjectURL(selectedFile);
    setPreviewUrl(url);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCrop(undefined);
    setCompletedCrop(null);

    return () => {
      revokeObjectURL(url);
    };
  }, [selectedFile]);

  const handleRotateCw = () => setRotation((r) => (r + 90) % 360);
  const handleRotateCcw = () => setRotation((r) => (r - 90 + 360) % 360);
  const handleFlipH = () => setFlipH((f) => !f);
  const handleFlipV = () => setFlipV((f) => !f);

  const handleReset = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCrop(undefined);
    setCompletedCrop(null);
  };

  const handleExport = async () => {
    if (!selectedFile || !imgRef.current) return;
    setIsProcessing(true);

    try {
      let cropArea = undefined;
      if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
        const image = imgRef.current;
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        cropArea = {
          x: completedCrop.x * scaleX,
          y: completedCrop.y * scaleY,
          width: completedCrop.width * scaleX,
          height: completedCrop.height * scaleY,
        };
      }

      const blob = await transformImage(selectedFile, {
        crop: cropArea,
        rotation,
        flipH,
        flipV,
      });

      const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
      triggerDownload(blob, `${baseName}_edited.jpg`);
      toast({
        title: "Export complete",
        description: "Image successfully cropped and downloaded.",
        variant: "success",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Transform failed",
        description: err.message || "Failed to process image",
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
            <CropIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
              Crop & Rotate Image
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Interactively crop, rotate 90°, and flip images without uploading to an external server.
            </p>
          </div>
        </div>
      </div>

      {!selectedFile ? (
        <DropZone
          onFiles={(files) => {
            const img = files.find((f) => f.type.startsWith("image/"));
            if (img) setSelectedFile(img);
          }}
          accept={[".jpg", ".jpeg", ".png", ".webp"]}
          multiple={false}
          label="Drop an image to crop and rotate"
          sublabel="JPG, PNG, or WebP"
          className="py-20"
        />
      ) : (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Button variant="secondary" size="sm" onClick={handleRotateCcw} title="Rotate 90° Left">
                <RotateCcw className="h-4 w-4 mr-1" /> 90° Left
              </Button>
              <Button variant="secondary" size="sm" onClick={handleRotateCw} title="Rotate 90° Right">
                <RotateCw className="h-4 w-4 mr-1" /> 90° Right
              </Button>
              <Button
                variant={flipH ? "default" : "secondary"}
                size="sm"
                onClick={handleFlipH}
                title="Flip Horizontal"
              >
                <FlipHorizontal className="h-4 w-4 mr-1" /> Flip H
              </Button>
              <Button
                variant={flipV ? "default" : "secondary"}
                size="sm"
                onClick={handleFlipV}
                title="Flip Vertical"
              >
                <FlipVertical className="h-4 w-4 mr-1" /> Flip V
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset} title="Reset">
                <ResetIcon className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
              >
                Change Image
              </Button>
              <Button
                variant="default"
                size="sm"
                disabled={isProcessing}
                onClick={handleExport}
                className="bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Download className="h-4 w-4 mr-1" />
                )}
                Download Result
              </Button>
            </div>
          </div>

          {/* Canvas / Crop workspace */}
          <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-black/50 p-6 overflow-hidden">
            {previewUrl && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                className="max-h-[600px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={previewUrl}
                  alt="Crop preview"
                  style={{
                    transform: `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`,
                    maxHeight: "550px",
                    maxWidth: "100%",
                    objectFit: "contain",
                    transition: "transform 0.15s ease-out",
                  }}
                />
              </ReactCrop>
            )}
          </div>
          <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
            Click and drag on the image above to select a crop region. Use the toolbar buttons to rotate or flip.
          </p>
        </div>
      )}
    </div>
  );
}
