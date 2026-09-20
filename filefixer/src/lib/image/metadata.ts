import exifr from "exifr";
import { SupportedImageFormat, getExtensionFromMime } from "../file-utils";

export interface DetailedExif {
  make?: string;
  model?: string;
  software?: string;
  dateTime?: string;
  artist?: string;
  copyright?: string;
  exposureTime?: string;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
  lensModel?: string;
  hasGps: boolean;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  gpsTimestamp?: string;
}

export async function readImageMetadata(file: File): Promise<DetailedExif | null> {
  try {
    const data = await exifr.parse(file, true);
    if (!data) return null;

    return {
      make: data.Make,
      model: data.Model,
      software: data.Software,
      dateTime: data.DateTimeOriginal ? new Date(data.DateTimeOriginal).toLocaleString() : undefined,
      artist: data.Artist,
      copyright: data.Copyright,
      exposureTime: data.ExposureTime ? `1/${Math.round(1 / data.ExposureTime)}s` : undefined,
      fNumber: data.FNumber,
      iso: data.ISO,
      focalLength: data.FocalLength,
      lensModel: data.LensModel,
      hasGps: Boolean(data.latitude || data.longitude),
      latitude: data.latitude,
      longitude: data.longitude,
      altitude: data.altitude,
      gpsTimestamp: data.GPSDateStamp,
    };
  } catch {
    return null;
  }
}

/**
 * Strips detectable EXIF and GPS metadata by drawing pixels to a clean canvas and exporting clean blob.
 */
export async function stripImageMetadata(
  file: File,
  quality = 0.95
): Promise<{ blob: Blob; outputFilename: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context failed"));

        // If target is JPEG and original had transparency, fill with white
        if (file.type === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        const mime = file.type || "image/jpeg";
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Failed to strip metadata"));
            const base = file.name.replace(/\.[^/.]+$/, "");
            const ext = file.name.split(".").pop() || "jpg";
            resolve({
              blob,
              outputFilename: `${base}_clean.${ext}`,
            });
          },
          mime,
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
