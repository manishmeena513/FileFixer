import { PDFDocument } from "pdf-lib";
import { fileToArrayBuffer } from "../file-utils";

export async function mergePDFs(
  pdfFiles: File[],
  onProgress?: (current: number, total: number) => void
): Promise<{ blob: Blob; outputFilename: string; pageCount: number }> {
  if (pdfFiles.length < 2) {
    throw new Error("At least 2 PDF files are required for merging.");
  }

  const mergedPdf = await PDFDocument.create();
  let totalPages = 0;

  for (let i = 0; i < pdfFiles.length; i++) {
    const file = pdfFiles[i];
    const arrayBuffer = await fileToArrayBuffer(file);
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
      totalPages++;
    }

    if (onProgress) {
      onProgress(i + 1, pdfFiles.length);
    }
  }

  const mergedBytes = await mergedPdf.save();
  const blob = new Blob([mergedBytes as unknown as BlobPart], { type: "application/pdf" });

  return {
    blob,
    outputFilename: "merged_document.pdf",
    pageCount: totalPages,
  };
}
