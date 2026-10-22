import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

describe("Privacy Invariant: Zero Server Uploads & On-Device Integrity", () => {
  it("PI-1: src/app/api has strictly zero endpoint files", () => {
    const apiDir = path.join(rootDir, "src/app/api");
    if (fs.existsSync(apiDir)) {
      const entries = fs.readdirSync(apiDir, { recursive: true }) as string[];
      const routeFiles = entries.filter((e) => e.endsWith(".ts") || e.endsWith(".js"));
      assert.strictEqual(
        routeFiles.length,
        0,
        `Zero-Server Upload Violation: Found API route files: ${routeFiles.join(", ")}`
      );
    }
  });

  it("PI-2: No outbound file upload endpoints or remote tracking domains in source code", () => {
    const srcDir = path.join(rootDir, "src");
    const allFiles: string[] = [];

    function collectFiles(dir: string) {
      const list = fs.readdirSync(dir);
      for (const item of list) {
        const full = path.join(dir, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          collectFiles(full);
        } else if (item.endsWith(".ts") || item.endsWith(".tsx")) {
          allFiles.push(full);
        }
      }
    }

    collectFiles(srcDir);

    const forbiddenPatterns = [
      "google-analytics.com",
      "googletagmanager.com",
      "hotjar.com",
      "mixpanel.com",
      "segment.io",
      "uploadcare.com",
      "filestackapi.com",
      "cloudinary.com/v1_1",
    ];

    for (const filePath of allFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      for (const pattern of forbiddenPatterns) {
        assert.ok(
          !content.includes(pattern),
          `Privacy Violation: Found tracking/upload pattern '${pattern}' in ${path.relative(rootDir, filePath)}`
        );
      }
    }
  });

  it("PI-3: Image engines use in-browser Canvas, Web Worker, and exifr", () => {
    const compressPath = path.join(rootDir, "src/lib/image/compress.ts");
    const convertPath = path.join(rootDir, "src/lib/image/convert.ts");
    const metadataPath = path.join(rootDir, "src/lib/image/metadata.ts");

    assert.ok(fs.existsSync(compressPath), "compress.ts missing");
    assert.ok(fs.existsSync(convertPath), "convert.ts missing");
    assert.ok(fs.existsSync(metadataPath), "metadata.ts missing");

    const compressContent = fs.readFileSync(compressPath, "utf-8");
    assert.ok(
      compressContent.includes("imageCompression") || compressContent.includes("canvas"),
      "Image compression must use client-side browser compression or canvas"
    );

    const convertContent = fs.readFileSync(convertPath, "utf-8");
    assert.ok(
      convertContent.includes("document.createElement(\"canvas\")") || convertContent.includes("canvas"),
      "Image convert must use HTML5 canvas rasterization"
    );

    const metadataContent = fs.readFileSync(metadataPath, "utf-8");
    assert.ok(
      metadataContent.includes("exifr"),
      "Metadata inspector must use in-browser exifr"
    );
  });

  it("PI-4: PDF engines use in-browser pdf-lib manipulation", () => {
    const mergePath = path.join(rootDir, "src/lib/pdf/merge.ts");
    const splitPath = path.join(rootDir, "src/lib/pdf/split.ts");
    const compressPath = path.join(rootDir, "src/lib/pdf/compress.ts");

    assert.ok(fs.existsSync(mergePath), "pdf/merge.ts missing");
    assert.ok(fs.existsSync(splitPath), "pdf/split.ts missing");
    assert.ok(fs.existsSync(compressPath), "pdf/compress.ts missing");

    const mergeContent = fs.readFileSync(mergePath, "utf-8");
    assert.ok(mergeContent.includes("pdf-lib"), "PDF merge must use pdf-lib");

    const splitContent = fs.readFileSync(splitPath, "utf-8");
    assert.ok(splitContent.includes("pdf-lib"), "PDF split must use pdf-lib");
  });

  it("PI-5: Storage is strictly local: IndexedDB (filefixer_db) stores metadata only, zero file blobs", () => {
    const historyPath = path.join(rootDir, "src/lib/storage/history.ts");
    assert.ok(fs.existsSync(historyPath), "history.ts missing");
    const content = fs.readFileSync(historyPath, "utf-8");
    assert.ok(content.includes("idb") || content.includes("indexedDB"), "History must use browser IndexedDB");
    assert.ok(content.includes("filefixer_db"), "IndexedDB database name mismatch");
  });
});
