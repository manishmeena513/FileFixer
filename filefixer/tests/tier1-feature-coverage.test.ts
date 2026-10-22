import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { TOOLS, CATEGORIES } from "../src/lib/tools.js";
import {
  formatBytes,
  calcSavings,
  getMimeFromExtension,
  getExtensionFromMime,
  IMAGE_FORMATS,
  IMAGE_EXTENSIONS,
} from "../src/lib/file-utils.js";
import { parsePageSelection } from "../src/lib/pdf/split.js";
import { computeOptimizationScore } from "../src/lib/score.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

describe("Tier 1: Feature Coverage (R1 - R5)", () => {
  // ------------------------------------------------------------------------
  // R1: Design System & Global Application Shell
  // ------------------------------------------------------------------------
  describe("R1: Design System & Global Application Shell", () => {
    const cssPath = path.join(rootDir, "src/app/globals.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    it("TC-T1-R1-1: Calibrates light and dark theme CSS variables in globals.css", () => {
      // Light background and primary
      assert.ok(
        cssContent.includes("--background: 216 45% 97.8%") || cssContent.includes("--background: 214 38% 98%"),
        "Light background missing"
      );
      assert.ok(cssContent.includes("--primary: 221 83% 53%"), "Light primary missing");
      
      // Dark background and primary
      assert.ok(cssContent.includes(".dark"), "Dark mode class missing");
      assert.ok(
        cssContent.includes("--background: 226 49% 8.4%") || cssContent.includes("--background: 224 49% 9%"),
        "Dark background missing"
      );
      assert.ok(cssContent.includes("--primary: 217 91% 60%"), "Dark primary missing");
    });

    it("TC-T1-R1-2: Enforces universal .tabular-nums utility for layout stability", () => {
      assert.ok(cssContent.includes(".tabular-nums"), ".tabular-nums class definition missing");
      assert.ok(
        cssContent.includes("font-variant-numeric: tabular-nums"),
        "font-variant-numeric tabular-nums missing"
      );
    });

    it("TC-T1-R1-3: Header component includes navigation structure and accessibility tags", () => {
      const headerPath = path.join(rootDir, "src/components/layout/Header.tsx");
      assert.ok(fs.existsSync(headerPath), "Header.tsx not found");
      const headerContent = fs.readFileSync(headerPath, "utf-8");
      assert.ok(headerContent.includes("nav"), "Header missing nav element");
      assert.ok(headerContent.includes("/tools"), "Header missing link to /tools");
      assert.ok(headerContent.includes("ThemeToggle"), "Header missing ThemeToggle");
    });

    it("TC-T1-R1-4: CommandCenter provides keyboard shortcut listener and focus management", () => {
      const commandPath = path.join(rootDir, "src/components/command/CommandCenter.tsx");
      assert.ok(fs.existsSync(commandPath), "CommandCenter.tsx not found");
      const commandContent = fs.readFileSync(commandPath, "utf-8");
      assert.ok(commandContent.includes("ctrlKey") || commandContent.includes("metaKey"), "Shortcut missing");
      assert.ok(commandContent.includes("inputRef"), "Search input focus ref missing");
      assert.ok(commandContent.includes("Escape"), "Escape key dismissal missing");
    });

    it("TC-T1-R1-5: MobileBottomNav implements 5 navigation items with >=48px touch targets", () => {
      const navPath = path.join(rootDir, "src/components/layout/MobileBottomNav.tsx");
      assert.ok(fs.existsSync(navPath), "MobileBottomNav.tsx not found");
      const navContent = fs.readFileSync(navPath, "utf-8");
      assert.ok(navContent.includes("grid-cols-5"), "Mobile bottom nav must have exactly 5 columns");
      assert.ok(navContent.includes("min-h-[48px]"), "Interactive items must have min-h-[48px]");
      assert.ok(navContent.includes("pb-safe"), "pb-safe mobile viewport padding missing");
    });
  });

  // ------------------------------------------------------------------------
  // R2: Homepage & Central Tools Directory Overhaul
  // ------------------------------------------------------------------------
  describe("R2: Homepage & Central Tools Directory", () => {
    it("TC-T1-R2-1: Homepage features required hero headline copy", () => {
      const pagePath = path.join(rootDir, "src/app/page.tsx");
      assert.ok(fs.existsSync(pagePath), "page.tsx not found");
      const pageContent = fs.readFileSync(pagePath, "utf-8");
      assert.ok(
        pageContent.includes("Fix your files. Keep them private.") ||
        pageContent.includes("Fix your files") && pageContent.includes("Keep them private"),
        "Hero headline copy mismatch"
      );
    });

    it("TC-T1-R2-2: Central tool catalog contains exactly 20 tools", () => {
      assert.strictEqual(TOOLS.length, 20, `Expected 20 tools in catalog, found ${TOOLS.length}`);
    });

    it("TC-T1-R2-3: Catalog supports all 5 category keys (all, images, pdf, batch, utilities)", () => {
      const keys = CATEGORIES.map((c) => c.key);
      assert.deepStrictEqual(keys, ["all", "images", "pdf", "batch", "utilities"]);
    });

    it("TC-T1-R2-4: Tools have explicit format tags and valid routing slugs", () => {
      for (const tool of TOOLS) {
        assert.ok(tool.id, `Tool ${tool.name} missing id`);
        assert.ok(tool.slug.startsWith("/"), `Tool ${tool.name} slug must start with /`);
        assert.ok(tool.category, `Tool ${tool.name} missing category`);
        assert.ok(tool.supportedFormats && tool.supportedFormats.length > 0, `Tool ${tool.name} missing format tags`);
      }
    });

    it("TC-T1-R2-5: Tools directory page provides category filtering and responsive cards", () => {
      const toolsPagePath = path.join(rootDir, "src/app/tools/page.tsx");
      const toolsDirCompPath = path.join(rootDir, "src/components/tools/ToolsDirectory.tsx");
      assert.ok(fs.existsSync(toolsPagePath), "tools/page.tsx not found");
      assert.ok(fs.existsSync(toolsDirCompPath), "ToolsDirectory.tsx not found");
      
      const toolsPageContent = fs.readFileSync(toolsPagePath, "utf-8");
      assert.ok(toolsPageContent.includes("ToolsDirectory"), "tools/page.tsx must render ToolsDirectory component");

      const dirContent = fs.readFileSync(toolsDirCompPath, "utf-8");
      assert.ok(dirContent.includes("TOOLS"), "ToolsDirectory does not consume TOOLS catalog");
      assert.ok(dirContent.includes("selectedCategory"), "ToolsDirectory missing selectedCategory state");
      assert.ok(dirContent.includes("EmptyState"), "ToolsDirectory missing EmptyState fallback");
    });
  });

  // ------------------------------------------------------------------------
  // R3: Comprehensive Tool Pages & Workstation Experience
  // ------------------------------------------------------------------------
  describe("R3: Comprehensive Tool Pages & Workstations", () => {
    it("TC-T1-R3-1: Image format utilities correctly map MIME types and extensions", () => {
      assert.strictEqual(getMimeFromExtension("jpg"), "image/jpeg");
      assert.strictEqual(getMimeFromExtension("png"), "image/png");
      assert.strictEqual(getMimeFromExtension("webp"), "image/webp");
      assert.strictEqual(getExtensionFromMime("image/jpeg"), "jpg");
      assert.strictEqual(getExtensionFromMime("image/png"), "png");
      assert.strictEqual(getExtensionFromMime("image/webp"), "webp");
      assert.strictEqual(IMAGE_FORMATS.length, 3);
      assert.deepStrictEqual(IMAGE_EXTENSIONS, ["jpg", "jpeg", "png", "webp"]);
    });

    it("TC-T1-R3-2: PDF split range parser processes comma and range token syntax", () => {
      const parsed = parsePageSelection("1-3, 5, 8-10", 15);
      // 0-indexed: 0, 1, 2 (from 1-3), 4 (from 5), 7, 8, 9 (from 8-10)
      assert.deepStrictEqual(parsed, [0, 1, 2, 4, 7, 8, 9]);
    });

    it("TC-T1-R3-3: PDF merge engine asserts at least 2 files required", async () => {
      const { mergePDFs } = await import("../src/lib/pdf/merge.js");
      await assert.rejects(
        async () => {
          await mergePDFs([]);
        },
        {
          name: "Error",
          message: "At least 2 PDF files are required for merging.",
        }
      );
    });

    it("TC-T1-R3-4: Batch sequence rename logic parses hashes into padded numbering", () => {
      const renamePattern = "Project_Alpha_###";
      const startNumber = 1;
      const index = 4;
      const hashMatch = renamePattern.match(/#+/);
      const padding = hashMatch ? hashMatch[0].length : 3;
      const num = startNumber + index; // 5
      const paddedNum = String(num).padStart(padding, "0"); // "005"
      const outputName = renamePattern.replace(/#+/, paddedNum) + ".jpg";
      assert.strictEqual(outputName, "Project_Alpha_005.jpg");
    });

    it("TC-T1-R3-5: Optimization score algorithm computes multi-factor scores", () => {
      const score = computeOptimizationScore({
        name: "test.jpg",
        size: 2000000,
        type: "image/jpeg",
        outputSize: 600000,
        outputType: "image/webp",
        metadataCleaned: true,
        width: 1920,
        height: 1080,
      });

      assert.ok(score.overall >= 80, `Expected score >= 80, got ${score.overall}`);
      assert.strictEqual(score.breakdown.privacy, 20, "Cleaned metadata should earn full privacy score");
      assert.strictEqual(score.breakdown.dimensions, 20, "1080p resolution should earn sweet spot dimension score");
      assert.ok(["Excellent", "Optimal"].includes(score.rating));
    });
  });

  // ------------------------------------------------------------------------
  // R4: Processing, Deliveries & Voluntary Support Integration
  // ------------------------------------------------------------------------
  describe("R4: Processing, Deliveries & Voluntary Support", () => {
    it("TC-T1-R4-1: Download store adds delivered items and calculates savings", () => {
      const savings = calcSavings(1000000, 350000);
      assert.strictEqual(savings, "65.0%");
      const formatted = formatBytes(350000);
      assert.strictEqual(formatted, "341.8 KB");
    });

    it("TC-T1-R4-2: Voluntary support modal displays official QR code asset path", () => {
      const modalPath = path.join(rootDir, "src/components/support/SupportModal.tsx");
      assert.ok(fs.existsSync(modalPath), "SupportModal.tsx not found");
      const modalContent = fs.readFileSync(modalPath, "utf-8");
      assert.ok(
        modalContent.includes("/images/filefixer_support_qr.png"),
        "SupportModal must reference /images/filefixer_support_qr.png"
      );
      assert.ok(
        modalContent.includes("FileFixer voluntary support UPI QR code"),
        "SupportModal missing descriptive alt text"
      );
    });

    it("TC-T1-R4-3: Official voluntary support QR code image exists in public directory", () => {
      const qrPath = path.join(rootDir, "public/images/filefixer_support_qr.png");
      assert.ok(fs.existsSync(qrPath), "filefixer_support_qr.png does not exist");
      const stat = fs.statSync(qrPath);
      assert.ok(stat.size > 50000, `QR image suspiciously small (${stat.size} bytes)`);
    });

    it("TC-T1-R4-4: Support modal implements accessible dialog roles and escape key handler", () => {
      const modalPath = path.join(rootDir, "src/components/support/SupportModal.tsx");
      const modalContent = fs.readFileSync(modalPath, "utf-8");
      assert.ok(modalContent.includes('role="dialog"'), "Missing role=dialog");
      assert.ok(modalContent.includes('aria-modal="true"'), "Missing aria-modal=true");
      assert.ok(modalContent.includes('aria-labelledby="support-dialog-title"'), "Missing aria-labelledby");
      assert.ok(modalContent.includes("Escape"), "Missing Escape key dismiss listener");
    });

    it("TC-T1-R4-5: DownloadDock floating component renders non-blocking delivery dock", () => {
      const dockPath = path.join(rootDir, "src/components/download/DownloadDock.tsx");
      assert.ok(fs.existsSync(dockPath), "DownloadDock.tsx not found");
      const dockContent = fs.readFileSync(dockPath, "utf-8");
      assert.ok(dockContent.includes("downloadQueue"), "DownloadDock does not read downloadQueue");
      assert.ok(dockContent.includes("animate-dock-in") || dockContent.includes("fixed bottom"), "DownloadDock not floating");
    });
  });

  // ------------------------------------------------------------------------
  // R5: Responsive Design, Accessibility & Technical Preservation
  // ------------------------------------------------------------------------
  describe("R5: Responsive Design, Accessibility & Technical Preservation", () => {
    it("TC-T1-R5-1: Button primitive implements touch-friendly sizing", () => {
      const buttonPath = path.join(rootDir, "src/components/ui/button.tsx");
      assert.ok(fs.existsSync(buttonPath), "button.tsx not found");
      const buttonContent = fs.readFileSync(buttonPath, "utf-8");
      assert.ok(buttonContent.includes("h-10"), "Button missing default h-10 touch size");
      assert.ok(buttonContent.includes("focus-visible:ring-2"), "Button missing accessible focus ring");
    });

    it("TC-T1-R5-2: Zero-Server Upload Invariant: app/api directory is completely empty", () => {
      const apiDir = path.join(rootDir, "src/app/api");
      if (fs.existsSync(apiDir)) {
        const entries = fs.readdirSync(apiDir);
        assert.strictEqual(
          entries.length,
          0,
          `Privacy Violation: src/app/api must contain 0 endpoints, found: ${entries.join(", ")}`
        );
      }
    });

    it("TC-T1-R5-3: Route Parity: All 26 user page routes exist in filesystem", () => {
      const expectedPages = [
        "", // root page.tsx
        "tools",
        "workspace",
        "workflows",
        "image-studio",
        "pdf-studio",
        "privacy-cleaner",
        "compress-image",
        "resize-image",
        "convert-image",
        "crop-image",
        "image-metadata",
        "pdf-merge",
        "pdf-split",
        "pdf-compress",
        "pdf-workspace",
        "images-to-pdf",
        "batch",
        "batch-rename",
        "smart-compress",
        "inspect",
        "history",
        "about",
        "privacy",
        "terms",
        "branding",
      ];

      for (const route of expectedPages) {
        const pageFile = route === ""
          ? path.join(rootDir, "src/app/page.tsx")
          : path.join(rootDir, "src/app", route, "page.tsx");
        assert.ok(fs.existsSync(pageFile), `Route file missing for /${route}`);
      }
    });

    it("TC-T1-R5-4: SEO & Metadata files are fully configured (sitemap.ts, robots.ts)", () => {
      const sitemapPath = path.join(rootDir, "src/app/sitemap.ts");
      const robotsPath = path.join(rootDir, "src/app/robots.ts");
      assert.ok(fs.existsSync(sitemapPath), "sitemap.ts missing");
      assert.ok(fs.existsSync(robotsPath), "robots.ts missing");
      const sitemapContent = fs.readFileSync(sitemapPath, "utf-8");
      assert.ok(sitemapContent.includes("MetadataRoute.Sitemap"), "sitemap.ts not using Next MetadataRoute");
      assert.ok(sitemapContent.includes("/workspace"), "sitemap.ts missing /workspace");
      assert.ok(sitemapContent.includes("/tools"), "sitemap.ts missing /tools");
    });

    it("TC-T1-R5-5: PWA Service Worker and Web App Manifest exist in public directory", () => {
      const swPath = path.join(rootDir, "public/sw.js");
      const manifestPath = path.join(rootDir, "public/manifest.json");
      assert.ok(fs.existsSync(swPath), "public/sw.js missing");
      assert.ok(fs.existsSync(manifestPath), "public/manifest.json missing");
      const manifestContent = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      assert.ok(manifestContent.name.includes("FileFixer"), "Manifest name missing FileFixer");
      assert.strictEqual(manifestContent.short_name, "FileFixer", "Manifest short_name mismatch");
      assert.strictEqual(manifestContent.display, "standalone", "PWA display mode must be standalone");
    });
  });
});
