import exifr from "exifr";

export interface DetailedExif {
  // Camera & Hardware
  make?: string;
  model?: string;
  software?: string;
  lensModel?: string;
  lensMake?: string;
  artist?: string;
  copyright?: string;

  // Exposure & Sensor
  dateTime?: string;
  exposureTime?: string;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
  focalLengthIn35mm?: number;
  flash?: string;
  whiteBalance?: string;

  // Image Geometry
  imageWidth?: number;
  imageHeight?: number;
  megapixels?: string;

  // GPS Location
  hasGps: boolean;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  gpsTimestamp?: string;
  dmsLatitude?: string;
  dmsLongitude?: string;

  // Tag count
  rawTagCount: number;
}

export function formatShutterSpeed(seconds: number | undefined): string | undefined {
  if (seconds === undefined || isNaN(seconds) || seconds <= 0) return undefined;
  if (seconds >= 1) {
    return `${seconds.toFixed(1).replace(/\.0$/, "")}s`;
  }
  const denominator = Math.round(1 / seconds);
  return `1/${denominator}s`;
}

export function toDMS(deg: number, isLat: boolean): string {
  const absolute = Math.abs(deg);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
  const direction = isLat ? (deg >= 0 ? "N" : "S") : (deg >= 0 ? "E" : "W");
  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

export async function readImageMetadata(file: File): Promise<DetailedExif | null> {
  try {
    const data = await exifr.parse(file, true);
    if (!data) return null;

    const hasGps =
      typeof data.latitude === "number" &&
      typeof data.longitude === "number" &&
      !isNaN(data.latitude) &&
      !isNaN(data.longitude);

    const dmsLat = hasGps ? toDMS(data.latitude, true) : undefined;
    const dmsLon = hasGps ? toDMS(data.longitude, false) : undefined;

    const imgW = data.ImageWidth || data.ExifImageWidth;
    const imgH = data.ImageHeight || data.ExifImageHeight;
    let megapixels: string | undefined = undefined;
    if (imgW && imgH) {
      megapixels = `${((imgW * imgH) / 1000000).toFixed(2)} MP`;
    }

    const rawTagCount = Object.keys(data).length;

    return {
      make: data.Make,
      model: data.Model,
      software: data.Software,
      lensModel: data.LensModel,
      lensMake: data.LensMake,
      artist: data.Artist,
      copyright: data.Copyright,
      dateTime: data.DateTimeOriginal
        ? new Date(data.DateTimeOriginal).toLocaleString()
        : data.DateTime
        ? new Date(data.DateTime).toLocaleString()
        : undefined,
      exposureTime: formatShutterSpeed(data.ExposureTime),
      fNumber: data.FNumber,
      iso: data.ISO,
      focalLength: data.FocalLength,
      focalLengthIn35mm: data.FocalLengthIn35mmFormat,
      flash: data.Flash,
      whiteBalance: data.WhiteBalance,
      imageWidth: imgW,
      imageHeight: imgH,
      megapixels,
      hasGps,
      latitude: data.latitude,
      longitude: data.longitude,
      altitude: data.altitude,
      gpsTimestamp:
        data.GPSDateStamp ||
        (data.GPSTimeStamp ? String(data.GPSTimeStamp) : undefined),
      dmsLatitude: dmsLat,
      dmsLongitude: dmsLon,
      rawTagCount,
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
