import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
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
import { inspectFile } from "../src/lib/inspect";
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
  page.drawText("Confidential Internal Document - Reviewer Verification");

  const bytes = await doc.save();
  return new File([bytes as unknown as BlobPart], "confidential_document.pdf", {
    type: "application/pdf",
  });
}

describe("Milestone 5 Comprehensive Suite: Batch Utilities, Workflows & Information Hub", () => {
  // ==========================================================================
  // 1. Batch Renaming Engine Core & Deep Edge Cases
  // ==========================================================================
  describe("1. Batch Renaming Engine (src/lib/batch/rename.ts)", () => {
    it("correctly handles titlecase across spaces, underscores, and hyphens", () => {
      assert.equal(applyCaseTransform("hello_world", "titlecase"), "Hello_World");
      assert.equal(applyCaseTransform("annual_report_2026", "titlecase"), "Annual_Report_2026");
      assert.equal(applyCaseTransform("my-sample-file", "titlecase"), "My-Sample-File");
      assert.equal(applyCaseTransform("hello world", "titlecase"), "Hello World");
      assert.equal(applyCaseTransform("already TitleCase", "titlecase"), "Already Titlecase");
    });

    it("correctly collapses duplicates and trims hyphens/underscores in kebab and snake case", () => {
      assert.equal(applyCaseTransform("  spaced name  ", "kebab"), "spaced-name");
      assert.equal(applyCaseTransform("my - file", "kebab"), "my-file");
      assert.equal(applyCaseTransform("---leading---trailing---", "kebab"), "leading-trailing");

      assert.equal(applyCaseTransform("  spaced name  ", "snake"), "spaced_name");
      assert.equal(applyCaseTransform("my - file", "snake"), "my_file");
      assert.equal(applyCaseTransform("___leading___trailing___", "snake"), "leading_trailing");
    });

    it("shields against replacement pattern injection ($1, $&, $') in templates", () => {
      // In JavaScript string.replace, $& would insert the matched token "{orig}" if not escaped or handled via function
      const resAmp = applyRenameRules("Report$&v1.txt", 0, { template: "Doc_{orig}" });
      assert.equal(resAmp, "Doc_Report$&v1.txt");

      const resGroup = applyRenameRules("Invoice$1.pdf", 0, { template: "Archive_{orig}" });
      assert.equal(resGroup, "Archive_Invoice$1.pdf");

      const resDollar = applyRenameRules("Price$100.png", 0, { template: "Product_{orig}" });
      assert.equal(resDollar, "Product_Price$100.png");
    });

    it("supports extended template tokens: {orig}, {name}, {ext}, {n}, {index}", () => {
      const res = applyRenameRules("photo_raw.JPG", 4, {
        template: "{name}_processed_{n}.{ext}",
        preserveExtension: false,
      });
      assert.equal(res, "photo_raw_processed_5.JPG");
    });

    it("validates filenames against Windows reserved device names and trailing dots", () => {
      // DOS / Windows device names
      assert.equal(validateFilename("CON.txt").valid, false);
      assert.equal(validateFilename("con.png").valid, false);
      assert.equal(validateFilename("PRN.pdf").valid, false);
      assert.equal(validateFilename("AUX.jpg").valid, false);
      assert.equal(validateFilename("NUL").valid, false);
      assert.equal(validateFilename("COM1.txt").valid, false);
      assert.equal(validateFilename("LPT9.png").valid, false);

      // Trailing periods (illegal in Windows / NTFS)
      assert.equal(validateFilename("invalid_dot.").valid, false);
      assert.equal(validateFilename("photo.jpg.").valid, false);

      // Illegal characters
      assert.equal(validateFilename("bad:name.png").valid, false);
      assert.equal(validateFilename("bad*name.png").valid, false);
      assert.equal(validateFilename("bad?name.png").valid, false);
      assert.equal(validateFilename("bad<name.png").valid, false);
      assert.equal(validateFilename("bad>name.png").valid, false);
      assert.equal(validateFilename("bad|name.png").valid, false);

      // Legal filenames
      assert.equal(validateFilename("legal-file_2026.png").valid, true);
      assert.equal(validateFilename("Document (1).pdf").valid, true);
    });

    it("resolves duplicate collisions in packageRenamedZip in O(N) time for large batches", async () => {
      const count = 100;
      const files: File[] = [];
      for (let i = 0; i < count; i++) {
        files.push(new File([`content ${i}`], `file_${i}.txt`, { type: "text/plain" }));
      }

      // Rename all 100 files to the EXACT same static name
      const startTime = Date.now();
      const zipBlob = await packageRenamedZip(files, { template: "StandardDoc" });
      const duration = Date.now() - startTime;

      assert.ok(zipBlob.size > 0, "ZIP blob must be created");
      assert.ok(duration < 2000, `Collision resolution must complete swiftly (took ${duration}ms)`);

      const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
      const names = Object.keys(zip.files);
      assert.equal(names.length, count, `All ${count} files must exist in zip`);

      // Verify names follow standard collision sequence: StandardDoc.txt, StandardDoc_1.txt, StandardDoc_2.txt...
      assert.ok(names.includes("StandardDoc.txt"));
      assert.ok(names.includes("StandardDoc_1.txt"));
      assert.ok(names.includes("StandardDoc_99.txt"));
    });
  });

  // ==========================================================================
  // 2. Batch Hub Workstation (src/app/batch/page.tsx)
  // ==========================================================================
  describe("2. Batch Hub Workstation (src/app/batch/page.tsx)", () => {
    const src = readSource("src/app/batch/page.tsx");

    it("wraps in ToolPageShell with title, description, and breadcrumbs", () => {
      assert.ok(src.includes("<ToolPageShell"), "Must wrap in ToolPageShell");
      assert.ok(src.includes('title="Batch Studio"'), "Must specify title");
      assert.ok(src.includes("</ToolPageShell>"), "Must close ToolPageShell");
    });

    it("wires setLatestDeliveredFile to single-file and all-individual save handlers", () => {
      assert.ok(src.includes("handleDownloadSingle"), "Must declare handleDownloadSingle");
      assert.ok(src.includes("setLatestDeliveredFile"), "Must trigger celebratory delivery modal");
      assert.ok(src.includes("triggerSupportPrompt"), "Must hook into voluntary support prompt");
    });

    it("enforces touch targets >= 44x44px and touch-manipulation across all interactive controls", () => {
      assert.ok(
        src.includes("min-h-[44px] touch-manipulation"),
        "Toolbar inputs, buttons, and switches must have min-h-[44px] touch-manipulation"
      );
      assert.ok(
        src.includes("flex h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation"),
        "Individual file remove button must measure at least 44x44px"
      );
    });

    it("uses calibrated WCAG AA contrast and tabular numerals", () => {
      assert.ok(
        src.includes("text-emerald-700 dark:text-emerald-400"),
        "Must use calibrated text-emerald-700/400"
      );
      assert.ok(
        src.includes("tabular-nums font-mono"),
        "Must apply tabular-nums font-mono to metrics"
      );
    });
  });

  // ==========================================================================
  // 3. Batch Rename Page (src/app/batch-rename/page.tsx)
  // ==========================================================================
  describe("3. Batch Rename Page (src/app/batch-rename/page.tsx)", () => {
    const src = readSource("src/app/batch-rename/page.tsx");

    it("does not prematurely push preview files into download queue on file drop", () => {
      // Must not call pushDownload inside a previews.length useEffect
      const hasPrematurePush = src.includes("previews.slice(0, 5).forEach((p) => {");
      assert.equal(hasPrematurePush, false, "Must not auto-push preview items to download queue");
    });

    it("integrates full delivery flow (pushDownload, setLatestDeliveredFile, triggerSupportPrompt)", () => {
      assert.ok(src.includes("pushDownload"), "Must call pushDownload");
      assert.ok(src.includes("setLatestDeliveredFile"), "Must call setLatestDeliveredFile");
      assert.ok(src.includes("triggerSupportPrompt"), "Must call triggerSupportPrompt");
      assert.ok(src.includes("addHistoryRecord"), "Must record history");
    });

    it("enforces touch targets >= 44px on tabs, preset chips, and remove buttons", () => {
      assert.ok(src.includes("min-h-[44px] touch-manipulation"), "Interactive controls must be >= 44px");
      assert.ok(src.includes("flex h-11 w-11 min-h-[44px] min-w-[44px]"), "Remove button must be >= 44x44px");
    });
  });

  // ==========================================================================
  // 4. Privacy Cleaner (src/app/privacy-cleaner/page.tsx)
  // ==========================================================================
  describe("4. Privacy Cleaner (src/app/privacy-cleaner/page.tsx)", () => {
    const src = readSource("src/app/privacy-cleaner/page.tsx");

    it("safely extracts base and extension without duplicating extension on extension-less files", () => {
      assert.ok(src.includes("lastIndexOf(\".\")"), "Must use lastIndexOf for extension extraction");
      assert.ok(src.includes("ext ? `${base}_privacy_clean.${ext}` : `${base}_privacy_clean`"), "Must handle files without extension");
    });

    it("rejects unsupported file types with informative toast rather than false success", () => {
      assert.ok(src.includes("Unsupported file format"), "Must show unsupported file format toast");
    });

    it("provides New File reset button allowing users to return to DropZone", () => {
      assert.ok(src.includes("New File"), "Must include New File button");
      assert.ok(src.includes("setActiveFile(null)"), "Must allow clearing active file");
    });

    it("genuinely strips PDF metadata fields in real client-side execution", async () => {
      const samplePdf = await createSamplePdf({
        title: "Confidential Strategy Report",
        author: "Chief Security Officer",
        subject: "Executive Briefing",
        creator: "Acrobat Distiller 2026",
        keywords: ["classified", "internal", "restricted"],
      });

      const cleaned = await compressPDF(samplePdf, {
        level: "smaller",
        removeMetadata: true,
      });

      assert.ok(cleaned.blob.size > 0, "Cleaned PDF must not be empty");
      const buffer = await cleaned.blob.arrayBuffer();
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true, updateMetadata: false });

      assert.equal(pdf.getTitle() || "", "", "Title must be scrubbed");
      assert.equal(pdf.getAuthor() || "", "", "Author must be scrubbed");
      assert.equal(pdf.getSubject() || "", "", "Subject must be scrubbed");
      assert.equal(pdf.getCreator() || "", "", "Creator must be scrubbed");
      const kw = pdf.getKeywords();
      assert.ok(!kw || kw.length === 0, "Keywords must be scrubbed");
    });

    it("contains zero window.alert() calls and enforces touch targets >= 44px", () => {
      assert.ok(!src.includes("alert("), "Must contain zero window alert calls");
      assert.ok(src.includes("min-h-[44px] touch-manipulation"), "Must enforce touch targets >= 44px");
      assert.ok(src.includes("min-h-[48px] touch-manipulation"), "Must enforce primary button >= 48px");
    });
  });

  // ==========================================================================
  // 5. Universal File Inspector (src/app/inspect/page.tsx & inspect.ts)
  // ==========================================================================
  describe("5. Universal File Inspector (src/app/inspect/page.tsx)", () => {
    const src = readSource("src/app/inspect/page.tsx");

    it("extracts comprehensive metadata from both image and PDF files", async () => {
      const samplePdf = await createSamplePdf({
        title: "Architecture Blueprint",
        author: "Principal Engineer",
        keywords: ["nextjs", "wasm", "client-side"],
      });

      const metadata = await inspectFile(samplePdf);
      assert.equal(metadata.category, "pdf");
      assert.equal(metadata.pdfPages, 1);
      assert.equal(metadata.pdfTitle, "Architecture Blueprint");
      assert.equal(metadata.pdfAuthor, "Principal Engineer");
      assert.ok(metadata.pdfKeywords?.includes("nextjs"));
    });

    it("provides quick action routing buttons with touch targets >= 44px", () => {
      assert.ok(src.includes('href="/privacy-cleaner"'), "Must link to Privacy Cleaner");
      assert.ok(src.includes('href="/compress-image"'), "Must link to Compress Image");
      assert.ok(src.includes('href="/pdf-compress"'), "Must link to Compress PDF");
      assert.ok(src.includes("min-h-[44px]"), "Quick action buttons must have min-h-[44px]");
    });

    it("enforces tabular numerals on all file sizes, dates, and metrics", () => {
      assert.ok(src.includes("tabular-nums"), "Must format numeric values with tabular-nums");
    });
  });

  // ==========================================================================
  // 6. Local Processing History (src/app/history/page.tsx)
  // ==========================================================================
  describe("6. Local Processing History (src/app/history/page.tsx)", () => {
    const src = readSource("src/app/history/page.tsx");

    it("enforces touch target >= 44x44px on individual history delete button", () => {
      assert.ok(
        src.includes("flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center"),
        "Delete button must be at least 44x44px"
      );
      assert.ok(src.includes("touch-manipulation"), "Must include touch-manipulation");
    });

    it("provides Reopen action links mapping back to canonical tool routes", () => {
      assert.ok(src.includes("getToolHref"), "Must have getToolHref route mapper");
      assert.ok(src.includes("Reopen"), "Must have Reopen link");
      assert.ok(src.includes("min-h-[44px] touch-manipulation"), "Reopen link must be >= 44px");
    });

    it("applies tabular numerals and calibrated contrast to saved metrics", () => {
      assert.ok(src.includes("tabular-nums font-mono"), "Must format bytes with tabular numerals");
      assert.ok(src.includes("text-emerald-700 dark:text-emerald-400"), "Must use calibrated emerald");
    });
  });

  // ==========================================================================
  // 7. Informational Pages (about, privacy, terms, branding)
  // ==========================================================================
  describe("7. Informational Pages Accessibility & Navigation", () => {
    const aboutSrc = readSource("src/app/about/page.tsx");
    const privacySrc = readSource("src/app/privacy/page.tsx");
    const termsSrc = readSource("src/app/terms/page.tsx");
    const brandingSrc = readSource("src/app/branding/page.tsx");

    it("terms page includes responsive navigation links with touch targets >= 44px", () => {
      assert.ok(termsSrc.includes('href="/tools"'), "Terms page must link to /tools");
      assert.ok(termsSrc.includes('href="/privacy"'), "Terms page must link to /privacy");
      assert.ok(termsSrc.includes("min-h-[44px]"), "Terms CTA buttons must be >= 44px");
    });

    it("about page includes CTAs with >= 44px touch targets and calibrated contrast", () => {
      assert.ok(aboutSrc.includes("min-h-[44px]"), "About CTA buttons must be >= 44px");
      assert.ok(aboutSrc.includes("text-emerald-700 dark:text-emerald-400"), "Must use calibrated emerald");
    });

    it("privacy page includes offline indicator and navigation CTAs >= 44px", () => {
      assert.ok(privacySrc.includes("Works 100% Offline After Load"), "Must document offline capability");
      assert.ok(privacySrc.includes("min-h-[44px]"), "Privacy CTAs must be >= 44px");
      assert.ok(privacySrc.includes("text-emerald-700 dark:text-emerald-400"), "Must use calibrated emerald");
    });

    it("branding page provides download links and bottom CTAs with >= 44px touch targets", () => {
      assert.ok(brandingSrc.includes("downloadableAssets"), "Must list downloadable assets");
      assert.ok(brandingSrc.includes("min-h-[44px]"), "Branding CTAs must be >= 44px");
    });
  });

  // ==========================================================================
  // 8. Security & Invariant Guards
  // ==========================================================================
  describe("8. Security & Invariant Verification", () => {
    it("preserves exact SHA-256 hash of support QR code image", () => {
      const qrPath = path.join(rootDir, "public/images/filefixer_support_qr.png");
      assert.ok(fs.existsSync(qrPath), "QR image file must exist");
      const buffer = fs.readFileSync(qrPath);
      const hash = crypto.createHash("sha256").update(buffer).digest("hex");
      assert.equal(
        hash,
        "8592bd8a18457f3ac496d6735c472d7c4f3239e87b93771ed238d348b87d4744",
        "QR code image must be bit-for-bit immutable"
      );
    });

    it("contains zero external network requests in batch and utility libraries", () => {
      const renameLib = readSource("src/lib/batch/rename.ts");
      const batchProc = readSource("src/lib/batch/batchProcessor.ts");
      const inspectLib = readSource("src/lib/inspect.ts");

      assert.ok(!renameLib.includes("fetch("), "rename.ts must have zero fetch calls");
      assert.ok(!renameLib.includes("axios"), "rename.ts must not import axios");
      assert.ok(!batchProc.includes("fetch("), "batchProcessor.ts must have zero fetch calls");
      assert.ok(!inspectLib.includes("fetch("), "inspect.ts must have zero fetch calls");
    });
  });
});
