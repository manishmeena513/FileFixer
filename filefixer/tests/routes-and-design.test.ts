import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

describe("Routes & Design System Parity Audit", () => {
  // ------------------------------------------------------------------------
  // RD-1: Complete 33-Route Static Generation
  // ------------------------------------------------------------------------
  it("RD-1: Verifies all 33 application and metadata routes exist in filesystem", () => {
    const userPages = [
      "",
      "about",
      "batch",
      "batch-rename",
      "branding",
      "compress-image",
      "convert-image",
      "crop-image",
      "history",
      "image-metadata",
      "image-studio",
      "images-to-pdf",
      "inspect",
      "pdf-compress",
      "pdf-merge",
      "pdf-split",
      "pdf-studio",
      "pdf-workspace",
      "privacy",
      "privacy-cleaner",
      "resize-image",
      "smart-compress",
      "terms",
      "tools",
      "workflows",
      "workspace",
    ];

    assert.strictEqual(userPages.length, 26, "Expected 26 user page routes");

    for (const route of userPages) {
      const pageFile = route === ""
        ? path.join(rootDir, "src/app/page.tsx")
        : path.join(rootDir, "src/app", route, "page.tsx");
      assert.ok(fs.existsSync(pageFile), `Missing route page: /${route}`);
    }

    const metadataRoutes = [
      "src/app/robots.ts",
      "src/app/sitemap.ts",
      "src/app/favicon.ico",
      "src/app/icon.svg",
      "src/app/apple-icon.png",
      "public/manifest.json",
      "public/sw.js",
    ];

    assert.strictEqual(metadataRoutes.length, 7, "Expected 7 metadata and static routes");

    for (const meta of metadataRoutes) {
      assert.ok(fs.existsSync(path.join(rootDir, meta)), `Missing metadata file: ${meta}`);
    }

    // Total routes: 26 + 7 = 33
    assert.strictEqual(userPages.length + metadataRoutes.length, 33);
  });

  // ------------------------------------------------------------------------
  // RD-2: CSS Design Tokens & Palette Calibration
  // ------------------------------------------------------------------------
  it("RD-2: CSS tokens in globals.css match calibrated light and dark color values", () => {
    const cssPath = path.join(rootDir, "src/app/globals.css");
    const content = fs.readFileSync(cssPath, "utf-8");

    // Light Theme
    assert.ok(
      content.includes("--background: 216 45% 97.8%") || content.includes("--background: 214 38% 98%"),
      "Light background missing"
    );
    assert.ok(content.includes("--foreground: 222 47% 11%"), "Light foreground missing");
    assert.ok(content.includes("--primary: 221 83% 53%"), "Light primary missing");

    // Dark Theme
    assert.ok(content.includes(".dark"), "Dark mode selector missing");
    assert.ok(
      content.includes("--background: 226 49% 8.4%") || content.includes("--background: 224 49% 9%"),
      "Dark background missing"
    );
    assert.ok(content.includes("--foreground: 210 40% 98%"), "Dark foreground missing");
    assert.ok(content.includes("--primary: 217 91% 60%"), "Dark primary missing");
  });

  // ------------------------------------------------------------------------
  // RD-3: Touch Target Accessibility (>=44px / >=48px)
  // ------------------------------------------------------------------------
  it("RD-3: Touch target sizing complies with mobile accessibility requirements", () => {
    const navPath = path.join(rootDir, "src/components/layout/MobileBottomNav.tsx");
    const navContent = fs.readFileSync(navPath, "utf-8");
    assert.ok(navContent.includes("min-h-[48px]"), "MobileBottomNav items must enforce >=48px touch target");

    const buttonPath = path.join(rootDir, "src/components/ui/button.tsx");
    const buttonContent = fs.readFileSync(buttonPath, "utf-8");
    assert.ok(buttonContent.includes("h-10"), "Button default height must be at least 40px (h-10)");
    assert.ok(buttonContent.includes("h-12"), "Button lg height must be 48px (h-12)");
  });

  // ------------------------------------------------------------------------
  // RD-4: Voluntary Support QR Code Integrity & Accessibility
  // ------------------------------------------------------------------------
  it("RD-4: Support QR code asset exists with valid PNG header and high resolution", () => {
    const qrPath = path.join(rootDir, "public/images/filefixer_support_qr.png");
    assert.ok(fs.existsSync(qrPath), "filefixer_support_qr.png missing in public/images/");
    
    const buffer = fs.readFileSync(qrPath);
    // Verify PNG magic bytes (0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
    assert.strictEqual(buffer[0], 0x89);
    assert.strictEqual(buffer[1], 0x50); // P
    assert.strictEqual(buffer[2], 0x4e); // N
    assert.strictEqual(buffer[3], 0x47); // G
    
    // File size > 500 KB as verified in file inspection
    assert.ok(buffer.length > 500000, `QR image file size smaller than expected: ${buffer.length}`);
  });

  // ------------------------------------------------------------------------
  // RD-5: Typography and Layout Spacing Tokens
  // ------------------------------------------------------------------------
  it("RD-5: Enforces .tabular-nums, safe area utilities and card surface styling", () => {
    const cssPath = path.join(rootDir, "src/app/globals.css");
    const content = fs.readFileSync(cssPath, "utf-8");

    assert.ok(content.includes(".tabular-nums"), ".tabular-nums utility missing");
    assert.ok(content.includes("font-variant-numeric: tabular-nums"), "font-variant-numeric missing");
    assert.ok(content.includes(".pb-safe"), "pb-safe utility missing");
    assert.ok(content.includes(".pt-safe"), "pt-safe utility missing");
    assert.ok(content.includes(".surface-card"), "surface-card utility missing");
  });
});
