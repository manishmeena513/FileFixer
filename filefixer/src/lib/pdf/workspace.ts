import { PDFDocument, degrees } from "pdf-lib";
import { fileToArrayBuffer } from "../file-utils";

export interface WorkspacePage {
  id: string;
  originalPageIndex: number; // 0-indexed in source PDF
  displayNumber: number;
  rotation: number; // 0, 90, 180, 270
}

export async function loadWorkspacePages(file: File): Promise<WorkspacePage[]> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const count = pdfDoc.getPageCount();

  const pages: WorkspacePage[] = [];
  for (let i = 0; i < count; i++) {
    const page = pdfDoc.getPage(i);
    const existingRotation = page.getRotation().angle;
    pages.push({
      id: `page-${i + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      originalPageIndex: i,
      displayNumber: i + 1,
      rotation: existingRotation,
    });
  }

  return pages;
}

export async function saveWorkspacePdf(
  file: File,
  pages: WorkspacePage[]
): Promise<{ blob: Blob; outputFilename: string }> {
  if (pages.length === 0) {
    throw new Error("Cannot save an empty PDF document with 0 pages.");
  }

  const arrayBuffer = await fileToArrayBuffer(file);
  const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();

  // We can copy pages from sourcePdf for each page in workspace (including duplicates)
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const [copiedPage] = await newPdf.copyPages(sourcePdf, [p.originalPageIndex]);
    
    // Set custom rotation
    copiedPage.setRotation(degrees(p.rotation % 360));
    newPdf.addPage(copiedPage);
  }

  const newBytes = await newPdf.save({ useObjectStreams: true });
  const blob = new Blob([newBytes as unknown as BlobPart], { type: "application/pdf" });
  const base = file.name.replace(/\.[^/.]+$/, "");

  return {
    blob,
    outputFilename: `${base}_workspace_edited.pdf`,
  };
}
