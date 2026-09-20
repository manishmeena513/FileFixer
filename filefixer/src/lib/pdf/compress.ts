import { PDFDocument } from "pdf-lib";
import { fileToArrayBuffer } from "../file-utils";

export interface PdfCompressOptions {
  level: "balanced" | "smaller" | "custom";
  removeMetadata?: boolean;
}

export interface PdfCompressResult {
  blob: Blob;
  originalSize: number;
  outputSize: number;
  pageCount: number;
  savingsPct: number;
}

export async function compressPDF(
  file: File,
  options: PdfCompressOptions = { level: "balanced" }
): Promise<PdfCompressResult> {
  const originalSize = file.size;
  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const pageCount = pdfDoc.getPageCount();

  if (options.removeMetadata || options.level === "smaller") {
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");
  }

  // Create a clean new PDF document to discard dead objects and unreferenced streams
  const newPdf = await PDFDocument.create();
  const pageIndices = pdfDoc.getPageIndices();
  const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);

  for (const page of copiedPages) {
    newPdf.addPage(page);
  }

  // Save with optimal object streams
  const compressedBytes = await newPdf.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 50,
  });

  const blob = new Blob([compressedBytes as unknown as BlobPart], { type: "application/pdf" });
  const outputSize = blob.size;
  const savingsPct = originalSize > 0 ? ((originalSize - outputSize) / originalSize) * 100 : 0;

  return {
    blob,
    originalSize,
    outputSize,
    pageCount,
    savingsPct: Math.max(0, savingsPct),
  };
}
