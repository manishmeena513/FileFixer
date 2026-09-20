import { ResizePreset } from "@/types";

export const RESIZE_PRESETS: ResizePreset[] = [
  { label: "Instagram Post (Square)", width: 1080, height: 1080, category: "Social Media" },
  { label: "Instagram Story / Reel", width: 1080, height: 1920, category: "Social Media" },
  { label: "YouTube Thumbnail", width: 1280, height: 720, category: "Video" },
  { label: "YouTube Banner", width: 2560, height: 1440, category: "Video" },
  { label: "WhatsApp Profile", width: 500, height: 500, category: "Social Media" },
  { label: "LinkedIn Cover", width: 1584, height: 396, category: "Professional" },
  { label: "Passport Photo", width: 600, height: 600, category: "Documents" },
  { label: "Twitter / X Post", width: 1200, height: 675, category: "Social Media" },
  { label: "Facebook Cover", width: 820, height: 312, category: "Social Media" },
];

export interface ResizeOptions {
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  fitMode?: "contain" | "cover" | "stretch";
  quality?: number; // 0.1 to 1.0
  format?: string; // image/jpeg, image/png, image/webp
}

export async function resizeImage(file: File, options: ResizeOptions): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let targetW = options.width;
        let targetH = options.height;

        if (options.maintainAspectRatio && (!targetW || !targetH)) {
          const ratio = img.naturalWidth / img.naturalHeight;
          if (targetW && !targetH) {
            targetH = Math.round(targetW / ratio);
          } else if (targetH && !targetW) {
            targetW = Math.round(targetH * ratio);
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Unable to create canvas context"));
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        if (options.fitMode === "contain") {
          // Letterbox / pillarbox if aspect ratio is preserved
          const hRatio = targetW / img.naturalWidth;
          const vRatio = targetH / img.naturalHeight;
          const ratio = Math.min(hRatio, vRatio);
          const centerShiftX = (targetW - img.naturalWidth * ratio) / 2;
          const centerShiftY = (targetH - img.naturalHeight * ratio) / 2;
          ctx.clearRect(0, 0, targetW, targetH);
          ctx.drawImage(
            img,
            0,
            0,
            img.naturalWidth,
            img.naturalHeight,
            centerShiftX,
            centerShiftY,
            img.naturalWidth * ratio,
            img.naturalHeight * ratio
          );
        } else if (options.fitMode === "cover") {
          const hRatio = targetW / img.naturalWidth;
          const vRatio = targetH / img.naturalHeight;
          const ratio = Math.max(hRatio, vRatio);
          const centerShiftX = (targetW - img.naturalWidth * ratio) / 2;
          const centerShiftY = (targetH - img.naturalHeight * ratio) / 2;
          ctx.drawImage(
            img,
            0,
            0,
            img.naturalWidth,
            img.naturalHeight,
            centerShiftX,
            centerShiftY,
            img.naturalWidth * ratio,
            img.naturalHeight * ratio
          );
        } else {
          ctx.drawImage(img, 0, 0, targetW, targetH);
        }

        const mime = options.format || file.type || "image/jpeg";
        const quality = options.quality ?? 0.92;

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Failed to export resized image"));
            resolve({ blob, width: targetW, height: targetH });
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
