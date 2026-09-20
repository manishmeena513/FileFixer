import { resizeImage } from "../image/resize";
import { convertImage } from "../image/convert";
import { compressImage } from "../image/compress";
import { SupportedImageFormat, getExtensionFromMime } from "../file-utils";

export interface BatchPipelineConfig {
  resizeEnabled: boolean;
  targetWidth?: number;
  targetHeight?: number;
  maintainAspectRatio?: boolean;

  convertEnabled: boolean;
  targetFormat?: SupportedImageFormat;

  compressEnabled: boolean;
  qualityPct?: number; // e.g. 80

  renamePattern?: string; // e.g. "Project_###"
  startNumber?: number;
}

export interface BatchItemResult {
  id: string;
  originalName: string;
  outputName: string;
  originalSize: number;
  outputSize: number;
  blob: Blob;
  status: "done" | "error";
  error?: string;
}

export async function processBatchItem(
  file: File,
  index: number,
  config: BatchPipelineConfig
): Promise<BatchItemResult> {
  const originalSize = file.size;
  let currentFile: File = file;
  let currentBlob: Blob = file;

  try {
    // 1. Resize if enabled
    if (config.resizeEnabled && config.targetWidth && config.targetHeight) {
      const resizeRes = await resizeImage(currentFile, {
        width: config.targetWidth,
        height: config.targetHeight,
        maintainAspectRatio: config.maintainAspectRatio ?? true,
        fitMode: "cover",
      });
      currentBlob = resizeRes.blob;
      currentFile = new File([currentBlob], currentFile.name, { type: currentBlob.type });
    }

    // 2. Convert if enabled
    if (config.convertEnabled && config.targetFormat) {
      const convertRes = await convertImage(currentFile, {
        targetFormat: config.targetFormat,
        quality: (config.qualityPct ?? 85) / 100,
      });
      currentBlob = convertRes.blob;
      currentFile = new File([currentBlob], convertRes.outputFilename, { type: config.targetFormat });
    }

    // 3. Compress if enabled
    if (config.compressEnabled) {
      const compressRes = await compressImage(currentFile, {
        mode: "quality",
        quality: (config.qualityPct ?? 80) / 100,
      });
      currentBlob = compressRes.blob;
    }

    // 4. Determine output filename based on renaming pattern
    let outputName = currentFile.name;
    if (config.renamePattern) {
      const ext = config.convertEnabled && config.targetFormat
        ? getExtensionFromMime(config.targetFormat)
        : currentFile.name.split(".").pop() || "jpg";

      const num = (config.startNumber ?? 1) + index;
      const hashMatch = config.renamePattern.match(/#+/);
      const padding = hashMatch ? hashMatch[0].length : 3;
      const paddedNum = String(num).padStart(padding, "0");
      const base = config.renamePattern.replace(/#+/, paddedNum);
      outputName = `${base}.${ext}`;
    }

    return {
      id: `${Date.now()}-${index}`,
      originalName: file.name,
      outputName,
      originalSize,
      outputSize: currentBlob.size,
      blob: currentBlob,
      status: "done",
    };
  } catch (err: any) {
    return {
      id: `${Date.now()}-${index}`,
      originalName: file.name,
      outputName: file.name,
      originalSize,
      outputSize: originalSize,
      blob: file,
      status: "error",
      error: err.message || "Failed in batch pipeline",
    };
  }
}
