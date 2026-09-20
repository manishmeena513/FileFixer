import { PDFDocument } from "pdf-lib";
import { fileToArrayBuffer } from "../file-utils";

export interface PageRange {
  start: number; // 1-indexed
  end: number;   // 1-indexed
}

/**
 * Parses a string like "1-3, 5, 8-10" into 0-indexed page numbers.
 */
export function parsePageSelection(input: string, maxPages: number): number[] {
  const pages = new Set<number>();
  const parts = input.split(",").map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-").map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(maxPages, Math.max(start, end));
        for (let i = from; i <= to; i++) {
          pages.add(i - 1); // 0-indexed
        }
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= 1 && num <= maxPages) {
        pages.add(num - 1); // 0-indexed
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export async function getPdfPageCount(file: File): Promise<number> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  return pdfDoc.getPageCount();
}

/**
 * Extracts specified pages (0-indexed) into a new single PDF.
 */
export async function extractPages(
  file: File,
  pageIndices: number[]
): Promise<{ blob: Blob; outputFilename: string }> {
  if (pageIndices.length === 0) {
    throw new Error("No valid pages selected for extraction.");
  }

  const arrayBuffer = await fileToArrayBuffer(file);
  const sourcePdf = await PDFDocument.load(arrayBuffer);
  const newPdf = await PDFDocument.create();

  const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
  for (const page of copiedPages) {
    newPdf.addPage(page);
  }

  const pdfBytes = await newPdf.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  const baseName = file.name.replace(/\.[^/.]+$/, "");

  return {
    blob,
    outputFilename: `${baseName}_extracted.pdf`,
  };
}

/**
 * Splits a PDF into multiple individual single-page PDFs.
 */
export async function splitAllPages(
  file: File
): Promise<Array<{ filename: string; blob: Blob }>> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const sourcePdf = await PDFDocument.load(arrayBuffer);
  const total = sourcePdf.getPageCount();
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const results: Array<{ filename: string; blob: Blob }> = [];

  for (let i = 0; i < total; i++) {
    const singlePdf = await PDFDocument.create();
    const [page] = await singlePdf.copyPages(sourcePdf, [i]);
    singlePdf.addPage(page);
    const bytes = await singlePdf.save();
    const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
    const pageNumStr = String(i + 1).padStart(3, "0");
    results.push({
      filename: `${baseName}_page_${pageNumStr}.pdf`,
      blob,
    });
  }

  return results;
}
