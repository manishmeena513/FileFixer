import imageCompression from "browser-image-compression";
import { SupportedImageFormat, getExtensionFromMime } from "../file-utils";

export interface CompressionOptions {
  mode: "recommended" | "targetSize" | "quality";
  targetSizeMB?: number; // In megabytes, e.g. 0.25 for 250KB, 1.0 for 1MB
  quality?: number; // 0.1 to 1.0 (default e.g. 0.8)
  maxIteration?: number;
}

export interface CompressResult {
  blob: Blob;
  outputName: string;
  outputSize: number;
  originalSize: number;
}

export async function compressImage(
  file: File,
  options: CompressionOptions,
  onProgress?: (progress: number) => void
): Promise<CompressResult> {
  const originalSize = file.size;

  let maxMB = 1;
  let initialQuality = 0.8;

  if (options.mode === "recommended") {
    // Determine recommended target size or quality based on input size
    if (originalSize > 10 * 1024 * 1024) {
      maxMB = 2.0;
      initialQuality = 0.75;
    } else if (originalSize > 4 * 1024 * 1024) {
      maxMB = 1.0;
      initialQuality = 0.8;
    } else if (originalSize > 1 * 1024 * 1024) {
      maxMB = 0.5;
      initialQuality = 0.82;
    } else {
      maxMB = (originalSize / (1024 * 1024)) * 0.7;
      initialQuality = 0.85;
    }
  } else if (options.mode === "targetSize") {
    maxMB = options.targetSizeMB || 1.0;
    initialQuality = 0.8;
  } else if (options.mode === "quality") {
    initialQuality = Math.max(0.1, Math.min(1.0, options.quality ?? 0.8));
    maxMB = originalSize / (1024 * 1024); // Don't cap aggressively by size, let quality drive
  }

  const compressionConfig = {
    maxSizeMB: maxMB,
    maxWidthOrHeight: 4096,
    useWebWorker: true,
    initialQuality: initialQuality,
    alwaysKeepResolution: options.mode === "quality",
    onProgress: (p: number) => {
      if (onProgress) onProgress(p);
    },
  };

  try {
    const compressedFile = await imageCompression(file, compressionConfig);
    
    // If output is somehow larger than original (can happen with already compressed jpg), use original or canvas re-encode
    let finalBlob: Blob = compressedFile;
    if (compressedFile.size >= originalSize && options.mode !== "targetSize") {
      finalBlob = file;
    }

    return {
      blob: finalBlob,
      outputName: file.name,
      outputSize: finalBlob.size,
      originalSize,
    };
  } catch (err) {
    console.warn("browser-image-compression failed, falling back to Canvas compression", err);
    return fallbackCanvasCompress(file, initialQuality, options.targetSizeMB);
  }
}

async function fallbackCanvasCompress(
  file: File,
  quality: number,
  targetSizeMB?: number
): Promise<CompressResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Could not initialize canvas context"));
        }
        ctx.drawImage(img, 0, 0);

        const mime = file.type.startsWith("image/") ? file.type : "image/jpeg";

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Failed to create image blob"));
            }
            resolve({
              blob,
              outputName: file.name,
              outputSize: blob.size,
              originalSize: file.size,
            });
          },
          mime,
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image into canvas"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
