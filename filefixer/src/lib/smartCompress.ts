import imageCompression from "browser-image-compression";
import { PDFDocument } from "pdf-lib";
import { isPDFFile, isImageFile, fileToArrayBuffer } from "./file-utils";

export interface CompressionAttempt {
  attemptNumber: number;
  label: string;
  sizeBytes: number;
  success: boolean;
  blob?: Blob;
}

export interface SmartCompressResult {
  originalSize: number;
  targetSizeMB: number;
  targetSizeBytes: number;
  achieved: boolean;
  attempts: CompressionAttempt[];
  bestBlob: Blob;
  bestSize: number;
}

export async function smartCompress(
  file: File,
  targetSizeMB: number,
  onAttempt?: (attempt: CompressionAttempt) => void
): Promise<SmartCompressResult> {
  const originalSize = file.size;
  const targetSizeBytes = targetSizeMB * 1024 * 1024;
  const attempts: CompressionAttempt[] = [];

  // If already under target size
  if (originalSize <= targetSizeBytes) {
    const directAttempt: CompressionAttempt = {
      attemptNumber: 1,
      label: "Original file is already under target size",
      sizeBytes: originalSize,
      success: true,
      blob: file,
    };
    attempts.push(directAttempt);
    if (onAttempt) onAttempt(directAttempt);
    return {
      originalSize,
      targetSizeMB,
      targetSizeBytes,
      achieved: true,
      attempts,
      bestBlob: file,
      bestSize: originalSize,
    };
  }

  if (isPDFFile(file)) {
    return smartCompressPDF(file, targetSizeMB, onAttempt);
  }

  // Image passes
  const passes = [
    { label: "High Quality Pass (Quality 82%, Max 2560px)", quality: 0.82, maxDim: 2560 },
    { label: "Balanced Pass (Quality 68%, Max 2048px)", quality: 0.68, maxDim: 2048 },
    { label: "Strong Compression (Quality 52%, Max 1600px)", quality: 0.52, maxDim: 1600 },
    { label: "Target Optimization (Quality 40%, Max 1280px)", quality: 0.40, maxDim: 1280 },
    { label: "Extreme Optimization (Quality 28%, Max 1024px)", quality: 0.28, maxDim: 1024 },
  ];

  let bestBlob: Blob = file;
  let bestSize = originalSize;
  let achieved = false;

  for (let i = 0; i < passes.length; i++) {
    const pass = passes[i];
    try {
      const config = {
        maxSizeMB: targetSizeMB,
        maxWidthOrHeight: pass.maxDim,
        initialQuality: pass.quality,
        useWebWorker: true,
      };

      const compressed = await imageCompression(file, config);
      const isUnderTarget = compressed.size <= targetSizeBytes;

      const attemptResult: CompressionAttempt = {
        attemptNumber: i + 1,
        label: pass.label,
        sizeBytes: compressed.size,
        success: isUnderTarget,
        blob: compressed,
      };

      attempts.push(attemptResult);
      if (onAttempt) onAttempt(attemptResult);

      if (compressed.size < bestSize) {
        bestSize = compressed.size;
        bestBlob = compressed;
      }

      if (isUnderTarget) {
        achieved = true;
        break;
      }
    } catch (err) {
      console.warn(`Smart pass ${i + 1} failed:`, err);
    }
  }

  return {
    originalSize,
    targetSizeMB,
    targetSizeBytes,
    achieved,
    attempts,
    bestBlob,
    bestSize,
  };
}

async function smartCompressPDF(
  file: File,
  targetSizeMB: number,
  onAttempt?: (attempt: CompressionAttempt) => void
): Promise<SmartCompressResult> {
  const originalSize = file.size;
  const targetSizeBytes = targetSizeMB * 1024 * 1024;
  const attempts: CompressionAttempt[] = [];

  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  // Pass 1: Standard object stream re-encode with pdf-lib
  const compressedBytes1 = await pdfDoc.save({ useObjectStreams: true });
  const blob1 = new Blob([compressedBytes1 as unknown as BlobPart], { type: "application/pdf" });
  const isUnder1 = blob1.size <= targetSizeBytes;

  const attempt1: CompressionAttempt = {
    attemptNumber: 1,
    label: "Stream Optimization & Object Deduplication",
    sizeBytes: blob1.size,
    success: isUnder1,
    blob: blob1,
  };
  attempts.push(attempt1);
  if (onAttempt) onAttempt(attempt1);

  if (isUnder1) {
    return {
      originalSize,
      targetSizeMB,
      targetSizeBytes,
      achieved: true,
      attempts,
      bestBlob: blob1,
      bestSize: blob1.size,
    };
  }

  // Pass 2: Aggressive structural optimization
  const pdfDoc2 = await PDFDocument.create();
  const pageIndices = pdfDoc.getPageIndices();
  const copiedPages = await pdfDoc2.copyPages(pdfDoc, pageIndices);
  for (const page of copiedPages) {
    pdfDoc2.addPage(page);
  }
  const compressedBytes2 = await pdfDoc2.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 50,
  });
  const blob2 = new Blob([compressedBytes2 as unknown as BlobPart], { type: "application/pdf" });
  const isUnder2 = blob2.size <= targetSizeBytes;

  const attempt2: CompressionAttempt = {
    attemptNumber: 2,
    label: "Structural Hierarchy Compaction",
    sizeBytes: blob2.size,
    success: isUnder2,
    blob: blob2,
  };
  attempts.push(attempt2);
  if (onAttempt) onAttempt(attempt2);

  const bestBlob = blob2.size < blob1.size ? blob2 : blob1;
  const bestSize = bestBlob.size;

  return {
    originalSize,
    targetSizeMB,
    targetSizeBytes,
    achieved: isUnder2,
    attempts,
    bestBlob,
    bestSize,
  };
}
