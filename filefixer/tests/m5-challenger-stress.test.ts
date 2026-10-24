import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument, PageSizes, PDFName, PDFString } from "pdf-lib";
import JSZip from "jszip";

import {
  applyRenameRules,
  splitFilename,
  applyCaseTransform,
  validateFilename,
  previewRenames,
  packageRenamedZip,
  RenameRules,
} from "../src/lib/batch/rename";
import { compressPDF } from "../src/lib/pdf/compress";

describe("Adversarial Challenger Stress Suite: M5 Batch Processing & Privacy Cleaner", () => {
  // ==========================================================================
  // Section 1: applyRenameRules Boundary & Edge Cases
  // ==========================================================================
  describe("1. applyRenameRules Edge Cases & Fault Tolerance", () => {
    it("handles empty strings and whitespace filenames gracefully", () => {
      // Empty filename
      const emptyRes = applyRenameRules("", 0, { prefix: "pre_", suffix: "_post" });
      assert.equal(emptyRes, "pre__post");

      // Filename with only spaces
      const spaceRes = applyRenameRules("   ", 0, { prefix: "pre_" });
      assert.equal(spaceRes, "pre_   ");

      // Dotfiles (e.g. .gitignore, .env)
      const dotRes = applyRenameRules(".env", 0, { suffix: ".backup" });
      assert.equal(dotRes, ".env.backup");

      // Trailing dot
      const trailDotRes = applyRenameRules("test.", 0, { prefix: "v1_" });
      assert.equal(trailDotRes, "v1_test.");

      // Multiple dots
      const multiDotRes = applyRenameRules("archive.tar.gz", 0, { prefix: "backup_" });
      assert.equal(multiDotRes, "backup_archive.tar.gz");
    });

    it("does not throw on invalid regex patterns or invalid regex flags", () => {
      const invalidPatterns = [
        "[unclosed",
        "(unclosed_group",
        "\\",
        "+++",
        "?invalid_quantifier",
        "*star_first",
        "{5,2}", // invalid range quantifier in regex
      ];

      for (const pattern of invalidPatterns) {
        assert.doesNotThrow(() => {
          const res = applyRenameRules("sample_file.txt", 0, {
            regex: { pattern, replacement: "REPLACED" },
          });
          // On invalid regex, the original filename should be preserved intact
          assert.equal(res, "sample_file.txt");
        }, `Should not throw on invalid pattern: ${pattern}`);
      }

      // Invalid regex flags
      assert.doesNotThrow(() => {
        const res = applyRenameRules("sample_file.txt", 0, {
          regex: { pattern: "sample", replacement: "demo", flags: "invalid_flags#$%" },
        });
        assert.equal(res, "sample_file.txt");
      });
    });

    it("evaluates zero-padding boundary conditions (0, 1, 10, undefined)", () => {
      // Padding = 0: should not crash, should produce unpadded number
      const pad0 = applyRenameRules("photo.jpg", 0, {
        numbering: { enabled: true, startIndex: 1, padding: 0, position: "suffix" },
      });
      assert.equal(pad0, "photo_1.jpg");

      // Padding = 1: 1 -> "1", 10 -> "10"
      const pad1_first = applyRenameRules("photo.jpg", 0, {
        numbering: { enabled: true, startIndex: 1, padding: 1, position: "suffix" },
      });
      assert.equal(pad1_first, "photo_1.jpg");

      const pad1_tenth = applyRenameRules("photo.jpg", 9, {
        numbering: { enabled: true, startIndex: 1, padding: 1, position: "suffix" },
      });
      assert.equal(pad1_tenth, "photo_10.jpg");

      // Padding = 10: 1 -> "0000000001"
      const pad10 = applyRenameRules("photo.jpg", 0, {
        numbering: { enabled: true, startIndex: 1, padding: 10, position: "suffix" },
      });
      assert.equal(pad10, "photo_0000000001.jpg");

      // Hash template boundary tests
      const hash1 = applyRenameRules("file.txt", 4, { template: "Doc_#" });
      assert.equal(hash1, "Doc_5.txt");

      const hash10 = applyRenameRules("file.txt", 0, { template: "Doc_##########" });
      assert.equal(hash10, "Doc_0000000001.txt");
    });

    it("handles extreme sequence indices (large indices and zero startIndex)", () => {
      // Very large sequence index
      const hugeIndex = applyRenameRules("item.png", 999999, {
        numbering: { enabled: true, startIndex: 1, padding: 3, position: "suffix" },
      });
      assert.equal(hugeIndex, "item_1000000.png");

      // Zero start index with padding
      const zeroStart = applyRenameRules("item.png", 0, {
        numbering: { enabled: true, startIndex: 0, padding: 4, position: "prefix" },
      });
      assert.equal(zeroStart, "0000_item.png");

      const zeroStartNext = applyRenameRules("item.png", 1, {
        numbering: { enabled: true, startIndex: 0, padding: 4, position: "prefix" },
      });
      assert.equal(zeroStartNext, "0001_item.png");
    });

    it("evaluates case transforms with mixed punctuation, numbers, and symbols", () => {
      // CamelCase conversion to kebab and snake
      assert.equal(applyCaseTransform("iPhoneAppLaunch2026", "kebab"), "i-phone-app-launch2026");
      assert.equal(applyCaseTransform("iPhoneAppLaunch2026", "snake"), "i_phone_app_launch2026");

      // Collapses multiple delimiters cleanly:
      assert.equal(applyCaseTransform("hello___world---test   run", "kebab"), "hello-world-test-run");
      assert.equal(applyCaseTransform("hello___world---test   run", "snake"), "hello_world_test_run");

      // Collapses spaces around delimiters:
      assert.equal(applyCaseTransform("hello - world", "kebab"), "hello-world");
      assert.equal(applyCaseTransform("hello _ world", "snake"), "hello_world");

      // Titlecase correctly capitalizes words following spaces, dashes, underscores, dots, and slashes:
      assert.equal(
        applyCaseTransform("q1-financial-summary_v2", "titlecase"),
        "Q1-Financial-Summary_V2"
      );
      assert.equal(applyCaseTransform("hello_world", "titlecase"), "Hello_World");

      // Uppercase and Lowercase
      assert.equal(applyCaseTransform("Final_Draft_v1.0", "uppercase"), "FINAL_DRAFT_V1.0");
      assert.equal(applyCaseTransform("Final_Draft_v1.0", "lowercase"), "final_draft_v1.0");

      // Empty string
      assert.equal(applyCaseTransform("", "kebab"), "");
      assert.equal(applyCaseTransform("", "titlecase"), "");
    });

    it("validates filenames containing illegal characters and reserved names", () => {
      // Special illegal characters in Windows & POSIX
      const illegalChars = ["/", "\\", ":", "*", "?", '"', "<", ">", "|"];
      for (const char of illegalChars) {
        const testName = `test${char}file.jpg`;
        const res = validateFilename(testName);
        assert.equal(res.valid, false, `Filename containing '${char}' must be invalid`);
        assert.ok(res.error?.includes("Contains illegal characters"));
      }

      // Empty and whitespace names
      assert.equal(validateFilename("").valid, false);
      assert.equal(validateFilename("   ").valid, false);

      // Reserved directory dots
      assert.equal(validateFilename(".").valid, false);
      assert.equal(validateFilename("..").valid, false);

      // Pathological length (> 255 characters)
      const longName = "a".repeat(252) + ".png"; // 256 chars
      assert.equal(validateFilename(longName).valid, false);
      assert.ok(validateFilename(longName).error?.includes("exceeds 255 characters"));

      // Valid boundary length (255 characters)
      const validBoundaryName = "a".repeat(251) + ".png"; // 255 chars
      assert.equal(validateFilename(validBoundaryName).valid, true);
    });

    it("findReplace handles special replacement strings ($$, $&, $1) and regex tokens", () => {
      // Special find characters: parens, brackets, dots, pluses
      const resMeta = applyRenameRules("report(draft)+[final].doc", 0, {
        findReplace: { find: "(draft)+[final]", replace: "APPROVED", matchCase: true },
      });
      assert.equal(resMeta, "reportAPPROVED.doc");

      // ReplaceAll false should only replace the first occurrence
      const resSingle = applyRenameRules("apple_apple_apple.txt", 0, {
        findReplace: { find: "apple", replace: "orange", replaceAll: false },
      });
      assert.equal(resSingle, "orange_apple_apple.txt");
    });
  });

  // ==========================================================================
  // Section 2: packageRenamedZip Stress Tests
  // ==========================================================================
  describe("2. packageRenamedZip Collision Avoidance & Zero Files", () => {
    it("handles zero files by returning a valid empty ZIP blob", async () => {
      const emptyZipBlob = await packageRenamedZip([]);
      assert.ok(emptyZipBlob instanceof Blob, "Must return a Blob");
      assert.ok(emptyZipBlob.size > 0, "ZIP header must have positive byte length");

      const zip = await JSZip.loadAsync(await emptyZipBlob.arrayBuffer());
      const fileNames = Object.keys(zip.files);
      assert.equal(fileNames.length, 0, "ZIP should contain zero entries");
    });

    it("resolves multi-file name collisions deterministically into unique entries", async () => {
      // 5 files all renamed to the exact same target name "item.jpg"
      const files = [
        new File(["data1"], "a.png", { type: "image/png" }),
        new File(["data2"], "b.png", { type: "image/png" }),
        new File(["data3"], "c.png", { type: "image/png" }),
        new File(["data4"], "d.png", { type: "image/png" }),
        new File(["data5"], "e.png", { type: "image/png" }),
      ];

      const rules: RenameRules = {
        template: "item",
        preserveExtension: true, // will become item.png for all
      };

      const zipBlob = await packageRenamedZip(files, rules);
      const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
      const names = Object.keys(zip.files);

      assert.equal(names.length, 5, "All 5 files must exist in the archive");
      assert.deepEqual(
        names.sort(),
        ["item.png", "item_1.png", "item_2.png", "item_3.png", "item_4.png"].sort(),
        "Collisions must be resolved with _1, _2, _3, _4 suffixes"
      );

      // Verify each file's data was preserved
      const content0 = await zip.file("item.png")?.async("string");
      assert.equal(content0, "data1");
      const content4 = await zip.file("item_4.png")?.async("string");
      assert.equal(content4, "data5");
    });

    it("resolves collisions when pre-existing numbered files are present", async () => {
      // Input files where "asset_1.txt" already exists naturally
      const files = [
        new File(["first"], "asset.txt", { type: "text/plain" }),
        new File(["second"], "asset_1.txt", { type: "text/plain" }),
        new File(["third"], "another.txt", { type: "text/plain" }),
      ];

      // Rule that turns "another.txt" into "asset.txt"
      const rules: RenameRules = {
        findReplace: { find: "another", replace: "asset" },
      };

      const zipBlob = await packageRenamedZip(files, rules);
      const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
      const names = Object.keys(zip.files);

      assert.equal(names.length, 3);
      // "asset.txt" -> asset.txt
      // "asset_1.txt" -> asset_1.txt
      // "another.txt" renamed to "asset.txt" -> detects asset.txt AND asset_1.txt are taken -> becomes asset_2.txt!
      assert.ok(names.includes("asset.txt"), "Should contain asset.txt");
      assert.ok(names.includes("asset_1.txt"), "Should contain asset_1.txt");
      assert.ok(names.includes("asset_2.txt"), "Should increment to asset_2.txt to avoid collision with asset_1.txt");
    });

    it("handles collisions on files without extensions", async () => {
      const files = [
        new File(["A"], "fileA", { type: "application/octet-stream" }),
        new File(["B"], "fileB", { type: "application/octet-stream" }),
        new File(["C"], "fileC", { type: "application/octet-stream" }),
      ];

      const rules: RenameRules = {
        template: "README",
      };

      const zipBlob = await packageRenamedZip(files, rules);
      const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
      const names = Object.keys(zip.files);

      assert.deepEqual(names.sort(), ["README", "README_1", "README_2"].sort());
    });
  });

  // ==========================================================================
  // Section 3: Privacy Cleaner PDF Metadata Stripping & Stream Integrity
  // ==========================================================================
  describe("3. Privacy Cleaner PDF Metadata Scrubbing & Stream Integrity", () => {
    it("strips standard, custom, and obscure PDF metadata keys without corrupting page streams", async () => {
      // 1. Construct a PDF document with standard AND obscure custom metadata
      const doc = await PDFDocument.create();
      doc.setTitle("Super Confidential Corporate Strategy 2026");
      doc.setAuthor("CEO John Doe (Internal Leaks)");
      doc.setSubject("Secret M&A Discussions");
      doc.setCreator("Proprietary Surveillance Software v9.4");
      doc.setProducer("Internal Enterprise PDF Compiler");
      doc.setKeywords(["confidential", "insider", "top secret"]);

      // Inject custom obscure metadata into the Info dictionary
      const infoDict = (doc as any).getInfoDict();
      infoDict.set(PDFName.of("CustomCorporateID"), PDFString.of("CORP-998822"));
      infoDict.set(PDFName.of("ConfidentialityTag"), PDFString.of("StrictlyPrivate"));
      infoDict.set(PDFName.of("AuthorWorkstationIP"), PDFString.of("192.168.1.105"));

      // Add 3 pages with content streams
      const page1 = doc.addPage([PageSizes.A4[0], PageSizes.A4[1]]);
      page1.drawText("Page 1: Executive Summary of Non-Public Data");

      const page2 = doc.addPage([PageSizes.A4[0], PageSizes.A4[1]]);
      page2.drawText("Page 2: Financial forecasts & audit logs");

      const page3 = doc.addPage([PageSizes.A4[0], PageSizes.A4[1]]);
      page3.drawText("Page 3: Appendices & closing terms");

      const dirtyBytes = await doc.save();
      const dirtyFile = new File([dirtyBytes as unknown as BlobPart], "dirty_leak.pdf", {
        type: "application/pdf",
      });

      // Verify the dirty PDF actually contains the sensitive fields
      const loadedDirty = await PDFDocument.load(dirtyBytes);
      assert.equal(loadedDirty.getTitle(), "Super Confidential Corporate Strategy 2026");
      assert.equal(loadedDirty.getAuthor(), "CEO John Doe (Internal Leaks)");
      const dirtyInfo = (loadedDirty as any).getInfoDict();
      assert.ok(dirtyInfo.has(PDFName.of("CustomCorporateID")), "Dirty PDF must contain custom ID");
      assert.ok(dirtyInfo.has(PDFName.of("AuthorWorkstationIP")), "Dirty PDF must contain IP tag");

      // 2. Execute privacy cleaning via compressPDF with removeMetadata: true
      const cleanResult = await compressPDF(dirtyFile, {
        level: "smaller",
        removeMetadata: true,
      });

      assert.ok(cleanResult.blob.size > 0, "Cleaned PDF must not be empty");
      assert.equal(cleanResult.pageCount, 3, "Page count must remain exactly 3");

      // 3. Inspect the resulting cleaned PDF document
      const cleanBytes = await cleanResult.blob.arrayBuffer();
      const cleanedDoc = await PDFDocument.load(cleanBytes, { ignoreEncryption: true });

      // Standard metadata fields must be sanitized / blank
      assert.equal(cleanedDoc.getTitle() || "", "", "Title must be empty");
      assert.equal(cleanedDoc.getAuthor() || "", "", "Author must be empty");
      assert.equal(cleanedDoc.getSubject() || "", "", "Subject must be empty");
      assert.equal(cleanedDoc.getCreator() || "", "", "Creator must be empty");
      const kw = cleanedDoc.getKeywords();
      assert.ok(!kw || kw.length === 0, "Keywords must be empty");

      // Obscure custom keys from the original Info dictionary must NOT exist in the new PDF
      const cleanInfo = (cleanedDoc as any).getInfoDict();
      assert.equal(
        cleanInfo.has(PDFName.of("CustomCorporateID")),
        false,
        "CustomCorporateID must be completely stripped"
      );
      assert.equal(
        cleanInfo.has(PDFName.of("ConfidentialityTag")),
        false,
        "ConfidentialityTag must be completely stripped"
      );
      assert.equal(
        cleanInfo.has(PDFName.of("AuthorWorkstationIP")),
        false,
        "AuthorWorkstationIP must be completely stripped"
      );

      // Verify Page Stream Integrity: All 3 pages must be valid and readable
      assert.equal(cleanedDoc.getPageCount(), 3, "Cleaned document must preserve all 3 pages");
      const pages = cleanedDoc.getPages();
      assert.equal(pages.length, 3);
      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        assert.ok(p.getWidth() > 0, `Page ${i + 1} must have positive width`);
        assert.ok(p.getHeight() > 0, `Page ${i + 1} must have positive height`);
      }

      // Re-saving the cleaned document should succeed without errors
      assert.doesNotThrow(async () => {
        await cleanedDoc.save();
      }, "Cleaned document must serialize cleanly without corruption");
    });

    it("verifies that catalog XMP metadata streams are discarded during recreation", async () => {
      const doc = await PDFDocument.create();
      // Attach an XML metadata stream to the Catalog
      const catalog = doc.catalog;
      const xmpString = `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator><rdf:Seq><rdf:li>Secret Researcher</rdf:li></rdf:Seq></dc:creator></rdf:Description></rdf:RDF></x:xmpmeta>`;
      const xmpStream = doc.context.stream(xmpString, {
        Type: "Metadata",
        Subtype: "XML",
      });
      const xmpRef = doc.context.register(xmpStream);
      catalog.set(PDFName.of("Metadata"), xmpRef);

      const page = doc.addPage([PageSizes.A4[0], PageSizes.A4[1]]);
      page.drawText("Document with XMP Catalog stream");

      const rawBytes = await doc.save();
      const rawFile = new File([rawBytes as unknown as BlobPart], "xmp_doc.pdf", {
        type: "application/pdf",
      });

      // Verify original contains the Catalog Metadata stream
      const rawDoc = await PDFDocument.load(rawBytes);
      assert.ok(rawDoc.catalog.has(PDFName.of("Metadata")), "Original PDF must have /Metadata in Catalog");

      // Clean metadata
      const cleanRes = await compressPDF(rawFile, { level: "smaller", removeMetadata: true });
      const cleanDoc = await PDFDocument.load(await cleanRes.blob.arrayBuffer());

      // The new clean PDF created from copyPages must NOT contain the original Catalog /Metadata stream!
      assert.equal(
        cleanDoc.catalog.has(PDFName.of("Metadata")),
        false,
        "Cleaned document Catalog must not contain unscrubbed XMP stream"
      );
    });
  });

  // ==========================================================================
  // Section 4: High-Volume Batch Scaling & Performance Stress
  // ==========================================================================
  describe("4. High-Volume Batch Collision Stress", () => {
    it("handles 50 identical file targets without collision or stack overflow", async () => {
      const count = 50;
      const files: File[] = [];
      for (let i = 0; i < count; i++) {
        files.push(new File([`payload_${i}`], `data_${i}.bin`, { type: "application/octet-stream" }));
      }

      // Rename rule maps all 50 files to target name "payload.bin"
      const rules: RenameRules = {
        template: "payload",
        preserveExtension: true,
      };

      const zipBlob = await packageRenamedZip(files, rules);
      const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
      const entries = Object.keys(zip.files);

      assert.equal(entries.length, count, `Must package all ${count} files`);
      assert.ok(entries.includes("payload.bin"));
      assert.ok(entries.includes("payload_1.bin"));
      assert.ok(entries.includes("payload_49.bin"));

      // Ensure every entry is unique
      const uniqueSet = new Set(entries);
      assert.equal(uniqueSet.size, count, "All entries in the zip must be completely distinct");
    });
  });
});

