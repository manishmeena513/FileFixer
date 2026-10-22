import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { TOOLS, ToolCategoryKey } from "../src/lib/tools.js";
import { getExtensionFromMime, getMimeFromExtension } from "../src/lib/file-utils.js";
import { parsePageSelection } from "../src/lib/pdf/split.js";
import { useFileStore } from "../src/stores/fileStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

describe("Tier 3: Cross-Feature Combinations (Pairwise Integration)", () => {
  // ------------------------------------------------------------------------
  // Pairwise 1: Design System Tokens + UI Primitives
  // ------------------------------------------------------------------------
  it("TC-T3-1: Button variants and sizes bind to semantic design system CSS variables", () => {
    const buttonPath = path.join(rootDir, "src/components/ui/button.tsx");
    const content = fs.readFileSync(buttonPath, "utf-8");
    assert.ok(content.includes("hsl(var(--primary))"), "Button default variant missing --primary token");
    assert.ok(content.includes("hsl(var(--secondary))"), "Button secondary variant missing --secondary token");
    assert.ok(content.includes("hsl(var(--destructive))"), "Button destructive missing --destructive token");
    assert.ok(content.includes("hsl(var(--ring))"), "Button focus ring missing --ring token");
  });

  // ------------------------------------------------------------------------
  // Pairwise 2: CommandCenter Search Palette + Canonical Tool Catalog
  // ------------------------------------------------------------------------
  it("TC-T3-2: CommandCenter items map directly to valid TOOLS slugs and categories", () => {
    const commandPath = path.join(rootDir, "src/components/command/CommandCenter.tsx");
    const content = fs.readFileSync(commandPath, "utf-8");

    // Verify key workstations and tool slugs are referenced in command palette
    const keySlugs = [
      "/workspace",
      "/workflows",
      "/batch",
      "/image-studio",
      "/pdf-studio",
      "/privacy-cleaner",
      "/compress-image",
      "/smart-compress",
      "/resize-image",
      "/convert-image",
      "/pdf-merge",
      "/pdf-split",
    ];

    for (const slug of keySlugs) {
      assert.ok(
        content.includes(`"${slug}"`) || content.includes(`'${slug}'`),
        `CommandCenter missing navigation shortcut for canonical slug ${slug}`
      );
    }
  });

  // ------------------------------------------------------------------------
  // Pairwise 3: Batch Renaming Pattern + Format Conversion
  // ------------------------------------------------------------------------
  it("TC-T3-3: Combining sequential renaming template with target MIME format conversion", () => {
    const renamePattern = "Archive_Export_####";
    const startNumber = 10;
    const targetFormat = getMimeFromExtension("webp");
    const targetExt = getExtensionFromMime(targetFormat);

    const testFiles = ["scan_a.png", "scan_b.png", "scan_c.png"];
    const results = testFiles.map((file, index) => {
      const num = startNumber + index;
      const hashMatch = renamePattern.match(/#+/);
      const padding = hashMatch ? hashMatch[0].length : 3;
      const paddedNum = String(num).padStart(padding, "0");
      const base = renamePattern.replace(/#+/, paddedNum);
      return `${base}.${targetExt}`;
    });

    assert.deepStrictEqual(results, [
      "Archive_Export_0010.webp",
      "Archive_Export_0011.webp",
      "Archive_Export_0012.webp",
    ]);
  });

  // ------------------------------------------------------------------------
  // Pairwise 4: PDF Split Multi-Page Extraction + Download Dock Queue
  // ------------------------------------------------------------------------
  it("TC-T3-4: Multi-page PDF range splitting populates Download Dock queue with metadata", () => {
    const store = useFileStore.getState();
    store.clearDownloads();

    // Parse ranges from simulated 20-page document
    const selectedIndices = parsePageSelection("1-2, 5, 8", 20);
    assert.deepStrictEqual(selectedIndices, [0, 1, 4, 7]);

    // Simulate multi-file output push to download dock
    const originalSize = 1200000;

    for (const pageIdx of selectedIndices) {
      const pageNum = String(pageIdx + 1).padStart(3, "0");
      store.pushDownload({
        fileName: `Q3_Report_page_${pageNum}.pdf`,
        originalSize: Math.round(originalSize / 4),
        outputSize: 85000,
        status: "downloaded",
      });
    }

    const currentQueue = useFileStore.getState().downloadQueue;
    assert.strictEqual(currentQueue.length, 4);
    assert.strictEqual(currentQueue[0].fileName, "Q3_Report_page_008.pdf");
    assert.strictEqual(currentQueue[3].fileName, "Q3_Report_page_001.pdf");
    assert.ok(useFileStore.getState().latestDeliveredFile);
  });

  // ------------------------------------------------------------------------
  // Pairwise 5: Delivery Completion + File Delivered Modal + Support Trigger
  // ------------------------------------------------------------------------
  it("TC-T3-5: Delivery completion sets delivered file modal without blocking support modal", () => {
    const store = useFileStore.getState();
    store.clearDownloads();
    store.setLatestDeliveredFile(null);

    const deliveredId = store.pushDownload({
      fileName: "optimized_banner.webp",
      originalSize: 800000,
      outputSize: 180000,
      status: "downloaded",
    });
    assert.ok(deliveredId.startsWith("dl-"), "Expected download item ID to start with dl-");

    // Delivered file set
    const latest = useFileStore.getState().latestDeliveredFile;
    assert.ok(latest);
    assert.strictEqual(latest?.fileName, "optimized_banner.webp");

    // Open voluntary support modal directly
    store.openSupportModal();
    assert.strictEqual(useFileStore.getState().isSupportModalOpen, true);
    assert.strictEqual(useFileStore.getState().isSupportPromptVisible, false);

    // Close voluntary support modal
    store.closeSupportModal();
    assert.strictEqual(useFileStore.getState().isSupportModalOpen, false);
  });

  // ------------------------------------------------------------------------
  // Pairwise 6: Tool Catalog + Category Filtering + Homepage Drop Zone Mapping
  // ------------------------------------------------------------------------
  it("TC-T3-6: Catalog categories partition the exact 20 tools with zero overlap or orphans", () => {
    const categorizedCounts: Record<ToolCategoryKey, number> = {
      all: 0,
      images: 0,
      pdf: 0,
      batch: 0,
      utilities: 0,
    };

    for (const tool of TOOLS) {
      assert.ok(
        ["images", "pdf", "batch", "utilities"].includes(tool.categoryKey),
        `Tool ${tool.name} has invalid categoryKey ${tool.categoryKey}`
      );
      categorizedCounts[tool.categoryKey]++;
      categorizedCounts.all++;
    }

    assert.strictEqual(categorizedCounts.all, 20);
    assert.strictEqual(categorizedCounts.images, 6);
    assert.strictEqual(categorizedCounts.pdf, 6);
    assert.strictEqual(categorizedCounts.batch, 3);
    assert.strictEqual(categorizedCounts.utilities, 5);
  });

  // ------------------------------------------------------------------------
  // Pairwise 7: Mobile Navigation + Touch Target Sizing Integration
  // ------------------------------------------------------------------------
  it("TC-T3-7: MobileBottomNav matches canonical top-level routes with touch target compliance", () => {
    const navPath = path.join(rootDir, "src/components/layout/MobileBottomNav.tsx");
    const content = fs.readFileSync(navPath, "utf-8");

    // Verifies the 5 links/buttons and minimum touch constraints
    assert.ok(content.includes('href="/"'), "Missing Home link");
    assert.ok(content.includes('href="/workspace"'), "Missing Workspace link");
    assert.ok(content.includes('href="/tools"'), "Missing Tools link");
    assert.ok(content.includes('href="/history"'), "Missing History link");
    assert.ok(content.includes("min-h-[48px]"), "Interactive elements must exceed 44px (min-h-[48px])");
  });
});
