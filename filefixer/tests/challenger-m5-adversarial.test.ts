import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument, PageSizes, PDFName, PDFString, PDFHexString } from "pdf-lib";
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
import { processBatchItem, BatchPipelineConfig } from "../src/lib/batch/batchProcessor";
import { compressPDF } from "../src/lib/pdf/compress";

describe("Milestone 5 Adversarial Challenger Verification Suite", () => {
  // ==========================================================================
  // Section 1: Complex & Pathological Rename Patterns
  // ==========================================================================
  describe("1. Complex & Pathological Rename Patterns", () => {
    it("survives 1000+ character template patterns and long prefixes/suffixes", () => {
      const longPrefix = "PREFIX_".repeat(150); // 1050 chars
      const longSuffix = "_SUFFIX".repeat(150); // 1050 chars
      const longTemplate = "TEMPLATE_" + "X".repeat(1200) + "_###";

      // Prefix stress
      const resPrefix = applyRenameRules("document.pdf", 0, { prefix: longPrefix });
      assert.ok(resPrefix.startsWith("PREFIX_"));
      assert.ok(resPrefix.endsWith(".pdf"));
      assert.ok(resPrefix.length > 1050);

      // Suffix stress
      const resSuffix = applyRenameRules("document.pdf", 0, { suffix: longSuffix });
      assert.ok(resSuffix.includes("_SUFFIX"));
      assert.ok(resSuffix.endsWith(".pdf"));
      assert.ok(resSuffix.length > 1050);

      // 1000+ char template with numbering
      const resTpl = applyRenameRules("document.pdf", 41, { template: longTemplate });
      assert.ok(resTpl.startsWith("TEMPLATE_"));
      assert.ok(resTpl.endsWith("_042.pdf"));
      assert.ok(resTpl.length > 1200);

      // Filename validation should correctly catch that these exceed 255 chars
      const valPrefix = validateFilename(resPrefix);
      assert.equal(valPrefix.valid, false);
      assert.ok(valPrefix.error?.includes("exceeds 255 characters"));

      const valTpl = validateFilename(resTpl);
      assert.equal(valTpl.valid, false);
      assert.ok(valTpl.error?.includes("exceeds 255 characters"));
    });

    it("handles complex multi-lingual Unicode, bidirectional text, and emojis", () => {
      const unicodeCases = [
        { orig: "ملف_سري_للغاية.pdf", expectedExt: "pdf" }, // Arabic
        { orig: "機密文書_最終版_2026.docx", expectedExt: "docx" }, // Japanese Kanji
        { orig: "конфиденциальный_отчет.xlsx", expectedExt: "xlsx" }, // Russian Cyrillic
        { orig: "🔥_rocket_launch_🚀_party_🎉.png", expectedExt: "png" }, // Emojis
        { orig: "מסמך_חשוב_מאוד.pdf", expectedExt: "pdf" }, // Hebrew
        { orig: "crème_brûlée_recette.jpg", expectedExt: "jpg" }, // French accents
        { orig: "∑_integral_∂_partial_√_sqrt.dat", expectedExt: "dat" }, // Math symbols
      ];

      for (let i = 0; i < unicodeCases.length; i++) {
        const { orig, expectedExt } = unicodeCases[i];
        const split = splitFilename(orig);
        assert.equal(split.ext, expectedExt, `Failed to extract extension for ${orig}`);

        const renamed = applyRenameRules(orig, i, {
          template: "Asset_###_{orig}",
          numbering: { enabled: true, startIndex: 1 },
        });

        const expectedPadding = String(i + 1).padStart(3, "0");
        assert.ok(
          renamed.startsWith(`Asset_${expectedPadding}_`),
          `Renamed output should contain zero-padded index: ${renamed}`
        );
        assert.ok(
          renamed.endsWith(`.${expectedExt}`),
          `Renamed output should preserve extension: ${renamed}`
        );

        // Validation: Unicode characters are valid filesystem characters (POSIX/Windows)
        const val = validateFilename(renamed);
        assert.equal(val.valid, true, `Unicode filename should be valid: ${renamed}`);
      }
    });

    it("handles regex metacharacters, dollar tokens ($1, $&), and capture patterns without crashing", () => {
      // Filename containing literal regex metacharacters
      const trickyName = "file[test](v1.0)+{final}*^$?.png";
      const split = splitFilename(trickyName);
      assert.equal(split.ext, "png");
      assert.equal(split.base, "file[test](v1.0)+{final}*^$?");

      // Find and replace with regex metacharacters in 'find'
      const findRes = applyRenameRules(trickyName, 0, {
        findReplace: {
          find: "[test](v1.0)+{final}*^$?",
          replace: "_clean_",
          matchCase: true,
          replaceAll: true,
        },
      });
      assert.equal(findRes, "file_clean_.png");

      // Find and replace where 'replace' contains dollar tokens ($1, $&, $', $$)
      const dollarReplace = applyRenameRules("item_price.txt", 0, {
        findReplace: {
          find: "price",
          replace: "$100",
        },
      });
      // In JS regex replace, without capture groups in pattern, '$1' is preserved literally or handled safely
      assert.ok(dollarReplace.includes("100"), "Must include replacement text");

      // Complex regex rules
      const regexReplace = applyRenameRules("IMG_20261024_00123.JPEG", 0, {
        regex: {
          pattern: "^IMG_(\\d{8})_(\\d+)",
          replacement: "Photo_$1_Seq$2",
          flags: "i",
        },
        lowercaseExtension: true,
      });
      assert.equal(regexReplace, "Photo_20261024_Seq00123.jpeg");

      // Malformed regex patterns must fail gracefully without throwing
      const pathologicalPatterns = [
        "(?<=unsupported_lookbehind_in_some_runtimes",
        "\\c",
        "[\\x",
        "*quantifier_with_no_operand",
        "+quantifier_with_no_operand",
        "?quantifier_with_no_operand",
      ];

      for (const pattern of pathologicalPatterns) {
        assert.doesNotThrow(() => {
          const fallback = applyRenameRules("normal_file.txt", 0, {
            regex: { pattern, replacement: "hacked" },
          });
          assert.equal(fallback, "normal_file.txt");
        });
      }
    });

    it("evaluates template with zero hashes, empty template, and template token variations", () => {
      // Template without hash symbol
      const noHash = applyRenameRules("invoice_october.pdf", 0, {
        template: "Invoice_Static",
      });
      assert.equal(noHash, "Invoice_Static.pdf");

      // Template with {n} token instead of #
      const nToken = applyRenameRules("invoice.pdf", 7, {
        template: "Bill_{n}_{orig}",
      });
      assert.equal(nToken, "Bill_8_invoice.pdf");

      // Template with {index} token
      const indexToken = applyRenameRules("doc.pdf", 3, {
        template: "Doc_{index}",
      });
      assert.equal(indexToken, "Doc_4.pdf");

      // Template with multiple hash groups: only the first group is padded, remaining is preserved or untouched
      const multiHash = applyRenameRules("item.png", 0, {
        template: "Item_###_group_##",
      });
      assert.equal(multiHash, "Item_001_group_##.png");

      // Template with preserveExtension = false
      const noExt = applyRenameRules("photo.jpeg", 0, {
        template: "Photo_Archive_###",
        preserveExtension: false,
      });
      assert.equal(noExt, "Photo_Archive_001");

      // Empty string template falls back to origBase
      const emptyTpl = applyRenameRules("hello.txt", 0, {
        template: "   ",
      });
      assert.equal(emptyTpl, "hello.txt");
    });

    it("stress-tests sequence indices and zero padding boundaries", () => {
      // 0 padding should behave like unpadded number
      const unpadded = applyRenameRules("img.png", 5, {
        numbering: { enabled: true, startIndex: 1, padding: 0, position: "prefix" },
      });
      assert.equal(unpadded, "6_img.png");

      // Negative startIndex: in JavaScript String(-3).padStart(3, "0") yields "0-3"
      const negStart = applyRenameRules("img.png", 2, {
        numbering: { enabled: true, startIndex: -5, padding: 3, position: "suffix" },
      });
      assert.equal(negStart, "img_0-3.png");

      // Huge padding: 25 zeroes
      const hugePadding = applyRenameRules("log.txt", 0, {
        numbering: { enabled: true, startIndex: 1, padding: 25, position: "prefix" },
      });
      assert.equal(hugePadding, "0000000000000000000000001_log.txt");

      // Extreme numbering position "replace"
      const replacePos = applyRenameRules("original_name.txt", 15, {
        numbering: { enabled: true, startIndex: 100, padding: 4, position: "replace" },
      });
      assert.equal(replacePos, "0115.txt");
    });
  });

  // ==========================================================================
  // Section 2: Case Transforms on Tricky & Edge Filenames
  // ==========================================================================
  describe("2. Case Transforms on Adversarial Edge Filenames", () => {
    it("handles camelCase, PascalCase, and acronyms in kebab and snake transforms", () => {
      // PascalCase / acronyms
      const xmlCase = "XMLParserHTTPRequestHandler";
      const kebabXml = applyCaseTransform(xmlCase, "kebab");
      assert.ok(kebabXml.includes("xml"), "Should be lowercased");
      assert.ok(kebabXml.includes("-"), "Should contain hyphens");

      const snakeXml = applyCaseTransform(xmlCase, "snake");
      assert.ok(snakeXml.includes("xml"), "Should be lowercased");
      assert.ok(snakeXml.includes("_"), "Should contain underscores");

      // Multiple consecutive uppercase letters with lowercase ending
      const simpleCamel = "myAwesomeVariable";
      assert.equal(applyCaseTransform(simpleCamel, "kebab"), "my-awesome-variable");
      assert.equal(applyCaseTransform(simpleCamel, "snake"), "my_awesome_variable");
    });

    it("handles boundary punctuation, consecutive delimiters, and symbols in case transforms", () => {
      // Leading and trailing punctuation
      const edges = "__--leading_and_trailing--__";
      assert.doesNotThrow(() => applyCaseTransform(edges, "kebab"));
      assert.doesNotThrow(() => applyCaseTransform(edges, "snake"));
      assert.doesNotThrow(() => applyCaseTransform(edges, "titlecase"));

      // Repeated spaces, tabs, and mixed dashes
      const messy = "hello   world\t\tfoo---bar___baz";
      const kebabMessy = applyCaseTransform(messy, "kebab");
      assert.ok(!kebabMessy.includes(" "), "Kebab must not contain spaces");

      const snakeMessy = applyCaseTransform(messy, "snake");
      assert.ok(!snakeMessy.includes(" "), "Snake must not contain spaces");

      // Titlecase on hyphenated words
      const hyphenated = "user-interface-design-system";
      assert.equal(
        applyCaseTransform(hyphenated, "titlecase"),
        "User-Interface-Design-System"
      );

      // Titlecase on empty or single-character strings
      assert.equal(applyCaseTransform("", "titlecase"), "");
      assert.equal(applyCaseTransform("a", "titlecase"), "A");
      assert.equal(applyCaseTransform("Z", "titlecase"), "Z");
      assert.equal(applyCaseTransform("1", "titlecase"), "1");
      assert.equal(applyCaseTransform("$", "titlecase"), "$");
    });

    it("handles multi-extension and dotfile transformations", () => {
      // archive.tar.gz.bak
      const multi = "archive.tar.gz.bak";
      const split = splitFilename(multi);
      assert.equal(split.base, "archive.tar.gz");
      assert.equal(split.ext, "bak");

      // Transforming base
      const upperRes = applyRenameRules(multi, 0, {
        caseTransform: "uppercase",
      });
      assert.equal(upperRes, "ARCHIVE.TAR.GZ.bak");

      // Lowercase extension
      const lowerExtRes = applyRenameRules("PHOTO.TAR.GZ.JPEG", 0, {
        caseTransform: "lowercase",
        lowercaseExtension: true,
      });
      assert.equal(lowerExtRes, "photo.tar.gz.jpeg");
    });
  });

  // ==========================================================================
  // Section 3: 0-Byte Files, Collisions & ZIP Archive Stress
  // ==========================================================================
  describe("3. 0-Byte Files, Collisions & ZIP Archive Stress", () => {
    it("handles 0-byte files in previewRenames and packageRenamedZip", async () => {
      const zeroByteFiles = [
        new File([], "empty1.txt", { type: "text/plain" }),
        new File([], "empty2.png", { type: "image/png" }),
        new File([], "", { type: "application/octet-stream" }), // empty name
      ];

      const previews = previewRenames(zeroByteFiles, { prefix: "zero_" });
      assert.equal(previews.length, 3);
      assert.equal(previews[0].renamed, "zero_empty1.txt");
      assert.equal(previews[0].valid, true);
      assert.equal(previews[1].renamed, "zero_empty2.png");
      assert.equal(previews[1].valid, true);

      // Empty name becomes "zero_"
      assert.equal(previews[2].renamed, "zero_");
      assert.equal(previews[2].valid, true);

      // Package into ZIP
      const zipBlob = await packageRenamedZip(zeroByteFiles, { prefix: "zero_" });
      assert.ok(zipBlob.size > 0, "ZIP blob must have valid header");

      const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
      const filenames = Object.keys(zip.files);
      assert.equal(filenames.length, 3);
      assert.ok(filenames.includes("zero_empty1.txt"));
      assert.ok(filenames.includes("zero_empty2.png"));
      assert.ok(filenames.includes("zero_"));

      // Verify stored file size in ZIP is 0
      const content = await zip.file("zero_empty1.txt")?.async("uint8array");
      assert.equal(content?.length, 0);
    });

    it("resolves 25 overlapping collisions with identical template and extension", async () => {
      const collisionCount = 25;
      const files: File[] = [];
      for (let i = 0; i < collisionCount; i++) {
        files.push(new File([`data_${i}`], `file_${i}.dat`, { type: "application/octet-stream" }));
      }

      // Rename rule will output "collision.dat" for every single file
      const zipBlob = await packageRenamedZip(files, {
        template: "collision",
      });

      const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
      const entries = Object.keys(zip.files);

      assert.equal(entries.length, collisionCount, "All 25 files must exist in the archive");
      assert.ok(entries.includes("collision.dat"));
      assert.ok(entries.includes("collision_1.dat"));
      assert.ok(entries.includes("collision_24.dat"));

      // Confirm all entries are distinct
      const uniqueEntries = new Set(entries);
      assert.equal(uniqueEntries.size, collisionCount);

      // Verify each file's specific content was preserved
      for (let i = 0; i < collisionCount; i++) {
        const expectedName = i === 0 ? "collision.dat" : `collision_${i}.dat`;
        const content = await zip.file(expectedName)?.async("string");
        assert.equal(content, `data_${i}`);
      }
    });

    it("validates boundary conditions in filename validator", () => {
      // Exactly 255 chars is valid
      const exactly255 = "x".repeat(251) + ".txt"; // 251 + 4 = 255
      assert.equal(exactly255.length, 255);
      assert.equal(validateFilename(exactly255).valid, true);

      // 256 chars is invalid
      const exactly256 = "x".repeat(252) + ".txt"; // 252 + 4 = 256
      assert.equal(exactly256.length, 256);
      const val256 = validateFilename(exactly256);
      assert.equal(val256.valid, false);
      assert.ok(val256.error?.includes("exceeds 255 characters"));

      // Control characters \x00 through \x1F
      for (let code = 0; code < 32; code++) {
        const char = String.fromCharCode(code);
        const nameWithCtrl = `test${char}file.txt`;
        const res = validateFilename(nameWithCtrl);
        assert.equal(res.valid, false, `Character code ${code} should be invalid`);
      }
    });
  });

  // ==========================================================================
  // Section 4: PDF Document Metadata Stripping & Adversarial Metadata Objects
  // ==========================================================================
  describe("4. PDF Document Metadata Stripping & Adversarial Info Dictionaries", () => {
    it("completely removes massive (10,000+ char) and Unicode-laden metadata fields", async () => {
      const doc = await PDFDocument.create();

      // Pathological metadata payloads
      const massiveString = "SENSITIVE_AUTHOR_DATA_".repeat(500); // 11,000 chars
      const emojiUnicodeTitle = "Top Secret 敏感数据 🚀 Confidential 🔒 إستراتيجية خاصة";
      const subjectWithQuotesAndSlashes = 'Classified "Subject" \\ with / slashes and \n newlines \r\t';
      const sensitiveProducer = "Internal Secret Government Compiler 2026";
      const manyKeywords = Array.from({ length: 150 }, (_, i) => `leak_keyword_${i}`);

      doc.setTitle(emojiUnicodeTitle);
      doc.setAuthor(massiveString);
      doc.setSubject(subjectWithQuotesAndSlashes);
      doc.setCreator("Spyware Producer 2026");
      doc.setProducer(sensitiveProducer);
      doc.setKeywords(manyKeywords);

      // Add a page with visible content
      const page = doc.addPage([PageSizes.A4[0], PageSizes.A4[1]]);
      page.drawText("Protected Content Page 1");

      const dirtyBytes = await doc.save();
      const dirtyFile = new File([dirtyBytes as unknown as BlobPart], "massive_metadata.pdf", {
        type: "application/pdf",
      });

      // Compress and remove metadata
      const cleanResult = await compressPDF(dirtyFile, {
        level: "smaller",
        removeMetadata: true,
      });

      assert.ok(cleanResult.blob.size > 0, "Cleaned PDF must not be empty");
      assert.equal(cleanResult.pageCount, 1, "Page count must remain 1");

      // Verify that after cleaning, the metadata is completely purged
      const cleanedBytes = await cleanResult.blob.arrayBuffer();
      const cleanedDoc = await PDFDocument.load(cleanedBytes, { ignoreEncryption: true });

      assert.equal(cleanedDoc.getTitle() || "", "", "Title must be empty");
      assert.equal(cleanedDoc.getAuthor() || "", "", "Author must be empty");
      assert.equal(cleanedDoc.getSubject() || "", "", "Subject must be empty");
      assert.equal(cleanedDoc.getCreator() || "", "", "Creator must be empty");
      // The original sensitive producer must be completely scrubbed
      assert.notEqual(cleanedDoc.getProducer(), sensitiveProducer, "Sensitive producer must be stripped");
      assert.ok(
        cleanedDoc.getProducer() === "" || cleanedDoc.getProducer()?.includes("pdf-lib"),
        "Producer should either be blank or library default"
      );
      const kw = cleanedDoc.getKeywords();
      assert.ok(!kw || kw.length === 0, "Keywords must be empty");

      // Verify document still has page and draws properly
      assert.equal(cleanedDoc.getPageCount(), 1);
      assert.ok(cleanedDoc.getPage(0).getWidth() > 0);
    });

    it("purges low-level raw InfoDict entries (HexString, raw dictionaries, unknown keys)", async () => {
      const doc = await PDFDocument.create();

      // Inject raw low-level entries into the Info dictionary
      const infoDict = (doc as any).getInfoDict();
      infoDict.set(PDFName.of("HexSecret"), PDFHexString.of("48656C6C6F20536563726574")); // "Hello Secret"
      infoDict.set(PDFName.of("HardwareID"), PDFString.of("MAC-FF-EE-DD-CC-BB-AA"));
      infoDict.set(PDFName.of("GpsLatitude"), PDFString.of("37.7749 N"));
      infoDict.set(PDFName.of("GpsLongitude"), PDFString.of("122.4194 W"));

      const page = doc.addPage([PageSizes.Letter[0], PageSizes.Letter[1]]);
      page.drawText("Confidential Location Data");

      const dirtyBytes = await doc.save();
      const dirtyFile = new File([dirtyBytes as unknown as BlobPart], "raw_info_dict.pdf", {
        type: "application/pdf",
      });

      // Verify dirty file has these keys
      const loadedDirty = await PDFDocument.load(dirtyBytes);
      const dirtyInfo = (loadedDirty as any).getInfoDict();
      assert.ok(dirtyInfo.has(PDFName.of("HexSecret")));
      assert.ok(dirtyInfo.has(PDFName.of("GpsLatitude")));

      // Clean
      const cleanResult = await compressPDF(dirtyFile, {
        level: "smaller",
        removeMetadata: true,
      });

      const cleanedDoc = await PDFDocument.load(await cleanResult.blob.arrayBuffer(), {
        ignoreEncryption: true,
      });

      // Cleaned document's info dictionary must NOT contain HexSecret, HardwareID, or GPS keys
      const cleanInfo = (cleanedDoc as any).getInfoDict();
      assert.equal(cleanInfo.has(PDFName.of("HexSecret")), false);
      assert.equal(cleanInfo.has(PDFName.of("HardwareID")), false);
      assert.equal(cleanInfo.has(PDFName.of("GpsLatitude")), false);
      assert.equal(cleanInfo.has(PDFName.of("GpsLongitude")), false);
    });

    it("safely handles multi-page PDF documents during metadata stripping", async () => {
      const doc = await PDFDocument.create();
      doc.setTitle("Multi-Page Confidential Document");
      doc.setAuthor("Secret Org");

      // Add 10 pages
      for (let i = 0; i < 10; i++) {
        const page = doc.addPage([PageSizes.A4[0], PageSizes.A4[1]]);
        page.drawText(`Page content ${i + 1}`);
      }

      const bytes = await doc.save();
      const file = new File([bytes as unknown as BlobPart], "multipage.pdf", {
        type: "application/pdf",
      });

      const cleanResult = await compressPDF(file, {
        level: "smaller",
        removeMetadata: true,
      });

      assert.equal(cleanResult.pageCount, 10, "All 10 pages must be preserved");

      const cleanedDoc = await PDFDocument.load(await cleanResult.blob.arrayBuffer());
      assert.equal(cleanedDoc.getPageCount(), 10);
      assert.equal(cleanedDoc.getTitle() || "", "");
      assert.equal(cleanedDoc.getAuthor() || "", "");
    });
  });

  // ==========================================================================
  // Section 5: BatchProcessor Execution & Fault Tolerance
  // ==========================================================================
  describe("5. BatchProcessor Execution & Fault Tolerance", () => {
    it("handles non-image / corrupted files without throwing unhandled exceptions", async () => {
      // Create a corrupted or non-image file
      const corruptedFile = new File([new Uint8Array([0x00, 0x11, 0x22, 0x33])], "corrupted.jpg", {
        type: "image/jpeg",
      });

      const config: BatchPipelineConfig = {
        resizeEnabled: true,
        targetWidth: 800,
        targetHeight: 600,
        convertEnabled: true,
        targetFormat: "image/webp",
        compressEnabled: true,
        qualityPct: 80,
      };

      // In Node.js environment without canvas / browser image decoders,
      // processBatchItem should catch any error and return status 'error' cleanly.
      const result = await processBatchItem(corruptedFile, 0, config);
      assert.ok(result, "Must return BatchItemResult");
      assert.equal(result.originalName, "corrupted.jpg");
      assert.equal(result.status, "error");
      assert.ok(result.error && result.error.length > 0, "Error message must be present");
      assert.equal(result.outputSize, corruptedFile.size);
    });

    it("applies sequential renamePattern in batchProcessor correctly", async () => {
      const mockFile = new File(["test-content"], "sample_photo.png", { type: "image/png" });

      const config: BatchPipelineConfig = {
        resizeEnabled: false,
        convertEnabled: false,
        compressEnabled: false,
        renamePattern: "Project_2026_####",
        startNumber: 10,
      };

      const result = await processBatchItem(mockFile, 5, config);
      assert.equal(result.status, "done");
      // startNumber: 10 + index: 5 = 15, padded to 4 digits -> "0015"
      assert.equal(result.outputName, "Project_2026_0015.png");
    });

    it("handles renamePattern with no hash symbols gracefully in batchProcessor", async () => {
      const mockFile = new File(["test-content"], "sample_photo.png", { type: "image/png" });

      const config: BatchPipelineConfig = {
        resizeEnabled: false,
        convertEnabled: false,
        compressEnabled: false,
        renamePattern: "Fixed_Project_Name",
      };

      const result = await processBatchItem(mockFile, 0, config);
      assert.equal(result.status, "done");
      assert.equal(result.outputName, "Fixed_Project_Name.png");
    });
  });
});
