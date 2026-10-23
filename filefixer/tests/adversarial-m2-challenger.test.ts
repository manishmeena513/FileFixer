import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { TOOLS, CATEGORIES, ToolCategoryKey, ToolItem } from "../src/lib/tools";
import type { ManagedFile } from "../src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Helper to simulate ToolsDirectory search & filter pipeline exactly as implemented
function filterTools(searchQuery: string, selectedCategory: ToolCategoryKey): ToolItem[] {
  const rawQ = searchQuery.toLowerCase().trim();
  const queryTerms = rawQ ? rawQ.split(/\s+/) : [];

  return TOOLS.filter((tool) => {
    // 1. Category Matching
    if (selectedCategory !== "all" && tool.categoryKey !== selectedCategory) {
      return false;
    }

    // 2. Multi-term Search Query Matching
    if (queryTerms.length > 0) {
      const toolName = tool.name.toLowerCase();
      const toolDesc = tool.description.toLowerCase();
      const toolCat = tool.category.toLowerCase();
      const toolBadge = (tool.badge || "").toLowerCase();
      const toolIndicator = (tool.featureIndicator || "").toLowerCase();
      const toolFormats = (tool.supportedFormats || []).map((f) => f.toLowerCase());

      return queryTerms.every((term) => {
        return (
          toolName.includes(term) ||
          toolDesc.includes(term) ||
          toolCat.includes(term) ||
          toolBadge.includes(term) ||
          toolIndicator.includes(term) ||
          toolFormats.some((fmt) => fmt.includes(term))
        );
      });
    }

    return true;
  });
}

// Helper to simulate StagedFilesSummary recommendations logic exactly as implemented
interface SmartActionSummary {
  label: string;
  href: string;
  primary?: boolean;
}

function computeRecommendations(files: Partial<ManagedFile>[]): {
  headline: string;
  recommendations: SmartActionSummary[];
} {
  const imageFiles = files.filter((f) => (f.type || "").startsWith("image/"));
  const pdfFiles = files.filter(
    (f) =>
      f.type === "application/pdf" ||
      (f.name && f.name.toLowerCase().endsWith(".pdf"))
  );
  const otherFiles = files.filter(
    (f) =>
      !(f.type || "").startsWith("image/") &&
      f.type !== "application/pdf" &&
      !(f.name && f.name.toLowerCase().endsWith(".pdf"))
  );

  const recommendations: SmartActionSummary[] = [];

  if (imageFiles.length > 0 && pdfFiles.length === 0 && otherFiles.length === 0) {
    if (imageFiles.length === 1) {
      recommendations.push(
        { label: "Compress Image", href: "/compress-image", primary: true },
        { label: "Resize Dimensions", href: "/resize-image" },
        { label: "Convert Format", href: "/convert-image" },
        { label: "Crop & Rotate", href: "/crop-image" },
        { label: "Smart 'Under X MB'", href: "/smart-compress" },
        { label: "Remove Metadata", href: "/image-metadata" }
      );
    } else {
      recommendations.push(
        { label: "Batch Studio", href: "/batch", primary: true },
        { label: "Images to PDF", href: "/images-to-pdf" },
        { label: "Batch Rename", href: "/batch-rename" },
        { label: "Compress All", href: "/compress-image" }
      );
    }
  } else if (pdfFiles.length > 0 && imageFiles.length === 0 && otherFiles.length === 0) {
    if (pdfFiles.length === 1) {
      recommendations.push(
        { label: "Compress PDF", href: "/pdf-compress", primary: true },
        { label: "Split & Extract Pages", href: "/pdf-split" },
        { label: "Page Organizer", href: "/pdf-workspace" },
        { label: "PDF Studio", href: "/pdf-studio" }
      );
    } else {
      recommendations.push(
        { label: "Merge PDFs", href: "/pdf-merge", primary: true },
        { label: "PDF Studio", href: "/pdf-studio" },
        { label: "Universal Inspector", href: "/inspect" }
      );
    }
  } else {
    recommendations.push(
      { label: "Universal File Inspector", href: "/inspect", primary: true },
      { label: "File Workspace", href: "/workspace" },
      { label: "Batch Rename", href: "/batch-rename" }
    );
  }

  const categoryHeadline =
    imageFiles.length > 0 && pdfFiles.length === 0 && otherFiles.length === 0
      ? imageFiles.length === 1
        ? "Your Image"
        : `Your ${imageFiles.length} Images`
      : pdfFiles.length > 0 && imageFiles.length === 0 && otherFiles.length === 0
      ? pdfFiles.length === 1
        ? "Your PDF"
        : `Your ${pdfFiles.length} PDFs`
      : `Your ${files.length} Files`;

  return {
    headline: categoryHeadline,
    recommendations,
  };
}

// ============================================================================
// TEST SUITE: Challenger M2 Empirical Stress Tests
// ============================================================================
describe("Challenger M2: Empirical Stress Tests for Homepage & Tools Directory", () => {
  // --------------------------------------------------------------------------
  // 1. Search Query Behaviors in /tools
  // --------------------------------------------------------------------------
  describe("Suite 1: Search Query Behaviors in /tools", () => {
    it("TC-M2-SEARCH-1: Empty and whitespace-only queries return all 20 tools", () => {
      const emptyMatches = filterTools("", "all");
      assert.strictEqual(emptyMatches.length, 20, "Empty query must return all 20 tools");

      const whitespaceMatches = filterTools("     \t  \n  ", "all");
      assert.strictEqual(whitespaceMatches.length, 20, "Whitespace query must return all 20 tools");
    });

    it("TC-M2-SEARCH-2: Unmatched queries return exactly 0 tools (triggering EmptyState)", () => {
      const unmatched1 = filterTools("non_existent_xyz_tool_9999", "all");
      assert.strictEqual(unmatched1.length, 0, "Nonsense query must return 0 tools");

      const unmatched2 = filterTools("photoshop_cloud_upload_plugin", "all");
      assert.strictEqual(unmatched2.length, 0, "Unmatched query must return 0 tools");
    });

    it("TC-M2-SEARCH-3: Case-insensitive search parity across upper, lower, and mixed case", () => {
      const queries = [
        ["pdf", "PDF", "Pdf", "pDf"],
        ["webp", "WEBP", "WebP", "wEbP"],
        ["compress", "COMPRESS", "Compress", "cOmPrEsS"],
        ["resize", "RESIZE", "Resize", "rEsIzE"],
      ];

      for (const group of queries) {
        const baseline = filterTools(group[0], "all").map((t) => t.id).sort();
        assert.ok(baseline.length > 0, `Query ${group[0]} should return at least 1 match`);

        for (let i = 1; i < group.length; i++) {
          const variant = filterTools(group[i], "all").map((t) => t.id).sort();
          assert.deepStrictEqual(
            variant,
            baseline,
            `Case variance between "${group[0]}" and "${group[i]}" produced inconsistent results`
          );
        }
      }
    });

    it("TC-M2-SEARCH-4: Multi-term search with whitespace normalization", () => {
      // "compress image" should match tools that satisfy BOTH "compress" and "image"
      const res = filterTools("compress   image", "all");
      assert.ok(res.length >= 1, "Expected matches for multi-term query 'compress image'");
      for (const tool of res) {
        const text = [
          tool.name,
          tool.description,
          tool.category,
          tool.badge || "",
          tool.featureIndicator || "",
          ...(tool.supportedFormats || []),
        ]
          .join(" ")
          .toLowerCase();
        assert.ok(
          text.includes("compress") && text.includes("image"),
          `Tool ${tool.name} matched 'compress image' but did not contain both terms`
        );
      }

      // Reversing terms "image compress" should yield exact same set
      const reversed = filterTools("image compress", "all").map((t) => t.id).sort();
      const original = res.map((t) => t.id).sort();
      assert.deepStrictEqual(reversed, original, "Term ordering should not change multi-term search results");
    });

    it("TC-M2-SEARCH-5: Format tag searching (pdf, webp, jpg, png)", () => {
      // PDF format search
      const pdfResults = filterTools("pdf", "all");
      assert.ok(pdfResults.length >= 6, "Expected at least 6 tools matching 'pdf'");
      for (const t of pdfResults) {
        const hasPdf =
          t.name.toLowerCase().includes("pdf") ||
          t.description.toLowerCase().includes("pdf") ||
          t.category.toLowerCase().includes("pdf") ||
          (t.supportedFormats || []).some((f) => f.toLowerCase().includes("pdf"));
        assert.ok(hasPdf, `Tool ${t.name} does not reference 'pdf'`);
      }

      // WebP format search
      const webpResults = filterTools("webp", "all");
      assert.ok(webpResults.length >= 6, "Expected image tools matching 'webp'");
      for (const t of webpResults) {
        const hasWebp =
          t.name.toLowerCase().includes("webp") ||
          t.description.toLowerCase().includes("webp") ||
          (t.supportedFormats || []).some((f) => f.toLowerCase().includes("webp"));
        assert.ok(hasWebp, `Tool ${t.name} does not reference 'webp'`);
      }
    });

    it("TC-M2-SEARCH-6: Regex and special character resilience without regex injection errors", () => {
      const specialCharacters = [
        ".*",
        "+",
        "?",
        "^",
        "$",
        "{",
        "}",
        "(",
        ")",
        "[",
        "]",
        "\\",
        "/",
        "'",
        "\"",
        "<",
        ">",
        "!",
        "@",
        "#",
        "%",
        "&",
        "*",
      ];

      for (const char of specialCharacters) {
        assert.doesNotThrow(() => {
          const results = filterTools(char, "all");
          assert.ok(Array.isArray(results), `Results for '${char}' must be an array`);
        }, `Filter pipeline threw on special character: '${char}'`);
      }

      // Test searching with quotes: "Under X MB"
      const quoteRes = filterTools("Under X MB", "all");
      assert.strictEqual(quoteRes.length, 1);
      assert.strictEqual(quoteRes[0].id, "smart-compress");
    });

    it("TC-M2-SEARCH-7: Category filtering partitions tools into mutually exclusive sets", () => {
      const images = filterTools("", "images");
      const pdf = filterTools("", "pdf");
      const batch = filterTools("", "batch");
      const utilities = filterTools("", "utilities");
      const all = filterTools("", "all");

      assert.strictEqual(all.length, 20);
      assert.strictEqual(images.length, 6, "Images category should contain 6 tools");
      assert.strictEqual(pdf.length, 6, "PDF category should contain 6 tools");
      assert.strictEqual(batch.length, 3, "Batch category should contain 3 tools");
      assert.strictEqual(utilities.length, 5, "Utilities category should contain 5 tools");

      // Verify mutual exclusivity: intersection between any two categories must be empty
      const imageIds = new Set(images.map((t) => t.id));
      const pdfIds = new Set(pdf.map((t) => t.id));
      const batchIds = new Set(batch.map((t) => t.id));
      const utilityIds = new Set(utilities.map((t) => t.id));

      for (const id of imageIds) {
        assert.ok(!pdfIds.has(id), `Tool ${id} exists in both images and pdf`);
        assert.ok(!batchIds.has(id), `Tool ${id} exists in both images and batch`);
        assert.ok(!utilityIds.has(id), `Tool ${id} exists in both images and utilities`);
      }
      for (const id of pdfIds) {
        assert.ok(!batchIds.has(id), `Tool ${id} exists in both pdf and batch`);
        assert.ok(!utilityIds.has(id), `Tool ${id} exists in both pdf and utilities`);
      }
      for (const id of batchIds) {
        assert.ok(!utilityIds.has(id), `Tool ${id} exists in both batch and utilities`);
      }

      // Verify completeness: sum of all 4 categories must equal 20
      const totalPartition = imageIds.size + pdfIds.size + batchIds.size + utilityIds.size;
      assert.strictEqual(totalPartition, 20);
    });

    it("TC-M2-SEARCH-8: Combined Category and Search Query filtering", () => {
      // Category "images" + query "pdf": should return 0 tools
      const imgPdf = filterTools("pdf", "images");
      assert.strictEqual(imgPdf.length, 0, "No image tool should match 'pdf'");

      // Category "pdf" + query "merge": matches both "pdf-merge" and "pdf-studio" (which supports visual page merging)
      const pdfMerge = filterTools("merge", "pdf");
      assert.strictEqual(pdfMerge.length, 2);
      const pdfMergeIds = pdfMerge.map((t) => t.id).sort();
      assert.deepStrictEqual(pdfMergeIds, ["pdf-merge", "pdf-studio"]);

      // Category "batch" + query "rename": matches both "batch" (which includes sequential renaming in description) and "batch-rename"
      const batchRename = filterTools("rename", "batch");
      assert.strictEqual(batchRename.length, 2);
      const batchIds = batchRename.map((t) => t.id).sort();
      assert.deepStrictEqual(batchIds, ["batch", "batch-rename"]);

      // Category "utilities" + query "history": should return exactly "history"
      const utilHistory = filterTools("history", "utilities");
      assert.strictEqual(utilHistory.length, 1);
      assert.strictEqual(utilHistory[0].id, "history");
    });

    it("TC-M2-SEARCH-9: ToolsDirectory source code ensures EmptyState and reset contracts", () => {
      const dirPath = path.join(rootDir, "src/components/tools/ToolsDirectory.tsx");
      const content = fs.readFileSync(dirPath, "utf-8");

      assert.ok(content.includes("role=\"status\""), "Missing role='status' on empty state container");
      assert.ok(content.includes("aria-live=\"polite\""), "Missing aria-live='polite' on empty state");
      assert.ok(content.includes("Clear all filters"), "Missing 'Clear all filters' CTA button text");
      assert.ok(content.includes("setSelectedCategory(\"all\")"), "Clear handler must reset category to 'all'");
      assert.ok(content.includes("setSearchQuery(\"\")"), "Clear handler must reset searchQuery to empty string");
    });
  });

  // --------------------------------------------------------------------------
  // 2. Smart Drop Zone Contextual Heuristics & Recommendations
  // --------------------------------------------------------------------------
  describe("Suite 2: Smart Drop Zone Logic (StagedFilesSummary)", () => {
    it("TC-M2-DROP-1: Single image dropped -> contextual image tool recommendations", () => {
      const mockSingleImage: Partial<ManagedFile>[] = [
        {
          id: "f-1",
          name: "vacation.jpg",
          type: "image/jpeg",
          size: 1500000,
        },
      ];

      const res = computeRecommendations(mockSingleImage);
      assert.strictEqual(res.headline, "Your Image");
      assert.strictEqual(res.recommendations.length, 6);

      const primary = res.recommendations.find((r) => r.primary);
      assert.ok(primary, "Must have a primary recommendation");
      assert.strictEqual(primary?.label, "Compress Image");
      assert.strictEqual(primary?.href, "/compress-image");

      const labels = res.recommendations.map((r) => r.label);
      assert.ok(labels.includes("Compress Image"));
      assert.ok(labels.includes("Resize Dimensions"));
      assert.ok(labels.includes("Convert Format"));
      assert.ok(labels.includes("Crop & Rotate"));
      assert.ok(labels.includes("Smart 'Under X MB'"));
      assert.ok(labels.includes("Remove Metadata"));
    });

    it("TC-M2-DROP-2: Multiple images dropped -> batch studio / images-to-pdf recommendations", () => {
      const mockImages: Partial<ManagedFile>[] = [
        { id: "f-1", name: "img1.png", type: "image/png", size: 800000 },
        { id: "f-2", name: "img2.webp", type: "image/webp", size: 600000 },
        { id: "f-3", name: "img3.jpg", type: "image/jpeg", size: 900000 },
      ];

      const res = computeRecommendations(mockImages);
      assert.strictEqual(res.headline, "Your 3 Images");
      assert.strictEqual(res.recommendations.length, 4);

      const primary = res.recommendations.find((r) => r.primary);
      assert.ok(primary, "Must have a primary recommendation");
      assert.strictEqual(primary?.label, "Batch Studio");
      assert.strictEqual(primary?.href, "/batch");

      const labels = res.recommendations.map((r) => r.label);
      assert.ok(labels.includes("Batch Studio"));
      assert.ok(labels.includes("Images to PDF"));
      assert.ok(labels.includes("Batch Rename"));
      assert.ok(labels.includes("Compress All"));
    });

    it("TC-M2-DROP-3: Single PDF dropped -> PDF compress / split recommendations", () => {
      const mockSinglePdf: Partial<ManagedFile>[] = [
        {
          id: "f-1",
          name: "annual_report.pdf",
          type: "application/pdf",
          size: 4500000,
        },
      ];

      const res = computeRecommendations(mockSinglePdf);
      assert.strictEqual(res.headline, "Your PDF");
      assert.strictEqual(res.recommendations.length, 4);

      const primary = res.recommendations.find((r) => r.primary);
      assert.ok(primary, "Must have a primary recommendation");
      assert.strictEqual(primary?.label, "Compress PDF");
      assert.strictEqual(primary?.href, "/pdf-compress");

      const labels = res.recommendations.map((r) => r.label);
      assert.ok(labels.includes("Compress PDF"));
      assert.ok(labels.includes("Split & Extract Pages"));
      assert.ok(labels.includes("Page Organizer"));
      assert.ok(labels.includes("PDF Studio"));
    });

    it("TC-M2-DROP-4: Multiple PDFs dropped -> PDF merge recommendations", () => {
      const mockPdfs: Partial<ManagedFile>[] = [
        { id: "f-1", name: "doc1.pdf", type: "application/pdf", size: 1000000 },
        { id: "f-2", name: "doc2.pdf", type: "application/pdf", size: 2000000 },
      ];

      const res = computeRecommendations(mockPdfs);
      assert.strictEqual(res.headline, "Your 2 PDFs");
      assert.strictEqual(res.recommendations.length, 3);

      const primary = res.recommendations.find((r) => r.primary);
      assert.ok(primary, "Must have a primary recommendation");
      assert.strictEqual(primary?.label, "Merge PDFs");
      assert.strictEqual(primary?.href, "/pdf-merge");

      const labels = res.recommendations.map((r) => r.label);
      assert.ok(labels.includes("Merge PDFs"));
      assert.ok(labels.includes("PDF Studio"));
      assert.ok(labels.includes("Universal Inspector"));
    });

    it("TC-M2-DROP-5: Mixed files dropped -> inspector / workspace recommendations", () => {
      const mixedCases: Partial<ManagedFile>[][] = [
        // Case A: Image + PDF
        [
          { id: "f-1", name: "photo.jpg", type: "image/jpeg", size: 1000 },
          { id: "f-2", name: "doc.pdf", type: "application/pdf", size: 2000 },
        ],
        // Case B: Image + Unknown text document
        [
          { id: "f-1", name: "photo.jpg", type: "image/jpeg", size: 1000 },
          { id: "f-2", name: "notes.txt", type: "text/plain", size: 500 },
        ],
        // Case C: PDF + Binary file
        [
          { id: "f-1", name: "doc.pdf", type: "application/pdf", size: 2000 },
          { id: "f-2", name: "data.bin", type: "application/octet-stream", size: 500 },
        ],
        // Case D: Pure non-image/non-pdf files
        [
          { id: "f-1", name: "archive.zip", type: "application/zip", size: 5000 },
          { id: "f-2", name: "document.docx", type: "application/vnd.openxmlformats", size: 4000 },
        ],
      ];

      for (const staged of mixedCases) {
        const res = computeRecommendations(staged);
        assert.strictEqual(res.headline, `Your ${staged.length} Files`);

        const primary = res.recommendations.find((r) => r.primary);
        assert.ok(primary, "Must have a primary recommendation");
        assert.strictEqual(primary?.label, "Universal File Inspector");
        assert.strictEqual(primary?.href, "/inspect");

        const labels = res.recommendations.map((r) => r.label);
        assert.ok(labels.includes("Universal File Inspector"));
        assert.ok(labels.includes("File Workspace"));
        assert.ok(labels.includes("Batch Rename"));
      }
    });

    it("TC-M2-DROP-6: PDF with missing MIME type correctly identified by .pdf filename extension", () => {
      const mockPdfNoMime: Partial<ManagedFile>[] = [
        {
          id: "f-1",
          name: "SCAN_001.PDF",
          type: "",
          size: 2048,
        },
      ];

      const res = computeRecommendations(mockPdfNoMime);
      assert.strictEqual(res.headline, "Your PDF");
      assert.strictEqual(res.recommendations[0].label, "Compress PDF");
    });

    it("TC-M2-DROP-7: StagedFilesSummary renders compact preview and >4 file expansion button", () => {
      const summaryPath = path.join(rootDir, "src/components/home/StagedFilesSummary.tsx");
      const content = fs.readFileSync(summaryPath, "utf-8");

      assert.ok(content.includes("files.slice(0, 4)"), "Must slice first 4 files for preview list");
      assert.ok(content.includes("files.length > 4"), "Must check if files.length > 4");
      assert.ok(content.includes("more files in session"), "Must display overflow count message");
      assert.ok(content.includes("min-h-[44px]"), "Overflow action button must have min-h-[44px]");
    });
  });

  // --------------------------------------------------------------------------
  // 3. Zero Legacy "13 tools" Strings Verification
  // --------------------------------------------------------------------------
  describe("Suite 3: Legacy String Audit Across Codebase", () => {
    it("TC-M2-LEGACY-1: Zero occurrences of '13 tools' across src/", () => {
      const srcDir = path.join(rootDir, "src");

      function scanDir(dir: string, pattern: RegExp): string[] {
        let matches: string[] = [];
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
          const fullPath = path.join(dir, file.name);
          if (file.isDirectory()) {
            matches = matches.concat(scanDir(fullPath, pattern));
          } else if (/\.(tsx|ts|jsx|js|html)$/.test(file.name)) {
            const content = fs.readFileSync(fullPath, "utf-8");
            if (pattern.test(content)) {
              matches.push(fullPath);
            }
          }
        }
        return matches;
      }

      const matches = scanDir(srcDir, /13\s*tools/i);
      assert.deepStrictEqual(
        matches,
        [],
        `Found stale '13 tools' string in files: ${matches.join(", ")}`
      );
    });

    it("TC-M2-LEGACY-2: Zero occurrences of 'all 13' or '13 local' across src/", () => {
      const srcDir = path.join(rootDir, "src");

      function scanDir(dir: string, pattern: RegExp): string[] {
        let matches: string[] = [];
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
          const fullPath = path.join(dir, file.name);
          if (file.isDirectory()) {
            matches = matches.concat(scanDir(fullPath, pattern));
          } else if (/\.(tsx|ts|jsx|js|html)$/.test(file.name)) {
            const content = fs.readFileSync(fullPath, "utf-8");
            if (pattern.test(content)) {
              matches.push(fullPath);
            }
          }
        }
        return matches;
      }

      const matchesAll13 = scanDir(srcDir, /all\s+13/i);
      assert.deepStrictEqual(
        matchesAll13,
        [],
        `Found stale 'all 13' string in files: ${matchesAll13.join(", ")}`
      );

      const matches13Local = scanDir(srcDir, /13\s+local/i);
      assert.deepStrictEqual(
        matches13Local,
        [],
        `Found stale '13 local' string in files: ${matches13Local.join(", ")}`
      );
    });

    it("TC-M2-LEGACY-3: Dynamic catalog size {TOOLS.length} referenced in homepage components", () => {
      const heroPath = path.join(rootDir, "src/components/home/HeroSection.tsx");
      const heroContent = fs.readFileSync(heroPath, "utf-8");
      assert.ok(
        heroContent.includes("TOOLS.length"),
        "HeroSection does not dynamically reference TOOLS.length"
      );

      const featuredPath = path.join(rootDir, "src/components/home/FeaturedToolsGrid.tsx");
      const featuredContent = fs.readFileSync(featuredPath, "utf-8");
      assert.ok(
        featuredContent.includes("TOOLS.length"),
        "FeaturedToolsGrid does not dynamically reference TOOLS.length"
      );

      const quickPath = path.join(rootDir, "src/components/home/QuickActionGrid.tsx");
      const quickContent = fs.readFileSync(quickPath, "utf-8");
      assert.ok(
        quickContent.includes("TOOLS.length"),
        "QuickActionGrid does not dynamically reference TOOLS.length"
      );
    });

    it("TC-M2-LEGACY-4: Required hero headline copy strictly preserved in page.tsx and HeroSection.tsx", () => {
      const pagePath = path.join(rootDir, "src/app/page.tsx");
      const pageContent = fs.readFileSync(pagePath, "utf-8");
      assert.ok(
        pageContent.includes("Fix your files. Keep them private.") ||
        (pageContent.includes("Fix your files") && pageContent.includes("Keep them private")),
        "Headline missing in page.tsx"
      );

      const heroPath = path.join(rootDir, "src/components/home/HeroSection.tsx");
      const heroContent = fs.readFileSync(heroPath, "utf-8");
      assert.ok(
        heroContent.includes("Fix your files.") && heroContent.includes("Keep them private."),
        "Headline missing in HeroSection.tsx"
      );
    });
  });

  // --------------------------------------------------------------------------
  // 4. Master Catalog Contract & Ergonomics
  // --------------------------------------------------------------------------
  describe("Suite 4: Master Catalog Contract & Ergonomics", () => {
    it("TC-M2-CATALOG-1: Master catalog items satisfy all PROJECT.md contracts", () => {
      assert.strictEqual(TOOLS.length, 20, "Catalog must contain exactly 20 tools");

      for (const t of TOOLS) {
        assert.ok(t.id && typeof t.id === "string", `Tool missing id: ${JSON.stringify(t)}`);
        assert.ok(t.name && typeof t.name === "string", `Tool ${t.id} missing name`);
        assert.ok(t.slug && t.slug.startsWith("/"), `Tool ${t.id} slug must start with /`);
        assert.ok(t.href && t.href.startsWith("/"), `Tool ${t.id} href must start with /`);
        assert.strictEqual(t.slug, t.href, `Tool ${t.id} slug and href must match`);
        assert.ok(t.description && t.description.length > 10, `Tool ${t.id} description too short`);
        assert.ok(
          ["Images", "PDF", "Batch", "Utilities"].includes(t.category),
          `Tool ${t.id} invalid category ${t.category}`
        );
        assert.ok(
          ["images", "pdf", "batch", "utilities"].includes(t.categoryKey),
          `Tool ${t.id} invalid categoryKey ${t.categoryKey}`
        );
        assert.ok(
          Array.isArray(t.supportedFormats) && t.supportedFormats.length > 0,
          `Tool ${t.id} missing supportedFormats array`
        );
        assert.ok(
          Array.isArray(t.formats) && t.formats.length > 0,
          `Tool ${t.id} missing formats array`
        );
      }
    });

    it("TC-M2-CATALOG-2: All 20 tools map to valid static app routes", () => {
      for (const t of TOOLS) {
        const routeFolder = t.slug.replace(/^\//, "");
        const pagePath = path.join(rootDir, "src/app", routeFolder, "page.tsx");
        assert.ok(
          fs.existsSync(pagePath),
          `Tool slug '${t.slug}' does not correspond to an existing route at '${pagePath}'`
        );
      }
    });

    it("TC-M2-CATALOG-3: CommandCenter allItems includes every tool from TOOLS", () => {
      const ccPath = path.join(rootDir, "src/components/command/CommandCenter.tsx");
      const ccContent = fs.readFileSync(ccPath, "utf-8");

      for (const t of TOOLS) {
        assert.ok(
          ccContent.includes(`navigateTo("${t.slug}")`),
          `CommandCenter allItems is missing tool slug navigation: ${t.slug}`
        );
      }
    });

    it("TC-M2-CATALOG-4: Touch target accessibility constraints across all M2 components", () => {
      const filesToCheck = [
        "src/components/tools/ToolsDirectory.tsx",
        "src/components/tools/ToolCard.tsx",
        "src/components/home/StagedFilesSummary.tsx",
        "src/components/home/FeaturedToolsGrid.tsx",
        "src/components/home/PopularWorkflows.tsx",
        "src/components/home/QuickActionGrid.tsx",
        "src/components/home/SupportBanner.tsx",
      ];

      for (const rel of filesToCheck) {
        const full = path.join(rootDir, rel);
        assert.ok(fs.existsSync(full), `File not found: ${rel}`);
        const content = fs.readFileSync(full, "utf-8");

        // Verify presence of min-h-[44px] or larger on interactive elements
        const hasMinTouchTarget =
          content.includes("min-h-[44px]") ||
          content.includes("min-h-[48px]") ||
          content.includes("min-h-[56px]") ||
          content.includes("min-h-[64px]");
        assert.ok(
          hasMinTouchTarget,
          `Component ${rel} missing explicit ≥44px touch target class`
        );
      }
    });
  });
});
