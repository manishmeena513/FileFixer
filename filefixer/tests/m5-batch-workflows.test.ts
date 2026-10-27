import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, PageSizes } from "pdf-lib";
import JSZip from "jszip";

import {
  applyRenameRules,
  splitFilename,
  applyCaseTransform,
  validateFilename,
  previewRenames,
  packageRenamedZip,
} from "../src/lib/batch/rename";
import { compressPDF } from "../src/lib/pdf/compress";
import { createZipBlob, ZipEntry } from "../src/lib/zip";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function readSource(relPath: string): string {
  return fs.readFileSync(path.join(rootDir, relPath), "utf-8");
}

async function createSamplePdf(metadata?: {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  keywords?: string[];
}): Promise<File> {
  const doc = await PDFDocument.create();
  if (metadata?.title) doc.setTitle(metadata.title);
  if (metadata?.author) doc.setAuthor(metadata.author);
  if (metadata?.subject) doc.setSubject(metadata.subject);
  if (metadata?.creator) doc.setCreator(metadata.creator);
  if (metadata?.producer) doc.setProducer(metadata.producer);
  if (metadata?.keywords) doc.setKeywords(metadata.keywords);

  const page = doc.addPage([PageSizes.A4[0], PageSizes.A4[1]]);
  page.drawText("Test Confidential Document Content");

  const bytes = await doc.save();
  return new File([bytes as unknown as BlobPart], "confidential_document.pdf", {
    type: "application/pdf",
  });
}

describe("Milestone 5: Batch Processing, Pipelines & Utility Workstations", () => {
  // --------------------------------------------------------------------------
  // 1. Batch Renaming Engine (src/lib/batch/rename.ts)
  // --------------------------------------------------------------------------
  describe("1. Batch Renaming Engine (src/lib/batch/rename.ts)", () => {
    it("splits filenames accurately including multi-dot and no-dot filenames", () => {
      assert.deepEqual(splitFilename("vacation.photo.jpg"), {
        base: "vacation.photo",
        ext: "jpg",
      });
      assert.deepEqual(splitFilename("README"), {
        base: "README",
        ext: "",
      });
      assert.deepEqual(splitFilename(".env"), {
        base: ".env",
        ext: "",
      });
      assert.deepEqual(splitFilename("archive.2026.tar.gz"), {
        base: "archive.2026.tar",
        ext: "gz",
      });
    });

    it("applies case transformations correctly (lower, upper, title, kebab, snake, as-is)", () => {
      const input = "Annual financial Report_2026";
      assert.equal(applyCaseTransform(input, "lowercase"), "annual financial report_2026");
      assert.equal(applyCaseTransform(input, "uppercase"), "ANNUAL FINANCIAL REPORT_2026");
      assert.equal(applyCaseTransform("hello world", "titlecase"), "Hello World");
      assert.equal(applyCaseTransform("My File Name", "kebab"), "my-file-name");
      assert.equal(applyCaseTransform("My File Name", "snake"), "my_file_name");
      assert.equal(applyCaseTransform(input, "as-is"), input);
      assert.equal(applyCaseTransform(input, "none"), input);
    });

    it("validates filenames for filesystem safety", () => {
      assert.equal(validateFilename("valid-file_name.jpg").valid, true);
      assert.equal(validateFilename("").valid, false);
      assert.equal(validateFilename("   ").valid, false);
      assert.equal(validateFilename(".").valid, false);
      assert.equal(validateFilename("..").valid, false);
      assert.equal(validateFilename("file/name.jpg").valid, false);
      assert.equal(validateFilename("file:name.jpg").valid, false);
      assert.equal(validateFilename("file*name.jpg").valid, false);
      assert.equal(validateFilename("a".repeat(256) + ".jpg").valid, false);
    });

    it("applies prefix and suffix additions", () => {
      const res1 = applyRenameRules("invoice.pdf", 0, { prefix: "CONFIDENTIAL_" });
      assert.equal(res1, "CONFIDENTIAL_invoice.pdf");

      const res2 = applyRenameRules("photo.png", 0, { suffix: "_watermarked" });
      assert.equal(res2, "photo_watermarked.png");

      const res3 = applyRenameRules("data.csv", 0, { prefix: "export_", suffix: "_v2" });
      assert.equal(res3, "export_data_v2.csv");
    });

    it("handles find and replace with case matching and replaceAll options", () => {
      const resCase = applyRenameRules("Sample_sample_SAMPLE.png", 0, {
        findReplace: { find: "sample", replace: "demo", matchCase: true, replaceAll: true },
      });
      assert.equal(resCase, "Sample_demo_SAMPLE.png");

      const resInsensitive = applyRenameRules("Photo_photo_PHOTO.jpg", 0, {
        findReplace: { find: "photo", replace: "asset", matchCase: false, replaceAll: true },
      });
      assert.equal(resInsensitive, "asset_asset_asset.jpg");

      // Safe escape with regex metacharacters
      const resMeta = applyRenameRules("item[draft](v1).png", 0, {
        findReplace: { find: "[draft]", replace: "[final]", matchCase: true },
      });
      assert.equal(resMeta, "item[final](v1).png");
    });

    it("formats zero-padded number sequences from template hashes (#+)", () => {
      assert.equal(applyRenameRules("img.jpg", 0, { template: "Asset_###" }), "Asset_001.jpg");
      assert.equal(applyRenameRules("img.jpg", 9, { template: "Asset_###" }), "Asset_010.jpg");
      assert.equal(applyRenameRules("img.jpg", 99, { template: "Asset_###" }), "Asset_100.jpg");
      assert.equal(applyRenameRules("img.jpg", 0, { template: "Photo_####" }), "Photo_0001.jpg");
      assert.equal(applyRenameRules("img.jpg", 0, { template: "Item_#" }), "Item_1.jpg");

      // Custom start index
      assert.equal(
        applyRenameRules("img.jpg", 0, {
          template: "Asset_###",
          numbering: { enabled: true, startIndex: 50 },
        }),
        "Asset_050.jpg"
      );

      // Negative start index preserves negative sign at front of padded number
      assert.equal(
        applyRenameRules("img.jpg", 0, {
          template: "Asset_###",
          numbering: { enabled: true, startIndex: -3 },
        }),
        "Asset_-03.jpg"
      );
    });

    it("evaluates date tokens in renaming templates (YYYY-MM-DD and YYYYMMDD)", () => {
      const now = new Date();
      const todayIso = now.toISOString().slice(0, 10);
      const todayCompact = todayIso.replace(/-/g, "");

      const resIso = applyRenameRules("log.txt", 0, { template: "Backup_YYYY-MM-DD_###" });
      assert.equal(resIso, `Backup_${todayIso}_001.txt`);

      const resCompact = applyRenameRules("doc.pdf", 0, {
        template: "Document_YYYYMMDD_##",
        numbering: { enabled: true, startIndex: 1 },
      });
      assert.equal(resCompact, `Document_${todayCompact}_01.pdf`);
    });

    it("supports numbering rules without templates (prefix, suffix, replace)", () => {
      const resSuffix = applyRenameRules("photo.jpg", 0, {
        numbering: { enabled: true, startIndex: 1, padding: 3, position: "suffix", separator: "_" },
      });
      assert.equal(resSuffix, "photo_001.jpg");

      const resPrefix = applyRenameRules("photo.jpg", 0, {
        numbering: { enabled: true, startIndex: 1, padding: 2, position: "prefix", separator: "-" },
      });
      assert.equal(resPrefix, "01-photo.jpg");

      const resReplace = applyRenameRules("photo.jpg", 4, {
        numbering: { enabled: true, startIndex: 1, padding: 4, position: "replace" },
      });
      assert.equal(resReplace, "0005.jpg");

      const resNeg = applyRenameRules("photo.jpg", 0, {
        numbering: { enabled: true, startIndex: -7, padding: 4, position: "suffix", separator: "_" },
      });
      assert.equal(resNeg, "photo_-007.jpg");
    });

    it("handles safe regex pattern replacement and shields against malformed regex", () => {
      const resValid = applyRenameRules("file_123_abc.jpg", 0, {
        regex: { pattern: "\\d+", replacement: "NUM" },
      });
      assert.equal(resValid, "file_NUM_abc.jpg");

      // Malformed regex pattern unclosed bracket
      const resInvalid = applyRenameRules("file.jpg", 0, {
        regex: { pattern: "[unclosed", replacement: "x" },
      });
      assert.equal(resInvalid, "file.jpg");
    });

    it("generates preview items with validity status", () => {
      const files = [
        new File(["1"], "photo A.jpg", { type: "image/jpeg" }),
        new File(["2"], "photo B.png", { type: "image/png" }),
      ];

      const previews = previewRenames(files, {
        template: "Asset_###",
      });

      assert.equal(previews.length, 2);
      assert.equal(previews[0].renamed, "Asset_001.jpg");
      assert.equal(previews[0].valid, true);
      assert.equal(previews[1].renamed, "Asset_002.png");
      assert.equal(previews[1].valid, true);
    });

    it("packages renamed files into a ZIP and handles filename collisions gracefully", async () => {
      const files = [
        new File(["A"], "first.txt", { type: "text/plain" }),
        new File(["B"], "second.txt", { type: "text/plain" }),
      ];

      // Template without hash creates identical names -> collision resolver appends _1
      const zipBlob = await packageRenamedZip(files, {
        template: "StaticDoc",
      });

      assert.ok(zipBlob.size > 0, "ZIP blob must not be empty");

      const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
      const filenames = Object.keys(zip.files);
      assert.equal(filenames.length, 2);
      assert.ok(filenames.includes("StaticDoc.txt"));
      assert.ok(filenames.includes("StaticDoc_1.txt"));
    });
  });

  // --------------------------------------------------------------------------
  // 2. Batch Workstation Hub (src/app/batch/page.tsx)
  // --------------------------------------------------------------------------
  describe("2. Batch Hub Workstation (src/app/batch/page.tsx)", () => {
    const src = readSource("src/app/batch/page.tsx");

    it("wraps layout cleanly in ToolPageShell with title and back navigation", () => {
      assert.ok(src.includes("<ToolPageShell"), "Must wrap in ToolPageShell");
      assert.ok(src.includes('title="Batch Studio"'), "Must declare title Batch Studio");
      assert.ok(src.includes('backHref="/tools"'), "Must link back to /tools");
      assert.ok(src.includes("</ToolPageShell>"), "Must close ToolPageShell");
    });

    it("wires up global delivery flow and voluntary support prompt", () => {
      assert.ok(src.includes("pushDownload"), "Must populate global download dock");
      assert.ok(src.includes("setLatestDeliveredFile"), "Must trigger celebratory delivery modal");
      assert.ok(src.includes("triggerSupportPrompt"), "Must hook into voluntary support prompt");
      assert.ok(src.includes("addHistoryRecord"), "Must record telemetry in IndexedDB");
    });

    it("enforces touch targets >= 44x44px and touch-manipulation across all interactive controls", () => {
      assert.ok(
        src.includes("min-h-[44px] touch-manipulation"),
        "Toolbar buttons and inputs must have min-h-[44px] touch-manipulation"
      );
      assert.ok(
        src.includes("flex h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation"),
        "File delete button must be >= 44x44px"
      );
      assert.ok(
        src.includes("min-h-[48px] touch-manipulation"),
        "Primary action button must have touch target >= 48px"
      );
    });

    it("applies calibrated WCAG AA contrast and tabular numerals", () => {
      assert.ok(
        src.includes("text-emerald-700 dark:text-emerald-400"),
        "Must use calibrated emerald text contrast"
      );
      assert.ok(
        src.includes("tabular-nums font-mono"),
        "Must format numbers in tabular-nums font-mono"
      );
    });
  });

  // --------------------------------------------------------------------------
  // 3. Batch Rename Page (src/app/batch-rename/page.tsx)
  // --------------------------------------------------------------------------
  describe("3. Batch Rename Page (src/app/batch-rename/page.tsx)", () => {
    const src = readSource("src/app/batch-rename/page.tsx");

    it("connects to src/lib/batch/rename.ts engine", () => {
      assert.ok(src.includes('@/lib/batch/rename'), "Must import rename engine");
      assert.ok(src.includes("previewRenames"), "Must call previewRenames");
      assert.ok(src.includes("packageRenamedZip"), "Must call packageRenamedZip");
    });

    it("wraps in ToolPageShell with breadcrumbs", () => {
      assert.ok(src.includes("<ToolPageShell"), "Must wrap in ToolPageShell");
      assert.ok(src.includes('title="Batch Rename Files"'), "Must specify title");
      assert.ok(src.includes("</ToolPageShell>"), "Must close ToolPageShell");
    });

    it("provides live before/after rename table with .tabular-nums", () => {
      assert.ok(src.includes("previews.map"), "Must render live preview list");
      assert.ok(src.includes("tabular-nums"), "Must format numeric indices and counters with tabular-nums");
    });

    it("integrates full delivery flow (pushDownload, setLatestDeliveredFile, triggerSupportPrompt)", () => {
      assert.ok(src.includes("pushDownload"), "Must call pushDownload");
      assert.ok(src.includes("setLatestDeliveredFile"), "Must call setLatestDeliveredFile");
      assert.ok(src.includes("triggerSupportPrompt"), "Must call triggerSupportPrompt");
    });

    it("enforces touch targets >= 44x44px and touch-manipulation on all inputs, tabs, and buttons", () => {
      assert.ok(
        src.includes("min-h-[44px] touch-manipulation"),
        "Inputs, buttons, and chips must have min-h-[44px] touch-manipulation"
      );
      assert.ok(
        src.includes("flex h-11 w-11 min-h-[44px] min-w-[44px]"),
        "Remove item button must measure >= 44x44px"
      );
    });
  });

  // --------------------------------------------------------------------------
  // 4. Automated File Workflows (src/app/workflows/page.tsx & layout.tsx)
  // --------------------------------------------------------------------------
  describe("4. Automated Workflows (src/app/workflows/)", () => {
    const pageSrc = readSource("src/app/workflows/page.tsx");
    const layoutSrc = readSource("src/app/workflows/layout.tsx");

    it("exports complete route metadata in layout.tsx", () => {
      assert.ok(
        layoutSrc.includes("Automated File Workflows | FileFixer"),
        "Must export title Automated File Workflows | FileFixer"
      );
      assert.ok(layoutSrc.includes('canonical: "/workflows"'), "Must export canonical /workflows");
      assert.ok(
        layoutSrc.includes("/branding/filefixer-og.png"),
        "Must reference official openGraph branding asset"
      );
    });

    it("wraps workflows page in ToolPageShell", () => {
      assert.ok(pageSrc.includes("<ToolPageShell"), "Must wrap in ToolPageShell");
      assert.ok(pageSrc.includes("</ToolPageShell>"), "Must close ToolPageShell");
    });

    it("provides multi-step automation pipeline builder with pre-configured recipes", () => {
      assert.ok(pageSrc.includes("PRECONFIGURED_RECIPES"), "Must define starter recipes");
      assert.ok(pageSrc.includes("Web Ready Image"), "Must include Web Ready recipe");
      assert.ok(pageSrc.includes("Social Media Pack"), "Must include Social Media recipe");
    });

    it("enforces touch targets >= 44x44px on step cards, ordering buttons, and run triggers", () => {
      assert.ok(
        pageSrc.includes("flex h-11 w-11 min-h-[44px] min-w-[44px]"),
        "Step up, down, and delete controls must be at least 44x44px"
      );
      assert.ok(
        pageSrc.includes("min-h-[50px] touch-manipulation"),
        "Run automated workflow CTA must be >= 50px"
      );
    });

    it("integrates delivery flow (pushDownload, setLatestDeliveredFile, triggerSupportPrompt)", () => {
      assert.ok(pageSrc.includes("pushDownload"), "Must call pushDownload");
      assert.ok(pageSrc.includes("setLatestDeliveredFile"), "Must call setLatestDeliveredFile");
      assert.ok(pageSrc.includes("triggerSupportPrompt"), "Must call triggerSupportPrompt");
      assert.ok(pageSrc.includes("addHistoryRecord"), "Must record history in IndexedDB");
    });

    it("applies calibrated contrast and tabular numerals", () => {
      assert.ok(
        pageSrc.includes("text-emerald-700 dark:text-emerald-400"),
        "Must use calibrated contrast for success badges"
      );
      assert.ok(
        pageSrc.includes("tabular-nums font-mono"),
        "Must format all counts and sizes with tabular-nums"
      );
    });
  });

  // --------------------------------------------------------------------------
  // 5. Privacy Cleaner (src/app/privacy-cleaner/page.tsx)
  // --------------------------------------------------------------------------
  describe("5. Privacy Cleaner (src/app/privacy-cleaner/page.tsx)", () => {
    const src = readSource("src/app/privacy-cleaner/page.tsx");

    it("wraps in ToolPageShell with clear title and formats", () => {
      assert.ok(src.includes("<ToolPageShell"), "Must wrap in ToolPageShell");
      assert.ok(src.includes('title="Privacy Cleaner"'), "Must declare title");
      assert.ok(src.includes("</ToolPageShell>"), "Must close ToolPageShell");
    });

    it("genuinely supports PDF metadata scrubbing via compressPDF with removeMetadata: true", () => {
      assert.ok(src.includes("compressPDF"), "Must import and invoke compressPDF");
      assert.ok(src.includes("removeMetadata: true"), "Must specify removeMetadata: true");
    });

    it("contains zero window alert() calls, using accessible toast notifications", () => {
      assert.ok(!src.includes("alert("), "Must contain zero browser alert calls");
      assert.ok(src.includes("toast({"), "Must use accessible toast notifications");
    });

    it("enforces touch targets >= 44x44px and calibrated contrast", () => {
      assert.ok(src.includes("min-h-[44px] touch-manipulation"), "Buttons must have min-h-[44px]");
      assert.ok(src.includes("min-h-[48px] touch-manipulation"), "Action CTAs must have min-h-[48px]");
      assert.ok(
        src.includes("text-emerald-700 dark:text-emerald-400"),
        "Must use calibrated contrast for success states"
      );
      assert.ok(
        src.includes("text-amber-700 dark:text-amber-400") ||
          src.includes("text-amber-600 dark:text-amber-400"),
        "Must use calibrated contrast for warning states"
      );
    });

    it("actually strips PDF metadata fields in real client-side execution", async () => {
      const samplePdf = await createSamplePdf({
        title: "Top Secret Project Alpha",
        author: "Agent 007",
        subject: "Classified Intel",
        creator: "Classified Tool 2026",
        keywords: ["classified", "private"],
      });

      const cleaned = await compressPDF(samplePdf, {
        level: "smaller",
        removeMetadata: true,
      });

      assert.ok(cleaned.blob.size > 0, "Cleaned PDF must not be empty");

      const arrayBuffer = await cleaned.blob.arrayBuffer();
      const inspected = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true, updateMetadata: false });

      assert.equal(inspected.getTitle() || "", "", "Title dictionary must be erased");
      assert.equal(inspected.getAuthor() || "", "", "Author dictionary must be erased");
      assert.equal(inspected.getSubject() || "", "", "Subject dictionary must be erased");
      assert.equal(inspected.getCreator() || "", "", "Creator dictionary must be erased");
      const kw = inspected.getKeywords();
      assert.ok(!kw || kw.length === 0, "Keywords must be empty");
    });
  });

  // --------------------------------------------------------------------------
  // 6. Local Processing History (src/app/history/page.tsx)
  // --------------------------------------------------------------------------
  describe("6. Local History Workstation (src/app/history/page.tsx)", () => {
    const src = readSource("src/app/history/page.tsx");

    it("enforces touch target >= 44x44px on individual history delete button", () => {
      assert.ok(
        src.includes("flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center"),
        "Delete button must be at least 44x44px with centered flex layout"
      );
      assert.ok(
        src.includes("touch-manipulation"),
        "Delete button must have touch-manipulation"
      );
    });

    it("adds interactive replay / reopen action links on history records", () => {
      assert.ok(src.includes("getToolHref"), "Must have getToolHref route mapper");
      assert.ok(src.includes("Reopen"), "Must provide Reopen action link");
      assert.ok(
        src.includes("min-h-[44px] touch-manipulation"),
        "Reopen link must meet 44px touch target standard"
      );
    });

    it("ensures all metric figures and bytes use tabular numerals", () => {
      assert.ok(
        src.includes("tabular-nums font-mono"),
        "Must apply tabular-nums font-mono to byte counts and record statistics"
      );
      assert.ok(
        src.includes("text-emerald-700 dark:text-emerald-400"),
        "Must use calibrated contrast for bandwidth saved KPI"
      );
    });
  });

  // --------------------------------------------------------------------------
  // 7. ZIP Archiving Utility (src/lib/zip.ts)
  // --------------------------------------------------------------------------
  describe("7. ZIP Archiving Utility (src/lib/zip.ts)", () => {
    it("returns Promise<Blob> from createZipBlob and downloadAsZip", async () => {
      const entries: ZipEntry[] = [
        { filename: "test1.txt", blob: new Blob(["Hello 1"], { type: "text/plain" }) },
        { filename: "test2.txt", blob: new Blob(["Hello 2"], { type: "text/plain" }) },
      ];

      const blob = await createZipBlob(entries);
      assert.ok(blob instanceof Blob, "Must return a valid Blob instance");
      assert.ok(blob.size > 0, "Blob must have positive byte weight");

      const zip = await JSZip.loadAsync(await blob.arrayBuffer());
      assert.ok(zip.file("test1.txt"), "Must contain test1.txt");
      assert.ok(zip.file("test2.txt"), "Must contain test2.txt");

      const content1 = await zip.file("test1.txt")?.async("string");
      assert.equal(content1, "Hello 1");
    });
  });
});
