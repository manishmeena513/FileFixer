import { SupportedImageFormat, getExtensionFromMime } from "../file-utils";

export interface ConvertOptions {
  targetFormat: SupportedImageFormat;
  quality?: number; // 0.1 to 1.0 (for JPEG & WebP)
  backgroundColor?: string; // e.g. '#ffffff' for transparent PNG -> JPG
}

export async function convertImage(
  file: File,
  options: ConvertOptions
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
        if (!ctx) {
          return reject(new Error("Unable to create canvas context"));
        }

        // If target is JPEG, fill background with white (or custom) so transparent PNG doesn't turn black
        if (options.targetFormat === "image/jpeg") {
          ctx.fillStyle = options.backgroundColor || "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        const quality = options.quality ?? 0.92;
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Image conversion failed"));
            const base = file.name.replace(/\.[^/.]+$/, "");
            const ext = getExtensionFromMime(options.targetFormat);
            const outputFilename = `${base}.${ext}`;
            resolve({ blob, outputFilename });
          },
          options.targetFormat,
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load source image for conversion"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
