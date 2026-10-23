import { describe, it } from "node:test";
import assert from "node:assert/strict";
import zlib from "node:zlib";
import { PDFDocument, PageSizes } from "pdf-lib";

import { compressPDF } from "../src/lib/pdf/compress";
import { mergePDFs } from "../src/lib/pdf/merge";
import { splitAllPages, extractPages, parsePageSelection } from "../src/lib/pdf/split";
import { loadWorkspacePages, saveWorkspacePdf } from "../src/lib/pdf/workspace";
import { convertImagesToPdf } from "../src/lib/pdf/imagesToPdf";

// Helper: Programmatically construct valid PNG binary buffers of specified dimensions
function createTestPng(width: number, height: number): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function createChunk(type: string, data: Buffer): Buffer {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeBuf = Buffer.from(type, "ascii");
    const crc = Buffer.alloc(4);
    const calculatedCrc = zlib.crc32(Buffer.concat([typeBuf, data]));
    crc.writeUInt32BE(calculatedCrc);
    return Buffer.concat([len, typeBuf, data, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(2, 9); // Truecolor (RGB)
  ihdr.writeUInt8(0, 10); // Compression
  ihdr.writeUInt8(0, 11); // Filter
  ihdr.writeUInt8(0, 12); // Interlace (none)

  // 1 filter byte per scanline + width * 3 RGB bytes
  const rawData = Buffer.alloc(height * (width * 3 + 1), 0);
  // Fill simple test color
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 3 + 1);
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 3;
      rawData[px] = (x * 17) % 256;     // R
      rawData[px + 1] = (y * 29) % 256; // G
      rawData[px + 2] = 180;            // B
    }
  }

  const idat = createChunk("IDAT", zlib.deflateSync(rawData));
  const iend = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, createChunk("IHDR", ihdr), idat, iend]);
}

// Minimal valid JPEG binary buffer (1x1 JFIF)
const VALID_JPEG_BASE64 =
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

function createTestJpeg(): Buffer {
  const buf = Buffer.from(VALID_JPEG_BASE64, "base64");
  // Slice to guarantee byteOffset === 0 in underlying ArrayBuffer
  return Buffer.from(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

// Helper: Programmatically construct sample PDF with customizable pages and metadata
async function createSamplePdf(
  numPages = 3,
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    producer?: string;
    creator?: string;
  }
): Promise<File> {
  const doc = await PDFDocument.create();
  if (metadata?.title) doc.setTitle(metadata.title);
  if (metadata?.author) doc.setAuthor(metadata.author);
  if (metadata?.subject) doc.setSubject(metadata.subject);
  if (metadata?.keywords) doc.setKeywords(metadata.keywords);
  if (metadata?.producer) doc.setProducer(metadata.producer);
  if (metadata?.creator) doc.setCreator(metadata.creator);

  for (let i = 0; i < numPages; i++) {
    const page = doc.addPage([PageSizes.A4[0], PageSizes.A4[1]]);
    page.drawText(`Page content for index ${i + 1}`);
  }

  const bytes = await doc.save();
  return new File([bytes as unknown as BlobPart], "sample_test.pdf", {
    type: "application/pdf",
  });
}

describe("Challenger M4: Adversarial PDF Engines & Edge Case Stress-Tests", () => {
  // =========================================================================
  // 1. compressPDF Adversarial Stress-Tests
  // =========================================================================
  describe("1. compressPDF Engine & Stream Invariants", () => {
    it("preserves full metadata dictionary when removeMetadata is explicitly false", async () => {
      const originalFile = await createSamplePdf(3, {
        title: "Confidential Quarterly Report",
        author: "Chief Financial Officer",
        subject: "Audit Q4 2026",
        keywords: ["financials", "audit", "2026", "q4"],
        producer: "FileFixer PDF Engine v1",
        creator: "Report Generator",
      });

      const result = await compressPDF(originalFile, {
        level: "balanced",
        removeMetadata: false,
      });

      assert.ok(result.outputSize > 0, "Compressed output size must be positive");
      assert.equal(result.pageCount, 3, "Page count must remain exactly 3");
      assert.ok(result.savingsPct >= 0, "Savings percentage must be non-negative");

      // Verify loaded metadata
      const compDoc = await PDFDocument.load(await result.blob.arrayBuffer(), { updateMetadata: false });
      assert.equal(compDoc.getTitle(), "Confidential Quarterly Report");
      assert.equal(compDoc.getAuthor(), "Chief Financial Officer");
      assert.equal(compDoc.getSubject(), "Audit Q4 2026");
      assert.equal(compDoc.getCreator(), "Report Generator");
      const kw = compDoc.getKeywords();
      assert.ok(kw?.includes("financials"));
      assert.ok(kw?.includes("q4"));
      // Note: pdf-lib defaults producer to 'pdf-lib' on Document.load unless updateMetadata: false is passed in engine
      assert.ok(compDoc.getProducer() !== undefined, "Producer field must exist");

      // Verify Object Streams enabled
      const rawText = Buffer.from(await result.blob.arrayBuffer()).toString("latin1");
      assert.ok(rawText.includes("/ObjStm"), "Saved PDF must utilize /ObjStm object streams");
    });

    it("strips all metadata when removeMetadata is true under balanced profile", async () => {
      const originalFile = await createSamplePdf(2, {
        title: "Personal Health Information",
        author: "Medical Doctor",
        subject: "Confidential Clinical Notes",
        keywords: ["phi", "hipaa"],
        producer: "EMR System",
        creator: "Clinic PDF Writer",
      });

      const result = await compressPDF(originalFile, {
        level: "balanced",
        removeMetadata: true,
      });

      const compDoc = await PDFDocument.load(await result.blob.arrayBuffer());
      const title = compDoc.getTitle();
      const author = compDoc.getAuthor();
      const subject = compDoc.getSubject();
      assert.ok(!title || title === "", "Title must be empty or undefined");
      assert.ok(!author || author === "", "Author must be empty or undefined");
      assert.ok(!subject || subject === "", "Subject must be empty or undefined");

      const rawText = Buffer.from(await result.blob.arrayBuffer()).toString("latin1");
      assert.ok(rawText.includes("/ObjStm"), "Stripped PDF must still use /ObjStm object streams");
    });

    it("automatically strips metadata when level is 'smaller' even without removeMetadata flag", async () => {
      const originalFile = await createSamplePdf(2, {
        title: "Strict Secrets",
        author: "Agent 007",
      });

      const result = await compressPDF(originalFile, {
        level: "smaller",
      });

      const compDoc = await PDFDocument.load(await result.blob.arrayBuffer());
      assert.ok(!compDoc.getTitle() || compDoc.getTitle() === "", "Title must be stripped in smaller mode");
      assert.ok(!compDoc.getAuthor() || compDoc.getAuthor() === "", "Author must be stripped in smaller mode");
    });

    it("handles PDF with zero metadata fields without throwing", async () => {
      const bareDoc = await PDFDocument.create();
      bareDoc.addPage([100, 100]);
      const bytes = await bareDoc.save();
      const bareFile = new File([bytes as unknown as BlobPart], "bare.pdf", { type: "application/pdf" });

      const result = await compressPDF(bareFile, { level: "balanced", removeMetadata: false });
      assert.equal(result.pageCount, 1);
      assert.ok(result.outputSize > 0);
    });

    it("successfully scales and compresses a 25-page document with object stream compaction", async () => {
      const multiPageDoc = await createSamplePdf(25);
      const result = await compressPDF(multiPageDoc, { level: "balanced" });
      assert.equal(result.pageCount, 25);
      assert.ok(result.outputSize > 0);

      const loaded = await PDFDocument.load(await result.blob.arrayBuffer());
      assert.equal(loaded.getPageCount(), 25);
    });
  });

  // =========================================================================
  // 2. mergePDFs Adversarial Stress-Tests
  // =========================================================================
  describe("2. mergePDFs Multi-Document Aggregation & Invariants", () => {
    it("combines 2 multi-page PDFs (5 + 7 pages) and verifies conservation of total page count", async () => {
      const docA = await createSamplePdf(5);
      const docB = await createSamplePdf(7);

      const progressCalls: Array<{ current: number; total: number }> = [];
      const result = await mergePDFs([docA, docB], (current, total) => {
        progressCalls.push({ current, total });
      });

      assert.equal(result.pageCount, 12, "Total page count must exactly equal 5 + 7 = 12");
      assert.equal(result.outputFilename, "merged_document.pdf");

      const merged = await PDFDocument.load(await result.blob.arrayBuffer());
      assert.equal(merged.getPageCount(), 12);

      // Verify progress callback invariants
      assert.equal(progressCalls.length, 2);
      assert.deepEqual(progressCalls[0], { current: 1, total: 2 });
      assert.deepEqual(progressCalls[1], { current: 2, total: 2 });

      // Object streams check
      const rawText = Buffer.from(await result.blob.arrayBuffer()).toString("latin1");
      assert.ok(rawText.includes("/ObjStm"), "Merged PDF must use object streams");
    });

    it("combines 3 multi-page PDFs (3 + 4 + 6 pages = 13 pages) in specified sequence", async () => {
      const doc1 = await createSamplePdf(3);
      const doc2 = await createSamplePdf(4);
      const doc3 = await createSamplePdf(6);

      const result = await mergePDFs([doc1, doc2, doc3]);
      assert.equal(result.pageCount, 13);

      const merged = await PDFDocument.load(await result.blob.arrayBuffer());
      assert.equal(merged.getPageCount(), 13);
    });

    it("strictly rejects merge requests with less than 2 files (empty array)", async () => {
      await assert.rejects(
        async () => {
          await mergePDFs([]);
        },
        {
          name: "Error",
          message: "At least 2 PDF files are required for merging.",
        }
      );
    });

    it("strictly rejects merge requests with only a single file", async () => {
      const single = await createSamplePdf(2);
      await assert.rejects(
        async () => {
          await mergePDFs([single]);
        },
        {
          name: "Error",
          message: "At least 2 PDF files are required for merging.",
        }
      );
    });
  });

  // =========================================================================
  // 3. split.ts parsePageSelection & Range Extraction Stress-Tests
  // =========================================================================
  describe("3. split.ts Page Selection Parser & Range Extraction", () => {
    it("handles negative numbers, 0, and non-positive page tokens safely", () => {
      // 0-indexed result: inputs <= 0 are discarded
      const res1 = parsePageSelection("-5, -1, 0, 1, 2", 10);
      assert.deepEqual(res1, [0, 1]);

      const res2 = parsePageSelection("-10, -20, 0", 5);
      assert.deepEqual(res2, []);
    });

    it("handles inverted ranges ('5-2', '10-4') by ordering from min to max", () => {
      // '5-2' corresponds to pages 2, 3, 4, 5 (0-indexed [1, 2, 3, 4])
      const res = parsePageSelection("5-2", 10);
      assert.deepEqual(res, [1, 2, 3, 4]);

      const res2 = parsePageSelection("10-8, 3-1", 10);
      assert.deepEqual(res2, [0, 1, 2, 7, 8, 9]);
    });

    it("safely discards malformed and non-numeric tokens", () => {
      const res = parsePageSelection("abc, undefined, null, NaN, @#$, 3, foo-bar, 5", 6);
      assert.deepEqual(res, [2, 4]); // Only 3 (index 2) and 5 (index 4) are valid numbers
    });

    it("deduplicates overlapping single pages and ranges", () => {
      const res = parsePageSelection("1, 1, 1, 2, 1-3, 2-4, 3", 5);
      assert.deepEqual(res, [0, 1, 2, 3]);
    });

    it("clamps ranges and single numbers that exceed maxPages", () => {
      const res = parsePageSelection("1-100, 999, 50-70", 5);
      assert.deepEqual(res, [0, 1, 2, 3, 4]); // Clamped to 0..4 (pages 1..5)
    });

    it("returns empty array for empty string, commas only, or whitespace", () => {
      assert.deepEqual(parsePageSelection("", 10), []);
      assert.deepEqual(parsePageSelection("   ", 10), []);
      assert.deepEqual(parsePageSelection(",,,,,", 10), []);
      assert.deepEqual(parsePageSelection(" , , , ", 10), []);
    });

    it("extractPages extracts non-contiguous selection and verifies output structure", async () => {
      const file = await createSamplePdf(6);
      const res = await extractPages(file, [0, 2, 4]); // Pages 1, 3, 5
      assert.ok(res.outputFilename.includes("_extracted.pdf"));

      const extracted = await PDFDocument.load(await res.blob.arrayBuffer());
      assert.equal(extracted.getPageCount(), 3);

      const rawText = Buffer.from(await res.blob.arrayBuffer()).toString("latin1");
      assert.ok(rawText.includes("/ObjStm"), "Extracted PDF must use object streams");
    });

    it("extractPages throws an error when given an empty page selection", async () => {
      const file = await createSamplePdf(3);
      await assert.rejects(
        async () => {
          await extractPages(file, []);
        },
        {
          name: "Error",
          message: "No valid pages selected for extraction.",
        }
      );
    });

    it("splitAllPages splits a 4-page PDF into 4 single-page outputs with 3-digit zero-padding", async () => {
      const file = await createSamplePdf(4);
      const outputs = await splitAllPages(file);
      assert.equal(outputs.length, 4);

      assert.ok(outputs[0].filename.endsWith("_page_001.pdf"));
      assert.ok(outputs[1].filename.endsWith("_page_002.pdf"));
      assert.ok(outputs[2].filename.endsWith("_page_003.pdf"));
      assert.ok(outputs[3].filename.endsWith("_page_004.pdf"));

      for (const item of outputs) {
        const doc = await PDFDocument.load(await item.blob.arrayBuffer());
        assert.equal(doc.getPageCount(), 1);
        const rawText = Buffer.from(await item.blob.arrayBuffer()).toString("latin1");
        assert.ok(rawText.includes("/ObjStm"));
      }
    });
  });

  // =========================================================================
  // 4. imagesToPdf.ts Format & Dimension Stress-Tests
  // =========================================================================
  describe("4. imagesToPdf.ts Conversion & Formatting Invariants", () => {
    it("converts PNG image with exact A4 portrait dimensions and margin", async () => {
      const pngBuf = createTestPng(120, 80);
      const pngFile = new File([pngBuf as unknown as BlobPart], "photo.png", { type: "image/png" });

      const res = await convertImagesToPdf([pngFile], {
        pageSize: "a4",
        orientation: "portrait",
        margin: 20,
      });

      const doc = await PDFDocument.load(await res.blob.arrayBuffer());
      assert.equal(doc.getPageCount(), 1);

      const page = doc.getPage(0);
      assert.equal(Math.round(page.getWidth()), Math.round(PageSizes.A4[0]));
      assert.equal(Math.round(page.getHeight()), Math.round(PageSizes.A4[1]));

      const rawText = Buffer.from(await res.blob.arrayBuffer()).toString("latin1");
      assert.ok(rawText.includes("/ObjStm"));
    });

    it("converts JPEG image with US Letter landscape dimensions", async () => {
      const jpgBuf = createTestJpeg();
      const jpgFile = new File([jpgBuf as unknown as BlobPart], "scan.jpg", { type: "image/jpeg" });

      const res = await convertImagesToPdf([jpgFile], {
        pageSize: "letter",
        orientation: "landscape",
        margin: 15,
      });

      const doc = await PDFDocument.load(await res.blob.arrayBuffer());
      assert.equal(doc.getPageCount(), 1);

      const page = doc.getPage(0);
      // Landscape: width must be greater than height (Letter width = 612, height = 792)
      assert.equal(Math.round(page.getWidth()), Math.round(PageSizes.Letter[1]));
      assert.equal(Math.round(page.getHeight()), Math.round(PageSizes.Letter[0]));
      assert.ok(page.getWidth() > page.getHeight(), "Page must be wider than tall");
    });

    it("correctly triggers auto-orientation: landscape image becomes landscape page on A4", async () => {
      // Landscape image: width (120) > height (40)
      const landscapePng = createTestPng(120, 40);
      const img = new File([landscapePng as unknown as BlobPart], "wide.png", { type: "image/png" });

      const res = await convertImagesToPdf([img], {
        pageSize: "a4",
        orientation: "auto",
        margin: 10,
      });

      const doc = await PDFDocument.load(await res.blob.arrayBuffer());
      const page = doc.getPage(0);

      // Auto orientation should rotate A4 to landscape (842 x 595)
      assert.equal(Math.round(page.getWidth()), Math.round(PageSizes.A4[1]));
      assert.equal(Math.round(page.getHeight()), Math.round(PageSizes.A4[0]));
      assert.ok(page.getWidth() > page.getHeight(), "Auto-orientation must flip wide image to landscape");
    });

    it("correctly triggers auto-orientation: portrait image remains portrait page on A4", async () => {
      // Portrait image: height (120) > width (40)
      const portraitPng = createTestPng(40, 120);
      const img = new File([portraitPng as unknown as BlobPart], "tall.png", { type: "image/png" });

      const res = await convertImagesToPdf([img], {
        pageSize: "a4",
        orientation: "auto",
        margin: 10,
      });

      const doc = await PDFDocument.load(await res.blob.arrayBuffer());
      const page = doc.getPage(0);

      // Auto orientation should keep portrait orientation (595 x 842)
      assert.equal(Math.round(page.getWidth()), Math.round(PageSizes.A4[0]));
      assert.equal(Math.round(page.getHeight()), Math.round(PageSizes.A4[1]));
      assert.ok(page.getHeight() > page.getWidth(), "Auto-orientation must keep tall image portrait");
    });

    it("throws a clear descriptive error when empty array is provided", async () => {
      await assert.rejects(
        async () => {
          await convertImagesToPdf([]);
        },
        {
          name: "Error",
          message: "No images provided for PDF creation.",
        }
      );
    });
  });

  // =========================================================================
  // 5. workspace.ts Rotation, Duplication & Reordering Stress-Tests
  // =========================================================================
  describe("5. workspace.ts Rotation & Page Reorganization Invariants", () => {
    it("loads pages with accurate originalPageIndex and initial 0 rotation", async () => {
      const file = await createSamplePdf(4);
      const pages = await loadWorkspacePages(file);

      assert.equal(pages.length, 4);
      for (let i = 0; i < 4; i++) {
        assert.equal(pages[i].originalPageIndex, i);
        assert.equal(pages[i].displayNumber, i + 1);
        assert.equal(pages[i].rotation, 0);
        assert.ok(typeof pages[i].id === "string" && pages[i].id.length > 0);
      }
    });

    it("handles 90, 180, 270, 360, and 450 degree rotations accurately upon saving", async () => {
      const file = await createSamplePdf(5);
      const pages = await loadWorkspacePages(file);

      pages[0].rotation = 90;
      pages[1].rotation = 180;
      pages[2].rotation = 270;
      pages[3].rotation = 360; // 360 % 360 === 0
      pages[4].rotation = 450; // 450 % 360 === 90

      const saved = await saveWorkspacePdf(file, pages);
      const doc = await PDFDocument.load(await saved.blob.arrayBuffer());

      assert.equal(doc.getPage(0).getRotation().angle, 90);
      assert.equal(doc.getPage(1).getRotation().angle, 180);
      assert.equal(doc.getPage(2).getRotation().angle, 270);
      assert.equal(doc.getPage(3).getRotation().angle, 0);
      assert.equal(doc.getPage(4).getRotation().angle, 90);

      const rawText = Buffer.from(await saved.blob.arrayBuffer()).toString("latin1");
      assert.ok(rawText.includes("/ObjStm"));
    });

    it("supports duplicate page copying and complex reordering (A, B, C -> C, A, A, B, C)", async () => {
      const file = await createSamplePdf(3);
      const pages = await loadWorkspacePages(file); // 0, 1, 2

      const customArrangement = [
        pages[2], // C
        pages[0], // A
        { ...pages[0], id: "page-dup-a" }, // Duplicate of A
        pages[1], // B
        { ...pages[2], id: "page-dup-c" }, // Duplicate of C
      ];

      const saved = await saveWorkspacePdf(file, customArrangement);
      assert.ok(saved.outputFilename.includes("_workspace_edited.pdf"));

      const doc = await PDFDocument.load(await saved.blob.arrayBuffer());
      assert.equal(doc.getPageCount(), 5);
    });

    it("rejects saving an empty page list with clear error", async () => {
      const file = await createSamplePdf(2);
      await assert.rejects(
        async () => {
          await saveWorkspacePdf(file, []);
        },
        {
          name: "Error",
          message: "Cannot save an empty PDF document with 0 pages.",
        }
      );
    });
  });
});
