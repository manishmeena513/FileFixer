import { PDFDocument, PDFName } from "pdf-lib";
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

  const shouldStripMetadata = Boolean(options.removeMetadata || options.level === "smaller");

  if (shouldStripMetadata) {
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

  // Preserve document metadata unless stripping is requested
  if (!shouldStripMetadata) {
    const title = pdfDoc.getTitle();
    if (title !== undefined) newPdf.setTitle(title);
    const author = pdfDoc.getAuthor();
    if (author !== undefined) newPdf.setAuthor(author);
    const subject = pdfDoc.getSubject();
    if (subject !== undefined) newPdf.setSubject(subject);
    const keywords = pdfDoc.getKeywords();
    if (keywords !== undefined && keywords.length > 0) {
      const kwList = Array.isArray(keywords)
        ? keywords
        : typeof keywords === "string"
        ? keywords.split(" ").filter(Boolean)
        : [String(keywords)];
      if (kwList.length > 0) {
        newPdf.setKeywords(kwList);
      }
    }
    const producer = pdfDoc.getProducer();
    if (producer !== undefined) newPdf.setProducer(producer);
    const creator = pdfDoc.getCreator();
    if (creator !== undefined) newPdf.setCreator(creator);
  } else {
    newPdf.setTitle("");
    newPdf.setAuthor("");
    newPdf.setSubject("");
    newPdf.setKeywords([]);
    newPdf.setProducer("");
    newPdf.setCreator("");
    try {
      const infoDict = (newPdf as any).getInfoDict?.();
      if (infoDict && typeof infoDict.delete === "function") {
        infoDict.delete(PDFName.of("Producer"));
      }
    } catch {
      // Ignore if infoDict is unavailable
    }
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
