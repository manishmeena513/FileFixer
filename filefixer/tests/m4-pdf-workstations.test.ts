import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, PageSizes } from "pdf-lib";

import { compressPDF } from "../src/lib/pdf/compress";
import { mergePDFs } from "../src/lib/pdf/merge";
import { splitAllPages, extractPages, parsePageSelection } from "../src/lib/pdf/split";
import { loadWorkspacePages, saveWorkspacePdf } from "../src/lib/pdf/workspace";
import { convertImagesToPdf } from "../src/lib/pdf/imagesToPdf";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const PDF_WORKSTATION_FILES = [
  "src/app/pdf-merge/page.tsx",
  "src/app/pdf-split/page.tsx",
  "src/app/pdf-compress/page.tsx",
  "src/app/pdf-workspace/page.tsx",
  "src/app/images-to-pdf/page.tsx",
  "src/app/pdf-studio/page.tsx",
];

// Helper: 1x1 transparent PNG data
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function createSamplePdf(numPages = 3, metadata?: { title?: string; author?: string; subject?: string; keywords?: string[] }): Promise<File> {
  const doc = await PDFDocument.create();
  if (metadata?.title) doc.setTitle(metadata.title);
  if (metadata?.author) doc.setAuthor(metadata.author);
  if (metadata?.subject) doc.setSubject(metadata.subject);
  if (metadata?.keywords) doc.setKeywords(metadata.keywords);

  for (let i = 0; i < numPages; i++) {
    const page = doc.addPage([PageSizes.A4[0], PageSizes.A4[1]]);
    page.drawText(`Sample Page ${i + 1}`);
  }

  const bytes = await doc.save();
  return new File([bytes as unknown as BlobPart], "test_document.pdf", { type: "application/pdf" });
}

describe("Milestone 4: Comprehensive PDF Workstations Test Suite", () => {
  // --------------------------------------------------------------------------
  // 1. PDF Compression Engine (compressPDF)
  // --------------------------------------------------------------------------
  describe("1. PDF Compression Engine (compressPDF)", () => {
    it("preserves metadata when removeMetadata is false and level is balanced", async () => {
      const file = await createSamplePdf(2, {
        title: "Quarterly Audit",
        author: "Finance Team",
        subject: "Q3 Results",
        keywords: ["finance", "audit", "2026"],
      });

      const result = await compressPDF(file, { level: "balanced", removeMetadata: false });
      assert.ok(result.blob.size > 0, "Compressed blob size must be > 0");
      assert.equal(result.pageCount, 2, "Page count must remain 2");
      assert.ok(typeof result.savingsPct === "number", "Savings percentage must be a number");
      assert.ok(result.savingsPct >= 0, "Savings percentage must be >= 0");

      const compDoc = await PDFDocument.load(await result.blob.arrayBuffer());
      assert.equal(compDoc.getTitle(), "Quarterly Audit", "Document title must be preserved");
      assert.equal(compDoc.getAuthor(), "Finance Team", "Document author must be preserved");
      assert.equal(compDoc.getSubject(), "Q3 Results", "Document subject must be preserved");
      const kw = compDoc.getKeywords();
      assert.ok(kw?.includes("finance"), "Keywords must be preserved");
    });

    it("strips metadata when removeMetadata is true or level is smaller", async () => {
      const file = await createSamplePdf(2, {
        title: "Confidential Strategy",
        author: "Executive",
        subject: "Secret",
        keywords: ["secret"],
      });

      const result = await compressPDF(file, { level: "smaller", removeMetadata: true });
      const compDoc = await PDFDocument.load(await result.blob.arrayBuffer());
      const title = compDoc.getTitle();
      const author = compDoc.getAuthor();
      assert.ok(!title || title === "", "Title must be stripped");
      assert.ok(!author || author === "", "Author must be stripped");
    });

    it("calculates accurate before/after size and nonnegative savingsPct", async () => {
      const file = await createSamplePdf(3);
      const result = await compressPDF(file, { level: "balanced" });
      assert.equal(result.originalSize, file.size);
      assert.equal(result.outputSize, result.blob.size);
      assert.ok(result.savingsPct >= 0 && result.savingsPct <= 100);
    });
  });

  // --------------------------------------------------------------------------
  // 2. PDF Workspace Engine (loadWorkspacePages & saveWorkspacePdf)
  // --------------------------------------------------------------------------
  describe("2. PDF Workspace Engine", () => {
    it("loads pages with 0-based indices and unique identifiers", async () => {
      const file = await createSamplePdf(3);
      const pages = await loadWorkspacePages(file);
      assert.equal(pages.length, 3);
      assert.equal(pages[0].originalPageIndex, 0);
      assert.equal(pages[1].originalPageIndex, 1);
      assert.equal(pages[2].originalPageIndex, 2);
      assert.equal(pages[0].rotation, 0);
      assert.ok(pages[0].id !== pages[1].id, "Page IDs must be unique");
    });

    it("applies 90, 180, and 270 degree rotations accurately upon saving", async () => {
      const file = await createSamplePdf(3);
      const pages = await loadWorkspacePages(file);
      pages[0].rotation = 90;
      pages[1].rotation = 180;
      pages[2].rotation = 270;

      const saved = await saveWorkspacePdf(file, pages);
      assert.ok(saved.outputFilename.includes("_workspace_edited.pdf"));

      const savedDoc = await PDFDocument.load(await saved.blob.arrayBuffer());
      assert.equal(savedDoc.getPageCount(), 3);
      assert.equal(savedDoc.getPage(0).getRotation().angle, 90);
      assert.equal(savedDoc.getPage(1).getRotation().angle, 180);
      assert.equal(savedDoc.getPage(2).getRotation().angle, 270);
    });

    it("supports page duplication and reordering", async () => {
      const file = await createSamplePdf(2);
      const pages = await loadWorkspacePages(file);
      // Reorder and duplicate page 0
      const reorderedAndDuplicated = [
        pages[1], // Page 2 first
        pages[0], // Page 1 second
        { ...pages[0], id: "page-dup-1" }, // Duplicate of Page 1 third
      ];

      const saved = await saveWorkspacePdf(file, reorderedAndDuplicated);
      const savedDoc = await PDFDocument.load(await saved.blob.arrayBuffer());
      assert.equal(savedDoc.getPageCount(), 3);
    });

    it("throws an error when saving an empty page list", async () => {
      const file = await createSamplePdf(1);
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

  // --------------------------------------------------------------------------
  // 3. Images to PDF Conversion (convertImagesToPdf)
  // --------------------------------------------------------------------------
  describe("3. Images to PDF Engine", () => {
    it("converts multiple images into standard A4 PDF pages with margin", async () => {
      const pngBuffer = Buffer.from(TINY_PNG_BASE64, "base64");
      const img1 = new File([pngBuffer], "photo1.png", { type: "image/png" });
      const img2 = new File([pngBuffer], "photo2.png", { type: "image/png" });

      const res = await convertImagesToPdf([img1, img2], {
        pageSize: "a4",
        orientation: "portrait",
        margin: 20,
      });

      assert.equal(res.outputFilename, "images_document.pdf");
      const pdf = await PDFDocument.load(await res.blob.arrayBuffer());
      assert.equal(pdf.getPageCount(), 2);

      const p1 = pdf.getPage(0);
      assert.equal(Math.round(p1.getWidth()), Math.round(PageSizes.A4[0]));
      assert.equal(Math.round(p1.getHeight()), Math.round(PageSizes.A4[1]));
    });

    it("supports US Letter page size preset with landscape orientation", async () => {
      const pngBuffer = Buffer.from(TINY_PNG_BASE64, "base64");
      const img = new File([pngBuffer], "scan.png", { type: "image/png" });

      const res = await convertImagesToPdf([img], {
        pageSize: "letter",
        orientation: "landscape",
      });

      const pdf = await PDFDocument.load(await res.blob.arrayBuffer());
      const page = pdf.getPage(0);
      // Landscape letter: width is larger than height
      assert.equal(Math.round(page.getWidth()), Math.round(PageSizes.Letter[1]));
      assert.equal(Math.round(page.getHeight()), Math.round(PageSizes.Letter[0]));
    });

    it("rejects empty image array with clear error", async () => {
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

  // --------------------------------------------------------------------------
  // 4. PDF Split & Extract (extractPages & splitAllPages)
  // --------------------------------------------------------------------------
  describe("4. PDF Split & Extract Engine", () => {
    it("parses diverse page selection strings correctly", () => {
      assert.deepEqual(parsePageSelection("1-3, 5", 6), [0, 1, 2, 4]);
      assert.deepEqual(parsePageSelection("4-2", 5), [1, 2, 3]);
      assert.deepEqual(parsePageSelection("-1, 0, 1-2", 4), [0, 1]);
      assert.deepEqual(parsePageSelection("foo, 2, bar", 3), [1]);
      assert.deepEqual(parsePageSelection("", 5), []);
    });

    it("extracts specific pages into a new PDF", async () => {
      const file = await createSamplePdf(4);
      const res = await extractPages(file, [0, 2]); // Pages 1 and 3
      assert.ok(res.outputFilename.includes("_extracted.pdf"));

      const pdf = await PDFDocument.load(await res.blob.arrayBuffer());
      assert.equal(pdf.getPageCount(), 2);
    });

    it("splits all pages into individual single-page documents", async () => {
      const file = await createSamplePdf(3);
      const results = await splitAllPages(file);
      assert.equal(results.length, 3);
      assert.ok(results[0].filename.includes("_page_001.pdf"));
      assert.ok(results[1].filename.includes("_page_002.pdf"));
      assert.ok(results[2].filename.includes("_page_003.pdf"));

      for (const item of results) {
        const singleDoc = await PDFDocument.load(await item.blob.arrayBuffer());
        assert.equal(singleDoc.getPageCount(), 1);
      }
    });

    it("throws when extracting empty page list", async () => {
      const file = await createSamplePdf(2);
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
  });

  // --------------------------------------------------------------------------
  // 5. PDF Merge Engine (mergePDFs)
  // --------------------------------------------------------------------------
  describe("5. PDF Merge Engine", () => {
    it("merges multiple PDF documents and sums total page counts", async () => {
      const docA = await createSamplePdf(2);
      const docB = await createSamplePdf(3);

      let reportedProgress = false;
      const res = await mergePDFs([docA, docB], (curr, total) => {
        if (curr === total) reportedProgress = true;
      });

      assert.equal(res.outputFilename, "merged_document.pdf");
      assert.equal(res.pageCount, 5);
      assert.ok(reportedProgress, "Progress callback should be triggered");

      const mergedDoc = await PDFDocument.load(await res.blob.arrayBuffer());
      assert.equal(mergedDoc.getPageCount(), 5);
    });

    it("rejects single file or empty array with descriptive error", async () => {
      const doc = await createSamplePdf(1);
      await assert.rejects(
        async () => {
          await mergePDFs([doc]);
        },
        {
          name: "Error",
          message: "At least 2 PDF files are required for merging.",
        }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 6. UI Consistency, Touch Targets, and Accessibility Contracts
  // --------------------------------------------------------------------------
  describe("6. UI Contracts & Accessibility Compliance Across 6 PDF Workstations", () => {
    it("all 6 PDF workstations use ToolPageShell with breadcrumbs and format badges", () => {
      for (const relPath of PDF_WORKSTATION_FILES) {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, "utf8");

        assert.ok(
          content.includes("<ToolPageShell"),
          `${relPath} must be wrapped in <ToolPageShell>`
        );
        assert.ok(
          content.includes('formats={["PDF"]}') || content.includes('formats={["JPG", "PNG", "WEBP"]}'),
          `${relPath} must specify semantic formats on ToolPageShell`
        );
      }
    });

    it("all 6 PDF workstations enforce touch targets >= 44x44px", () => {
      for (const relPath of PDF_WORKSTATION_FILES) {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, "utf8");

        // Verify touch-manipulation is enforced
        assert.ok(
          content.includes("touch-manipulation"),
          `${relPath} must include touch-manipulation on interactive elements`
        );

        // Verify min-h-[44px] is enforced
        assert.ok(
          content.includes("min-h-[44px]"),
          `${relPath} must include min-h-[44px] on buttons/controls`
        );

        // Verify old sub-44px buttons (h-8 w-8 and h-7 w-7 without min-h-[44px]) are eliminated
        assert.ok(
          !content.includes('className="h-8 w-8"') && !content.includes('className="h-7 w-7"'),
          `${relPath} must not contain bare h-8 w-8 or h-7 w-7 icon buttons`
        );
      }
    });

    it("all 6 PDF workstations apply tabular-nums to numeric metrics", () => {
      for (const relPath of PDF_WORKSTATION_FILES) {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, "utf8");

        assert.ok(
          content.includes("tabular-nums"),
          `${relPath} must include tabular-nums for numeric figures and counts`
        );
      }
    });

    it("all 6 PDF workstations satisfy WCAG AA contrast on success indicators", () => {
      for (const relPath of PDF_WORKSTATION_FILES) {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, "utf8");

        // Bare text-emerald-400 fails contrast against #F7F9FC; must be text-emerald-700 dark:text-emerald-400
        const bareEmeraldMatches = content.match(/className="[^"]*\btext-emerald-400\b(?!.*text-emerald-700)[^"]*"/g);
        if (bareEmeraldMatches) {
          for (const match of bareEmeraldMatches) {
            assert.ok(
              match.includes("text-emerald-700"),
              `${relPath} contains low-contrast bare text-emerald-400: ${match}`
            );
          }
        }

        // Success buttons must use text-[hsl(var(--success-foreground))] rather than text-white
        if (content.includes("bg-[hsl(var(--success))]")) {
          assert.ok(
            content.includes("text-[hsl(var(--success-foreground))]"),
            `${relPath} must pair bg-[hsl(var(--success))] with text-[hsl(var(--success-foreground))]`
          );
        }
      }
    });

    it("all 6 PDF workstations integrate pushDownload and triggerSupportPrompt", () => {
      for (const relPath of PDF_WORKSTATION_FILES) {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, "utf8");

        assert.ok(
          content.includes("pushDownload"),
          `${relPath} must integrate pushDownload for Download Dock tracking`
        );
        assert.ok(
          content.includes("setLatestDeliveredFile"),
          `${relPath} must set latest delivered file for celebration modal`
        );
        assert.ok(
          content.includes("triggerSupportPrompt"),
          `${relPath} must invoke triggerSupportPrompt upon download`
        );
      }
    });

    it("pdf-studio does not contain disruptive native alert() calls and exposes duplicatePage", () => {
      const studioPath = path.join(rootDir, "src/app/pdf-studio/page.tsx");
      const content = fs.readFileSync(studioPath, "utf8");

      assert.ok(
        !content.includes("alert("),
        "pdf-studio must not call native alert()"
      );
      assert.ok(
        content.includes("duplicatePage"),
        "pdf-studio must implement and bind duplicatePage"
      );
      assert.ok(
        content.includes("<Copy"),
        "pdf-studio must expose Copy icon button for duplicatePage"
      );
    });
  });
});
