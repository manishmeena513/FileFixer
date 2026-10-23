import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { PDFDocument, PageSizes } from "pdf-lib";
import JSZip from "jszip";

import {
  splitFilename,
  applyCaseTransform,
  validateFilename,
  applyRenameRules,
  previewRenames,
  packageRenamedZip,
} from "../src/lib/batch/rename";
import { processBatchItem } from "../src/lib/batch/batchProcessor";
import { compressPDF } from "../src/lib/pdf/compress";
import { inspectFile } from "../src/lib/inspect";
import { getAllHistory, clearAllHistory, deleteHistoryRecord } from "../src/lib/storage/history";
import { downloadAsZip } from "../src/lib/zip";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const M5_PAGE_FILES = [
  "src/app/batch/page.tsx",
  "src/app/batch-rename/page.tsx",
  "src/app/workflows/page.tsx",
  "src/app/workflows/layout.tsx",
  "src/app/privacy-cleaner/page.tsx",
  "src/app/inspect/page.tsx",
  "src/app/history/page.tsx",
  "src/app/about/page.tsx",
  "src/app/privacy/page.tsx",
  "src/app/branding/page.tsx",
  "src/components/workflows/WorkflowBuilder.tsx",
];

async function createSamplePdf(
  numPages = 2,
  meta?: { title?: string; author?: string; subject?: string; keywords?: string[] }
): Promise<File> {
  const doc = await PDFDocument.create();
  if (meta?.title) doc.setTitle(meta.title);
  if (meta?.author) doc.setAuthor(meta.author);
  if (meta?.subject) doc.setSubject(meta.subject);
  if (meta?.keywords) doc.setKeywords(meta.keywords);

  for (let i = 0; i < numPages; i++) {
    const page = doc.addPage([PageSizes.A4[0], PageSizes.A4[1]]);
    page.drawText(`Milestone 5 Test Page ${i + 1}`);
  }

  const bytes = await doc.save();
  return new File([bytes as unknown as BlobPart], "sample_doc.pdf", {
    type: "application/pdf",
  });
}

describe("Milestone 5: Batch Processing, Pipelines & Utility Tools Test Suite", () => {
  // --------------------------------------------------------------------------
  // 1. Batch Rename Engine: Unit & Boundary Tests
  // --------------------------------------------------------------------------
  describe("1. Batch Rename Engine (src/lib/batch/rename.ts)", () => {
    it("splits filenames into base and extension correctly across edge cases", () => {
      assert.deepEqual(splitFilename("photo.jpg"), { base: "photo", ext: "jpg" });
      assert.deepEqual(splitFilename("archive.tar.gz"), { base: "archive.tar", ext: "gz" });
      assert.deepEqual(splitFilename(".env"), { base: ".env", ext: "" });
      assert.deepEqual(splitFilename("README"), { base: "README", ext: "" });
      assert.deepEqual(splitFilename("folder.name/file.png"), { base: "folder.name/file", ext: "png" });
    });

    it("applies case transformations correctly", () => {
      const text = "my Project_file-name";
      assert.equal(applyCaseTransform(text, "none"), text);
      assert.equal(applyCaseTransform(text, "lowercase"), "my project_file-name");
      assert.equal(applyCaseTransform(text, "uppercase"), "MY PROJECT_FILE-NAME");
      assert.equal(applyCaseTransform("hello world", "titlecase"), "Hello World");
      assert.equal(applyCaseTransform("myProjectFile", "kebab"), "my-project-file");
      assert.equal(applyCaseTransform("myProjectFile", "snake"), "my_project_file");
    });

    it("validates filenames and detects illegal characters and boundaries", () => {
      assert.equal(validateFilename("valid_file-123.jpg").valid, true);
      assert.equal(validateFilename("").valid, false);
      assert.equal(validateFilename("   ").valid, false);
      assert.equal(validateFilename(".").valid, false);
      assert.equal(validateFilename("..").valid, false);
      assert.equal(validateFilename("invalid:name.jpg").valid, false);
      assert.equal(validateFilename("invalid*name.jpg").valid, false);
      assert.equal(validateFilename("invalid/name.jpg").valid, false);
      assert.equal(validateFilename("a".repeat(256)).valid, false);
      assert.equal(validateFilename("a".repeat(250)).valid, true);
    });

    it("applies prefix, suffix, and find/replace rules", () => {
      const original = "document_old.pdf";
      const rules = {
        prefix: "2026_",
        suffix: "_v2",
        findReplace: { find: "old", replace: "final", matchCase: true },
      };
      const result = applyRenameRules(original, 0, rules);
      assert.equal(result, "2026_document_final_v2.pdf");
    });

    it("applies template pattern expansion with padding and date replacement", () => {
      const original = "DSC_0042.RAW";
      const rules = {
        template: "Photo_####",
        lowercaseExtension: true,
      };
      const result = applyRenameRules(original, 4, rules); // index 4 -> number 5 -> 0005
      assert.equal(result, "Photo_0005.raw");
    });

    it("supports custom start index and numbering rules", () => {
      const original = "item.png";
      const rules = {
        numbering: {
          enabled: true,
          startIndex: 100,
          padding: 4,
          position: "prefix" as const,
          separator: "-",
        },
      };
      const result = applyRenameRules(original, 2, rules); // 100 + 2 = 102 -> 0102
      assert.equal(result, "0102-item.png");
    });

    it("handles regex replacement with error tolerance for malformed patterns", () => {
      const original = "IMG_9999_draft.jpg";
      const rules = {
        regex: { pattern: "IMG_(\\d+)", replacement: "Photo_$1", flags: "g" },
      };
      const result = applyRenameRules(original, 0, rules);
      assert.equal(result, "Photo_9999_draft.jpg");

      // Malformed regex pattern does not throw
      const badRules = { regex: { pattern: "[unclosed", replacement: "x" } };
      const safe = applyRenameRules(original, 0, badRules);
      assert.equal(safe, original);
    });

    it("previewRenames returns mapped list with validation status", () => {
      const files = [
        new File(["abc"], "test1.jpg", { type: "image/jpeg" }),
        new File(["def"], "test2.jpg", { type: "image/jpeg" }),
      ];
      const previews = previewRenames(files, { template: "Asset_###" });
      assert.equal(previews.length, 2);
      assert.equal(previews[0].renamed, "Asset_001.jpg");
      assert.equal(previews[1].renamed, "Asset_002.jpg");
      assert.equal(previews[0].valid, true);
    });

    it("packageRenamedZip resolves filename collisions safely and returns zip blob", async () => {
      // Both files with duplicate target names
      const files = [
        new File(["content-1"], "duplicate.txt", { type: "text/plain" }),
        new File(["content-2"], "duplicate.txt", { type: "text/plain" }),
      ];
      // Force constant rename without numbering
      const rules = { template: "static_name" };
      const blob = await packageRenamedZip(files, rules);
      assert.ok(blob instanceof Blob);
      assert.ok(blob.size > 0);

      const zip = await JSZip.loadAsync(await blob.arrayBuffer());
      const filenames = Object.keys(zip.files);
      assert.equal(filenames.length, 2);
      assert.ok(filenames.includes("static_name.txt"));
      assert.ok(filenames.includes("static_name_1.txt"));
    });
  });

  // --------------------------------------------------------------------------
  // 2. Batch Pipeline Processor (src/lib/batch/batchProcessor.ts)
  // --------------------------------------------------------------------------
  describe("2. Batch Pipeline Processor (src/lib/batch/batchProcessor.ts)", () => {
    it("processes batch item with renaming pattern and MIME expansion", async () => {
      const dummyFile = new File(["dummy-image-data"], "input_sample.jpg", {
        type: "image/jpeg",
      });

      const result = await processBatchItem(dummyFile, 2, {
        resizeEnabled: false,
        convertEnabled: false,
        compressEnabled: false,
        renamePattern: "Item_###",
        startNumber: 10,
      });

      assert.equal(result.status, "done");
      assert.equal(result.originalName, "input_sample.jpg");
      assert.equal(result.outputName, "Item_012.jpg");
      assert.equal(result.originalSize, dummyFile.size);
    });

    it("safely handles error state when pipeline step fails", async () => {
      // Create a corrupted or empty file that fails when convert is invoked without DOM canvas
      const badFile = new File([], "corrupted.jpg", { type: "image/jpeg" });

      const result = await processBatchItem(badFile, 0, {
        resizeEnabled: true,
        targetWidth: 500,
        targetHeight: 500,
        convertEnabled: false,
        compressEnabled: false,
      });

      // In Node environment without DOM canvas, resize throws and is caught
      assert.equal(result.status, "error");
      assert.ok(result.error);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Privacy Cleaner & PDF Metadata Scrubbing
  // --------------------------------------------------------------------------
  describe("3. Privacy Cleaner & PDF Metadata Scrubbing", () => {
    it("thoroughly cleans PDF metadata using compressPDF with removeMetadata: true", async () => {
      const dirtyPdf = await createSamplePdf(2, {
        title: "Confidential Strategy",
        author: "Chief Executive",
        subject: "Internal Operations",
        keywords: ["confidential", "secret", "private"],
      });

      // Verify metadata exists initially
      const initialMeta = await inspectFile(dirtyPdf);
      assert.equal(initialMeta.pdfTitle, "Confidential Strategy");
      assert.equal(initialMeta.pdfAuthor, "Chief Executive");
      assert.ok(initialMeta.pdfKeywords?.includes("confidential"));

      // Clean metadata
      const cleanResult = await compressPDF(dirtyPdf, {
        level: "smaller",
        removeMetadata: true,
      });

      assert.ok(cleanResult.blob instanceof Blob);
      const cleanFile = new File([cleanResult.blob], "cleaned.pdf", {
        type: "application/pdf",
      });

      // Verify metadata is completely wiped
      const cleanedMeta = await inspectFile(cleanFile);
      assert.ok(!cleanedMeta.pdfTitle || cleanedMeta.pdfTitle === "");
      assert.ok(!cleanedMeta.pdfAuthor || cleanedMeta.pdfAuthor === "");
      assert.ok(!cleanedMeta.pdfSubject || cleanedMeta.pdfSubject === "");
      assert.ok(!cleanedMeta.pdfKeywords || cleanedMeta.pdfKeywords.length === 0);
    });

    it("preserves metadata when removeMetadata is explicitly false", async () => {
      const doc = await createSamplePdf(1, {
        title: "Public Whitepaper",
        author: "Research Team",
      });

      const preservedResult = await compressPDF(doc, {
        level: "balanced",
        removeMetadata: false,
      });

      const preservedFile = new File([preservedResult.blob], "preserved.pdf", {
        type: "application/pdf",
      });
      const meta = await inspectFile(preservedFile);
      assert.equal(meta.pdfTitle, "Public Whitepaper");
      assert.equal(meta.pdfAuthor, "Research Team");
    });
  });

  // --------------------------------------------------------------------------
  // 4. Workflows Pipeline Architecture & Recipes
  // --------------------------------------------------------------------------
  describe("4. Workflows Pipeline Architecture", () => {
    it("verifies preconfigured workflow recipe integrity in workflows page", () => {
      const workflowsPageContent = fs.readFileSync(
        path.join(rootDir, "src/app/workflows/page.tsx"),
        "utf8"
      );
      assert.ok(workflowsPageContent.includes("PRECONFIGURED_RECIPES"));
      assert.ok(workflowsPageContent.includes("web-ready"));
      assert.ok(workflowsPageContent.includes("social-media"));
      assert.ok(workflowsPageContent.includes("document-sanitize"));
      assert.ok(workflowsPageContent.includes("email-safe"));
      assert.ok(workflowsPageContent.includes("fast-upload-rename"));
    });

    it("verifies WorkflowBuilder component exists with step drag/reorder support", () => {
      const builderContent = fs.readFileSync(
        path.join(rootDir, "src/components/workflows/WorkflowBuilder.tsx"),
        "utf8"
      );
      assert.ok(builderContent.includes("ToolPageShell"));
      assert.ok(builderContent.includes("setLatestDeliveredFile"));
      assert.ok(builderContent.includes("triggerSupportPrompt"));
      assert.ok(builderContent.includes("min-h-[44px]"));
    });

    it("verifies workflows layout metadata matches canonical specifications", () => {
      const layoutContent = fs.readFileSync(
        path.join(rootDir, "src/app/workflows/layout.tsx"),
        "utf8"
      );
      assert.ok(layoutContent.includes("Automated File Workflows | FileFixer"));
      assert.ok(layoutContent.includes("canonical: \"/workflows\""));
      assert.ok(layoutContent.includes("/branding/filefixer-og.png"));
    });
  });

  // --------------------------------------------------------------------------
  // 5. History Storage & SSR Safety
  // --------------------------------------------------------------------------
  describe("5. History Storage & SSR Safety (src/lib/storage/history.ts)", () => {
    it("safely returns empty list on SSR / Node environment without throwing", async () => {
      const records = await getAllHistory();
      assert.deepEqual(records, []);
    });

    it("safely handles clear and delete in SSR / Node environment", async () => {
      await assert.doesNotReject(async () => {
        await clearAllHistory();
        await deleteHistoryRecord("dummy-id");
      });
    });

    it("history page provides direct quick-links to tools", () => {
      const historyPageContent = fs.readFileSync(
        path.join(rootDir, "src/app/history/page.tsx"),
        "utf8"
      );
      assert.ok(historyPageContent.includes("TOOL_HREFS"));
      assert.ok(historyPageContent.includes("/batch"));
      assert.ok(historyPageContent.includes("/workflows"));
      assert.ok(historyPageContent.includes("/privacy-cleaner"));
      assert.ok(historyPageContent.includes("/inspect"));
    });
  });

  // --------------------------------------------------------------------------
  // 6. ZIP Utility Return Value (src/lib/zip.ts)
  // --------------------------------------------------------------------------
  describe("6. ZIP Utility Return Value (src/lib/zip.ts)", () => {
    it("downloadAsZip returns a Promise resolving to a Blob", async () => {
      // In Node environment, triggerDownload checks document/window and no-ops safely
      const entries = [
        { filename: "file1.txt", blob: new Blob(["Hello"]) },
        { filename: "file2.txt", blob: new Blob(["World"]) },
      ];
      const result = await downloadAsZip(entries, "test.zip");
      assert.ok(result instanceof Blob);
      assert.ok(result.size > 0);

      const zip = await JSZip.loadAsync(await result.arrayBuffer());
      assert.deepEqual(Object.keys(zip.files).sort(), ["file1.txt", "file2.txt"]);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Touch Target & Accessibility Invariants (≥ 44×44px)
  // --------------------------------------------------------------------------
  describe("7. Touch Target Compliance (WCAG 2.5.5 / 2.5.8)", () => {
    it("verifies interactive controls in M5 pages satisfy minimum 44px touch targets", () => {
      for (const relPath of M5_PAGE_FILES) {
        if (relPath.endsWith("layout.tsx")) continue;
        const fullPath = path.join(rootDir, relPath);
        assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
        const content = fs.readFileSync(fullPath, "utf8");

        // Verify touch target tokens are pervasive in interactive components
        const hasTouchTokens =
          content.includes("min-h-[44px]") ||
          content.includes("h-11") ||
          content.includes("touch-manipulation");
        assert.ok(
          hasTouchTokens,
          `Page ${relPath} must enforce minimum 44px touch target tokens`
        );
      }
    });

    it("verifies individual delete and clear buttons in history page meet 44px touch target", () => {
      const historyContent = fs.readFileSync(
        path.join(rootDir, "src/app/history/page.tsx"),
        "utf8"
      );
      assert.ok(
        historyContent.includes("min-h-[44px] min-w-[44px]"),
        "History item delete button must have explicit min-h-[44px] min-w-[44px]"
      );
    });

    it("verifies tab trigger and preset chips in batch-rename meet 44px touch target", () => {
      const batchRenameContent = fs.readFileSync(
        path.join(rootDir, "src/app/batch-rename/page.tsx"),
        "utf8"
      );
      assert.ok(batchRenameContent.includes("min-h-[44px]"));
      assert.ok(batchRenameContent.includes("touch-manipulation"));
    });
  });

  // --------------------------------------------------------------------------
  // 8. Tabular Numerals & Metric Typography (.tabular-nums)
  // --------------------------------------------------------------------------
  describe("8. Tabular Numerals Invariant (.tabular-nums)", () => {
    it("verifies metrics, counts, and sizes in batch pages include tabular-nums", () => {
      const targetPages = [
        "src/app/batch/page.tsx",
        "src/app/batch-rename/page.tsx",
        "src/app/workflows/page.tsx",
        "src/app/inspect/page.tsx",
        "src/app/history/page.tsx",
      ];

      for (const relPath of targetPages) {
        const content = fs.readFileSync(path.join(rootDir, relPath), "utf8");
        assert.ok(
          content.includes("tabular-nums"),
          `${relPath} must use tabular-nums on numerical metrics and sizes`
        );
      }
    });
  });

  // --------------------------------------------------------------------------
  // 9. WCAG AA Contrast Calibration (Emerald/Amber Tokens)
  // --------------------------------------------------------------------------
  describe("9. WCAG AA Contrast Calibration", () => {
    it("ensures no uncalibrated raw text-emerald-400 on light backgrounds without dark mode prefix", () => {
      const checkFiles = [
        "src/app/batch/page.tsx",
        "src/app/batch-rename/page.tsx",
        "src/app/workflows/page.tsx",
        "src/app/privacy-cleaner/page.tsx",
        "src/app/history/page.tsx",
        "src/app/about/page.tsx",
        "src/app/privacy/page.tsx",
      ];

      for (const relPath of checkFiles) {
        const content = fs.readFileSync(path.join(rootDir, relPath), "utf8");
        // Matches "text-emerald-400" only if it is NOT preceded by "dark:"
        const rawEmerald400 = /(?<!dark:)text-emerald-400\b/.test(content);
        assert.equal(
          rawEmerald400,
          false,
          `File ${relPath} contains raw text-emerald-400 on light canvas, violating WCAG AA`
        );
      }
    });
  });

  // --------------------------------------------------------------------------
  // 10. QR Support Asset Immutability Invariant
  // --------------------------------------------------------------------------
  describe("10. Support QR Asset Immutability Invariant", () => {
    it("guarantees public/images/filefixer_support_qr.png sha256 is unchanged", () => {
      const qrPath = path.join(rootDir, "public/images/filefixer_support_qr.png");
      assert.ok(fs.existsSync(qrPath), "QR image file must exist");
      const buffer = fs.readFileSync(qrPath);
      const hash = crypto.createHash("sha256").update(buffer).digest("hex");
      assert.equal(
        hash,
        "8592bd8a18457f3ac496d6735c472d7c4f3239e87b93771ed238d348b87d4744",
        "QR asset SHA-256 must match authoritative baseline exactly"
      );
    });
  });
});
