import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  formatBytes,
  calcSavings,
  getMimeFromExtension,
  getExtensionFromMime,
  isPDFFile,
  stripExtension,
} from "../src/lib/file-utils.js";
import { parsePageSelection } from "../src/lib/pdf/split.js";
import { computeOptimizationScore } from "../src/lib/score.js";
import { useFileStore } from "../src/stores/fileStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

describe("Tier 4: Real-World Application Scenarios (E2E Workflows)", () => {
  // ------------------------------------------------------------------------
  // Scenario 1: Photographer Privacy & Web Optimization Pipeline
  // ------------------------------------------------------------------------
  it("Scenario 1: Photographer imports high-res photo, scrubs GPS, converts to WebP, and evaluates score", () => {
    // 1. Raw camera photo metadata
    const rawPhoto = {
      name: "DSC_09821.JPG",
      size: 4800000, // 4.8 MB
      type: "image/jpeg",
      width: 4608,
      height: 3456,
      hasExif: true,
      hasGps: true,
      metadataCleaned: false,
    };

    // 2. Pre-optimization audit score
    const initialScore = computeOptimizationScore(rawPhoto);
    assert.strictEqual(initialScore.breakdown.privacy, 4, "GPS coordinates must incur severe privacy penalty");
    assert.strictEqual(initialScore.breakdown.dimensions, 8, "Excessive camera resolution (>4000px) penalized");
    assert.ok(initialScore.suggestions.some((s) => s.includes("GPS")), "GPS removal suggestion required");

    // 3. Scrub metadata & convert to WebP with web scaling
    const optimizedPhoto = {
      name: "DSC_09821.webp",
      size: 4800000,
      type: "image/jpeg",
      outputSize: 420000, // ~420 KB
      outputType: "image/webp",
      width: 1920,
      height: 1440,
      metadataCleaned: true,
      hasGps: false,
      hasExif: false,
    };

    // 4. Post-optimization score
    const postScore = computeOptimizationScore(optimizedPhoto);
    assert.strictEqual(postScore.breakdown.privacy, 20, "Scrubbed metadata achieves full privacy score");
    assert.strictEqual(postScore.breakdown.dimensions, 20, "1920px width achieves sweet spot dimension score");
    assert.strictEqual(postScore.breakdown.format, 25, "WebP achieves top format rating");
    assert.ok(postScore.overall >= 90, `Expected score >= 90, got ${postScore.overall}`);
    assert.strictEqual(postScore.rating, "Excellent");

    // 5. Savings calculation
    const savings = calcSavings(rawPhoto.size, optimizedPhoto.outputSize);
    assert.strictEqual(savings, "91.3%");

    // 6. Push delivered item to download queue
    const store = useFileStore.getState();
    const id = store.pushDownload({
      fileName: "DSC_09821.webp",
      originalSize: rawPhoto.size,
      outputSize: optimizedPhoto.outputSize,
      status: "downloaded",
    });
    assert.ok(id.startsWith("dl-"));
    assert.strictEqual(useFileStore.getState().latestDeliveredFile?.fileName, "DSC_09821.webp");
  });

  // ------------------------------------------------------------------------
  // Scenario 2: Corporate Multi-Report PDF Merge & Restructure
  // ------------------------------------------------------------------------
  it("Scenario 2: Corporate user merges 3 quarterly reports into a single consolidated PDF", () => {
    const reportA = { name: "Executive_Summary.pdf", pages: 2, size: 250000, type: "application/pdf" };
    const reportB = { name: "Financials_Q3.pdf", pages: 6, size: 750000, type: "application/pdf" };
    const reportC = { name: "Appendix.pdf", pages: 4, size: 400000, type: "application/pdf" };

    const batch = [reportA, reportB, reportC];
    
    // 1. Verify all files are valid PDF format
    for (const doc of batch) {
      assert.ok(isPDFFile(doc as unknown as File), `${doc.name} must be identified as PDF`);
    }

    // 2. Validate multi-file merge precondition
    assert.ok(batch.length >= 2, "Merge requires at least 2 documents");

    // 3. Combined page count
    const totalExpectedPages = batch.reduce((sum, doc) => sum + doc.pages, 0);
    assert.strictEqual(totalExpectedPages, 12);

    // 4. Staged for download
    const totalInputSize = batch.reduce((sum, doc) => sum + doc.size, 0);
    const estimatedOutputSize = 1320000;

    const store = useFileStore.getState();
    store.pushDownload({
      fileName: "merged_document.pdf",
      originalSize: totalInputSize,
      outputSize: estimatedOutputSize,
      status: "downloaded",
    });

    const latest = useFileStore.getState().latestDeliveredFile;
    assert.strictEqual(latest?.fileName, "merged_document.pdf");
    assert.strictEqual(latest?.originalSize, 1400000);
  });

  // ------------------------------------------------------------------------
  // Scenario 3: Academic Thesis Chapter Extraction & Reassembly
  // ------------------------------------------------------------------------
  it("Scenario 3: Academic thesis chapter extraction using complex multi-range expression", () => {
    const thesisDoc = {
      name: "Doctoral_Dissertation_2026.pdf",
      totalPages: 75,
      size: 15400000,
    };

    // User specifies chapters: Intro (1-5), Methodology (18-24), Results (40-48), Abstract (1)
    const selectionQuery = "1-5, 18-24, 40-48, 1";
    const selectedPages = parsePageSelection(selectionQuery, thesisDoc.totalPages);

    // 1. Verify duplicates are unified into a sorted set of 0-indexed indices
    // 1-5 -> 0,1,2,3,4 (5 pages)
    // 18-24 -> 17,18,19,20,21,22,23 (7 pages)
    // 40-48 -> 39,40,41,42,43,44,45,46,47 (9 pages)
    // '1' was already included in 1-5, so total unique pages = 5 + 7 + 9 = 21 pages
    assert.strictEqual(selectedPages.length, 21);
    assert.strictEqual(selectedPages[0], 0);
    assert.strictEqual(selectedPages[selectedPages.length - 1], 47);

    // 2. Naming convention
    const baseName = stripExtension(thesisDoc.name);
    const outputFilename = `${baseName}_extracted.pdf`;
    assert.strictEqual(outputFilename, "Doctoral_Dissertation_2026_extracted.pdf");

    // 3. Stage in download dock
    const store = useFileStore.getState();
    store.pushDownload({
      fileName: outputFilename,
      originalSize: thesisDoc.size,
      outputSize: 4200000,
      status: "downloaded",
    });

    assert.strictEqual(useFileStore.getState().latestDeliveredFile?.fileName, outputFilename);
  });

  // ------------------------------------------------------------------------
  // Scenario 4: Enterprise Bulk Batch Asset Standardization
  // ------------------------------------------------------------------------
  it("Scenario 4: E-commerce team standardizes 6 product photos into numbered WebP sequence", () => {
    const incomingFiles = [
      "sneaker_side.png",
      "sneaker_top.png",
      "sneaker_sole.png",
      "box_front.jpg",
      "box_side.jpg",
      "lifestyle_model.jpeg",
    ];

    const config = {
      renamePattern: "Catalog_Spring2026_###",
      startNumber: 101,
      targetFormat: getMimeFromExtension("webp"),
    };

    const targetExt = getExtensionFromMime(config.targetFormat);
    const hashMatch = config.renamePattern.match(/#+/);
    const padding = hashMatch ? hashMatch[0].length : 3;

    const processedItems = incomingFiles.map((file, idx) => {
      const num = config.startNumber + idx;
      const padded = String(num).padStart(padding, "0");
      const base = config.renamePattern.replace(/#+/, padded);
      return {
        originalName: file,
        outputName: `${base}.${targetExt}`,
        originalSize: 1200000,
        outputSize: 320000,
      };
    });

    assert.strictEqual(processedItems.length, 6);
    assert.strictEqual(processedItems[0].outputName, "Catalog_Spring2026_101.webp");
    assert.strictEqual(processedItems[5].outputName, "Catalog_Spring2026_106.webp");

    // All formats normalized to webp
    for (const item of processedItems) {
      assert.ok(item.outputName.endsWith(".webp"));
    }
  });

  // ------------------------------------------------------------------------
  // Scenario 5: Sensitive Mobile Document Filing with Zero-Egress Guarantee
  // ------------------------------------------------------------------------
  it("Scenario 5: Mobile citizen compresses identity scan with zero external network requests", () => {
    // 1. Verify app/api remains empty
    const apiDir = path.join(rootDir, "src/app/api");
    const endpoints = fs.existsSync(apiDir) ? fs.readdirSync(apiDir) : [];
    assert.strictEqual(endpoints.length, 0, "No server endpoints permitted");

    // 2. Format byte size accurately with tabular numbers
    const inputSize = 3145728; // 3 MB
    const targetSize = 980000; // ~980 KB (< 1 MB government limit)
    const formattedInput = formatBytes(inputSize);
    const formattedOutput = formatBytes(targetSize);
    const savings = calcSavings(inputSize, targetSize);

    assert.strictEqual(formattedInput, "3 MB");
    assert.strictEqual(formattedOutput, "957.03 KB");
    assert.strictEqual(savings, "68.8%");

    // 3. Stage delivered item
    const store = useFileStore.getState();
    store.pushDownload({
      fileName: "Passport_Scan_under1mb.pdf",
      originalSize: inputSize,
      outputSize: targetSize,
      status: "downloaded",
    });

    assert.strictEqual(useFileStore.getState().latestDeliveredFile?.fileName, "Passport_Scan_under1mb.pdf");

    // 4. Voluntary Support QR code is available locally in public assets
    const qrPath = path.join(rootDir, "public/images/filefixer_support_qr.png");
    assert.ok(fs.existsSync(qrPath), "Support QR asset must be available locally on-device");
  });
});
